import type { IRoom, OnlineUser, ActiveRoomEvent } from "@repo/shared-types";
import { ActiveRoomData } from "./state";
import { useRoomListStore } from "../../stores";

export interface ActiveRoomActions {
  setActiveRoomId: (activeRoomId: string | null) => void;
  applyDelta: (event: ActiveRoomEvent) => void;
  joinRoom: (roomId: string, user: OnlineUser) => void;
  leaveRoom: (roomId: string, userId: string) => void;
  addRoom: (room: IRoom) => void;
}

export const createActiveRoomActions = (
  set: (arg: Partial<ActiveRoomData> | ((state: ActiveRoomData) => Partial<ActiveRoomData>)) => void,
  get: () => ActiveRoomData,
): ActiveRoomActions => ({
  setActiveRoomId: (activeRoomId) => set({ activeRoomId }),
  applyDelta: (event) => {
    if (event.type === "update") {
      const activeRoomId = get().activeRoomId;
      set({ activeRoomId });
    } else {
      set({ activeRoomId: null });
    }
  },
  addRoom: (room: IRoom) => {
    set({ activeRoomId: room.id });
  },
  joinRoom: (roomId: string, user: OnlineUser) => {
    set(() => {
      const rooms = useRoomListStore.getState().rooms;
      const activeRoom = rooms.find((r) => r.id === roomId);
      if (!activeRoom) return { activeRoomId: null };
      const isAlready = activeRoom.members.includes(user.id);
      if (isAlready) return { activeRoomId: null };
      if (activeRoom.members.length >= activeRoom.maxSlots) return { activeRoomId: null };

      const updatedRoom: IRoom = {
        ...activeRoom,
        members: [...activeRoom.members, user.id],
      };
      return {
        activeRoomId: updatedRoom.id,
        rooms: rooms.map((r) => (r.id === roomId ? updatedRoom : r)),
      };
    });
  },
  leaveRoom: (roomId: string, userId: string) => {
    set(() => ({
      activeRoomId: null,
      rooms: useRoomListStore.getState().rooms.map((r) => {
        if (r.id !== roomId) return r;
        return {
          ...r,
          members: r.members.filter((id) => id !== userId),
        };
      }),
    }));
  },
});
