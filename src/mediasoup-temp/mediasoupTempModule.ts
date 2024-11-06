import { Module } from '@nestjs/common';
import { MediasoupService } from './mediasoup.service';
import { MediaSoupGateway } from '~/src/mediasoup-temp/mediasoup.gateway';

@Module({
  providers: [MediasoupService, MediaSoupGateway],
  exports: [MediasoupService],
})
export class MediasoupTempModule {}
