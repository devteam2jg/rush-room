import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
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
  socialType: string;
  // 여기까진 기존의 create-user.dto.ts와 동일합니다.

  @Column()
  profile_url: string;
  @Column()
  thumbnail_url: string;

  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;
}
