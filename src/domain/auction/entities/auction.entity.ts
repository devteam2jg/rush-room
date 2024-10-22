import { Column, Entity, ManyToOne } from 'typeorm';
import { CommonEntity } from '~/src/common/entities/common.entity';
import { User } from '~/src/domain/users/entities/user.entity';

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
}
