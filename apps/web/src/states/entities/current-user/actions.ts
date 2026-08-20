import { OnlineUser } from '@repo/shared-types';

export interface CurrentUserActions {
  setCurrentUser: (user?: OnlineUser) => void;
}

export const createCurrentUserActions = (
  set: (fn: (state: any) => any) => void,
): CurrentUserActions => {
  return {
    setCurrentUser: (user) => {
      set(() => ({
        currentUser: user,
      }));
    },
  };
};
