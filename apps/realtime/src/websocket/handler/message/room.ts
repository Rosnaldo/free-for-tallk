import { AuthenticatedWebSocket } from '#websocket/types';
import { ROOM_REACTION_EMOJIS, WsClientMessage } from '@repo/shared-types';
import logger from '#logger';
import { createRoom, deleteRoom, addMemberToRoom, removeMemberFromRoom, getRoom, setUserRoom, clearUserRoom } from '../../../services/room_list_redis';
import { publishRoomReaction } from '../../../services/room_reaction_redis';
import { publishRoomDeviceState } from '../../../services/room_device_state_redis';
import { publishRoomChat } from '../../../services/room_chat_redis';
import { publishRoomNotice } from '../../../services/room_notice_redis';
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

    createRoomAndRegister(ws, msg).catch((err) => logger.error(err, 'failed to create room'));
};

async function createRoomAndRegister(ws: AuthenticatedWebSocket, msg: RoomCreateMessage): Promise<void> {
    const room = await createRoom({ title: msg.title, subtitle: msg.subtitle, maxSlots: msg.maxSlots, creatorId: ws.user._id });
    roomSocketRegistry.add(room.id, ws);
    await setUserRoom(ws.user._id, room.id);
}

export const handleRoomDelete = (ws: AuthenticatedWebSocket, msg: RoomDeleteMessage): void => {
    deleteRoomIfOwner(ws, msg).catch((err) => logger.error(err, 'failed to delete room'));
};

async function deleteRoomIfOwner(ws: AuthenticatedWebSocket, msg: RoomDeleteMessage): Promise<void> {
    const room = await getRoom(msg.roomId);
    if (!room) return;
    if (room.creator !== ws.user._id) {
        sendError(ws, 'Somente quem criou a sala pode excluí-la');
        return;
    }

    await deleteRoom(msg.roomId);
    roomSocketRegistry.clear(msg.roomId);
    await Promise.all(room.members.map((memberId) => clearUserRoom(memberId)));
}

export const handleRoomJoin = (ws: AuthenticatedWebSocket, msg: RoomJoinMessage): void => {
    joinRoom(ws, msg).catch((err) => logger.error(err, 'failed to join room'));
};

async function joinRoom(ws: AuthenticatedWebSocket, msg: RoomJoinMessage): Promise<void> {
    const result = await addMemberToRoom(msg.roomId, ws.user._id);
    if (!result.ok) {
        sendError(ws, result.reason === 'full' ? 'A sala está cheia' : 'Sala não encontrada');
        return;
    }

    roomSocketRegistry.add(msg.roomId, ws);
    await setUserRoom(ws.user._id, msg.roomId);
    if (result.alreadyMember) return;

    await publishRoomNotice({ roomId: msg.roomId, userId: ws.user._id, userName: displayName(ws), type: 'join' });
}

export const handleRoomLeave = (ws: AuthenticatedWebSocket, msg: RoomLeaveMessage): void => {
    leaveRoom(ws, msg).catch((err) => logger.error(err, 'failed to leave room'));
};

async function leaveRoom(ws: AuthenticatedWebSocket, msg: RoomLeaveMessage): Promise<void> {
    const removed = await removeMemberFromRoom(msg.roomId, ws.user._id);
    roomSocketRegistry.remove(msg.roomId, ws);
    await clearUserRoom(ws.user._id);
    if (!removed) return;

    await publishRoomNotice({ roomId: msg.roomId, userId: ws.user._id, userName: displayName(ws), type: 'leave' });
}

export const handleRoomReaction = (ws: AuthenticatedWebSocket, msg: RoomReactionMessage): void => {
    if (!(ROOM_REACTION_EMOJIS as readonly string[]).includes(msg.emoji)) {
        sendError(ws, 'Reação inválida');
        return;
    }

    reactInRoom(ws, msg).catch((err) => logger.error(err, 'failed to publish room reaction'));
};

async function reactInRoom(ws: AuthenticatedWebSocket, msg: RoomReactionMessage): Promise<void> {
    const room = await getRoom(msg.roomId);
    if (!room || !room.members.includes(ws.user._id)) {
        sendError(ws, 'Você não está nesta sala');
        return;
    }

    roomSocketRegistry.add(msg.roomId, ws);
    await publishRoomReaction({ roomId: msg.roomId, userId: ws.user._id, emoji: msg.emoji });
}

export const handleRoomDeviceState = (ws: AuthenticatedWebSocket, msg: RoomDeviceStateMessage): void => {
    if (typeof msg.microphoneOn !== 'boolean' || typeof msg.cameraOn !== 'boolean') {
        sendError(ws, 'Estado de dispositivo inválido');
        return;
    }

    updateDeviceState(ws, msg).catch((err) => logger.error(err, 'failed to publish room device state'));
};

async function updateDeviceState(ws: AuthenticatedWebSocket, msg: RoomDeviceStateMessage): Promise<void> {
    const room = await getRoom(msg.roomId);
    if (!room || !room.members.includes(ws.user._id)) {
        sendError(ws, 'Você não está nesta sala');
        return;
    }

    roomSocketRegistry.add(msg.roomId, ws);
    await publishRoomDeviceState({
        roomId: msg.roomId,
        userId: ws.user._id,
        microphoneOn: msg.microphoneOn,
        cameraOn: msg.cameraOn,
    });
}

export const handleRoomChat = (ws: AuthenticatedWebSocket, msg: RoomChatMessage): void => {
    if (typeof msg.text !== 'string' || !msg.text.trim() || msg.text.length > MAX_CHAT_TEXT_LENGTH) {
        sendError(ws, 'Mensagem inválida');
        return;
    }

    sendChatMessage(ws, msg).catch((err) => logger.error(err, 'failed to publish room chat'));
};

async function sendChatMessage(ws: AuthenticatedWebSocket, msg: RoomChatMessage): Promise<void> {
    const room = await getRoom(msg.roomId);
    if (!room || !room.members.includes(ws.user._id)) {
        sendError(ws, 'Você não está nesta sala');
        return;
    }

    roomSocketRegistry.add(msg.roomId, ws);
    await publishRoomChat({ roomId: msg.roomId, userId: ws.user._id, text: msg.text.trim() });
}
