import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { setupSwagger } from '~/infrastructure/document/document.swagger';
import { ServiceExceptionToHttpExceptionFilter } from '~/src/common/filters/exception-filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });
  app.enableCors({
    origin: true,
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.useGlobalFilters(new ServiceExceptionToHttpExceptionFilter());

  setupSwagger(app);

  await app.listen(3000);
}
bootstrap();
