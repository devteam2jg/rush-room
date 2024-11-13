import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';

interface TimeReductionHistory {
  timestamp: number;
  previousPrice: number;
  newPrice: number;
  originalTimeRemaining: number;
  reducedTime: number;
}

@Injectable()
export class AuctionTimeService {
  private readonly MINIMUM_INCREASE_THRESHOLD = 0.04;
  private readonly HISTORY_EXPIRATION = 86400; // 24시간 유지
  private readonly HISTORY_KEY_PREFIX = 'auction:time:history:';

  constructor(@InjectRedis() private readonly redis: Redis) {}

  private getHistoryKey(auctionId: string): string {
    return `${this.HISTORY_KEY_PREFIX}${auctionId}`;
  }

  /**
   * Redis에서 히스토리 조회
   */
  private async getTimeReductionHistory(
    auctionId: string,
  ): Promise<TimeReductionHistory[]> {
    const historyKey = this.getHistoryKey(auctionId);
    const historyData = await this.redis.get(historyKey);

    if (!historyData) {
      return [];
    }

    try {
      return JSON.parse(historyData);
    } catch (error) {
      console.error('History parsing error:', error);
      return [];
    }
  }

  /**
   * Redis에 히스토리 저장
   */
  private async saveTimeReductionHistory(
    auctionId: string,
    history: TimeReductionHistory[],
  ): Promise<void> {
    const historyKey = this.getHistoryKey(auctionId);
    await this.redis.set(
      historyKey,
      JSON.stringify(history),
      'EX',
      this.HISTORY_EXPIRATION,
    );
  }

  /**
   * 지수 함수를 사용한 시간 감소율 계산
   */
  private calculateTimeReductionRate(priceIncreaseRate: number): number {
    if (priceIncreaseRate < this.MINIMUM_INCREASE_THRESHOLD) {
      return 0;
    }

    // 지수 함수를 사용한 부드러운 증가 곡선
    const reductionRate = 0.5 * (1 - Math.exp(-5 * priceIncreaseRate));
    return Math.min(0.5, reductionRate);
  }

  /**
   * 이전 시간 감소 기록을 고려한 실제 감소 시간 계산
   */
  private async calculateActualTimeReduction(
    auctionId: string,
    currentPrice: number,
    newPrice: number,
    currentTimeRemaining: number,
  ): Promise<number> {
    const priceIncreaseRate = (newPrice - currentPrice) / currentPrice;
    const history = await this.getTimeReductionHistory(auctionId);

    // 최근 5초 이내의 기록만 확인
    const recentReductions = history
      .filter((h) => h.timestamp > Date.now() - 5000)
      .sort((a, b) => b.timestamp - a.timestamp);

    if (recentReductions.length === 0) {
      return (
        currentTimeRemaining *
        this.calculateTimeReductionRate(priceIncreaseRate)
      );
    }

    const lastReduction = recentReductions[0];
    const lastIncreaseRate =
      (lastReduction.newPrice - lastReduction.previousPrice) /
      lastReduction.previousPrice;
    const targetReductionRate =
      this.calculateTimeReductionRate(priceIncreaseRate);

    // 증가율이 더 높은 경우, 이전 감소 전의 시간 기준으로 새로운 감소율 적용
    if (priceIncreaseRate > lastIncreaseRate) {
      const originalTime = lastReduction.originalTimeRemaining;
      return originalTime * targetReductionRate;
    }

    return currentTimeRemaining * targetReductionRate;
  }

  /**
   * 입찰에 따른 남은 시간 계산
   */
  public async calculateNewRemainingTime(
    auctionId: string,
    currentPrice: number,
    newPrice: number,
    currentTimeRemaining: number,
  ): Promise<number> {
    const timeReduction = await this.calculateActualTimeReduction(
      auctionId,
      currentPrice,
      newPrice,
      currentTimeRemaining,
    );

    // 히스토리 저장
    const history = await this.getTimeReductionHistory(auctionId);
    history.push({
      timestamp: Date.now(),
      previousPrice: currentPrice,
      newPrice,
      originalTimeRemaining: currentTimeRemaining,
      reducedTime: timeReduction,
    });

    // 최근 100개의 기록만 유지
    const trimmedHistory = history.slice(-100);
    await this.saveTimeReductionHistory(auctionId, trimmedHistory);

    return Math.floor(Math.max(currentTimeRemaining - timeReduction, 0));
  }

  /**
   * 경매 종료 시 히스토리 정리
   */
  public async clearAuctionHistory(auctionId: string): Promise<void> {
    const historyKey = this.getHistoryKey(auctionId);
    await this.redis.del(historyKey);
  }

  /**
   * 특정 시간 범위의 히스토리 조회
   */
  public async getHistoryInTimeRange(
    auctionId: string,
    startTime: number,
    endTime: number,
  ): Promise<TimeReductionHistory[]> {
    const history = await this.getTimeReductionHistory(auctionId);
    return history.filter(
      (h) => h.timestamp >= startTime && h.timestamp <= endTime,
    );
  }
}
