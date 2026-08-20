import { create } from 'zustand';

export interface TabLeaderState {
  isLeader: boolean;
}

export interface TabLeaderActions {
  setIsLeader: (isLeader: boolean) => void;
}

export const createTabLeaderStore = () => create<TabLeaderState & TabLeaderActions>((set) => ({
  isLeader: false,

  setIsLeader: (isLeader) => set({ isLeader }),
}));
