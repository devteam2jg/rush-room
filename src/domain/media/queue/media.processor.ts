import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import {
  CreateRoomDto,
  DestroyRoomDto,
} from '~/src/domain/media/dto/media.dto';
import { MediasoupService } from '~/src/domain/media/mediasoup/mediasoup.service';

@Processor('media-queue')
export class MediaProcessor {
  constructor(private readonly mediaService: MediasoupService) {
    console.log('MediaProcessor initialized');
  }

  @Process('create-room')
  async createRoom(job: Job<CreateRoomDto>): Promise<any> {
    console.log('Creating room for auction:');
    try {
      const { auctionId } = job.data;
      console.log('Creating room for auction:', auctionId);
      return 'Room created';
    } catch (error) {
      console.error('Error processing job:', error);
      throw error;
    }
  }

  @Process('destory-room')
  async destoryRoom(job: Job<DestroyRoomDto>): Promise<any> {
    console.log('Destroying room for auction:');
    try {
      const { auctionId } = job.data;
      return 'Room destroyed';
    } catch (error) {
      console.error('Error processing job:', error);
      throw error;
    }
  }
}
