import { createActiveRoomStore } from './entities/active-room/store.ts';
import { createCurrentUserStore } from './entities/current-user/store.ts';
import { createOnlineUserListStore } from './entities/online-user-list/store.ts';
import { createRoomListStore } from './entities/room-list/store.ts';
import { createAuthStore } from './local/auth/store.ts';
import { createDevicesStore } from './local/devices/store.ts';
import { createReactionsStore } from './local/reactions/store.ts';
import { createChatStore } from './local/chat/store.ts';
import { createTabLeaderStore } from './local/tab-leader/store.ts';

export type AuthStoreInstance = ReturnType<typeof createAuthStore>;
export type DevicesStoreInstance = ReturnType<typeof createDevicesStore>;
export type ReactionsStoreInstance = ReturnType<typeof createReactionsStore>;
export type ChatStoreInstance = ReturnType<typeof createChatStore>;
export type CurrentUserStoreInstance = ReturnType<typeof createCurrentUserStore>;
export type OnlineUserListStoreInstance = ReturnType<typeof createOnlineUserListStore>;
export type RoomListStoreInstance = ReturnType<typeof createRoomListStore>;
export type ActiveRoomStoreInstance = ReturnType<typeof createActiveRoomStore>;
export type TabLeaderStoreInstance = ReturnType<typeof createTabLeaderStore>;

export interface Stores {
    auth: AuthStoreInstance;
    devices: DevicesStoreInstance;
    reactions: ReactionsStoreInstance;
    chat: ChatStoreInstance;
    currentUser: CurrentUserStoreInstance;
    onlineUserList: OnlineUserListStoreInstance;
    roomList: RoomListStoreInstance;
    activeRoom: ActiveRoomStoreInstance;
    tabLeader: TabLeaderStoreInstance;
}

export let useAuthStore: AuthStoreInstance;
export let useDevicesStore: DevicesStoreInstance;
export let useReactionsStore: ReactionsStoreInstance;
export let useChatStore: ChatStoreInstance;
export let useCurrentUserStore: CurrentUserStoreInstance;
export let useOnlineUserListStore: OnlineUserListStoreInstance;
export let useRoomListStore: RoomListStoreInstance;
export let useActiveRoomStore: ActiveRoomStoreInstance;
export let useTabLeaderStore: TabLeaderStoreInstance;

export function createStores(): Stores {
    const s: Stores = {
        auth: createAuthStore(),
        devices: createDevicesStore(),
        reactions: createReactionsStore(),
        chat: createChatStore(),
        currentUser: createCurrentUserStore(),
        onlineUserList: createOnlineUserListStore(),
        roomList: createRoomListStore(),
        activeRoom: createActiveRoomStore(),
        tabLeader: createTabLeaderStore(),
    };

    useAuthStore = s.auth;
    useDevicesStore = s.devices;
    useReactionsStore = s.reactions;
    useChatStore = s.chat;
    useCurrentUserStore = s.currentUser;
    useOnlineUserListStore = s.onlineUserList;
    useRoomListStore = s.roomList;
    useActiveRoomStore = s.activeRoom;
    useTabLeaderStore = s.tabLeader;

    return s;
}
