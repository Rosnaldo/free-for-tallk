import type Redis from 'ioredis';
import { REDIS_CHANNELS, SOCKET_OPEN, OnlineUserListEvent, RoomListEvent, RoomReactionEvent, RoomDeviceStateEvent, RoomChatEvent, RoomNoticeEvent, WsServerMessage } from '@repo/shared-types';
import logger from '#logger';
import { getRedisClient } from './singleton';
import { addOnlineUser as addOnlineUserPresence, removeOnlineUser as removeOnlineUserPresence, patchOnlineUserIfPresent as patchOnlineUserPresence } from '../services/online_list_redis';
import * as onlineRegistry from '../websocket/user_registry';
import { broadcastOnlineUserDelta } from '../websocket/broadcast_online_user_delta';
import { broadcastRoomDelta } from '../websocket/broadcast_room_delta';
import { broadcastRoomReaction } from '../websocket/broadcast_room_reaction';
import { broadcastRoomDeviceState } from '../websocket/broadcast_room_device_state';
import { broadcastRoomChat } from '../websocket/broadcast_room_chat';
import { broadcastRoomNotice } from '../websocket/broadcast_room_notice';

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
    } else if (event.type === 'remove') {
        applied = removeOnlineUserPresence(event.onlineUserId).then(() => undefined);
    } else if (event.type === 'patch') {
        applied = patchOnlineUserPresence(event.onlineUserId, event.patch).then(() => {
            broadcastOnlineUserDelta(event);
        });
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

    broadcastRoomReaction(event);
}

function handleRoomDeviceStateEvent(raw: string): void {
    let event: RoomDeviceStateEvent;
    try {
        event = JSON.parse(raw);
    } catch (err) {
        logger.error(err, 'failed to parse room device state event');
        return;
    }

    broadcastRoomDeviceState(event);
}

function handleRoomChatEvent(raw: string): void {
    let event: RoomChatEvent;
    try {
        event = JSON.parse(raw);
    } catch (err) {
        logger.error(err, 'failed to parse room chat event');
        return;
    }

    broadcastRoomChat(event);
}

function handleRoomNoticeEvent(raw: string): void {
    let event: RoomNoticeEvent;
    try {
        event = JSON.parse(raw);
    } catch (err) {
        logger.error(err, 'failed to parse room notice event');
        return;
    }

    broadcastRoomNotice(event);
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
        if (channel === REDIS_CHANNELS.ROOM_CHAT_EMITTED) {
            handleRoomChatEvent(message);
        }
        if (channel === REDIS_CHANNELS.ROOM_NOTICE_EMITTED) {
            handleRoomNoticeEvent(message);
        }
    });

    await subscriber.subscribe(
        REDIS_CHANNELS.ONLINE_USER_LIST_UPDATED,
        REDIS_CHANNELS.ONLINE_USER_WS_DELIVER,
        REDIS_CHANNELS.ROOM_LIST_UPDATED,
        REDIS_CHANNELS.ROOM_REACTION_EMITTED,
        REDIS_CHANNELS.ROOM_DEVICE_STATE_UPDATED,
        REDIS_CHANNELS.ROOM_CHAT_EMITTED,
        REDIS_CHANNELS.ROOM_NOTICE_EMITTED
    );
    logger.info('subscribed to online-list, ws-delivery, room-list, room-reaction, room-device-state, room-chat, and room-notice redis channels');
};

export const stopListSubscriber = async (): Promise<void> => {
    if (!subscriber) return;
    await subscriber.quit();
    subscriber = undefined;
};
