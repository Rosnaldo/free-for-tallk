import type { OnlineUser } from "@repo/shared-types";

export interface OnlineUserListData {
  onlineUsers: OnlineUser[];
}

export const initialOnlineUserListState: OnlineUserListData = {
  onlineUsers: [],
};
