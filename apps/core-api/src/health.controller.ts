import { Controller, Get } from '@nestjs/common';

@Controller('ping')
export class HealthController {
  @Get()
  getHello(): string {
    return 'pong';
  }
}
