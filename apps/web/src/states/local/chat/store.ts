import { create } from 'zustand';
import { initialChatState, ChatData } from './state';
import { createChatActions, ChatActions } from './actions';

export const createChatStore = () => create<ChatData & ChatActions>((set) => ({
  ...initialChatState,
  ...createChatActions(set),
}));
