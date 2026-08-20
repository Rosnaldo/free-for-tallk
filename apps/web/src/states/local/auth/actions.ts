import { keycloak } from '../../../api/keycloak';
import { fetchUser } from '../../../services/api/user';
import { RealtimeWsService } from '../../../services/ws/realtime-ws';
import { handleWsMessage } from '../../../services/ws-handlers';
import { initWs } from '../../../services/ws/init-ws';
import { useCurrentUserStore, useOnlineUserListStore, useRoomListStore, useTabLeaderStore } from '../../stores';
import { AuthState } from './state';
import authSession from '../../../auth/session';
import { mapUserToOnlineUser } from '@repo/shared-types';

export interface AuthActions {
    reset(): void;
    bootstrap(): Promise<void>;
    init(): Promise<void>;
    login(): void;
    logout(): void;
}

export const createAuthActions = (
    set: (fn: (state: any) => any) => void,
    get: () => AuthState & AuthActions,
): AuthActions => ({
    reset() {
        initWs.notifyLogout();
        initWs.stop();
        RealtimeWsService.getInstance().disconnect();
        useCurrentUserStore.getState().setCurrentUser();

        set(() => ({
            isAuthenticated: false,
            token: undefined,
            email: undefined,
        }));

        keycloak.logout({ redirectUri: window.location.origin + '/login' });
    },

    async bootstrap() {
        await get().init();
        initWs.init({ tabLeader: useTabLeaderStore });

        const { error, email } = get();
        if (error) {
            set(() => ({ error }));
            return;
        };

        if (!email) {
            set(() => ({ ready: true }));
            return;
        }

        try {
            const user = await fetchUser(email);
            useCurrentUserStore.getState().setCurrentUser(mapUserToOnlineUser(user));

            if (authSession.token) {
                initWs.onMessage((message) =>
                    handleWsMessage(message, {
                        currentUserStore: useCurrentUserStore,
                        onlineUserListStore: useOnlineUserListStore,
                        roomListStore: useRoomListStore,
                    }),
                );

                // if (user.role === 'volunteer' || user.role === 'admin') {
                //     RealtimeWsService.getInstance().connectAsVolunteer(authSession.token);
                // } else {
                //     RealtimeWsService.getInstance().connectAsCustomer(authSession.token);
                // }
            }

            set(() => ({ ready: true }));
        } catch (err) {
            console.log('Error fetching user:', err);
            const message = err instanceof Error ? err.message : 'Erro desconhecido.';
            this.reset();
            set(() => ({ error: message }));
        }
    },

    async init() {
        try {
            const auth = await keycloak.init({
                onLoad: 'check-sso',
                silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
                redirectUri: window.location.origin + '/',
                checkLoginIframe: false,
                enableLogging: true,
            });

            keycloak.onAuthSuccess = () => set(() => ({ isAuthenticated: true }));
            keycloak.onAuthLogout = () => {this.reset()};
            keycloak.onTokenExpired = () => {
                keycloak.updateToken(30).catch(() => {
                    set(() => ({ isAuthenticated: false }));
                    keycloak.logout({ redirectUri: window.location.origin + '/login' });
                });
            };

            authSession.token = keycloak.token;
            authSession.email = keycloak.tokenParsed?.email;

            set(() => ({
                isAuthenticated: auth,
                token: authSession.token,
                email: authSession.email,
            }));
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Erro desconhecido.';
            console.error('Error during Keycloak initialization:', error);
            set(() => ({ error: message }));
        }
    },

    login() {
        keycloak.login({ prompt: 'login', redirectUri: window.location.href });
    },

    logout() {
        initWs.notifyLogout();
        keycloak.logout({ redirectUri: window.location.origin + '/login' });
    },
});
