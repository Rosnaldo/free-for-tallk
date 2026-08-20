import type { IChatMessage } from '@repo/shared-types';
import { ChatData } from './state';

export interface ChatActions {
  addMessage: (message: IChatMessage) => void;
}

export const createChatActions = (
  set: (arg: Partial<ChatData> | ((state: ChatData) => Partial<ChatData>)) => void,
): ChatActions => ({
  addMessage: (message) => {
    set((state) => ({ messages: [...state.messages, message] }));
  },
});
