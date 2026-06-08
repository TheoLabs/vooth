import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { type DataSourceOptions } from 'typeorm';
import { AwsConfig, S3Options } from './configuration';

@Injectable()
export class ConfigsService {
  constructor(private readonly configService: ConfigService) {}

  isLocal() {
    return process.env.NODE_ENV === 'local';
  }

  isProduction() {
    return process.env.NODE_ENV === 'production';
  }

  get mysql() {
    return this.configService.get<DataSourceOptions>('mysql')!;
  }

  get s3() {
    return this.configService.get<S3Options>('s3')!;
  }

  get aws() {
    return this.configService.get<AwsConfig>('aws')!;
  }
}
