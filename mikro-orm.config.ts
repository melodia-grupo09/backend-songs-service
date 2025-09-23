import { Migrator } from '@mikro-orm/migrations';
import { defineConfig, PostgreSqlDriver, Utils } from '@mikro-orm/postgresql';
import { SeedManager } from '@mikro-orm/seeder';
import { SqlHighlighter } from '@mikro-orm/sql-highlighter';
import 'dotenv/config';

export default defineConfig({
  driver: PostgreSqlDriver,
  debug: true,
  autoJoinOneToOneOwner: false,
  highlighter: new SqlHighlighter(),
  entities: ['dist/**/*.entity.js'],
  entitiesTs: ['src/**/*.entity.ts'],
  extensions: [Migrator, SeedManager],
  seeder: {
    path: Utils.detectTsNode()
      ? 'src/database/seeders'
      : 'dist/src/database/seeders',
  },
  migrations: {
    tableName: '_migrations',
    allOrNothing: true,
    disableForeignKeys: true,
    path: Utils.detectTsNode()
      ? 'src/database/migrations'
      : 'dist/src/database/migrations',
    transactional: true,
    emit: 'ts',
  },
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT!),
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  dbName: process.env.DATABASE_NAME,
});
