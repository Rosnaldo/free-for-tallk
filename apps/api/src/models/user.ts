import mongoose, { HydratedDocument, Model } from 'mongoose';
import { IUser, IUserAvatar, UserRoleAll, UserRole } from '@repo/shared-types';

const { Schema } = mongoose;

const UserAvatarSchema = new Schema<IUserAvatar>(
  {
    url: { type: String, required: true },
    s3Path: { type: String, required: true },
    s3Host: { type: String, required: true },
    cdnHost: { type: String, required: false },
  },
  { _id: false },
);

export type UserDocument = HydratedDocument<Omit<IUser, '_id'>>;
export type UserModel = Model<Omit<IUser, '_id'>>;

const UserSchema = new Schema<Omit<IUser, '_id'>>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    slug: { type: String, required: true },
    email: { type: String, required: false, unique: true, sparse: true },
    role: {
      type: String,
      enum: UserRoleAll,
      default: UserRole.member,
    },
    avatar: { type: UserAvatarSchema, required: false },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  },
);

export function toUser(doc: UserDocument): IUser {
  return {
    _id: doc._id.toString(),
    firstName: doc.firstName,
    lastName: doc.lastName,
    slug: doc.slug,
    email: doc.email,
    avatar: doc.avatar,
    role: doc.role,
    unverified: doc.unverified,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

let UserModel: UserModel;

export function getUserModel(): UserModel {
  if (!UserModel) {
    UserModel = mongoose.model<Omit<IUser, '_id'>>('User', UserSchema, 'users');
  }
  return UserModel;
}

export async function findUserByEmail(email: string): Promise<IUser | undefined> {
  const doc = await getUserModel().findOne({ email });
  return doc ? toUser(doc) : undefined;
}

// The room a match creates is named after the volunteer's slug (see
// on_volunteer_connection.ts) -- this is how notify.ts resolves a match's
// roomName back to the volunteer's display info (name/avatar).
export async function findUserBySlug(slug: string): Promise<IUser | undefined> {
  const doc = await getUserModel().findOne({ slug });
  return doc ? toUser(doc) : undefined;
}
