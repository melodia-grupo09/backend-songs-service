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

Before(async function (this: TestWorld) {
  process.env.NODE_ENV = 'testing';
  const moduleRef: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(MIKRO_ORM_MODULE_OPTIONS)
    .useValue({
      driver: MongoDriver,
      debug: false,
      clientUrl: process.env.DATABASE_URL,
      entities: ['src/**/*.entity.ts'],
    })
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
  const orm = this.app.get(MikroORM);
  const generator = orm.getSchemaGenerator();
  await generator.dropSchema();
  await this.app.close();
});

export class TestWorld {
  public app!: INestApplication<App>;
  public response?: supertest.Response;

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
      `Expected status code ${statusCode} but got ${this.response.status}`,
    );
  },
);
