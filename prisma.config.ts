import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: {
    kind: 'file',
    path: 'prisma/schema.prisma',
  },
  migrate: {
    migrationsDirectory: 'prisma/migrations',
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
