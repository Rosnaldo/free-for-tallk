import { ReactionsData, ReactionParticle } from './state';

// Matches the CSS animation duration for .reaction-particle (see index.css).
const REACTION_DURATION_MS = 1800;

export interface ReactionsActions {
  triggerReaction: (userId: string, emoji: string) => void;
}

export const createReactionsActions = (
  set: (arg: Partial<ReactionsData> | ((state: ReactionsData) => Partial<ReactionsData>)) => void,
): ReactionsActions => ({
  triggerReaction: (userId, emoji) => {
    if (emoji === '🎉') return;

    const batchId = `react-batch-${Date.now()}-${Math.random()}`;
    const particle: ReactionParticle = {
      id: `${batchId}-0`,
      userId,
      emoji,
      tx: 0,
      delayMs: 0,
      sizeRem: 2.4,
    };

    // Replace any existing active reaction for this user so only 1 icon renders
    set((state) => ({
      activeReactions: [...state.activeReactions.filter((p) => p.userId !== userId), particle],
    }));

    setTimeout(() => {
      set((state) => ({
        activeReactions: state.activeReactions.filter((p) => !p.id.startsWith(batchId)),
      }));
    }, REACTION_DURATION_MS);
  },
});
