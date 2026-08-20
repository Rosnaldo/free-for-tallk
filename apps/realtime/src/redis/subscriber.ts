import type Redis from 'ioredis';
import { REDIS_CHANNELS, SOCKET_OPEN, OnlineUserListEvent, RoomListEvent, RoomReactionEvent, RoomDeviceStateEvent, WsServerMessage } from '@repo/shared-types';
import logger from '#logger';
import { getRedisClient } from './singleton';
import { addOnlineUser as addOnlineUserPresence, removeOnlineUser as removeOnlineUserPresence, patchOnlineUserIfPresent } from '../services/online_list_redis';
import * as onlineRegistry from '../websocket/user_registry';
import { broadcastRoomDelta } from '../websocket/broadcast_room_delta';
import { broadcastRoomReaction } from '../websocket/broadcast_room_reaction';
import { broadcastRoomDeviceState } from '../websocket/broadcast_room_device_state';

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

function handleRoomReactionEvent(raw: string): void {
    let event: RoomReactionEvent;
    try {
        event = JSON.parse(raw);
    } catch (err) {
        logger.error(err, 'failed to parse room reaction event');
        return;
    }

    broadcastRoomReaction(event).catch((err) => logger.error(err, 'failed to broadcast room reaction'));
}

function handleRoomDeviceStateEvent(raw: string): void {
    let event: RoomDeviceStateEvent;
    try {
        event = JSON.parse(raw);
    } catch (err) {
        logger.error(err, 'failed to parse room device state event');
        return;
    }

    broadcastRoomDeviceState(event).catch((err) => logger.error(err, 'failed to broadcast room device state'));
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
        if (channel === REDIS_CHANNELS.ROOM_REACTION_EMITTED) {
            handleRoomReactionEvent(message);
        }
        if (channel === REDIS_CHANNELS.ROOM_DEVICE_STATE_UPDATED) {
            handleRoomDeviceStateEvent(message);
        }
    });

    await subscriber.subscribe(
        REDIS_CHANNELS.ONLINE_USER_LIST_UPDATED,
        REDIS_CHANNELS.ONLINE_USER_WS_DELIVER,
        REDIS_CHANNELS.ROOM_LIST_UPDATED,
        REDIS_CHANNELS.ROOM_REACTION_EMITTED,
        REDIS_CHANNELS.ROOM_DEVICE_STATE_UPDATED
    );
    logger.info('subscribed to online-list, ws-delivery, room-list, room-reaction, and room-device-state redis channels');
};

export const stopListSubscriber = async (): Promise<void> => {
    if (!subscriber) return;
    await subscriber.quit();
    subscriber = undefined;
};
