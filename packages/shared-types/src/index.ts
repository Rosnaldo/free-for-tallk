export * from './transport';


export const REDIS_CHANNELS = {
  // update redis state
  ONLINE_USER_LIST_UPDATED: "online-user-list:updated",

  // send message to user ws
  ONLINE_USER_WS_DELIVER: "online-user-ws:deliver",

  // room list mutated (create/delete/join/leave), relayed to every instance
  ROOM_LIST_UPDATED: "room-list:updated",
} as const;

// Shared between realtime (the sole writer, via redis/subscriber.ts) and api
// (a reader, checking current status before matching) so both agree on the
// exact key format.
export const REDIS_KEYS = {
  ONLINE_USER_PREFIX: "online-user:",
  ROOM_PREFIX: "room:",
} as const;

export type WsServerMessage =
  | { event: "error"; message: string }
  | { event: "online-user:delta"; delta: OnlineUserListEvent }
  | { event: "room:delta"; delta: RoomListEvent }

export type WsClientMessage =
  | { event: "ping" }
  | { event: "user_logout" }
  | { event: "room:create"; title: string; subtitle?: string; maxSlots: number }
  | { event: "room:delete"; roomId: string }
  | { event: "room:join"; roomId: string }
  | { event: "room:leave"; roomId: string }

export const UserRole = {
    admin: 'admin',
    member: 'member',
} as const;

export const UserRoleAll = [
    UserRole.admin,
    UserRole.member,
];

export interface IMedia {
    _id: string;
    url: string;
    s3Path: string;
    s3Host: string;
    cdnHost?: string;
};

export interface IUserAvatar extends IMedia {};

export interface IUser {
    _id: string;
    slug: string;
    firstName: string;
    lastName: string;
    email?: string;
    avatar?: IUserAvatar;
    role: keyof typeof UserRole;
    unverified: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface OnlineUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  state: 'SP';
  status: 'online';
  initials: string;
  hearts: number;
  role: keyof typeof UserRole;
  unverified: boolean;
  microphoneOn?: boolean;
  cameraOn?: boolean;
}

export interface IChatMessage {
  id: string;
  roomId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  timestamp: number;
  type?: 'text' | 'system' | 'reaction';
}

export interface IRoom {
  id: string;
  title: string;
  subtitle?: string;
  maxSlots: number;
  creator: OnlineUser;
  members: OnlineUser[];
}

export interface ICallSessionParticipant {
  userId: string | null;
  userName: string | null;
  joinedAt: Date;
  leftAt: Date;
  durationSeconds: number;
}

export interface Pagination {
    currentPage: number;
    totalPages: number;
    totalRecords: number;
    size: number;
};

export type OnlineUserListEvent =
  | { type: "upsert"; onlineUser: OnlineUser }
  | { type: "update-status"; onlineUserId: string; status: OnlineUser['status'] }
  | { type: "remove"; onlineUserId: string };

export type RoomListEvent =
  | { type: "created"; room: IRoom }
  | { type: "deleted"; roomId: string }
  | { type: "member-added"; roomId: string; member: OnlineUser }
  | { type: "member-removed"; roomId: string; userId: string };

export type ActiveRoomEvent =
  | { type: "update"; activeRoom: IRoom }
  | { type: "remove"; activeRoomId: string };

export function mapUserToOnlineUser(
    user: IUser,
    options?: Partial<Pick<OnlineUser, 'status' | 'id'>>,
): OnlineUser {
    return {
        id: options?.id ?? user._id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email ?? '',
        avatar: user.avatar?.url,
        state: 'SP',
        status: options?.status ?? 'online',
        initials: `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase(),
        hearts: 0,
        role: user.role,
        unverified: user.unverified,
        microphoneOn: false,
        cameraOn: false,
    };
}
