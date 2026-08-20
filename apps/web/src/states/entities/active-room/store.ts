import { create } from 'zustand';
import { initialActiveRoomState, ActiveRoomData } from './state';
import { createActiveRoomActions, ActiveRoomActions } from './actions';

export const createActiveRoomStore = () => create<ActiveRoomData & ActiveRoomActions>((set, get) => ({
  ...initialActiveRoomState,
  ...createActiveRoomActions(set, get),
}));