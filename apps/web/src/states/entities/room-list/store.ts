import { create } from 'zustand';
import { initialRoomListState, RoomListData } from './state';
import { createRoomListActions, RoomListActions } from './actions';

export const createRoomListStore = () => create<RoomListData & RoomListActions>((set, get) => ({
  ...initialRoomListState,
  ...createRoomListActions(set, get),
}));