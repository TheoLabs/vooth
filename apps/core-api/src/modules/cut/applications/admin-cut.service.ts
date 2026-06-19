import { DddService } from '@libs/ddd';
import { Injectable } from '@nestjs/common';
import { CutRepository } from '../infrastructure/cut.repository';
import { Transactional } from '@libs/decorators';

@Injectable()
export class AdminCutService extends DddService {
  constructor(private readonly cutRepository: CutRepository) {
    super();
  }

  @Transactional()
  async create() {}

  async list() {}

  @Transactional()
  async update() {}

  @Transactional()
  async remove() {}
}
