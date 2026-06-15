import { DddAggregate } from '@libs/ddd';
import { Column, Entity, Index, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { canTransitionEpisode, EpisodeStatus } from '@vooth/shared';
import { Cut, type CropBox } from './cut.entity';
import { Line } from './line.entity';
import { BadRequestException } from '@nestjs/common';

type Ctor = {
  contentId: number;
  title: string;
  chapter: number;
};

@Entity()
@Index('idx_episode_content_id', ['contentId'])
export class Episode extends DddAggregate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  contentId: number;

  @Column()
  title: string;

  @Column()
  chapter: number;

  @Column({ type: 'smallint' })
  status: EpisodeStatus;

  @Column()
  cutCount: number;

  @Column()
  lineCount: number;

  // 스크립트 재업로드 시 교체된(빠진) 컷은 삭제한다(고아 제거). 하위 라인은 Cut.lines 가 정리.
  @OneToMany(() => Cut, (cut) => cut.episode, { cascade: true, orphanedRowAction: 'delete' })
  cuts: Cut[];

  private constructor(args: Ctor) {
    super();

    if (args) {
      this.contentId = args.contentId;
      this.title = args.title;
      this.status = EpisodeStatus.DRAFT;
      this.chapter = args.chapter;
      this.cutCount = 0;
      this.lineCount = 0;
      this.cuts = [];
    }
  }

  static of(args: Ctor) {
    return new Episode(args);
  }

  update(args: { title?: string; chapter?: number }) {
    const changed = this.stripUnchanged(args);

    if (!changed) {
      return;
    }

    Object.assign(this, changed);
  }

  /** 상태 전이. 허용된 전이(반려 포함)만 가능. 같은 상태면 no-op. */
  transitionTo(next: EpisodeStatus) {
    if (this.status === next) {
      return;
    }

    if (!canTransitionEpisode(this.status, next)) {
      throw new BadRequestException('허용되지 않는 상태 전이입니다.', {
        cause: '허용되지 않는 상태 전이입니다.',
      });
    }

    this.status = next;
  }

  uploadCut({
    cutItems,
  }: {
    cutItems: {
      id?: number;
      position: number;
      imageUrl: string;
      imageWidth?: number;
      imageHeight?: number;
      cropBox?: CropBox;
      holdMs?: number;
      lineItems: {
        id?: number;
        characterId: number;
        position: number;
        script: string;
        anchorY?: number;
        gapBeforeMs?: number;
      }[];
    }[];
  }) {
    // if (this.status !== EpisodeStatus.DRAFT) {
    //   throw new BadRequestException('편집 중인 상태에서만 수정이 가능합니다.', {
    //     cause: '편집 중인 상태에서만 수정이 가능합니다.',
    //   });
    // }

    // id 로 기존 컷/대사를 매칭해 upsert 한다.
    // - id 있고 매칭 → update(변경분만, id 유지), id 없거나 미매칭 → 신규 insert.
    // - payload 에 없는 기존 컷/대사 → this.cuts 재할당 + orphanedRowAction 으로 삭제.
    const existingCuts = this.cuts ?? [];

    this.cuts = cutItems.map((cutItem) => {
      const existingCut = cutItem.id != null ? existingCuts.find((c) => c.id === cutItem.id) : undefined;

      const cut =
        existingCut ??
        Cut.of({
          episodeId: this.id,
          position: cutItem.position,
          imageUrl: cutItem.imageUrl,
          imageWidth: cutItem.imageWidth,
          imageHeight: cutItem.imageHeight,
          cropBox: cutItem.cropBox,
          holdMs: cutItem.holdMs,
        });

      if (existingCut) {
        existingCut.update({
          position: cutItem.position,
          imageUrl: cutItem.imageUrl,
          imageWidth: cutItem.imageWidth,
          imageHeight: cutItem.imageHeight,
          cropBox: cutItem.cropBox,
          holdMs: cutItem.holdMs,
        });
      }

      const existingLines = existingCut?.lines ?? [];

      const lines = cutItem.lineItems.map((lineItem) => {
        const existingLine = lineItem.id != null ? existingLines.find((l) => l.id === lineItem.id) : undefined;

        if (existingLine) {
          existingLine.update({
            characterId: lineItem.characterId,
            position: lineItem.position,
            script: lineItem.script,
            anchorY: lineItem.anchorY,
            gapBeforeMs: lineItem.gapBeforeMs,
          });
          return existingLine;
        }

        return Line.of({
          episodeId: this.id,
          characterId: lineItem.characterId,
          position: lineItem.position,
          script: lineItem.script,
          anchorY: lineItem.anchorY,
          gapBeforeMs: lineItem.gapBeforeMs,
        });
      });

      cut.setLines(lines);

      return cut;
    });

    this.cutCount = this.cuts.length;
    this.lineCount = this.cuts.reduce((acc, cut) => acc + cut.lines.length, 0);
  }

  /**
   * 연출 부분 수정 — 컷 holdMs / 라인 anchorY·gapBeforeMs 만 갱신한다.
   * 스크립트(컷/대사 구성)는 건드리지 않으므로 등록(uploadScript)과 충돌하지 않는다.
   * payload 에 없는 컷/대사는 무시(부분 수정), 기존 연출값은 보존.
   */
  applyDirection({
    cuts,
  }: {
    cuts: { id: number; holdMs?: number; lines?: { id: number; anchorY?: number; gapBeforeMs?: number }[] }[];
  }) {
    const existingCuts = this.cuts ?? [];

    for (const cutItem of cuts) {
      const cut = existingCuts.find((c) => c.id === cutItem.id);

      if (!cut) {
        continue;
      }

      cut.update({ holdMs: cutItem.holdMs });

      for (const lineItem of cutItem.lines ?? []) {
        const line = (cut.lines ?? []).find((l) => l.id === lineItem.id);

        if (!line) {
          continue;
        }

        line.update({ anchorY: lineItem.anchorY, gapBeforeMs: lineItem.gapBeforeMs });
      }
    }
  }

  validRecordable() {
    if (this.status !== EpisodeStatus.READY && this.status !== EpisodeStatus.RECORDING) {
      throw new BadRequestException('편집 중인 상태에서만 녹음이 가능합니다.', {
        cause: '편집 중인 상태에서만 녹음이 가능합니다.',
      });
    }

    return true;
  }
}
