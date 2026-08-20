import type { WsServerMessage } from '@repo/shared-types';
import type { CurrentUserStoreInstance, OnlineUserListStoreInstance, ReactionsStoreInstance, RoomListStoreInstance } from '../states/stores.ts';
import { mytoast } from '../components/toast.tsx';

export interface WsHandlerStores {
  currentUserStore: CurrentUserStoreInstance;
  onlineUserListStore: OnlineUserListStoreInstance;
  roomListStore: RoomListStoreInstance;
  reactionsStore: ReactionsStoreInstance;
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
    case 'room:reaction': {
      // The sender already triggers their own animation instantly on click
      // (see RoomView.sendReaction) -- this only needs to animate it for
      // everyone else in the room.
      const currentUserId = stores.currentUserStore.getState().currentUser?.id;
      if (message.userId !== currentUserId) {
        stores.reactionsStore.getState().triggerReaction(message.userId, message.emoji);
      }
      break;
    }
    case 'room:device-state': {
      // The sender already reflects their own mic/camera state from the
      // local devices store (see RoomView) -- this only needs to update how
      // everyone else in the room sees them.
      const currentUserId = stores.currentUserStore.getState().currentUser?.id;
      if (message.userId !== currentUserId) {
        stores.onlineUserListStore.getState().updateDeviceState(message.userId, {
          microphoneOn: message.microphoneOn,
          cameraOn: message.cameraOn,
        });
      }
      break;
    }
  }
}
