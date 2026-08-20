import { AuthenticatedWebSocket, TransportFactory, TRANSPORT_OPEN, createWsTransport } from './transport';
import type { WsServerMessage } from '@repo/shared-types';
import type { TabLeaderStoreInstance } from '../../states/stores';
import properties from '../../properties';
import { mytoast } from '../../components/toast';
import authSession from '../../auth/session';
import { TabLeader } from '../tab-leader/tab-leader';

export type InitWsMessageCallback = (message: WsServerMessage) => void;

const WS_URL = properties.realtimeWsUrl || undefined;
const RECONNECT_BASE_DELAY_MS = 1_000;
const RECONNECT_MAX_DELAY_MS = 30_000;
// One real socket per browser instead of one per tab: tabs race to lead via
// TabLeader, the winner opens the socket, and the rest fall back to
// listenAsFollower below.
const LEADER_LOCK_NAME = 'call-center-ws-leader';
const RELAY_CHANNEL_NAME = 'call-center-ws-relay';

interface InitWsStores {
    tabLeader: TabLeaderStoreInstance;
}

type RelayMessage =
    // any tab -> leader: something to forward over the real socket
    { type: 'ws-send'; payload: any };

export class InitWs {
    private activeWs: AuthenticatedWebSocket | null = null;
    private running = false;
    private factory: TransportFactory = createWsTransport;
    private reconnectAttempts = 0;
    private reconnectPending = false;
    private tabLeader = new TabLeader<RelayMessage>({ lockName: LEADER_LOCK_NAME, channelName: RELAY_CHANNEL_NAME });
    private onMessageCallback?: InitWsMessageCallback;

    onMessage(cb: InitWsMessageCallback): void {
        this.onMessageCallback = cb;
    }

    private createAuthWs(): AuthenticatedWebSocket {
        const transport = this.factory(`${WS_URL}`);
        return transport as AuthenticatedWebSocket;
    }

    // Full-jitter exponential backoff (AWS Architecture Blog): spreads
    // reconnect attempts out so a server restart doesn't get hit by every
    // client reconnecting at the same instant.
    private nextReconnectDelay(): number {
        const cap = Math.min(RECONNECT_MAX_DELAY_MS, RECONNECT_BASE_DELAY_MS * 2 ** this.reconnectAttempts);
        this.reconnectAttempts += 1;
        return Math.random() * cap;
    }

    private connect(
        ws: AuthenticatedWebSocket,
        token: string,
        tabLeaderStore: TabLeaderStoreInstance,
    ): void {
        if (!this.running || !WS_URL) return;
        this.activeWs = ws;
        this.reconnectPending = false;
        // connect() only ever runs for the tab that actually holds the real
        // socket — see becomeLeader/init() below — so reaching here means
        // this tab is the leader. Stored reactively so React components can
        // key off it — see CallFooter/CallFooterActions.

        console.log('InitWs.connect() — this tab is the leader');
        tabLeaderStore.getState().setIsLeader(true);
        let authenticated = false;

        ws.onopen = () => {
            authSession.getToken();
            // Token travels as the first message instead of a `?token=` URL
            // query param, so it doesn't end up in proxy/CDN access logs or
            // browser history — see connection.ts on the realtime side.
            ws.send(JSON.stringify({ event: 'auth', token }));
        };

        ws.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data as string);
                if (msg.isError) {
                    mytoast.error(msg.message);
                    this.running = false;
                    ws.close();
                    return;
                }
                if (!authenticated) {
                    authenticated = true;
                    this.reconnectAttempts = 0;
                }
                this.onMessageCallback?.(msg as WsServerMessage);
            } catch {
                // malformed frame — ignore
            }
        };

        ws.onerror = (_err) => {
            mytoast.error('Connection error');
        };

        ws.onclose = () => {
            if (!this.running) return;
            this.scheduleReconnect(this.nextReconnectDelay(), tabLeaderStore);
        };
    }

    private scheduleReconnect(
        delayMs: number,
        tabLeaderStore: TabLeaderStoreInstance,
    ): void {
        // Guards against onclose's backoff timer and a visibilitychange
        // firing back-to-back (e.g. the OS drops the socket right as the
        // phone wakes) from both racing to open a second, orphaned socket.
        // Cleared once connect() actually runs.
        if (this.reconnectPending) return;
        this.reconnectPending = true;
        setTimeout(() => {
            authSession.getToken().then((freshToken) => {
                if (!freshToken || !this.running) {
                    this.reconnectPending = false;
                    return;
                }
                this.connect(this.createAuthWs(), freshToken, tabLeaderStore);
            });
        }, delayMs);
    }

    // Mobile OSes can suspend a backgrounded tab's socket without ever
    // delivering onclose/onerror to JS (unlike heartbeat.ts's pong, which is
    // answered at the network layer and survives this). A phone waking from
    // screen-lock is the common case: reconnect immediately instead of
    // waiting out the exponential backoff from whatever attempt was last in
    // flight, since that delay is meant to spread out load after a server
    // restart, not to apply to "the user just looked at their phone".
    private handleVisibilityChange(
        tabLeaderStore: TabLeaderStoreInstance,
    ): void {
        if (document.visibilityState !== 'visible') return;
        if (!this.running || !this.activeWs) return; // not the leader tab, or never connected
        if (this.activeWs.readyState === TRANSPORT_OPEN) return;
        this.reconnectAttempts = 0;
        this.scheduleReconnect(0, tabLeaderStore);
    }

    // Runs in every tab regardless of leader/follower role. Leader tabs never
    // receive their own postMessage (BroadcastChannel doesn't echo back to the
    // sender), so this only ever does something in followers: forward this
    // tab's outgoing sends (see notifyLogout) through whichever tab is the
    // leader.
    private listenAsFollower(): void {
        this.tabLeader.onMessage((data) => {
            if (data.type === 'ws-send' && this.activeWs?.readyState === TRANSPORT_OPEN) {
                this.activeWs.send(JSON.stringify(data.payload));
            }
        });
    }

    private async becomeLeader(
        tabLeaderStore: TabLeaderStoreInstance,
    ): Promise<void> {
        // Reaching becomeLeader at all already means this tab won the
        // TabLeader race -- true regardless of auth, so mark it before
        // touching tokens at all. Anonymous visitors have no socket to open
        // below, but they still have a leader tab.
        tabLeaderStore.getState().setIsLeader(true);

        // becomeLeader can run well before init()/a token exists (see
        // startTabCoordination — the race starts at app boot, independent of
        // auth) or long after, if this tab was queued behind whichever tab
        // was leader before it. Either way, fetch a token now rather than
        // trust whatever was passed to init(): it may not exist yet, or may
        // be stale.
        const freshToken = await authSession.getToken();
        if (!freshToken || !this.running) return;
        this.reconnectAttempts = 0;
        this.connect(this.createAuthWs(), freshToken, tabLeaderStore);
    }

    // Starts the leader/follower race immediately at app boot (see
    // main.tsx), independent of auth entirely -- every tab gets a
    // leader/follower role whether or not anyone ever logs in. init() below
    // only reacts to the outcome once a token is actually available.
    startTabCoordination(): void {
        this.tabLeader.start();
    }

    init(stores: InitWsStores, factory: TransportFactory = createWsTransport): void {
        this.running = true;
        this.factory = factory;
        this.reconnectAttempts = 0;
        stores.tabLeader.getState().setIsLeader(false);

        this.listenAsFollower();

        document.addEventListener('visibilitychange', () =>
            this.handleVisibilityChange(stores.tabLeader),
        );

        // Registers rather than (re)starts the race: startTabCoordination()
        // already kicked it off, possibly long before this tab even had a
        // token. Fires immediately if this tab already won by now (the
        // common case — logout/re-login in the same tab, or the race
        // resolving before auth finishes), otherwise waits for it.
        this.tabLeader.onBecomeLeader(() => this.becomeLeader(stores.tabLeader));

        // This tab may be joining as a follower behind a leader that's been
        // open for a while and already did its own initial sync — nothing
        // will naturally push fresh call/online-user state to it otherwise
        // (see request_state on the realtime side). Harmless no-op if this
        // tab ends up being the leader instead: it gets the same data for
        // free from its own connect() above.
        // this.requestStateSync();
    }

    // Sends over this tab's socket if it's the leader and open, otherwise
    // relays through whichever tab is leader (see listenAsFollower above) —
    // same reasoning as notifyLogout below, generalized for any outgoing
    // message (e.g. room:create/join/leave).
    send(payload: object): void {
        if (this.activeWs?.readyState === TRANSPORT_OPEN) {
            this.activeWs.send(JSON.stringify(payload));
            return;
        }
        this.tabLeader.postMessage({ type: 'ws-send', payload });
    }

    notifyLogout(): void {
        this.send({ event: 'user_logout' });
    }

    // Deliberate teardown (e.g. logout): stops the reconnect loop so a
    // closed socket doesn't just come back. Deliberately does NOT stop
    // tabLeader -- leader/follower role is a page-lifetime concern owned by
    // startTabCoordination() (see main.tsx), not this auth session, so it
    // must survive logout/re-login in the same tab.
    stop(): void {
        this.running = false;
        this.activeWs?.close();
        this.activeWs = null;
    }
}

export const initWs = new InitWs();
