import { DddService } from '@libs/ddd';
import { Injectable } from '@nestjs/common';
import { ContentRepository } from '../infrastructure/content.repository';
import { Transactional } from '@libs/decorators';

@Injectable()
export class AdminContentService extends DddService {
  constructor(private readonly contentRepository: ContentRepository) {
    super();
  }

  @Transactional()
  async create() {}

  async list() {}

  async retrieve() {}
}
