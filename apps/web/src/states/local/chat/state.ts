import type { IChatMessage } from '@repo/shared-types';

export interface ChatData {
  messages: IChatMessage[];
}

export const initialChatState: ChatData = {
  messages: [],
};
