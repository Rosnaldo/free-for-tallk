import type { OnlineUser, OnlineUserListEvent } from "@repo/shared-types";
import { OnlineUserListData } from "./state";
import { fetchOnlineUsers } from "../../../services/api/online-users";

export interface OnlineUserListActions {
  setOnlineUsers: (onlineUsers: OnlineUser[]) => void;
  fetchOnlineUsers: () => Promise<void>;
  applyDelta: (event: OnlineUserListEvent) => void;
  updateDeviceState: (userId: string, patch: Partial<Pick<OnlineUser, 'microphoneOn' | 'cameraOn'>>) => void;
}

export const createOnlineUserListActions = (
  set: (arg: Partial<OnlineUserListData> | ((state: OnlineUserListData) => Partial<OnlineUserListData>)) => void,
  get: () => OnlineUserListData,
): OnlineUserListActions => ({
  setOnlineUsers: (onlineUsers) => set({ onlineUsers }),
  fetchOnlineUsers: async () => {
    const onlineUsers = await fetchOnlineUsers();
    set({ onlineUsers });
  },
  applyDelta: (event) => {
    if (event.type === "upsert") {
      const others = get().onlineUsers.filter((v) => v.id !== event.onlineUser.id);
      set({ onlineUsers: [...others, event.onlineUser] });
    } else if (event.type === "update-status") {
      set({
        onlineUsers: get().onlineUsers.map((v) =>
          v.id === event.onlineUserId ? { ...v, status: event.status } : v
        ),
      });
    } else {
      set({ onlineUsers: get().onlineUsers.filter((v) => v.id !== event.onlineUserId) });
    }
  },
  updateDeviceState: (userId, patch) => {
    set({
      onlineUsers: get().onlineUsers.map((v) => (v.id === userId ? { ...v, ...patch } : v)),
    });
  },
});
