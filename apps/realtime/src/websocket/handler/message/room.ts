import { AuthenticatedWebSocket, WsClientMessage } from '#websocket/types';
import { mapUserToOnlineUser } from '@repo/shared-types';
import logger from '#logger';
import { createRoom, deleteRoom, addMemberToRoom, removeMemberFromRoom, getRoom } from '../../../services/room_list_redis';
import * as roomMembership from '../../room_membership';

type RoomCreateMessage = Extract<WsClientMessage, { event: 'room:create' }>;
type RoomDeleteMessage = Extract<WsClientMessage, { event: 'room:delete' }>;
type RoomJoinMessage = Extract<WsClientMessage, { event: 'room:join' }>;
type RoomLeaveMessage = Extract<WsClientMessage, { event: 'room:leave' }>;

const sendError = (ws: AuthenticatedWebSocket, message: string): void => {
    ws.send(JSON.stringify({ event: 'error', message }));
};

export const handleRoomCreate = (ws: AuthenticatedWebSocket, msg: RoomCreateMessage): void => {
    if (typeof msg.title !== 'string' || !msg.title.trim() || typeof msg.maxSlots !== 'number' || msg.maxSlots < 1) {
        sendError(ws, 'Invalid room data');
        return;
    }

    const creator = mapUserToOnlineUser(ws.user, { id: ws.user._id, status: 'online' });
    createRoom({ title: msg.title, subtitle: msg.subtitle, maxSlots: msg.maxSlots, creator })
        .then((room) => roomMembership.set(ws.user._id, room.id))
        .catch((err) => logger.error(err, 'failed to create room'));
};

export const handleRoomDelete = (ws: AuthenticatedWebSocket, msg: RoomDeleteMessage): void => {
    getRoom(msg.roomId)
        .then((room) => {
            if (!room) return;
            if (room.creator.id !== ws.user._id) {
                sendError(ws, 'Only the room creator can delete this room');
                return;
            }
            return deleteRoom(msg.roomId);
        })
        .catch((err) => logger.error(err, 'failed to delete room'));
};

export const handleRoomJoin = (ws: AuthenticatedWebSocket, msg: RoomJoinMessage): void => {
    const member = mapUserToOnlineUser(ws.user, { id: ws.user._id, status: 'online' });
    addMemberToRoom(msg.roomId, member)
        .then((result) => {
            if (!result.ok) {
                sendError(ws, result.reason === 'full' ? 'Room is full' : 'Room not found');
                return;
            }
            roomMembership.set(ws.user._id, msg.roomId);
        })
        .catch((err) => logger.error(err, 'failed to join room'));
};

export const handleRoomLeave = (ws: AuthenticatedWebSocket, msg: RoomLeaveMessage): void => {
    removeMemberFromRoom(msg.roomId, ws.user._id)
        .then(() => roomMembership.remove(ws.user._id))
        .catch((err) => logger.error(err, 'failed to leave room'));
};
