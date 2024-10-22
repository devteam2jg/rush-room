import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SocialType } from '~/src/domain/users/enum/social-type.enum';
import { Auction } from '~/src/domain/auction/entities/auction.entity';
import { IsEmail } from 'class-validator';
import { AuctionItem } from '~/src/domain/auction/entities/auction-item.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column()
  name: string;
  @Column()
  @IsEmail()
  email: string;
  @Column()
  password: string;

  @Column({ nullable: true })
  socialId: string;
  @Column({ nullable: true })
  socialType: SocialType;
  // 여기까진 기존의 create-user.dto.ts와 동일합니다.

  @Column({ nullable: true })
  profileUrl: string;
  @Column({ nullable: true })
  thumbnailUrl: string;

  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Auction, (auction) => auction.user, {
    eager: false,
  })
  auctions: Auction[];

  @OneToMany(() => AuctionItem, (auctionItem) => auctionItem.user, {
    eager: false,
  })
  auctionItems: AuctionItem[];
}
