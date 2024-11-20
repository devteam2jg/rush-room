import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import {
  CreateRoomDto,
  DestroyRoomDto,
} from '~/src/domain/media/dto/media.dto';

@Processor('media-queue')
export class MediaProcessor {
  constructor() {
    console.log('MediaProcessor initialized');
  }

  @Process('create-room')
  async createRoom(job: Job<CreateRoomDto>): Promise<any> {
    try {
      const { auctionId } = job.data;
      console.log('Creating room for auction:', auctionId);
    } catch (error) {
      console.error('Error processing job:', error);
      throw error;
    }
  }

  @Process('destory-room')
  async destoryRoom(job: Job<DestroyRoomDto>): Promise<any> {
    try {
      const { auctionId } = job.data;
      console.log('Destroying room for auction:', auctionId);
    } catch (error) {
      console.error('Error processing job:', error);
      throw error;
    }
  }
}
