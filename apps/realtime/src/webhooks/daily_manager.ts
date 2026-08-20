import { spawn, ChildProcess } from 'child_process';
import properties from '#properties';
import logger from '#logger';
import { listAndClearTrackedRooms } from '../services/calls_redis';

const DAILY_API_URL = 'https://api.daily.co/v1';
const WEBHOOK_PATH_LOCAL = '/webhooks/daily';
const WEBHOOK_PATH_REMOTE = '/realtime/webhooks/daily';

let ngrokProcess: ChildProcess | null = null;

function dailyHeaders() {
    return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${properties.dailyApiKey}`,
    };
}

async function findActiveNgrokTunnel(): Promise<string | null> {
    try {
        const res = await fetch('http://localhost:4040/api/tunnels');
        const data = await res.json();
        const tunnel = (data.tunnels as { public_url: string }[])?.find((t) => t.public_url?.startsWith('https://'));
        return tunnel?.public_url ?? null;
    } catch {
        return null;
    }
}

// Usa um domínio fixo (NGROK_DOMAIN) para que a URL do tunnel não mude entre
// restarts do nodemon, mesmo que o processo do ngrok em si morra a cada save
// (nodemon mata a subárvore inteira via SIGUSR2/psTree). Com a URL estável,
// registerDailyWebhooks percebe que o webhook já aponta pra ela e não precisa
// recriar no Daily a cada restart.
async function ensureNgrokTunnel(): Promise<string> {
    const existing = await findActiveNgrokTunnel();
    if (existing) return existing;

    const port = String(properties.port);
    if (!properties.ngrokDomain) {
        logger.warn('daily NGROK_DOMAIN não definido, usando subdomínio aleatório do ngrok (muda a cada restart)');
    }
    const args = properties.ngrokDomain
        ? ['http', '--domain', properties.ngrokDomain, port]
        : ['http', port];

    logger.info({ port, domain: properties.ngrokDomain || undefined }, 'ngrok abrindo tunnel');
    const proc = spawn('ngrok', args, { stdio: 'ignore', detached: true });
    ngrokProcess = proc;
    let spawnError: Error | null = null;
    proc.on('error', (err) => { spawnError = new Error(`ngrok: ${err.message}`); });

    for (let i = 0; i < 30; i++) {
        if (spawnError) throw spawnError;
        await new Promise((r) => setTimeout(r, 500));
        const url = await findActiveNgrokTunnel();
        if (url) return url;
    }
    throw new Error('ngrok timeout');
}

async function listWebhooks(): Promise<{ uuid: string; url: string }[]> {
    const res = await fetch(`${DAILY_API_URL}/webhooks`, {
        headers: dailyHeaders(),
    });
    if (!res.ok) {
        logger.error({ status: res.status, body: await res.text() }, 'daily erro ao listar webhooks');
        return [];
    }
    const webhooks = await res.json();
    return webhooks.data ?? webhooks;
}

async function deleteAllWebhooks(): Promise<void> {
    try {
        const webhooks = await listWebhooks();
        for (const wh of webhooks) {
            const delRes = await fetch(`${DAILY_API_URL}/webhooks/${wh.uuid}`, {
                method: 'DELETE',
                headers: dailyHeaders(),
            });
            if (!delRes.ok) {
                logger.error({ uuid: wh.uuid, status: delRes.status, body: await delRes.text() }, 'daily erro ao remover webhook');
                continue;
            }
            logger.info({ uuid: wh.uuid }, 'daily webhook removido');
        }
    } catch (error) {
        logger.error(error, 'daily deleteAllWebhooks: falha ao comunicar com api do daily');
    }
}

async function waitForEndpoint(url: string): Promise<boolean> {
    const maxAttempts = 30;
    const intervalMs = 2000;
    for (let i = 0; i < maxAttempts; i++) {
        try {
            const res = await fetch(url);
            if (res.ok) return true;
        } catch {}
        logger.info({ attempt: i + 1, maxAttempts }, 'daily aguardando endpoint');
        await new Promise(r => setTimeout(r, intervalMs));
    }
    return false;
}

async function createWebhook(url: string): Promise<void> {
    const reachable = await waitForEndpoint(url);
    if (!reachable) {
        logger.error({ url }, 'daily endpoint não ficou acessível, abortando registro');
        return;
    }

    const res = await fetch(`${DAILY_API_URL}/webhooks`, {
        method: 'POST',
        headers: dailyHeaders(),
        body: JSON.stringify({
            url,
            eventTypes: ['meeting.started', 'meeting.ended', 'participant.joined', 'participant.left'],
        }),
    });
    if (!res.ok) {
        logger.error({ status: res.status, body: await res.text() }, 'daily erro ao criar webhook');
        return;
    }
    const webhook = await res.json();
    logger.info({ uuid: webhook.uuid, url }, 'daily webhook criado');
}

export async function deleteDailyRoom(room: string): Promise<void> {
    try {
        const res = await fetch(`${DAILY_API_URL}/rooms/${room}`, {
            method: 'DELETE',
            headers: dailyHeaders(),
        });
        if (!res.ok) {
            logger.error({ room, status: res.status, body: await res.text() }, 'daily erro ao remover room');
            return;
        }
        logger.info({ room }, 'daily room removida');
    } catch (error) {
        logger.error(error, 'daily deleteDailyRoom: falha ao comunicar com api do daily');
    }
}

export async function ejectParticipant(room: string, userId: string): Promise<void> {
    try {
        const res = await fetch(`${DAILY_API_URL}/rooms/${room}/eject`, {
            method: 'POST',
            headers: dailyHeaders(),
            body: JSON.stringify({ user_ids: [userId] }),
        });
        if (!res.ok) {
            logger.error({ room, userId, status: res.status, body: await res.text() }, 'daily erro ao ejetar participante');
            return;
        }
        logger.info({ room, userId }, 'daily participante ejetado');
    } catch (error) {
        logger.error(error, 'daily ejectParticipant: falha ao comunicar com api do daily');
    }
}

export interface DailyMeetingParticipant {
    user_id: string | null;
    participant_id: string;
    user_name: string | null;
    join_time: number;
    duration: number;
}

const PARTICIPANTS_PAGE_SIZE = 100;


export async function getMeetingParticipants(meetingId: string): Promise<DailyMeetingParticipant[]> {
    const participants: DailyMeetingParticipant[] = [];
    let joinedAfter: string | undefined;

    for (;;) {
        const params = new URLSearchParams({ limit: String(PARTICIPANTS_PAGE_SIZE) });
        if (joinedAfter) params.set('joined_after', joinedAfter);

        const res = await fetch(`${DAILY_API_URL}/meetings/${meetingId}/participants?${params}`, {
            headers: dailyHeaders(),
        });

        if (!res.ok) {
            throw new Error(`daily erro ao consultar participants da meeting ${meetingId}: ${res.status} ${await res.text()}`);
        }

        const { data } = await res.json() as { data: DailyMeetingParticipant[] };
        participants.push(...data);

        if (data.length < PARTICIPANTS_PAGE_SIZE) break;
        joinedAfter = data[data.length - 1].participant_id;
    }

    return participants;
}

interface DailyRoomPresenceEntry {
    id: string;
    userId: string;
    userName: string;
}

async function getRoomPresence(room: string): Promise<DailyRoomPresenceEntry[]> {
    const res = await fetch(`${DAILY_API_URL}/rooms/${room}/presence`, {
        headers: dailyHeaders(),
    });

    if (!res.ok) {
        logger.error({ room, status: res.status, body: await res.text() }, 'daily erro ao consultar presence da room');
        return [];
    }

    const { data } = await res.json() as { data: DailyRoomPresenceEntry[] };
    return data;
}

export async function isUserPresentInRoom(room: string, userId: string): Promise<boolean> {
    const presence = await getRoomPresence(room);
    return presence.some((p) => p.userId === userId);
}

async function deleteTrackedRooms(): Promise<void> {
    try {
        const rooms = await listAndClearTrackedRooms();
        for (const room of rooms) {
            await deleteDailyRoom(room);
        }
    } catch (error) {
        logger.error(error, 'daily deleteTrackedRooms: falha ao buscar/remover rooms rastreadas');
    }
}

export async function registerDailyWebhooks(): Promise<void> {
    if (!properties.dailyApiKey || !properties.webhookUrl) {
        logger.warn('daily DAILY_API_KEY ou WEBHOOK_URL não definida, pulando registro de webhooks');
        return;
    }

    let baseUrl: string;
    let webhookPath: string;

    if (properties.nodeEnv === 'dev' || properties.nodeEnv === 'local') {
        try {
            const ngrokUrl = await ensureNgrokTunnel();
            logger.info({ url: ngrokUrl }, 'ngrok tunnel ativo');
            baseUrl = ngrokUrl;
        } catch (err) {
            logger.warn({ err: String(err) }, 'daily ngrok não disponível, pulando registro de webhooks');
            return;
        }
        // ngrok tunnels directly to this container's port, bypassing the nginx /realtime prefix
        webhookPath = WEBHOOK_PATH_LOCAL;
    } else {
        baseUrl = properties.webhookUrl.replace(/\/$/, '');
        webhookPath = WEBHOOK_PATH_REMOTE;
    }

    const webhookUrl = `${baseUrl}${webhookPath}`;

    const existing = await listWebhooks();
    if (existing.length === 1 && existing[0].url === webhookUrl) {
        logger.info({ url: webhookUrl }, 'daily webhook já registrado, nada a fazer');
        return;
    }

    await deleteAllWebhooks();
    await createWebhook(webhookUrl);

    logger.info('daily webhooks registrados');
}

export async function cleanupDailyWebhooks(): Promise<void> {
    await deleteAllWebhooks()
    await deleteTrackedRooms()
    if (ngrokProcess) {
        ngrokProcess.kill();
        ngrokProcess = null;
    }
}
