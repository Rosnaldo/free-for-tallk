import { getUserModel } from '../models/user';
import { toSlug } from './to_slug';

export async function generateUniqueSlug(text: string): Promise<string> {
  const base = toSlug(text);
  const model = getUserModel();

  let slug = base;
  let suffix = 1;
  while (await model.exists({ slug })) {
    suffix += 1;
    slug = `${base}-${suffix}`;
  }

  return slug;
}
