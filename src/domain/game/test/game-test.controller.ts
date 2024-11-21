import { Controller, Query, Get, Logger } from '@nestjs/common';
import { GameService } from '~/src/domain/game/services/game.service';
import { InjectQueue } from '@nestjs/bull';
import { JobId, Queue } from 'bull';

@Controller('game-test')
export class GameTestController {
  private readonly logger = new Logger(GameService.name, { timestamp: true });

  constructor(
    private readonly gameService: GameService,
    @InjectQueue('update-bid-queue')
    private readonly updateBidQueue: Queue, // Bull Queue 주입
  ) {}

  @Get('start')
  startAuction(@Query('id') auctionId) {
    return this.gameService.startAuction({ auctionId });
  }

  @Get('test')
  stressTest(@Query('id') auctionId) {
    return this.stressTestUpdateBidQueue(auctionId);
  }

  /**
   * 10초 동안 초당 100개의 메시지를 Bull Queue에 보내는 함수
   * Bull Queue의 `completed` 및 `failed` 이벤트를 활용하여 처리 시간 기록
   */
  async stressTestUpdateBidQueue(auctionId: string): Promise<void> {
    const duration = 10 * 1000; // 10초
    const messagesPerSecond = 100;
    const totalMessages = (duration / 1000) * messagesPerSecond;

    this.logger.log(
      `Starting stress test: Sending ${totalMessages} messages over 10 seconds...`,
    );

    // 성능 데이터 수집용 변수
    let successCount = 0;
    let failCount = 0;
    const processingTimes: number[] = [];
    const messageStartTimes = new Map<JobId, number>();

    // Bull Queue 이벤트 핸들러 설정
    this.updateBidQueue.on('completed', (job) => {
      const endTime = Date.now();
      const startTime = messageStartTimes.get(job.id);
      if (startTime) {
        const processingTime = endTime - startTime;
        processingTimes.push(processingTime);
        messageStartTimes.delete(job.id);
        this.logger.log(`Job ${job.id} completed in ${processingTime} ms`);
      }
      successCount++;
    });

    this.updateBidQueue.on('failed', (job, error) => {
      failCount++;
      this.logger.error(`Job ${job.id} failed: ${error.message}`);
    });

    const startTime = Date.now();

    const sendMessage = async (index: number) => {
      const updateBidPriceDto = {
        auctionId: auctionId,
        bidderId: `test-user-${index}`,
        bidderNickname: `test-user-${index}`,
        bidPrice: Math.floor(Math.random() * 1000) + 1, // 랜덤 입찰가
      };
      try {
        const job = await this.updateBidQueue.add(
          'updateBid',
          updateBidPriceDto,
          {
            removeOnComplete: true,
            removeOnFail: true,
          },
        );
        messageStartTimes.set(job.id, Date.now()); // 메시지 시작 시간 기록
      } catch (err) {
        this.logger.error(
          `Message ${index} failed during enqueue: ${err.message}`,
        );
      }
    };

    for (let i = 0; i < duration / 1000; i++) {
      const promises = [];
      for (let j = 0; j < messagesPerSecond; j++) {
        promises.push(sendMessage(i * messagesPerSecond + j));
      }
      await Promise.all(promises);
      await new Promise((resolve) => setTimeout(resolve, 1000)); // 1초 대기
    }

    // 모든 작업이 끝난 후 결과 출력
    const endTime = Date.now();
    const elapsed = (endTime - startTime) / 1000;

    // 평균 처리 시간 계산
    const averageProcessingTime =
      processingTimes.reduce((sum, time) => sum + time, 0) /
      processingTimes.length;

    // 최종 결과 로그
    this.logger.log(`Stress test completed in ${elapsed.toFixed(2)} seconds.`);
    this.logger.log(`Total Messages Sent: ${successCount + failCount}`);
    this.logger.log(`Successful Messages: ${successCount}`);
    this.logger.log(`Failed Messages: ${failCount}`);
    this.logger.log(
      `Average Processing Time: ${averageProcessingTime.toFixed(2)} ms`,
    );
  }
}
