# 로컬 인프라 가이드

`docker-compose.yml`로 띄우는 로컬 개발 인프라 정리.

## 구성

| 서비스 | 포트 | 용도 |
|--------|------|------|
| kafka | 9092 (호스트) / 29092 (내부) | KRaft 모드 브로커 (Zookeeper 불필요) |
| mysql | 3306 | CDC 소스 DB (binlog/GTID 활성화) |
| debezium | 8083 | Kafka Connect REST API |
| kafka-ui | 8080 | 토픽 / 커넥터 모니터링 |
| localstack | 4566 | 로컬 AWS S3 에뮬레이터 |

## 기동 / 종료

```bash
# 전체 기동
docker compose up -d

# 상태 확인
docker compose ps

# 로그 확인
docker compose logs -f debezium

# 종료 (볼륨 유지)
docker compose down

# 종료 + 데이터 삭제
docker compose down -v
```

접속 주소
- Kafka UI: http://localhost:8080
- Kafka Connect API: http://localhost:8083
- LocalStack: http://localhost:4566

---

## Debezium MySQL 커넥터

### 1. 커넥터 등록

커넥터 설정은 [`connectors/mysql.json`](connectors/mysql.json) 파일로 관리한다.

```bash
curl -X POST http://localhost:8083/connectors \
  -H "Content-Type: application/json" \
  -d @connectors/mysql.json
```

> `database.server.id`는 MySQL 복제 슬레이브로 동작하므로 MySQL 서버 ID(1)와 겹치지 않게 지정.
> `topic.prefix`가 토픽 이름 접두사가 됨 → 변경 이벤트는 `dbserver1.app.users` 형태 토픽으로 발행.

### 2. 커넥터 목록 조회

```bash
curl http://localhost:8083/connectors
```

### 3. 커넥터 상태 확인

```bash
curl http://localhost:8083/connectors/mysql-connector/status
```

### 4. 커넥터 설정 조회

```bash
curl http://localhost:8083/connectors/mysql-connector/config
```

### 5. 커넥터 설정 변경 (업서트)

```bash
curl -X PUT http://localhost:8083/connectors/mysql-connector/config \
  -H "Content-Type: application/json" \
  -d '{
    "connector.class": "io.debezium.connector.mysql.MySqlConnector",
    "tasks.max": "1",
    "database.hostname": "mysql",
    "database.port": "3306",
    "database.user": "root",
    "database.password": "root",
    "database.server.id": "184054",
    "topic.prefix": "dbserver1",
    "database.include.list": "app",
    "table.include.list": "app.users,app.orders,app.payments",
    "schema.history.internal.kafka.bootstrap.servers": "kafka:29092",
    "schema.history.internal.kafka.topic": "schema-changes.app"
  }'
```

### 6. 커넥터 재시작 / 일시정지 / 재개

```bash
# 재시작
curl -X POST http://localhost:8083/connectors/mysql-connector/restart

# 일시정지
curl -X PUT http://localhost:8083/connectors/mysql-connector/pause

# 재개
curl -X PUT http://localhost:8083/connectors/mysql-connector/resume
```

### 7. 커넥터 삭제

```bash
curl -X DELETE http://localhost:8083/connectors/mysql-connector
```

### 8. CDC 이벤트 소비 확인

```bash
# 토픽 목록
docker compose exec kafka kafka-topics \
  --bootstrap-server localhost:9092 --list

# 변경 이벤트 콘솔로 확인
docker compose exec kafka kafka-console-consumer \
  --bootstrap-server localhost:9092 \
  --topic dbserver1.app.users \
  --from-beginning
```

---

## LocalStack S3

`awslocal` (LocalStack CLI) 또는 `aws --endpoint-url` 로 사용. 자격증명은 아무 값이나 가능(`test`/`test`).

### 컨테이너 내부에서 (awslocal)

```bash
# 버킷 생성
docker compose exec localstack awslocal s3 mb s3://my-bucket

# 버킷 목록
docker compose exec localstack awslocal s3 ls

# 파일 업로드
docker compose exec localstack awslocal s3 cp /etc/hosts s3://my-bucket/hosts

# 객체 목록
docker compose exec localstack awslocal s3 ls s3://my-bucket
```

### 호스트에서 (aws CLI)

```bash
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=ap-northeast-2

aws --endpoint-url http://localhost:4566 s3 mb s3://my-bucket
aws --endpoint-url http://localhost:4566 s3 ls
aws --endpoint-url http://localhost:4566 s3 cp ./file.txt s3://my-bucket/
```

### 애플리케이션 연결 설정 예시

```
AWS_ENDPOINT=http://localhost:4566
AWS_REGION=ap-northeast-2
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
S3_BUCKET=my-bucket
```

> SDK에서 LocalStack S3를 쓸 때는 `forcePathStyle: true` (path-style) 옵션을 켜야 `http://localhost:4566/my-bucket/...` 형식으로 접근됨.
