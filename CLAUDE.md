# CLAUDE.md

pnpm + Turborepo 모노레포. `apps/` 에 3개 애플리케이션, 공유 코드는 `packages/`.

| 앱 | 스택 | 비고 |
|----|------|------|
| `apps/core-api` | NestJS 11 | 백엔드 API |
| `apps/vooth-maker` | React 19 + TS + Vite + Electron | 사내 보이스툰 제작 데스크톱 앱 |
| `apps/voot-back-office` | React 19 + TS + Vite | 사내 백오피스 웹 |

## 작업 권한 규칙 (중요)

- **`apps/core-api` — 구현 금지, 사전 허락 필수.**
  - core-api는 사용자가 전적으로 직접 구현한다.
  - 이 디렉토리의 코드를 작성/수정하기 전에는 **반드시 사용자에게 먼저 허락을 받는다.**
  - 질문 답변, 코드 설명, 리뷰, 분석은 허락 없이 해도 되지만, **파일 편집은 명시적 승인 없이 하지 않는다.**

- **`apps/vooth-maker`, `apps/voot-back-office` (프론트엔드) — 자율 진행.**
  - 구현 방향과 세부 사항은 Claude가 스스로 판단해서 진행한다.
  - 매번 허락을 받을 필요 없이 작업하되, 큰 구조 변경이나 의존성 추가는 결과를 명확히 보고한다.

- `packages/` 공유 코드가 core-api에서 사용되는 경우, core-api 쪽 연결 작업은 위 core-api 규칙을 따른다.

## 작업 방식 규칙

- **`apps/vooth-maker` 와 `apps/voot-back-office` 는 항상 서로 다른 에이전트로 작업한다.**
  - 두 앱과 관련된 작업이 함께 들어오면, 각 앱마다 별도의 서브에이전트를 띄워 **병렬로** 진행한다 (한 에이전트가 두 앱을 같이 건드리지 않는다).
  - 각 에이전트는 자기 앱 디렉토리 밖(특히 다른 프론트 앱, core-api)을 수정하지 않는다.
  - 한쪽 앱만 작업하는 경우에는 해당 앱 에이전트 하나만 띄우면 된다.

## 명령어

```bash
pnpm install                          # 워크스페이스 전체 설치
pnpm dev                              # 전체 dev (turbo)
pnpm build                            # 전체 빌드
pnpm --filter <앱이름> <스크립트>      # 개별 앱 실행
```

## 인프라

로컬 인프라(kafka, mysql, debezium, kafka-ui, localstack)는 `docker-compose.yml`로 띄운다. 상세 가이드는 `infra.md` 참고.
