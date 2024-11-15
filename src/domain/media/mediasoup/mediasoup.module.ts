import { RoomModule } from '~/src/domain/media/mediasoup/room/room.module';
import { TransportModule } from '~/src/domain/media/mediasoup/transport/transport.module';
import { ProducerConsumerModule } from '~/src/domain/media/mediasoup/producer-consumer/producer-consumer.module';
import { Module } from '@nestjs/common';
import { MediasoupService } from '~/src/domain/media/mediasoup/mediasoup.service';

@Module({
  imports: [RoomModule, TransportModule, ProducerConsumerModule],
  providers: [MediasoupService],
  exports: [
    MediasoupService,
    RoomModule,
    TransportModule,
    ProducerConsumerModule,
  ],
})
export class MediasoupModule {}
