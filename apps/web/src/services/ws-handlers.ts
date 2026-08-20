import type { IChatMessage, WsServerMessage } from '@repo/shared-types';
import type { ChatStoreInstance, CurrentUserStoreInstance, OnlineUserListStoreInstance, ReactionsStoreInstance, RoomListStoreInstance } from '../states/stores.ts';
import { mytoast } from '../components/toast.tsx';

export interface WsHandlerStores {
  currentUserStore: CurrentUserStoreInstance;
  onlineUserListStore: OnlineUserListStoreInstance;
  roomListStore: RoomListStoreInstance;
  reactionsStore: ReactionsStoreInstance;
  chatStore: ChatStoreInstance;
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
      // The sender already triggers their own animation and adds their own
      // chat entry instantly on click (see RoomView.sendReaction) -- this
      // only needs to do the same for everyone else in the room.
      const currentUserId = stores.currentUserStore.getState().currentUser?.id;
      if (message.userId !== currentUserId) {
        stores.reactionsStore.getState().triggerReaction(message.userId, message.emoji);

        const reactingUser = stores.onlineUserListStore.getState().onlineUsers.find((u) => u.id === message.userId);
        const userName = reactingUser?.name ?? 'Alguém';
        const reactionMsg: IChatMessage = {
          id: `react-${message.userId}-${Date.now()}`,
          roomId: message.roomId,
          userId: message.userId,
          userName,
          text: `${userName} reacted with ${message.emoji}`,
          timestamp: Date.now(),
          type: 'reaction',
        };
        stores.chatStore.getState().addMessage(reactionMsg);
      }
      break;
    }
    case 'room:chat': {
      // The sender already adds their own chat entry instantly on send (see
      // RoomView.handleSendMessage) -- this only needs to do the same for
      // everyone else in the room.
      const currentUserId = stores.currentUserStore.getState().currentUser?.id;
      if (message.userId !== currentUserId) {
        const sender = stores.onlineUserListStore.getState().onlineUsers.find((u) => u.id === message.userId);
        const chatMsg: IChatMessage = {
          id: `msg-${message.userId}-${Date.now()}`,
          roomId: message.roomId,
          userId: message.userId,
          userName: sender?.name ?? 'Alguém',
          userAvatar: sender?.avatar,
          text: message.text,
          timestamp: Date.now(),
          type: 'text',
        };
        stores.chatStore.getState().addMessage(chatMsg);
      }
      break;
    }
    case 'room:notice': {
      // Broadcast to every member (including the one who joined/left) since
      // there's no responsiveness-sensitive local echo to race here, unlike
      // chat/reaction.
      const noticeMsg: IChatMessage = {
        id: `notice-${message.userId}-${Date.now()}`,
        roomId: message.roomId,
        userId: message.userId,
        userName: message.userName,
        text: message.type === 'join' ? `${message.userName} entrou na sala` : `${message.userName} saiu da sala`,
        timestamp: Date.now(),
        type: 'system',
      };
      stores.chatStore.getState().addMessage(noticeMsg);
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
