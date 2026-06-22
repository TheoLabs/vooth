import { useRef } from 'react';
import { Button, Drawer, Space } from 'antd';
import {
  EpisodeFormFields,
  type EpisodeFormHandle,
  type EpisodeFormPayload,
} from './EpisodeFormFields';

export type { EpisodeFormPayload } from './EpisodeFormFields';

interface EpisodeFormDrawerProps {
  open: boolean;
  /** 신규 등록 시 기본 회차 번호 제안값 */
  defaultChapter?: number;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (payload: EpisodeFormPayload) => void;
}

/** 회차 신규 등록 Drawer. (수정은 상세 Drawer 안에서 인라인으로 처리한다.) */
export function EpisodeFormDrawer({
  open,
  defaultChapter = 1,
  submitting = false,
  onClose,
  onSubmit,
}: EpisodeFormDrawerProps) {
  const formRef = useRef<EpisodeFormHandle>(null);

  const submit = () => {
    const payload = formRef.current?.getPayload();
    if (payload) onSubmit(payload);
  };

  return (
    <Drawer
      title="회차 등록"
      open={open}
      onClose={onClose}
      maskClosable={false}
      width={480}
      extra={
        <Space>
          <Button onClick={onClose} disabled={submitting}>
            취소
          </Button>
          <Button type="primary" onClick={submit} loading={submitting}>
            등록
          </Button>
        </Space>
      }
    >
      {open && <EpisodeFormFields ref={formRef} defaultChapter={defaultChapter} />}
    </Drawer>
  );
}
