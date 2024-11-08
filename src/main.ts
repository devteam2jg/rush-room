import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { setupSwagger } from '~/infrastructure/document/document.swagger';
import { ServiceExceptionToHttpExceptionFilter } from '~/src/common/filters/exception-filter';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });
  app.enableCors({
    origin: '*',
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.useGlobalFilters(new ServiceExceptionToHttpExceptionFilter());
  app.use(cookieParser());
  setupSwagger(app);
  await app.listen(2000);
}
bootstrap();
