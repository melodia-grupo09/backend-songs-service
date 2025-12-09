import './tracer';

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ExceptionFilter } from './framework/filters/exception.filter';
import {
  ConsoleLogger,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { MikroORM } from '@mikro-orm/mongodb';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new ConsoleLogger({
      logLevels: ['error', 'warn', 'log'],
      prefix: 'Songs Service',
    }),
  });

  await waitForDatabaseAndMigrate(app);
  setupFiltersAndPipes(app);
  startSwaggerDocs(app);

  app.enableShutdownHooks();
  app.enableCors();

  await app.listen(process.env.PORT ?? 3000);
}

function setupFiltersAndPipes(app: INestApplication) {
  app.useGlobalFilters(new ExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
}

function startSwaggerDocs(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('API Docs')
    .setDescription('API Docs description')
    .setVersion('1.0')
    .addTag('Rest')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, documentFactory);
}

async function waitForDatabaseAndMigrate(app: INestApplication) {
  const mikroORM: MikroORM = app.get(MikroORM);
  await mikroORM.checkConnection();
  await mikroORM.migrator.up();
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
