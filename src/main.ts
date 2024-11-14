import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { BidAppModule } from '~/src/app/app-bid.module';
import { WasAppModule } from '~/src/app/app-was.module';
import { MediaAppModule } from '~/src/app/app-media.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { setupSwagger } from '~/infrastructure/document/document.swagger';
import { ServiceExceptionToHttpExceptionFilter } from '~/src/common/filters/exception-filter';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const mode = process.env.MODE || 'APP';
  let app = null;
  switch (mode) {
    case 'WAS':
      console.log('Was App Start');
      app = await NestFactory.create(WasAppModule);
      break;
    case 'BID':
      console.log('BID App Start');
      app = await NestFactory.create(BidAppModule);
      break;
    case 'MEDIA':
      console.log('Media App Start');
      app = await NestFactory.create(MediaAppModule);
      break;
    default:
      console.log('App Start');
      app = await NestFactory.create(AppModule);
      break;
  }
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
  await app.listen(3000);
}
bootstrap();
