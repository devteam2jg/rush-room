import {
  LoadGameDataDto,
  SaveGameDataDto,
  InitialDataDto,
  ResponseDto,
} from '~/src/domain/game/dto/game.dto';

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
  picture: string[];
  canBid: boolean; // 기본값은 false
}
export class AuctionGameContext {
  auctionId: string;
  bidItems: BidItem[];
  auctionStartDateTime: Date;
  auctionStatus: AuctionStatus;
  currentBidItem: BidItem;

  prevBidPrice: number;
  prevBidderId: string;

  private loadEvent: (
    auctionId: string,
    auctionContext: AuctionGameContext,
  ) => Promise<LoadGameDataDto> = null;
  private saveEvent: (saveGameDataDto: SaveGameDataDto) => Promise<boolean> =
    null;
  constructor(
    load: (
      auctionId: string,
      auctionContext: AuctionGameContext,
    ) => Promise<LoadGameDataDto>,
    save: (saveGameDataDto: SaveGameDataDto) => Promise<boolean>,
    initialDataDto: InitialDataDto,
  ) {
    this.loadEvent = load;
    this.saveEvent = save;
    const { id } = initialDataDto;
    this.auctionId = id;
  }

  setNextBidItem() {
    this.currentBidItem = this.bidItems.find(
      (item) => item.itemId !== this.currentBidItem.itemId,
    );
  }
  private updateEvent = null;
  setUpdateBidEvent(event: () => void) {
    this.updateEvent = event;
  }

  setTime(time: number) {
    this.currentBidItem.itemSellingLimitTime = time;
  }
  activateBid() {
    this.currentBidItem.canBid = true;
  }
  deactivateBid() {
    this.currentBidItem.canBid = false;
  }

  setSaveEvent(event: (saveGameDataDto: SaveGameDataDto) => Promise<boolean>) {
    this.saveEvent = event;
  }
  async load() {
    const data: LoadGameDataDto = await this.loadEvent(this.auctionId, this);
    const { auctionId, bidItems, auctionStartDateTime, auctionStatus } = data;
    this.auctionId = auctionId;
    this.bidItems = bidItems;
    this.auctionStartDateTime = auctionStartDateTime;
    this.auctionStatus = auctionStatus;
    this.currentBidItem = this.bidItems[0];
  }
  save() {
    this.saveEvent(new SaveGameDataDto());
  }
  // -----------------------------------------------------------------------------
  /** client event */
  getCurrentBidItemInfo() {
    return {
      time: this.currentBidItem.itemSellingLimitTime,
      price: this.currentBidItem.bidPrice,
      bidderId: this.currentBidItem.bidderId,
    };
  }

  /** client event */
  updateBidPrice(bidPrice: number, bidderId: string): boolean {
    if (!this.currentBidItem.canBid) return false;
    if (bidPrice <= this.currentBidItem.bidPrice) return false;
    this.prevBidPrice = this.currentBidItem.bidPrice;
    this.prevBidderId = this.currentBidItem.bidderId;
    this.currentBidItem.bidPrice = bidPrice;
    this.currentBidItem.bidderId = bidderId;
    this.updateEvent();
    return true;
  }
  private socketEvent: (response: ResponseDto) => boolean = null;
  sendtoClient() {
    const responseDto = () => {};
    this.socketEvent(responseDto);
  }
}
