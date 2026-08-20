import { AuthenticatedWebSocket, WsClientMessage } from '#websocket/types';
import { OnlineUser, mapUserToOnlineUser } from '@repo/shared-types';
import { createHeartbeat } from '#websocket/heartbeat';
import { startGracePeriod, cancelGracePeriod } from '../redis/grace_period';
import { handleClose } from '#websocket/handler/on_close';
import { handlePong } from '#websocket/handler/on_pong';
import { handleMessageLogout } from '#websocket/handler/message/logout';
import { handleRoomCreate, handleRoomDelete, handleRoomJoin, handleRoomLeave, handleRoomReaction, handleRoomDeviceState } from '#websocket/handler/message/room';
import { clientRegistry } from '#websocket/client_registry';
import { addOnlineUser } from '../services/online_list_redis';
import { removeMemberFromRoom } from '../services/room_list_redis';
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
            removeMemberFromRoom(orphanedRoomId, ws.user._id).catch((err) =>
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
