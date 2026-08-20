import { IUser, EventEmitterTransport } from '@repo/shared-types';

export interface AuthenticatedWebSocket extends EventEmitterTransport {
    user: IUser;
    token: string;
    traceId: string;
    isAlive: boolean;
    userId: string;
}

export type WsClientEvent = 'heartbeat' | 'user_logout' | 'request_state';

export interface CancelledCallData {
    targetUserId: string;
}

export type WsClientMessage =
    | { event: 'user_logout' }
    | { event: 'room:create'; title: string; subtitle?: string; maxSlots: number }
    | { event: 'room:delete'; roomId: string }
    | { event: 'room:join'; roomId: string }
    | { event: 'room:leave'; roomId: string }
