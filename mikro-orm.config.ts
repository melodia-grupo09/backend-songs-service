import { Migrator } from '@mikro-orm/migrations-mongodb';
import { defineConfig, MongoDriver, Utils } from '@mikro-orm/mongodb';
import { SeedManager } from '@mikro-orm/seeder';
import { SqlHighlighter } from '@mikro-orm/sql-highlighter';
import 'dotenv/config';

export default defineConfig({
  driver: MongoDriver,
  debug: true,
  autoJoinOneToOneOwner: false,
  highlighter: new SqlHighlighter(),
  entities: ['dist/**/*.entity.js'],
  entitiesTs: ['src/**/*.entity.ts'],
  extensions: [Migrator, SeedManager],
  ensureIndexes: true,
  implicitTransactions: true,
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
    transactional: false,
    emit: 'ts',
  },
  clientUrl: process.env.DATABASE_URL,
});
