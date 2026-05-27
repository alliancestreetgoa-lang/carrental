import 'dotenv/config';
import http from 'http';
import { createApp } from './app';
import { initSocket } from './socket';
import { env } from './config/env';
import { prisma } from './lib/prisma';

const bootstrap = async () => {
  const app = createApp();
  const server = http.createServer(app);
  initSocket(server);

  await prisma.$connect();
  console.log('✓ Database connected');

  server.listen(env.PORT, () => {
    console.log(`✓ Server running on http://localhost:${env.PORT}`);
  });
};

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
