import { DddService } from '@libs/ddd';
import { Injectable } from '@nestjs/common';
import { CreatorRepository } from '../infrastructure/creator.repository';
import { AdminFileService } from '@modules/file/applications/admin-file.service';

@Injectable()
export class AdminCreatorService extends DddService {
  constructor(
    private readonly adminFileService: AdminFileService,
    private readonly creatorRepository: CreatorRepository
  ) {
    super();
  }
}
