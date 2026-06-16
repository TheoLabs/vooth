import { CreatorGuard } from '@common/guards';
import { Controller, UseGuards } from '@nestjs/common';

@Controller('creators/me')
@UseGuards(CreatorGuard)
export class CreatorMeController {}
