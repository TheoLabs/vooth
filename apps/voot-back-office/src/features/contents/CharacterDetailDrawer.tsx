import { useEffect, useRef, useState } from 'react';
import {
  App as AntApp,
  Avatar,
  Button,
  Drawer,
  Empty,
  Popconfirm,
  Space,
  Spin,
  Switch,
  Tooltip,
  Typography,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useCharacter, useUpdateCharacter } from './useCharacters';
import {
  useCastings,
  useChangeCastingPublish,
  useCreateCasting,
  useDeleteCasting,
} from './useCastings';
import { avatarColor, TypeChip } from './characterDisplay';
import { avatarColor as creatorAvatarColor } from '../creators/creator.types';
import {
  CharacterFormFields,
  type CharacterFormHandle,
  type CharacterFormPayload,
} from './CharacterFormFields';
import { CastingPickerModal, type PickedCreator } from './CastingPickerModal';
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

  // 캐스팅(캐릭터 ↔ 성우)
  const [pickerOpen, setPickerOpen] = useState(false);
  const { data: castingData } = useCastings(characterId);
  const castings = castingData?.items ?? [];
  const createCasting = useCreateCasting(characterId ?? 0);
  const changePublish = useChangeCastingPublish(characterId ?? 0);
  const deleteCasting = useDeleteCasting(characterId ?? 0);

  const open = characterId != null;

  // 다른 캐릭터를 열거나 닫으면 항상 보기 모드로 초기화
  useEffect(() => {
    setMode('view');
  }, [characterId]);

  const addCast = async (creator: PickedCreator) => {
    if (characterId == null || !character) return;
    try {
      await createCasting.mutateAsync({ contentId, creatorId: creator.id });
      message.success(`${creator.nickname} 캐스팅 완료`);
      setPickerOpen(false);
    } catch (e) {
      message.error(e instanceof Error ? e.message : '캐스팅에 실패했습니다.');
    }
  };

  const removeCast = (castingId: number) => {
    deleteCasting.mutate(castingId, {
      onSuccess: () => message.success('캐스팅을 해제했습니다.'),
      onError: (e) => message.error(e.message),
    });
  };

  const togglePublish = (castingId: number, next: boolean) => {
    changePublish.mutate(
      { castingId, isPublished: next },
      {
        onSuccess: () => message.success(next ? '공개로 전환했습니다.' : '비공개로 전환했습니다.'),
        onError: (e) => message.error(e.message),
      },
    );
  };

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

          {/* 캐스팅(성우 매칭) */}
          <div style={{ width: '100%', borderTop: '1px solid #f0f0f0', paddingTop: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
              <Typography.Text strong>캐스팅</Typography.Text>
              <Typography.Text type="secondary" style={{ fontSize: 12, marginLeft: 6 }}>
                {castings.length}명
              </Typography.Text>
              <Button
                size="small"
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setPickerOpen(true)}
                style={{ marginLeft: 'auto' }}
              >
                성우 추가
              </Button>
            </div>

            {castings.length === 0 ? (
              <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                아직 캐스팅된 성우가 없습니다.
              </Typography.Text>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {castings.map((c) => (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar
                      size={32}
                      src={c.creator.avatarUrl ?? undefined}
                      style={{
                        flex: 'none',
                        background: c.creator.avatarUrl
                          ? undefined
                          : creatorAvatarColor(c.creator.nickname),
                      }}
                    >
                      {c.creator.nickname.slice(0, 1)}
                    </Avatar>
                    <div style={{ minWidth: 0, flex: 1, lineHeight: 1.3 }}>
                      <Typography.Text strong style={{ fontSize: 13 }}>
                        {c.creator.nickname}
                      </Typography.Text>
                    </div>
                    <Tooltip title={c.isPublished ? '공개 중 (끄면 비공개)' : '비공개 (켜면 공개)'}>
                      <Switch
                        size="small"
                        checked={Boolean(c.isPublished)}
                        loading={changePublish.isPending}
                        checkedChildren="공개"
                        unCheckedChildren="비공개"
                        onChange={(next) => togglePublish(c.id, next)}
                      />
                    </Tooltip>
                    <Popconfirm
                      title="캐스팅을 해제할까요?"
                      okText="해제"
                      cancelText="취소"
                      okButtonProps={{ danger: true }}
                      onConfirm={() => removeCast(c.id)}
                    >
                      <Button size="small" type="text" danger>
                        해제
                      </Button>
                    </Popconfirm>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <CastingPickerModal
        open={pickerOpen}
        assignedIds={castings.map((c) => c.creatorId)}
        onClose={() => setPickerOpen(false)}
        onPick={addCast}
      />
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
