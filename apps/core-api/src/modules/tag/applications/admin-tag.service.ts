import { DddService } from '@libs/ddd';
import { Injectable } from '@nestjs/common';
import { TagRepository } from '../infrastructure/tag.repository';
import { Transactional } from '@libs/decorators';

@Injectable()
export class AdminTagService extends DddService {
  constructor(private readonly tagRepository: TagRepository) {
    super();
  }

  @Transactional()
  async create() {}
}
