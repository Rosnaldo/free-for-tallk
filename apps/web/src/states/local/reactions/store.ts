import { create } from 'zustand';
import { initialReactionsState, ReactionsData } from './state';
import { createReactionsActions, ReactionsActions } from './actions';

export const createReactionsStore = () => create<ReactionsData & ReactionsActions>((set) => ({
  ...initialReactionsState,
  ...createReactionsActions(set),
}));
