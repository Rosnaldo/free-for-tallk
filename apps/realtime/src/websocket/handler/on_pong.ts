import { AuthenticatedWebSocket } from '#websocket/types';
import { Heartbeat } from '#websocket/heartbeat';
import { touchOnlineUserPresence } from '../../services/online_list_redis';
import logger from '#logger';

export const handlePong = (ws: AuthenticatedWebSocket, hb: Heartbeat): void => {
    hb.beat();
    touchOnlineUserPresence(ws.user._id).catch((error: any) => logger.error(error, 'pong: falha ao renovar presença do usuário'));
};
