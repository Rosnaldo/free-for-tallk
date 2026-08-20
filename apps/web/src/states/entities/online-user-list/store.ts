import { create } from 'zustand';
import { initialOnlineUserListState, OnlineUserListData } from './state';
import { createOnlineUserListActions, OnlineUserListActions } from './actions';

export const createOnlineUserListStore = () => create<OnlineUserListData & OnlineUserListActions>((set, get) => ({
  ...initialOnlineUserListState,
  ...createOnlineUserListActions(set, get),
}));