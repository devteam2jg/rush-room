import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SocialType } from '~/src/domain/users/enum/social-type.enum';
@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: number;
  @Column()
  name: string;
  @Column()
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
}
