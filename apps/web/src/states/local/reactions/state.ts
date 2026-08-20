export interface ReactionParticle {
  id: string;
  userId: string;
  emoji: string;
  tx: number;
  delayMs: number;
  sizeRem: number;
}

export interface ReactionsData {
  activeReactions: ReactionParticle[];
}

export const initialReactionsState: ReactionsData = {
  activeReactions: [],
};
