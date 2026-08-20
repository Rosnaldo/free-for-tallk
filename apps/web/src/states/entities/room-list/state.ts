import type { IRoom } from "@repo/shared-types";

export interface RoomListData {
  rooms: IRoom[];
}

export const initialRoomListState: RoomListData = {
  rooms: [],
};
