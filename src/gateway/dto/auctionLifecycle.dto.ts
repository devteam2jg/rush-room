export enum AuctionStatus {
  READY = 'READY',
  ONGOING = 'ONGOING',
  ENDED = 'ENDED',
}
export class BidItem {
  itemId: string;
  sellerId: string;
  bidderId: string;
  startPrice: number;
  bidPrice: number;
  itemSellingLimitTime: number;
  title: string;
  description: string;
  picture: string;
}
export class AuctionGameContext {
  auctionId: string;
  bidItems: BidItem[];
  auctionStartDateTime: number;
  private auctionStatus: AuctionStatus;
  private currentBidItem: BidItem;
  constructor(
    auctionId: string,
    auctionStartDateTime: number,
    bidItems: BidItem[],
  ) {
    this.auctionId = auctionId;
    this.auctionStartDateTime = auctionStartDateTime;
    this.bidItems = bidItems;
    this.auctionStatus = AuctionStatus.READY;
  }
  setNextBidItem() {
    // 다음 아이템을 설정
  }
  onReduceTime() {
    // 경매 시간을 줄임
  }
}
// 여기는 사용자가 사용할 이벤트 목록
export class ActionGameService {
  // 모든 auction에 대한 정보를 가지고 있을 자료구조 ( 현재 열려있는 것들 )

  joinAuction(auctionId) {
    this.findAuction(auctionId);
  }

  getCurrentBidPrice(auctionId: string) {}

  findAuction(auctionId: string) {
    // 경매 id 가지고  context 찾아내기
  }
}
