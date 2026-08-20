import { AuthenticatedWebSocket, WsClientMessage } from '#websocket/types';
import { ROOM_REACTION_EMOJIS } from '@repo/shared-types';
import logger from '#logger';
import { createRoom, deleteRoom, addMemberToRoom, removeMemberFromRoom, getRoom } from '../../../services/room_list_redis';
import { publishRoomReaction } from '../../../services/room_reaction_redis';
import { publishRoomDeviceState } from '../../../services/room_device_state_redis';
import * as roomMembership from '../../room_membership';
import * as roomSocketRegistry from '../../room_socket_registry';

type RoomCreateMessage = Extract<WsClientMessage, { event: 'room:create' }>;
type RoomDeleteMessage = Extract<WsClientMessage, { event: 'room:delete' }>;
type RoomJoinMessage = Extract<WsClientMessage, { event: 'room:join' }>;
type RoomLeaveMessage = Extract<WsClientMessage, { event: 'room:leave' }>;
type RoomReactionMessage = Extract<WsClientMessage, { event: 'room:reaction' }>;
type RoomDeviceStateMessage = Extract<WsClientMessage, { event: 'room:device-state' }>;

const sendError = (ws: AuthenticatedWebSocket, message: string): void => {
    ws.send(JSON.stringify({ event: 'error', message }));
};

export const handleRoomCreate = (ws: AuthenticatedWebSocket, msg: RoomCreateMessage): void => {
    if (typeof msg.title !== 'string' || !msg.title.trim() || typeof msg.maxSlots !== 'number' || msg.maxSlots < 1) {
        sendError(ws, 'Dados da sala inválidos');
        return;
    }

    createRoom({ title: msg.title, subtitle: msg.subtitle, maxSlots: msg.maxSlots, creatorId: ws.user._id })
        .then((room) => {
            roomMembership.set(ws.user._id, room.id);
            roomSocketRegistry.add(room.id, ws);
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
            return deleteRoom(msg.roomId).then(() => roomSocketRegistry.clear(msg.roomId));
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
            roomMembership.set(ws.user._id, msg.roomId);
            roomSocketRegistry.add(msg.roomId, ws);
        })
        .catch((err) => logger.error(err, 'failed to join room'));
};

export const handleRoomLeave = (ws: AuthenticatedWebSocket, msg: RoomLeaveMessage): void => {
    removeMemberFromRoom(msg.roomId, ws.user._id)
        .then(() => {
            roomMembership.remove(ws.user._id);
            roomSocketRegistry.remove(msg.roomId, ws);
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
