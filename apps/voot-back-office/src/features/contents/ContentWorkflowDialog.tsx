import { Modal, Typography } from 'antd';
import { ContentStatus, CONTENT_STATUS_LABEL } from '@vooth/shared';
import { CONTENT_STATUS_DOT } from './content.types';

interface ContentWorkflowDialogProps {
  open: boolean;
  onClose: () => void;
}

/** 단계를 움직이는 주체. 색으로 구분해 한눈에 보이게. */
type Actor = '운영자' | '성우' | '검수자' | '자동';

const ACTOR_COLOR: Record<Actor, { bg: string; fg: string }> = {
  운영자: { bg: '#eff6ff', fg: '#1d4ed8' },
  성우: { bg: '#ecfdf5', fg: '#047857' },
  검수자: { bg: '#f5f3ff', fg: '#7c3aed' },
  자동: { bg: '#f1f5f9', fg: '#475569' },
};

interface Step {
  status: ContentStatus;
  /** 이 단계가 어떤 상태인지 운영자 언어로. */
  meaning: string;
  /** 다음 단계로 넘어가는 조건 (마지막 단계는 생략). */
  next?: { actor: Actor; text: string };
  /** 되돌아갈 수 있는 경우 안내. */
  back?: string;
}

const STEPS: Step[] = [
  {
    status: ContentStatus.DRAFT,
    meaning: '작품 정보와 회차·대사를 등록하며 제작을 준비하는 단계입니다.',
    next: { actor: '운영자', text: '준비가 끝나면 녹음 대기로 넘깁니다.' },
  },
  {
    status: ContentStatus.READY,
    meaning: '성우 배정과 준비가 끝나 녹음 시작을 기다리는 상태입니다.',
    next: { actor: '성우', text: '성우가 녹음을 시작하면 자동으로 녹음 중이 됩니다.' },
    back: '녹음 시작 전이라면 운영자가 초안으로 되돌려 재편집할 수 있습니다.',
  },
  {
    status: ContentStatus.RECORDING,
    meaning: '성우가 회차별로 녹음을 진행하고 있습니다.',
    next: { actor: '자동', text: '모든 회차 녹음이 끝나면 검수 중으로 넘어갑니다.' },
  },
  {
    status: ContentStatus.REVIEWING,
    meaning: '녹음 결과물을 검수자가 확인하는 단계입니다.',
    next: { actor: '검수자', text: '검수를 통과하면 검수 완료가 됩니다.' },
    back: '반려하면 다시 녹음 중으로 되돌아갑니다.',
  },
  {
    status: ContentStatus.APPROVED,
    meaning: '검수를 통과해 발행할 준비가 된 상태입니다.',
    next: { actor: '운영자', text: '발행 예정일을 설정하면 발행 대기로 넘어갑니다.' },
  },
  {
    status: ContentStatus.SCHEDULED,
    meaning: '발행 예정일이 지정되어 공개를 기다립니다.',
    next: { actor: '자동', text: '예정일이 되면 자동으로 발행됩니다.' },
    back: '예정일을 해제하면 검수 완료로 되돌아갑니다.',
  },
  {
    status: ContentStatus.PUBLISHED,
    meaning: '사용자에게 공개되어 서비스 중인 상태입니다.',
    next: { actor: '운영자', text: '노출을 종료하려면 보관 처리합니다.' },
  },
  {
    status: ContentStatus.ARCHIVED,
    meaning: '공개를 종료하고 보관한 상태입니다.',
    back: '다시 노출하려면 발행으로 되돌릴 수 있습니다.',
  },
];

function ActorChip({ actor }: { actor: Actor }) {
  const c = ACTOR_COLOR[actor];
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '1px 8px',
        borderRadius: 999,
        background: c.bg,
        color: c.fg,
        fontSize: 12,
        fontWeight: 600,
        lineHeight: '18px',
      }}
    >
      {actor === '자동' ? '자동 전환' : actor}
    </span>
  );
}

export function ContentWorkflowDialog({ open, onClose }: ContentWorkflowDialogProps) {
  return (
    <Modal
      title="작품 진행 단계 안내"
      open={open}
      onCancel={onClose}
      maskClosable={false}
      footer={null}
      width={560}
    >
      <Typography.Paragraph type="secondary" style={{ marginTop: 4 }}>
        작품은 등록부터 발행까지 아래 순서로 진행됩니다. 일부 단계는 검수 결과나 발행 설정에 따라
        이전 단계로 되돌아갈 수 있습니다.
      </Typography.Paragraph>

      <div style={{ marginTop: 8 }}>
        {STEPS.map((step, i) => {
          const isLast = i === STEPS.length - 1;
          const dot = CONTENT_STATUS_DOT[step.status];
          return (
            <div key={step.status} style={{ display: 'flex', gap: 14 }}>
              {/* 좌측: 번호 동그라미 + 연결선 */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: dot,
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 700,
                    flex: 'none',
                  }}
                >
                  {i + 1}
                </span>
                {!isLast && (
                  <span
                    style={{
                      flex: 1,
                      width: 2,
                      minHeight: 16,
                      background: '#e2e8f0',
                      margin: '4px 0',
                    }}
                  />
                )}
              </div>

              {/* 우측: 카드 */}
              <div style={{ flex: 1, paddingBottom: isLast ? 0 : 18 }}>
                <Typography.Text strong style={{ fontSize: 15 }}>
                  {CONTENT_STATUS_LABEL[step.status]}
                </Typography.Text>
                <div style={{ marginTop: 4, color: '#475569', fontSize: 13, lineHeight: 1.6 }}>
                  {step.meaning}
                </div>

                {step.next && (
                  <div
                    style={{
                      marginTop: 8,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      fontSize: 13,
                      color: '#334155',
                    }}
                  >
                    <ActorChip actor={step.next.actor} />
                    <span>{step.next.text}</span>
                  </div>
                )}

                {step.back && (
                  <div style={{ marginTop: 6, fontSize: 12, color: '#94a3b8' }}>
                    ↩ {step.back}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Modal>
  );
}
