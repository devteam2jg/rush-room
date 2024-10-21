export class ReadAuctionDto {
  id: string;
  title: string;
  description: string;
  eventDate: Date;
  sellingLimitTime: number;
  isEnd: boolean;
  isPrivate: boolean;
  privateCode?: string;
  createUserNickname: string;
}
