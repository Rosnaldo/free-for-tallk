import { AuthenticatedWebSocket } from '#websocket/types';
import { Heartbeat } from '#websocket/heartbeat';
import { cancelGracePeriod } from '../../../redis/grace_period';
import logger from '#logger';
import { removeOnlineUser } from '../../../services/online_list_redis';
import * as onlineUserRegistry from '../../user_registry';

export const handleMessageLogout =  (
    ws: AuthenticatedWebSocket,
    hb: Heartbeat,
): void => {
    logger.info({ userId: ws.user._id, email: ws.user.email }, 'ws client logged out');
    hb.stop();
    cancelGracePeriod(ws.user._id).catch((err) => logger.error(err, 'failed to cancel grace period'));

    removeOnlineUser(ws.user._id).catch((error: any) => logger.error(error, 'logout: falha ao remover usuário do api'));

    onlineUserRegistry.remove(ws.user._id);

    ws.terminate();
};
