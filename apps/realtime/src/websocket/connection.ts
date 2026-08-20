import { AuthenticatedWebSocket, WsClientMessage } from '#websocket/types';
import { OnlineUser, mapUserToOnlineUser } from '@repo/shared-types';
import { createHeartbeat } from '#websocket/heartbeat';
import { startGracePeriod, cancelGracePeriod } from '../redis/grace_period';
import { handleClose } from '#websocket/handler/on_close';
import { handlePong } from '#websocket/handler/on_pong';
import { handleMessageLogout } from '#websocket/handler/message/logout';
import { handleRoomCreate, handleRoomDelete, handleRoomJoin, handleRoomLeave, handleRoomReaction, handleRoomDeviceState, handleRoomChat } from '#websocket/handler/message/room';
import { clientRegistry } from '#websocket/client_registry';
import { addOnlineUser } from '../services/online_list_redis';
import { removeMemberFromRoom, getUserRoom, getRoom, clearUserRoom } from '../services/room_list_redis';
import { publishRoomNotice } from '../services/room_notice_redis';
import * as onlineUserRegistry from './user_registry';
import * as roomMembership from './room_membership';
import * as roomSocketRegistry from './room_socket_registry';
import logger from '#logger';


export const onConnection = () => async (ws: AuthenticatedWebSocket): Promise<void> => {
    logger.info({ userId: ws.user._id, email: ws.user.email, role: ws.user.role }, 'ws authenticated client connected');

    clientRegistry.add(ws);

    const user: OnlineUser = mapUserToOnlineUser(ws.user, { id: ws.user._id, status: 'online' });
    onlineUserRegistry.set(user.id, ws);

    const scheduleGracePeriod = (): void => {
        startGracePeriod(user.id).catch((err) => logger.error(err, 'failed to start grace period'));
    };

    cancelGracePeriod(user.id).catch((err) => logger.error(err, 'failed to cancel grace period'));

    // roomSocketRegistry/roomMembership are in-memory, so they go empty on
    // every realtime restart/redeploy while a reconnecting socket's actual
    // room membership (persisted via setUserRoom) doesn't -- without this,
    // that socket would silently stop receiving room:chat/reaction/notice
    // broadcasts until it happened to send one itself (see the "opportunistically
    // re-heals" handlers in room.ts, which only cover the sender's own socket).
    getUserRoom(ws.user._id)
        .then((roomId) => {
            if (!roomId) return;
            return getRoom(roomId).then((room) => {
                if (room && room.members.includes(ws.user._id)) {
                    roomMembership.set(ws.user._id, roomId);
                    roomSocketRegistry.add(roomId, ws);
                }
            });
        })
        .catch((err) => logger.error(err, 'failed to heal room socket registry on connect'));

    const hb = createHeartbeat(ws, () => {
        ws.terminate();
    });

    ws.on('pong', () => handlePong(ws, hb));

    ws.on('message', (raw) => {
        const msg = JSON.parse(raw.toString()) as WsClientMessage;
        switch (msg.event) {
            case 'user_logout':
                handleMessageLogout(ws, hb);
                break;
            case 'room:create':
                handleRoomCreate(ws, msg);
                break;
            case 'room:delete':
                handleRoomDelete(ws, msg);
                break;
            case 'room:join':
                handleRoomJoin(ws, msg);
                break;
            case 'room:leave':
                handleRoomLeave(ws, msg);
                break;
            case 'room:reaction':
                handleRoomReaction(ws, msg);
                break;
            case 'room:device-state':
                handleRoomDeviceState(ws, msg);
                break;
            case 'room:chat':
                handleRoomChat(ws, msg);
                break;
        }
    });

    ws.on('close', () => {
        logger.info({ userId: ws.user._id, email: ws.user.email }, 'ws client disconnected');
        clientRegistry.remove(ws);

        onlineUserRegistry.remove(ws.user._id);
        roomSocketRegistry.removeSocket(ws);

        const orphanedRoomId = roomMembership.get(ws.user._id);
        if (orphanedRoomId) {
            roomMembership.remove(ws.user._id);
            removeMemberFromRoom(orphanedRoomId, ws.user._id)
                .then((removed) =>
                    clearUserRoom(ws.user._id).then(() => {
                        if (!removed) return;
                        return publishRoomNotice({ roomId: orphanedRoomId, userId: ws.user._id, userName: `${ws.user.firstName} ${ws.user.lastName}`, type: 'leave' });
                    }),
                )
                .catch((err) =>
                    logger.error(err, 'failed to remove disconnected user from room'),
                );
        }

        handleClose(hb, scheduleGracePeriod);
    });

    try {
        logger.info({ userId: user.id, name: user.name }, 'user connected');
        await addOnlineUser(user);
    } catch (error) {
        logger.error(error, 'ws onConnection: falha ao sincronizar call ativa do usuário');
    }
};
