import type { DataSourceOptions } from 'typeorm';

export interface AwsConfig {
  accessKey: string;
  secretKey: string;
  region: string;
}

export interface S3Options {
  endpoint: string;
  bucket: string;
}

interface AppConfig {
  mysql: DataSourceOptions;
  aws: AwsConfig;
  s3: S3Options;
}

export default (env: Record<string, any> = process.env): AppConfig => ({
  mysql: {
    type: 'mysql',
    port: 3306,
    host: env.MYSQL_HOST,
    username: env.MYSQL_USERNAME,
    password: env.MYSQL_PASSWORD,
    database: env.MYSQL_DATABASE,
  },
  aws: {
    accessKey: env.AWS_ACCESS_KEY_ID,
    secretKey: env.AWS_SECRET_ACCESS_KEY,
    region: env.AWS_REGION,
  },
  s3: {
    endpoint: env.S3_ENDPOINT,
    bucket: env.S3_BUCKET,
  },
});
