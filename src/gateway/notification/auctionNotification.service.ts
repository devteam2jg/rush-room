import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';

@Injectable()
export class AuctionNotificationService {
  constructor(private readonly server: Server) {}

  notifyAuctionStart(auctionId: string) {
    const message = `경매가 시작되었습니다.`;
    this.sendNotificationToAuctionRoom(auctionId, message);
  }

  notifyAuctionEnd(auctionId: string) {
    const message = `경매가 종료되었습니다.`;
    this.sendNotificationToAuctionRoom(auctionId, message);
  }

  notifyHighestBidUpdate(
    auctionId: string,
    newBidAmount: number,
    username: string,
  ) {
    const message = `${username}님이 새로운 최고가 ${newBidAmount}원을 제시했습니다.`;
    this.sendNotificationToAuctionRoom(auctionId, message);
  }

  notifyAuctionTimeExtended(auctionId: string, additionalTime: number) {
    const message = `경매 종료 시간이 ${additionalTime}초 연장되었습니다.`;
    this.sendNotificationToAuctionRoom(auctionId, message);
  }

  private sendNotificationToAuctionRoom(auctionId: string, message: string) {
    this.server.to(auctionId).emit('notification', message);
  }
}
