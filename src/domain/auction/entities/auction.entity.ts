import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { CommonEntity } from '~/src/common/entities/common.entity';
import { User } from '~/src/domain/users/entities/user.entity';
import { AuctionItem } from '~/src/domain/auction/entities/auction-item.entity';
import { UserDataDto } from '~/src/domain/users/dto/user.dto';

export enum Status {
  WAIT = 'WAIT',
  PROGRESS = 'PROGRESS',
  END = 'END',
}

@Entity('auction')
export class Auction extends CommonEntity {
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'timestamptz' })
  eventDate: Date;

  @Column({ type: 'int' })
  sellingLimitTime: number; // minute

  @Column({ type: 'enum', enum: Status, default: Status.WAIT })
  status: Status;

  @Column({ type: 'int', nullable: true })
  budget: number;

  @Column({ type: 'boolean', default: false })
  isPrivate: boolean;

  @Column({ type: 'varchar', length: 25, nullable: true })
  privateCode: string;

  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
    eager: true,
    createForeignKeyConstraints: false,
  })
  user: User;

  @OneToMany(() => AuctionItem, (auctionItem) => auctionItem.user, {
    eager: true,
  })
  auctionItems: AuctionItem[];

  @Column({ type: 'json', nullable: true })
  joinedUsers: UserDataDto[];
}
