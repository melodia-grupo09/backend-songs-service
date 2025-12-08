import 'dotenv/config';
import { After, Before, setWorldConstructor, Then } from '@cucumber/cucumber';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import 'tsconfig-paths/register';
import { MongoDriver } from '@mikro-orm/mongodb';
import { MIKRO_ORM_MODULE_OPTIONS } from '@mikro-orm/nestjs';
import { AppModule } from 'src/app.module';
import { MikroORM } from '@mikro-orm/mongodb';
import assert from 'assert';
import supertest from 'supertest';
import { App } from 'supertest/types';
import { FirebaseStorage } from '../../src/tools-modules/firebase/firebase.storage'; // Adjust path if needed
import { FirebaseStorageMock } from './mocks/firebase-storage.mock';
import { MediaConverterService } from '../../src/tools-modules/media-converter/media-converter.service';
import { MediaConverterServiceMock } from './mocks/media-converter.mock';

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
if (!testDatabaseUrl)
  throw new Error('Missing TEST_DATABASE_URL env variable for e2e tests.');

Before(async function (this: TestWorld) {
  process.env.NODE_ENV = 'testing';
  const moduleRef: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(MIKRO_ORM_MODULE_OPTIONS)
    .useValue({
      driver: MongoDriver,
      debug: false,
      clientUrl: testDatabaseUrl,
      entities: ['src/**/*.entity.ts'],
    })
    .overrideProvider(FirebaseStorage)
    .useValue(new FirebaseStorageMock())
    .overrideProvider('FIREBASE_APP')
    .useValue({}) // Mock the Firebase App to prevent initialization
    .overrideProvider(MediaConverterService)
    .useValue(new MediaConverterServiceMock())
    .compile();

  this.app = moduleRef.createNestApplication();
  this.app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await this.app.init();
  const orm = this.app.get(MikroORM);
  await orm.checkConnection();
  const generator = orm.getSchemaGenerator();
  await generator.dropSchema();
  await generator.createSchema();
});

After(async function (this: TestWorld) {
  if (this.app) {
    const orm = this.app.get(MikroORM);
    const generator = orm.getSchemaGenerator();
    await generator.dropSchema();
    await this.app.close();
  }
});

export class TestWorld {
  public app!: INestApplication<App>;
  public response?: supertest.Response;
  public lastUploadedSongId?: string;

  public uploadedSongs: Map<string, string> = new Map();

  constructor() {
    // this.someEntities = new Map<string, SomeEntityDTO>();
  }
}

setWorldConstructor(TestWorld);

// Common step definitions

Then(
  'the response status code is {int}',
  function (this: TestWorld, statusCode: number) {
    if (!this.response) {
      throw new Error('Response is not defined');
    }
    assert.strictEqual(
      this.response.status,
      statusCode,
      `Expected status code ${statusCode} but got ${this.response.status}. Body: ${JSON.stringify(this.response.body)}`,
    );
  },
);
