import { Avatar, Typography } from 'antd';
import { CharacterType, CHARACTER_TYPE_LABEL } from '@vooth/shared';
import type { AdminCharacter } from '../../api/character.api';

/** 역할군 칩 색상. */
export const TYPE_COLOR: Record<CharacterType, { bg: string; fg: string }> = {
  [CharacterType.MAIN]: { bg: '#fff7ed', fg: '#c2410c' },
  [CharacterType.SUPPORTING]: { bg: '#eff6ff', fg: '#1d4ed8' },
  [CharacterType.EXTRA]: { bg: '#f1f5f9', fg: '#475569' },
  [CharacterType.NARRATOR]: { bg: '#f5f3ff', fg: '#7c3aed' },
};

/** 아바타 이미지가 없을 때 이름 기반 색. */
const AVATAR_BG = ['#f97316', '#0ea5e9', '#22c55e', '#a855f7', '#ec4899', '#14b8a6'];
export function avatarColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_BG[h % AVATAR_BG.length];
}

export function TypeChip({ type }: { type: CharacterType }) {
  const c = TYPE_COLOR[type];
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '0 8px',
        borderRadius: 999,
        background: c.bg,
        color: c.fg,
        fontSize: 11,
        fontWeight: 600,
        lineHeight: '18px',
        flex: 'none',
      }}
    >
      {CHARACTER_TYPE_LABEL[type]}
    </span>
  );
}

/** 캐릭터 한 줄(아바타 + 이름 + 역할군 + 소개). 클릭 가능. */
export function CharacterRow({
  character,
  onClick,
}: {
  character: AdminCharacter;
  onClick: () => void;
}) {
  return (
    <div
      role="button"
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        cursor: 'pointer',
        borderRadius: 8,
        padding: 4,
        margin: -4,
        transition: 'background 0.15s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      <Avatar
        size={36}
        src={character.avatarUrl ?? undefined}
        style={{
          flex: 'none',
          background: character.avatarUrl ? undefined : avatarColor(character.name),
          fontSize: 14,
          fontWeight: 600,
        }}
      >
        {character.name.slice(0, 1)}
      </Avatar>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Typography.Text strong ellipsis style={{ fontSize: 13 }}>
            {character.name}
          </Typography.Text>
          <TypeChip type={character.type} />
        </div>
        {character.description && (
          <Typography.Text type="secondary" ellipsis style={{ fontSize: 12, display: 'block' }}>
            {character.description}
          </Typography.Text>
        )}
      </div>
    </div>
  );
}
