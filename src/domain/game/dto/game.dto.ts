import { AuctionStatus } from '../game.context';
import { BidItem } from '../game.context';
export class LoadGameDataDto {
  auctionId: string;
  bidItems: BidItem[];
  auctionStartDateTime: Date;
  auctionStatus: AuctionStatus;
}

export class SaveGameDataDto {
  auctionId: string;
  bidItems: BidItem[];
  auctionStartDateTime: Date;
  auctionStatus: AuctionStatus;
}
