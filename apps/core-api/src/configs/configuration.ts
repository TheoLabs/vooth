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

export interface KafkaConfig {
  clientId: string;
  brokers: string[];
  groupId: string;
  /** ddd_events CDC 토픽 (Debezium: topic.prefix.DB.테이블). */
  topic: string;
}

export interface GoogleConfig {
  /** 웹(백오피스) OAuth 클라이언트 ID */
  clientId: string;
  /** 데스크톱(vooth-maker) OAuth 클라이언트 ID */
  desktopClientId: string;
  /** 데스크톱 OAuth 클라이언트 secret (서버에서 code 교환 시 사용) */
  desktopClientSecret: string;
}

export interface JwtConfig {
  accessSecret: string;
  accessExpiresIn: string;
}

interface AppConfig {
  mysql: DataSourceOptions;
  aws: AwsConfig;
  s3: S3Options;
  kafka: KafkaConfig;
  google: GoogleConfig;
  jwt: JwtConfig;
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
  kafka: {
    clientId: env.KAFKA_CLIENT_ID ?? 'core-api',
    brokers: (env.KAFKA_BROKERS ?? 'localhost:9092')
      .split(',')
      .map((broker: string) => broker.trim())
      .filter(Boolean),
    groupId: env.KAFKA_GROUP_ID ?? 'core-api',
    topic: env.KAFKA_DDD_EVENT_TOPIC ?? 'dbserver1.vooth.ddd_events',
  },
  google: {
    clientId: env.GOOGLE_CLIENT_ID,
    desktopClientId: env.GOOGLE_DESKTOP_CLIENT_ID,
    desktopClientSecret: env.GOOGLE_DESKTOP_CLIENT_SECRET,
  },
  jwt: {
    accessSecret: env.JWT_ACCESS_SECRET ?? 'dev-access-secret-change-me',
    accessExpiresIn: env.JWT_ACCESS_EXPIRES_IN ?? '1h',
  },
});
