import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Image {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  bid_id: string;

  @Column('text', { array: true, nullable: true })
  serialized_image_list: string[];
}
