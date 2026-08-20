import express from 'express';
import cors from 'cors';

import properties from './properties';
import logger from './logger';
import { connectMongo } from './db/connection';
import { connectRedis } from './redis/connection';
import authRoutes from './routes/auth';
import healthRoutes from './routes/health';
import usersRoutes from './routes/users';
import roomsRoutes from './routes/rooms';
import onlineUsersRoutes from './routes/online_users';

const app = express();
app.use(cors({ origin: properties.webOrigins }));
app.use(express.json());

app.use(authRoutes);
app.use(healthRoutes);
app.use(usersRoutes);
app.use(roomsRoutes);
app.use(onlineUsersRoutes);

async function main() {
  await connectMongo();
  await connectRedis();

  app.listen(properties.port, () => logger.info(`api listening on ${properties.port}`));
}

main();
