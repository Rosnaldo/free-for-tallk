import mongoose from 'mongoose';

import properties from '../properties';
import logger from '../logger';

export async function connectMongo(): Promise<void> {
  await mongoose.connect(properties.mongoUri);
  logger.info('mongo connected');
}
