import { DddRepository } from '@libs/ddd';
import { Injectable } from '@nestjs/common';
import { Review } from '../domain/review.entity';
import { checkInValue, convertOptions, stripUndefined, TypeormRelationOptions } from '@libs/utils';
import { ReviewStatus } from '@vooth/shared';

@Injectable()
export class ReviewRepository extends DddRepository<Review> {
  entityClass = Review;

  async find(
    conditions: { id?: number; contentId?: number; episodeId?: number; creatorId?: number; statuses?: ReviewStatus[] },
    options?: TypeormRelationOptions<Review>
  ) {
    return this.entityManager.find(this.entityClass, {
      where: stripUndefined({
        id: conditions.id,
        contentId: conditions.contentId,
        episodeId: conditions.episodeId,
        creatorId: conditions.creatorId,
        status: checkInValue(conditions.statuses),
      }),
      ...convertOptions(options),
    });
  }

  async count(conditions: {
    id?: number;
    contentId?: number;
    episodeId?: number;
    creatorId?: number;
    statuses?: ReviewStatus[];
  }) {
    return this.entityManager.count(this.entityClass, {
      where: stripUndefined({
        id: conditions.id,
        contentId: conditions.contentId,
        episodeId: conditions.episodeId,
        creatorId: conditions.creatorId,
        status: checkInValue(conditions.statuses),
      }),
    });
  }
}
