import { AuthenticatedWebSocket, WsClientMessage } from '#websocket/types';
import { ROOM_REACTION_EMOJIS } from '@repo/shared-types';
import logger from '#logger';
import { createRoom, deleteRoom, addMemberToRoom, removeMemberFromRoom, getRoom, setUserRoom, clearUserRoom } from '../../../services/room_list_redis';
import { publishRoomReaction } from '../../../services/room_reaction_redis';
import { publishRoomDeviceState } from '../../../services/room_device_state_redis';
import { publishRoomChat } from '../../../services/room_chat_redis';
import { publishRoomNotice } from '../../../services/room_notice_redis';
import * as roomMembership from '../../room_membership';
import * as roomSocketRegistry from '../../room_socket_registry';

type RoomCreateMessage = Extract<WsClientMessage, { event: 'room:create' }>;
type RoomDeleteMessage = Extract<WsClientMessage, { event: 'room:delete' }>;
type RoomJoinMessage = Extract<WsClientMessage, { event: 'room:join' }>;
type RoomLeaveMessage = Extract<WsClientMessage, { event: 'room:leave' }>;
type RoomReactionMessage = Extract<WsClientMessage, { event: 'room:reaction' }>;
type RoomDeviceStateMessage = Extract<WsClientMessage, { event: 'room:device-state' }>;
type RoomChatMessage = Extract<WsClientMessage, { event: 'room:chat' }>;

const MAX_CHAT_TEXT_LENGTH = 2000;

const sendError = (ws: AuthenticatedWebSocket, message: string): void => {
    ws.send(JSON.stringify({ event: 'error', message }));
};

const displayName = (ws: AuthenticatedWebSocket): string => `${ws.user.firstName} ${ws.user.lastName}`;

export const handleRoomCreate = (ws: AuthenticatedWebSocket, msg: RoomCreateMessage): void => {
    if (typeof msg.title !== 'string' || !msg.title.trim() || typeof msg.maxSlots !== 'number' || msg.maxSlots < 1) {
        sendError(ws, 'Dados da sala inválidos');
        return;
    }

    createRoom({ title: msg.title, subtitle: msg.subtitle, maxSlots: msg.maxSlots, creatorId: ws.user._id })
        .then((room) => {
            roomMembership.set(ws.user._id, room.id);
            roomSocketRegistry.add(room.id, ws);
            return setUserRoom(ws.user._id, room.id);
        })
        .catch((err) => logger.error(err, 'failed to create room'));
};

export const handleRoomDelete = (ws: AuthenticatedWebSocket, msg: RoomDeleteMessage): void => {
    getRoom(msg.roomId)
        .then((room) => {
            if (!room) return;
            if (room.creator !== ws.user._id) {
                sendError(ws, 'Somente quem criou a sala pode excluí-la');
                return;
            }
            return deleteRoom(msg.roomId).then(() => {
                roomSocketRegistry.clear(msg.roomId);
                return Promise.all(room.members.map((memberId) => clearUserRoom(memberId)));
            });
        })
        .catch((err) => logger.error(err, 'failed to delete room'));
};

export const handleRoomJoin = (ws: AuthenticatedWebSocket, msg: RoomJoinMessage): void => {
    addMemberToRoom(msg.roomId, ws.user._id)
        .then((result) => {
            if (!result.ok) {
                sendError(ws, result.reason === 'full' ? 'A sala está cheia' : 'Sala não encontrada');
                return;
            }
            // Healing (membership/registry/user-room) happens on every join,
            // including repeats -- RoomPage.tsx's room:join effect deliberately
            // resends until its local state reflects membership, and that resend
            // is otherwise a no-op against Redis (see addMemberToRoom). Only a
            // genuinely new join gets a notice, or every resend would post a
            // duplicate "entrou na sala" message.
            roomMembership.set(ws.user._id, msg.roomId);
            roomSocketRegistry.add(msg.roomId, ws);
            return setUserRoom(ws.user._id, msg.roomId).then(() => {
                if (result.alreadyMember) return;
                return publishRoomNotice({ roomId: msg.roomId, userId: ws.user._id, userName: displayName(ws), type: 'join' });
            });
        })
        .catch((err) => logger.error(err, 'failed to join room'));
};

export const handleRoomLeave = (ws: AuthenticatedWebSocket, msg: RoomLeaveMessage): void => {
    removeMemberFromRoom(msg.roomId, ws.user._id)
        .then((removed) => {
            roomMembership.remove(ws.user._id);
            roomSocketRegistry.remove(msg.roomId, ws);
            return clearUserRoom(ws.user._id).then(() => {
                if (!removed) return;
                return publishRoomNotice({ roomId: msg.roomId, userId: ws.user._id, userName: displayName(ws), type: 'leave' });
            });
        })
        .catch((err) => logger.error(err, 'failed to leave room'));
};

export const handleRoomReaction = (ws: AuthenticatedWebSocket, msg: RoomReactionMessage): void => {
    if (!(ROOM_REACTION_EMOJIS as readonly string[]).includes(msg.emoji)) {
        sendError(ws, 'Reação inválida');
        return;
    }

    // Checked against Redis (the authoritative room state) rather than the
    // in-memory roomMembership map: that map only reflects joins this exact
    // process has handled, so it goes stale on every restart/redeploy while
    // a client's socket just reconnects without resending room:join (it only
    // does that when its own local room state says it isn't a member yet).
    getRoom(msg.roomId)
        .then((room) => {
            if (!room || !room.members.includes(ws.user._id)) {
                sendError(ws, 'Você não está nesta sala');
                return;
            }
            // Opportunistically re-heals roomSocketRegistry: it's pure
            // in-memory state, so it goes empty across a restart while this
            // socket's Redis membership (just checked above) doesn't.
            roomSocketRegistry.add(msg.roomId, ws);
            return publishRoomReaction({ roomId: msg.roomId, userId: ws.user._id, emoji: msg.emoji });
        })
        .catch((err) => logger.error(err, 'failed to publish room reaction'));
};

export const handleRoomDeviceState = (ws: AuthenticatedWebSocket, msg: RoomDeviceStateMessage): void => {
    if (typeof msg.microphoneOn !== 'boolean' || typeof msg.cameraOn !== 'boolean') {
        sendError(ws, 'Estado de dispositivo inválido');
        return;
    }

    getRoom(msg.roomId)
        .then((room) => {
            if (!room || !room.members.includes(ws.user._id)) {
                sendError(ws, 'Você não está nesta sala');
                return;
            }
            roomSocketRegistry.add(msg.roomId, ws);
            return publishRoomDeviceState({
                roomId: msg.roomId,
                userId: ws.user._id,
                microphoneOn: msg.microphoneOn,
                cameraOn: msg.cameraOn,
            });
        })
        .catch((err) => logger.error(err, 'failed to publish room device state'));
};

export const handleRoomChat = (ws: AuthenticatedWebSocket, msg: RoomChatMessage): void => {
    if (typeof msg.text !== 'string' || !msg.text.trim() || msg.text.length > MAX_CHAT_TEXT_LENGTH) {
        sendError(ws, 'Mensagem inválida');
        return;
    }

    getRoom(msg.roomId)
        .then((room) => {
            if (!room || !room.members.includes(ws.user._id)) {
                sendError(ws, 'Você não está nesta sala');
                return;
            }
            roomSocketRegistry.add(msg.roomId, ws);
            return publishRoomChat({ roomId: msg.roomId, userId: ws.user._id, text: msg.text.trim() });
        })
        .catch((err) => logger.error(err, 'failed to publish room chat'));
};
