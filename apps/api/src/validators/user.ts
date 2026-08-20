import { z } from 'zod';
import { UserRole } from '@repo/shared-types';

import { BadRequestException } from '../exceptions/bad_request';

type UserRoleValue = (typeof UserRole)[keyof typeof UserRole];
const roleValues = Object.values(UserRole) as [UserRoleValue, ...UserRoleValue[]];

export const createUserSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional(),
  role: z.enum(roleValues),
});

export function validateCreateUser(input: unknown) {
  const result = createUserSchema.safeParse(input);
  if (!result.success) throw new BadRequestException(result.error.message);
  return result.data;
}

export const editUserSchema = z.object({
  _id: z.string().min(1),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  role: z.enum(roleValues).optional(),
});

export function validateEditUser(input: unknown) {
  const result = editUserSchema.safeParse(input);
  if (!result.success) throw new BadRequestException(result.error.message);
  return result.data;
}

export const deleteUserSchema = z.object({
  _id: z.string().min(1),
});

export function validateDeleteUser(input: unknown) {
  const result = deleteUserSchema.safeParse(input);
  if (!result.success) throw new BadRequestException(result.error.message);
  return result.data;
}

export const listUsersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  // Comma-separated (e.g. "volunteer,admin") since a caller may need more
  // than one role -- a plain z.enum() only accepts a single value.
  role: z.preprocess(
    (val) => (typeof val === 'string' ? val.split(',') : val),
    z.array(z.enum(roleValues)).optional(),
  ),
});

export function validateListUsers(input: unknown) {
  const result = listUsersSchema.safeParse(input);
  if (!result.success) throw new BadRequestException(result.error.message);
  return result.data;
}
