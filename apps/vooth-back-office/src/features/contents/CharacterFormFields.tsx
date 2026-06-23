import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { App as AntApp, Avatar, Button, Input, Select, Space } from 'antd';
import {
  CharacterType,
  CHARACTER_TYPE_LABEL,
  CHARACTER_TYPES_BY_PRIORITY,
} from '@vooth/shared';
import type { AdminCharacter } from '../../api/character.api';

export interface CharacterFormPayload {
  name: string;
  type: CharacterType;
  description: string;
  /** 새로 선택한 아바타 파일(없으면 미변경) */
  avatarFile: File | null;
  /** 기존 아바타를 제거(비우기)했는지 (수정 시) */
  avatarCleared: boolean;
}

export interface CharacterFormHandle {
  /** 유효성 검증 후 페이로드 반환. 유효하지 않으면 null. */
  getPayload: () => CharacterFormPayload | null;
}

const TYPE_OPTIONS = CHARACTER_TYPES_BY_PRIORITY.map((t) => ({
  value: t,
  label: CHARACTER_TYPE_LABEL[t],
}));

interface CharacterFormFieldsProps {
  /** null = 신규, AdminCharacter = 수정(프리필) */
  target?: AdminCharacter | null;
}

/**
 * 캐릭터 생성/수정 공용 폼 필드. 마운트 시 target 기준으로 초기화하므로,
 * 사용처에서 폼을 새로 열 때마다 remount(조건부 렌더)한다.
 */
export const CharacterFormFields = forwardRef<CharacterFormHandle, CharacterFormFieldsProps>(
  function CharacterFormFields({ target = null }, ref) {
    const { message } = AntApp.useApp();

    const [name, setName] = useState(target?.name ?? '');
    const [type, setType] = useState<CharacterType>(target?.type ?? CharacterType.MAIN);
    const [description, setDescription] = useState(target?.description ?? '');
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarCleared, setAvatarCleared] = useState(false);
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    // 새로 고른 파일 미리보기 objectURL 정리
    useEffect(() => {
      if (!avatarFile) {
        setFilePreview(null);
        return;
      }
      const url = URL.createObjectURL(avatarFile);
      setFilePreview(url);
      return () => URL.revokeObjectURL(url);
    }, [avatarFile]);

    useImperativeHandle(ref, () => ({
      getPayload: () => {
        if (!name.trim()) {
          message.warning('캐릭터 이름을 입력해주세요.');
          return null;
        }
        return {
          name: name.trim(),
          type,
          description: description.trim(),
          avatarFile,
          avatarCleared,
        };
      },
    }));

    const pickAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setAvatarFile(file);
        setAvatarCleared(false);
      }
      e.target.value = '';
    };

    const removeAvatar = () => {
      if (avatarFile) {
        setAvatarFile(null);
      } else {
        setAvatarCleared(true);
      }
    };

    const displaySrc = filePreview ?? (avatarCleared ? null : (target?.avatarUrl ?? null));
    const canRemove = Boolean(avatarFile) || (!avatarCleared && Boolean(target?.avatarUrl));

    return (
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 아바타 */}
        <div>
          <span className="form-label">아바타</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Avatar size={72} src={displaySrc ?? undefined} style={{ flex: 'none', fontSize: 24 }}>
              {name.slice(0, 1) || '?'}
            </Avatar>
            <Space>
              <Button onClick={() => fileRef.current?.click()}>
                {displaySrc ? '다른 이미지' : '이미지 선택'}
              </Button>
              {canRemove && (
                <Button type="text" danger onClick={removeAvatar}>
                  제거
                </Button>
              )}
            </Space>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickAvatar} />
          </div>
        </div>

        <div>
          <span className="form-label">이름</span>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="캐릭터 이름"
            maxLength={30}
          />
        </div>

        <div>
          <span className="form-label">역할군</span>
          <Select<CharacterType>
            style={{ width: '100%' }}
            value={type}
            onChange={setType}
            options={TYPE_OPTIONS}
          />
        </div>

        <div>
          <span className="form-label">소개</span>
          <Input.TextArea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="캐릭터 소개 (선택)"
            rows={4}
            maxLength={200}
            showCount
          />
        </div>
      </Space>
    );
  },
);
