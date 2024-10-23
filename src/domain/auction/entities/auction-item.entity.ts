import { CommonEntity } from '~/src/common/entities/common.entity';
import { Column, Entity, ManyToOne } from 'typeorm';
import { User } from '~/src/domain/users/entities/user.entity';
import { Auction } from '~/src/domain/auction/entities/auction.entity';

@Entity('auction-item')
export class AuctionItem extends CommonEntity {
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text', nullable: true })
  itemImages: string;

  @Column({ type: 'int' })
  startPrice: number;

  @Column({ type: 'int', nullable: true })
  lastPrice: number;

  @Column({ type: 'boolean', default: false })
  isSold: boolean;

  @Column({ nullable: true })
  buyerId: string;

  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
    eager: false,
    createForeignKeyConstraints: false,
  })
  user: User;

  @ManyToOne(() => Auction, {
    onDelete: 'CASCADE',
    eager: false,
    createForeignKeyConstraints: false,
  })
  auction: Auction;
}
