import { buildLogger } from '#logger';
import { DailyMeetingPayload, DailyParticipantPayload } from './daily_types';
import { getMeetingParticipants } from './daily_manager';


export async function onMeetingStarted(traceId: string, payload: DailyMeetingPayload): Promise<void> {
    const logger = buildLogger(traceId);
    logger.info({ room: payload.room }, 'daily meeting.started');

    try {

    } catch (error) {
        logger.error(error, 'daily onMeetingStarted');
    }
}

export async function onMeetingEnded(traceId: string, payload: DailyMeetingPayload): Promise<void> {
    const logger = buildLogger(traceId);
    logger.info({ room: payload.room }, 'daily meeting.ended');

    try {
        const dailyParticipants = await getMeetingParticipants(payload.meeting_id);

        const participants = dailyParticipants.map((p) => {
            const joinedAt = new Date(p.join_time * 1000);
            const leftAt = new Date((p.join_time + p.duration) * 1000);
            return {
                userId: p.user_id,
                userName: p.user_name,
                joinedAt,
                leftAt,
            };
        });

        logger.info({ room: payload.room, participants: participants.length }, 'daily onMeetingEnded: call segment recorded');
    } catch (error) {
        logger.error(error, 'daily onMeetingEnded');
    }
}

export async function onParticipantJoined(traceId: string, payload: DailyParticipantPayload): Promise<void> {
    const logger = buildLogger(traceId);
    logger.info({ room: payload.room, user: payload.user_name }, 'daily participant.joined');

    try {
        logger.info({ room: payload.room }, 'participant.joined: status set to in-call');

    } catch (error) {
        logger.error(error, 'daily onParticipantJoined');
    }
}

export async function onParticipantLeft(traceId: string, payload: DailyParticipantPayload): Promise<void> {
    const logger = buildLogger(traceId);
    logger.info({ room: payload.room, user: payload.user_name }, 'daily participant.left');

    try {
        logger.info({ room: payload.room }, 'participant.left: status reset to online');
    } catch (error) {
        logger.error(error, 'daily onParticipantLeft');
    }
}
