import type { WsServerMessage } from '@repo/shared-types';
import type { CurrentUserStoreInstance, OnlineUserListStoreInstance, RoomListStoreInstance } from '../states/stores.ts';
import { mytoast } from '../components/toast.tsx';

export interface WsHandlerStores {
  currentUserStore: CurrentUserStoreInstance;
  onlineUserListStore: OnlineUserListStoreInstance;
  roomListStore: RoomListStoreInstance;
}

export function handleWsMessage(message: WsServerMessage, stores: WsHandlerStores): void {
  switch (message.event) {
    case 'error':
      mytoast.error(message.message);
      break;
    case 'online-user:delta': {
      stores.onlineUserListStore.getState().applyDelta(message.delta);

      const currentUserId = stores.currentUserStore.getState().currentUser?.id;
      const delta = message.delta;
      if (currentUserId) {
        let newStatus;
        if (delta.type === 'upsert' && delta.onlineUser.id === currentUserId) {
          newStatus = delta.onlineUser.status;
        } else if (delta.type === 'update-status' && delta.onlineUserId === currentUserId) {
          newStatus = delta.status;
        } else if (delta.type === 'remove' && delta.onlineUserId === currentUserId) {
          newStatus = null;
        }
      }
      break;
    }
    case 'room:delta':
      stores.roomListStore.getState().applyDelta(message.delta);
      break;
  }
}
