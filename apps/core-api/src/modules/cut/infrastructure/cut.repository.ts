import { DddRepository } from '@libs/ddd';
import { Injectable } from '@nestjs/common';
import { Cut } from '../domain/cut.entity';
import { convertOptions, stripUndefined, TypeormRelationOptions } from '@libs/utils';
import { Line } from '../domain/line.entity';

@Injectable()
export class CutRepository extends DddRepository<Cut> {
  entityClass = Cut;

  async find(conditions: { id?: number; episodeId?: number; order?: number }, options?: TypeormRelationOptions<Cut>) {
    return this.entityManager.find(this.entityClass, {
      where: stripUndefined({
        id: conditions.id,
        episodeId: conditions.episodeId,
        order: conditions.order,
      }),
      ...convertOptions(options),
    });
  }

  async count(conditions: { id?: number; episodeId?: number; order?: number }) {
    return this.entityManager.count(this.entityClass, {
      where: stripUndefined({
        id: conditions.id,
        episodeId: conditions.episodeId,
        order: conditions.order,
      }),
    });
  }

  async countGroupByEpisodeId(episodeIds: number[]): Promise<Map<number, number>> {
    if (episodeIds.length === 0) {
      return new Map();
    }

    const raws = await this.createQueryBuilder('cut')
      .select('cut.episodeId', 'episodeId')
      .addSelect('count(cut.id)', 'count')
      .where('cut.episodeId IN (:...episodeIds)', { episodeIds })
      .groupBy('cut.episodeId')
      .getRawMany();

    return new Map(raws.map((raw) => [Number(raw.episodeId), Number(raw.count)]));
  }

  async countLinesGroupByEpisodeId(episodeIds: number[]): Promise<Map<number, number>> {
    if (!episodeIds.length) return new Map();

    const rows = await this.createQueryBuilder('cut')
      .innerJoin(Line, 'line', 'line.cutId = cut.id')
      .select('cut.episodeId', 'episodeId')
      .addSelect('COUNT(line.id)', 'count')
      .where('cut.episodeId IN (:...ids)', { ids: episodeIds })
      .groupBy('cut.episodeId')
      .getRawMany<{ episodeId: number; count: string }>();

    return new Map(rows.map((r) => [Number(r.episodeId), Number(r.count)]));
  }
}
