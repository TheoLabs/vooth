import { Context, ContextKey } from '@common/context';
import { CreatorGuard } from '@common/guards';
import { Creator } from '@modules/creator/domain/creator.entity';
import { CreatorUpdateDto } from '@modules/creator/presentation/dto/creator-update.dto';
import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { CreatorCreatorService } from '@modules/creator/applications/creator-creator.service';

@Controller('creators/me')
@UseGuards(CreatorGuard)
export class CreatorMeController {
  constructor(
    private readonly creatorCreatorService: CreatorCreatorService,
    private readonly context: Context
  ) {}

  @Get()
  async self() {
    // 1. Destructure body, params, query
    // 2. Get context
    const creator = this.context.get<Creator>(ContextKey.CREATOR);

    // 3. Get result
    const data = await this.creatorCreatorService.retrieve({ id: creator.id });

    // 4. Send response
    return { data };
  }

  @Put()
  async update(@Body() body: CreatorUpdateDto) {
    // 1. Destructure body, params, query
    // 2. Get context
    const creator = this.context.get<Creator>(ContextKey.CREATOR);

    // 3. Get result
    await this.creatorCreatorService.update({ creator, ...body });

    // 4. Send response
    return { data: {} };
  }
}
