# 보이스툰 제작 도메인 설계 (vooth-maker)

> DDD 기반. 계정/역할/권한 도메인은 [`domain-design.md`](./domain-design.md) 참고.
> 본 문서는 **웹툰 컷에 성우 녹음을 입혀 "영상처럼" 재생/내보내기** 하기 위한 도메인·타임라인 설계다.

## 1. 개요
보이스툰(voicetoon) = 웹툰 이미지 컷이 순서대로 흐르고, 각 컷의 대사에 성우 녹음이 재생되는 형태.
한 대사에 여러 성우가 녹음할 수 있다(**멀티캐스팅**). 최종 재생/영상에는 대사별로 **한 개의 녹음(take)** 이 흐른다.

## 2. 도메인 계층
```
작품(Webtoon)
  └─ 회차(Episode)
       └─ 컷(Cut, 이미지)
            └─ 대사(Line)
                 └─ 녹음(Recording)   ← Line 1:N Recording (멀티캐스팅)
```

## 3. 핵심 원칙 — 타임라인은 "저장"이 아니라 "파생"한다
컷마다 절대 시간(`startMs`/`endMs`)을 **원천으로 저장하지 않는다.** 녹음을 다시 하거나 대사를 바꾸면
모든 절대 시간을 다시 맞춰야 해서 깨지기 쉽다. 대신 **오디오 길이 + 순서 + 간격값**에서 타임라인을
**계산(derive)** 하고, 절대 시간은 재생/스크럽/내보내기 시점에 산출한다. (재녹음 → durationMs만 바뀌고
타임라인은 자동 재계산)

## 4. 원천(source-of-truth) 필드
| 엔티티 | 필드 | 의미 |
|--------|------|------|
| Recording | `durationMs` | 녹음 오디오 길이 (타임라인의 실제 원천) |
| Line | `selectedRecordingId?` | 멀티캐스팅 중 **최종 재생할 take**. 없으면 그 대사는 "미정" |
| Line | `gapBeforeMs` | 대사 시작 전 텀 (기본 0) |
| Line | `order` | 컷 내 대사 순서 |
| Cut | `holdMs` | 대사 종료 후 컷을 더 보여주는 시간 (기본 0) |
| Cut | `transition?` | (선택) 컷 전환 효과 |
| Cut | `order` | 회차 내 컷 순서 |

> 절대 `startMs`/`endMs`는 **저장하지 않는다.** 아래 `buildTimeline`이 계산한다.

## 5. 타임라인 계산 (buildTimeline)
```
buildTimeline(episode):
  t = 0
  cuts = []
  for cut in episode.cuts (order asc):
    cutStart = t
    lines = []
    for line in cut.lines (order asc):
      t += line.gapBeforeMs
      rec = line.recordings.find(r => r.id === line.selectedRecordingId)
      dur = rec ? rec.durationMs : DEFAULT_PLACEHOLDER_MS  // 미정 대사는 placeholder 길이
      lines.push({ lineId: line.id, recordingId: rec?.id, startMs: t, endMs: t + dur })
      t += dur
    t += cut.holdMs
    cuts.push({ cutId: cut.id, startMs: cutStart, endMs: t, lines })
  return { totalMs: t, cuts }
```
- 컷이 자동으로 이어붙는다: `앞 컷.endMs === 다음 컷.startMs`.
- 재생기는 "현재 시간 → 보여줄 컷 + 재생할 오디오"를 이 타임라인으로 결정.

## 6. 멀티캐스팅 ↔ 최종 선택
- 한 대사의 여러 `Recording` 중 `selectedRecordingId` 한 개가 최종 흐름에 들어간다.
- 선택이 안 된 대사는 타임라인에서 **"미정"** 으로 표시(placeholder 길이 또는 공백)되어, 제작자가
  어떤 take를 쓸지 골라야 완성된다.
- (확장) 캐릭터별 기본 캐스팅을 두고 대사가 이를 상속하는 방식도 가능.

## 7. 녹음 상태 lifecycle
```
PENDING(대기) → RECORDED(녹음됨) → REVIEW(검수중) → DONE(완료)
                                              └→ REJECTED(반려) → 재녹음
```
- 최종 재생/내보내기는 보통 `selectedRecordingId`가 가리키는 take 기준(이상적으로 DONE).

## 8. 재생 & 내보내기
- **실시간 재생(미리보기)**: 파생 타임라인으로 컷 전환 + 오디오 재생 동기화.
- **내보내기(mp4 등)**: 파생 타임라인을 한 번 "확정 스냅샷"으로 굳혀 이미지+오디오를 concat(ffmpeg 등).
  이때만 계산된 타임라인을 산출물로 저장하면 된다(원천은 여전히 파생).

## 9. 백엔드 연동(추후) 메모
- 녹음 오디오는 스토리지(S3/LocalStack)에 업로드, `durationMs`는 업로드 시 측정해 저장.
- 타임라인은 서버에 저장하지 않아도 됨(언제든 파생). 내보내기 결과물만 저장.
- 작품/회차/컷/대사/녹음 CRUD API는 별도 설계.

## 10. 현재 구현 범위 (mock)
- 도메인 타입에 `durationMs`/`selectedRecordingId`/`gapBeforeMs`/`holdMs` 반영.
- `buildTimeline` 헬퍼로 회차 예상 재생 시간/컷·대사 구간 계산.
- 회차 뷰어에서 타임라인(총 길이, 컷/대사 구간, 선택 take)을 표시. 실제 녹음/재생/익스포트는 이후 단계.
