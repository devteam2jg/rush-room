import { RoomModule } from '~/src/mediasoup/room/room.module';
import { TransportModule } from '~/src/mediasoup/transport/transport.module';
import { ProducerConsumerModule } from '~/src/mediasoup/producer-consumer/producer-consumer.module';
import { Module } from '@nestjs/common';
import { MediasoupService } from '~/src/mediasoup/mediasoup.service';


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
