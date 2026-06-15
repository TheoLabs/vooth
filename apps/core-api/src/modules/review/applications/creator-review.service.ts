import { DddService } from '@libs/ddd';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ReviewRepository } from '../infrastructure/review.repository';
import { Transactional } from '@libs/decorators';
import { Creator } from '@modules/creator/domain/creator.entity';
import { EpisodeRepository } from '@modules/episode/infrastructure/episode.repository';
import { LineTakeRepository } from '@modules/line-take/infrastructure/line-take.repository';
import { Review } from '../domain/review.entity';
import { CastingRepository } from '@modules/casting/infrastructure/casting.repository';

@Injectable()
export class CreatorReviewService extends DddService {
  constructor(
    private readonly reviewRepository: ReviewRepository,
    private readonly episodeRepository: EpisodeRepository,
    private readonly castingRepository: CastingRepository,
    private readonly lineTakeRepository: LineTakeRepository
  ) {
    super();
  }

  @Transactional()
  async create({ creator, episodeId }: { creator: Creator; episodeId: number }) {
    const [episode] = await this.episodeRepository.find({ id: episodeId });

    if (!episode) {
      throw new BadRequestException('등록되지 않은 에피소드입니다.', { cause: '등록되지 않은 에피소드입니다.' });
    }

    const [existedReview] = await this.reviewRepository.find({ episodeId, creatorId: creator.id });
    if (existedReview) {
      throw new BadRequestException('이미 검수 요청된 에피소드입니다.', { cause: '이미 검수 요청된 에피소드입니다.' });
    }

    const castings = await this.castingRepository.find({ creatorId: creator.id, contentId: episode.contentId });
    const myCharacterIds = new Set(castings.map((c) => c.characterId));

    const lines = await this.episodeRepository.findLines({ episodeId });

    const myLines = lines.filter((l) => myCharacterIds.has(l.characterId));
    if (myLines.length === 0) {
      throw new BadRequestException('이 회차에 배정된 대사가 없습니다.', {
        cause: '이 회차에 배정된 대사가 없습니다.',
      });
    }

    const myLineIds = myLines.map((l) => l.id);
    const adopted = await this.lineTakeRepository.count({ lineIds: myLineIds, creatorId: creator.id });
    if (adopted !== myLines.length) {
      throw new BadRequestException('배정된 모든 대사를 채택해야 검수 요청할 수 있습니다.', {
        cause: '배정된 모든 대사를 채택해야 검수 요청할 수 있습니다.',
      });
    }

    const review = Review.of({
      contentId: episode.contentId,
      episodeId,
      creatorId: creator.id,
    });

    await this.reviewRepository.save([review]);
  }
}
