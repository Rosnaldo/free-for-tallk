import { connectMongo } from './db/connection';
import { getUserModel } from './models/user';
import { generateUniqueSlug } from './utils/unique_slug';
import logger from './logger';

const users = [
  { firstName: 'Andrey', lastName: 'Tsuzuki', email: 'andreytsuzuki@gmail.com', role: 'admin' },
] as const;

async function populate(): Promise<void> {
  await connectMongo();

  const model = getUserModel();
  for (const u of users) {
    const existing = await model.findOne({ email: u.email });
    if (existing) {
      existing.role = u.role;
      await existing.save();
      logger.info(`populate: updated ${u.email} (role=${u.role})`);
      continue;
    }

    await model.create({
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      role: u.role,
      slug: await generateUniqueSlug(`${u.firstName}-${u.lastName}`),
    });
    logger.info(`populate: created ${u.email} (role=${u.role})`);
  }
}

populate()
  .then(() => process.exit(0))
  .catch((err) => {
    logger.error(err, 'populate: failed');
    process.exit(1);
  });
