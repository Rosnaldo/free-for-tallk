import type Redis from 'ioredis';
import { REDIS_CHANNELS, SOCKET_OPEN, OnlineUserListEvent, RoomListEvent, WsServerMessage } from '@repo/shared-types';
import logger from '#logger';
import { getRedisClient } from './singleton';
import { addOnlineUser as addOnlineUserPresence, removeOnlineUser as removeOnlineUserPresence, patchOnlineUserIfPresent } from '../services/online_list_redis';
import * as onlineRegistry from '../websocket/user_registry';
import { broadcastRoomDelta } from '../websocket/broadcast_room_delta';

let subscriber: Redis | undefined;

function handleOnlineUserEvent(raw: string): void {
    let event: OnlineUserListEvent;
    try {
        event = JSON.parse(raw);
    } catch (err) {
        logger.error(err, 'failed to parse online user list event');
        return;
    }

    let applied: Promise<void>;
    if (event.type === 'upsert') {
        applied = addOnlineUserPresence(event.onlineUser).then(() => undefined);
    } else if (event.type === 'update-status') {
        applied = patchOnlineUserIfPresent(event.onlineUserId, { status: event.status });
    } else if (event.type === 'remove') {
        applied = removeOnlineUserPresence(event.onlineUserId).then(() => undefined);
    } else {
        throw Error('handleOnlineUserEvent invalid OnlineUserListEvent');
    }

    applied.catch((err) => logger.error(err, 'failed to apply volunteer list event'));
}

function handleRoomListEvent(raw: string): void {
    let event: RoomListEvent;
    try {
        event = JSON.parse(raw);
    } catch (err) {
        logger.error(err, 'failed to parse room list event');
        return;
    }

    broadcastRoomDelta(event);
}

interface WsDeliverEvent {
    id: string;
    message: WsServerMessage;
}

function handleOnlineUserDeliver(raw: string): void {
    let event: WsDeliverEvent;
    try {
        event = JSON.parse(raw);
    } catch (err) {
        logger.error(err, 'failed to parse volunteer ws delivery event');
        return;
    }

    const ws = onlineRegistry.get(event.id);
    if (ws && ws.readyState === SOCKET_OPEN) {
        ws.send(JSON.stringify(event.message));
    }
}

export const startListSubscriber = async (): Promise<void> => {
    subscriber = getRedisClient().duplicate();

    subscriber.on('error', (err) => logger.error(err, 'redis subscriber connection error'));

    subscriber.on('message', (channel, message) => {
        if (channel === REDIS_CHANNELS.ONLINE_USER_LIST_UPDATED) {
            handleOnlineUserEvent(message);
        }
        if (channel === REDIS_CHANNELS.ONLINE_USER_WS_DELIVER) {
            handleOnlineUserDeliver(message);
        }
        if (channel === REDIS_CHANNELS.ROOM_LIST_UPDATED) {
            handleRoomListEvent(message);
        }
    });

    await subscriber.subscribe(
        REDIS_CHANNELS.ONLINE_USER_LIST_UPDATED,
        REDIS_CHANNELS.ONLINE_USER_WS_DELIVER,
        REDIS_CHANNELS.ROOM_LIST_UPDATED
    );
    logger.info('subscribed to online-list, ws-delivery, and room-list redis channels');
};

export const stopListSubscriber = async (): Promise<void> => {
    if (!subscriber) return;
    await subscriber.quit();
    subscriber = undefined;
};
