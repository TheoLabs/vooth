import { useRef } from 'react';
import { Button, Drawer, Space } from 'antd';
import {
  CharacterFormFields,
  type CharacterFormHandle,
  type CharacterFormPayload,
} from './CharacterFormFields';

export type { CharacterFormPayload } from './CharacterFormFields';

interface CharacterFormDrawerProps {
  open: boolean;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (payload: CharacterFormPayload) => void;
}

/** 캐릭터 신규 등록 Drawer. (수정은 상세 Drawer 안에서 인라인으로 처리한다.) */
export function CharacterFormDrawer({
  open,
  submitting = false,
  onClose,
  onSubmit,
}: CharacterFormDrawerProps) {
  const formRef = useRef<CharacterFormHandle>(null);

  const submit = () => {
    const payload = formRef.current?.getPayload();
    if (payload) onSubmit(payload);
  };

  return (
    <Drawer
      title="캐릭터 등록"
      open={open}
      onClose={onClose}
      maskClosable={false}
      width={460}
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
      {/* 열릴 때마다 새 폼으로 초기화되도록 조건부 렌더 */}
      {open && <CharacterFormFields ref={formRef} />}
    </Drawer>
  );
}
