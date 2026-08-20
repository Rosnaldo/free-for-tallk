import type { IRoom, RoomListEvent } from "@repo/shared-types";
import { RoomListData } from "./state";
import { fetchRooms } from "../../../services/api/rooms";

export interface RoomListActions {
  setRooms: (rooms: IRoom[]) => void;
  fetchRooms: () => Promise<void>;
  applyDelta: (event: RoomListEvent) => void;
}

export const createRoomListActions = (
  set: (arg: Partial<RoomListData> | ((state: RoomListData) => Partial<RoomListData>)) => void,
  get: () => RoomListData,
): RoomListActions => ({
  setRooms: (rooms) => set({ rooms }),
  fetchRooms: async () => {
    const rooms = await fetchRooms();
    set({ rooms });
  },
  applyDelta: (event) => {
    if (event.type === "created") {
      const others = get().rooms.filter((v) => v.id !== event.room.id);
      set({ rooms: [...others, event.room] });
    } else if (event.type === "deleted") {
      set({ rooms: get().rooms.filter((v) => v.id !== event.roomId) });
    } else if (event.type === "member-added") {
      set({
        rooms: get().rooms.map((r) =>
          r.id === event.roomId && !r.members.includes(event.userId)
            ? { ...r, members: [...r.members, event.userId] }
            : r
        ),
      });
    } else {
      set({
        rooms: get().rooms.map((r) =>
          r.id === event.roomId
            ? { ...r, members: r.members.filter((id) => id !== event.userId) }
            : r
        ),
      });
    }
  },
});
