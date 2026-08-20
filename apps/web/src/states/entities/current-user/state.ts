import { OnlineUser } from '@repo/shared-types';

export interface CurrentUserState {
  currentUser?: OnlineUser;
}

export const initialCurrentUserState: CurrentUserState = {
  currentUser: undefined,
};
