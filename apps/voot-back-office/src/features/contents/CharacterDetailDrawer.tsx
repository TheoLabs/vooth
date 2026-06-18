import { useEffect, useRef, useState } from 'react';
import { App as AntApp, Avatar, Button, Drawer, Empty, Space, Spin, Typography } from 'antd';
import { useCharacter, useUpdateCharacter } from './useCharacters';
import { avatarColor, TypeChip } from './characterDisplay';
import {
  CharacterFormFields,
  type CharacterFormHandle,
  type CharacterFormPayload,
} from './CharacterFormFields';
import { uploadImage } from '../../api/file.api';
import type { AdminCharacter, UpdateCharacterInput } from '../../api/character.api';

interface CharacterDetailDrawerProps {
  contentId: number;
  /** 조회할 캐릭터 id (null 이면 닫힘) */
  characterId: number | null;
  onClose: () => void;
}

export function CharacterDetailDrawer({
  contentId,
  characterId,
  onClose,
}: CharacterDetailDrawerProps) {
  const { message } = AntApp.useApp();
  const { data: character, isLoading } = useCharacter(contentId, characterId);
  const update = useUpdateCharacter(contentId);

  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef<CharacterFormHandle>(null);

  const open = characterId != null;

  // 다른 캐릭터를 열거나 닫으면 항상 보기 모드로 초기화
  useEffect(() => {
    setMode('view');
  }, [characterId]);

  const saveEdit = async () => {
    if (!character) return;
    const payload = formRef.current?.getPayload();
    if (!payload) return;

    const input = buildUpdateInput(character, payload);
    const hasNewAvatar = Boolean(payload.avatarFile);
    if (Object.keys(input).length === 0 && !hasNewAvatar) {
      message.info('변경된 내용이 없습니다.');
      setMode('view');
      return;
    }

    setSubmitting(true);
    try {
      if (payload.avatarFile) {
        input.avatarFileId = await uploadImage(payload.avatarFile, 'characters/avatar');
      }
      await update.mutateAsync({ id: character.id, input });
      message.success('캐릭터를 수정했습니다.');
      setMode('view');
    } catch (e) {
      message.error(e instanceof Error ? e.message : '캐릭터 수정에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const extra =
    character && mode === 'view' ? (
      <Button onClick={() => setMode('edit')}>수정</Button>
    ) : mode === 'edit' ? (
      <Space>
        <Button onClick={() => setMode('view')} disabled={submitting}>
          취소
        </Button>
        <Button type="primary" onClick={saveEdit} loading={submitting}>
          저장
        </Button>
      </Space>
    ) : undefined;

  return (
    <Drawer
      title={mode === 'edit' ? '캐릭터 수정' : '캐릭터 정보'}
      open={open}
      onClose={onClose}
      maskClosable={false}
      width={400}
      extra={extra}
    >
      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
          <Spin />
        </div>
      ) : !character ? (
        <Empty description="캐릭터를 불러오지 못했습니다." />
      ) : mode === 'edit' ? (
        <CharacterFormFields ref={formRef} target={character} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <Avatar
            size={120}
            src={character.avatarUrl ?? undefined}
            style={{
              background: character.avatarUrl ? undefined : avatarColor(character.name),
              fontSize: 44,
              fontWeight: 600,
            }}
          >
            {character.name.slice(0, 1)}
          </Avatar>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Typography.Title level={4} style={{ margin: 0 }}>
              {character.name}
            </Typography.Title>
            <TypeChip type={character.type} />
          </div>

          <div style={{ width: '100%', marginTop: 8 }}>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              소개
            </Typography.Text>
            <Typography.Paragraph style={{ margin: '4px 0 0', whiteSpace: 'pre-wrap' }}>
              {character.description?.trim() || '-'}
            </Typography.Paragraph>
          </div>
        </div>
      )}
    </Drawer>
  );
}

/** 원본과 비교해 변경된 필드만 담는다. description/avatar 비우기는 null. */
function buildUpdateInput(
  target: AdminCharacter,
  payload: CharacterFormPayload,
): UpdateCharacterInput {
  const input: UpdateCharacterInput = {};
  if (payload.name !== target.name) input.name = payload.name;
  if (payload.type !== target.type) input.type = payload.type;
  if (payload.description !== (target.description ?? '')) {
    input.description = payload.description || null;
  }
  // 아바타 비우기만 반영. 새 파일 업로드(avatarFileId 세팅)는 호출부에서 처리.
  if (!payload.avatarFile && payload.avatarCleared && target.avatarFileId != null) {
    input.avatarFileId = null;
  }
  return input;
}
