import { DddAggregate } from '@libs/ddd';
import { BadRequestException } from '@nestjs/common';
import { type CropBox } from '@vooth/shared';
import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

type Ctor = {
  episodeId: number;
  order: number;
  imageFileId: number;
  imageWidth: number;
  imageHeight: number;
  imageCropBox: CropBox;
  anchorY?: number;
  gap?: number;
  holdOverride?: number;
};

@Entity()
@Index('idx_cut_episode_id', ['episodeId'])
export class Cut extends DddAggregate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  episodeId: number;

  @Column()
  order: number;

  @Column()
  imageFileId: number;

  @Column()
  imageWidth: number;

  @Column()
  imageHeight: number;

  @Column({ type: 'json' })
  imageCropBox: CropBox;

  @Column({ type: 'int', nullable: true })
  anchorY: number | null;

  @Column({ type: 'int', nullable: true })
  gap: number | null;

  @Column({ type: 'int', nullable: true })
  holdOverride: number | null;

  private constructor(args: Ctor) {
    super();

    if (args) {
      this.episodeId = args.episodeId;
      this.order = args.order;
      this.imageFileId = args.imageFileId;
      this.imageWidth = args.imageWidth;
      this.imageHeight = args.imageHeight;
      this.imageCropBox = args.imageCropBox;
      this.anchorY = args.anchorY ?? null;
      this.gap = args.gap ?? null;
      this.holdOverride = args.holdOverride ?? null;
    }
  }

  static of(args: Ctor) {
    if (args.anchorY && (args.anchorY < 0 || args.anchorY > 1)) {
      throw new BadRequestException('앵커의 위치값응ㄴ 0~1 사이의 값이여야합니다.', { cause: 'anchorY' });
    }

    return new Cut(args);
  }
}
