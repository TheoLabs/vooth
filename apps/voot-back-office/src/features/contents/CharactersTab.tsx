import { useMemo, useState } from 'react';
import { App as AntApp, Avatar, Button, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  CharacterType,
  CHARACTER_TYPE_LABEL,
  CHARACTER_TYPES_BY_PRIORITY,
} from '@vooth/shared';
import { DEFAULT_PAGE_SIZE, FullHeightTable } from '../../components/FullHeightTable';
import { TableToolbar } from '../../components/TableToolbar';
import { FilterSelect } from '../../components/FilterSelect';
import { useCharacters, useCreateCharacter } from './useCharacters';
import { CharacterFormDrawer, type CharacterFormPayload } from './CharacterFormDrawer';
import { CharacterDetailDrawer } from './CharacterDetailDrawer';
import { avatarColor, TypeChip, TYPE_COLOR } from './characterDisplay';
import { uploadImage } from '../../api/file.api';
import type { AdminCharacter } from '../../api/character.api';

const TYPE_OPTIONS = CHARACTER_TYPES_BY_PRIORITY.map((t) => ({
  value: t,
  label: CHARACTER_TYPE_LABEL[t],
}));

interface CharactersTabProps {
  contentId: number;
}

export function CharactersTab({ contentId }: CharactersTabProps) {
  const { message } = AntApp.useApp();
  const create = useCreateCharacter(contentId);

  const [searchInput, setSearchInput] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [types, setTypes] = useState<CharacterType[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const query = useMemo(
    () => ({
      searchKey: searchValue ? ('name' as const) : undefined,
      searchValue: searchValue || undefined,
      types: types.length ? types : undefined,
      page,
      limit: pageSize,
    }),
    [searchValue, types, page, pageSize],
  );

  const { data, isLoading } = useCharacters(contentId, query);

  const submitCreate = async (payload: CharacterFormPayload) => {
    setSubmitting(true);
    try {
      const avatarFileId = payload.avatarFile
        ? await uploadImage(payload.avatarFile, 'characters/avatar')
        : undefined;
      await create.mutateAsync({
        name: payload.name,
        type: payload.type,
        description: payload.description || undefined,
        avatarFileId,
      });
      message.success('캐릭터를 등록했습니다.');
      setFormOpen(false);
      setPage(1);
    } catch (e) {
      message.error(e instanceof Error ? e.message : '캐릭터 등록에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const columns: ColumnsType<AdminCharacter> = [
    {
      title: '캐릭터',
      key: 'name',
      render: (_, c) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar
            size={36}
            src={c.avatarUrl ?? undefined}
            style={{
              flex: 'none',
              background: c.avatarUrl ? undefined : avatarColor(c.name),
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            {c.name.slice(0, 1)}
          </Avatar>
          <Typography.Text strong>{c.name}</Typography.Text>
        </div>
      ),
    },
    {
      title: '역할군',
      dataIndex: 'type',
      key: 'type',
      width: 110,
      render: (type: CharacterType) => <TypeChip type={type} />,
    },
    {
      title: '소개',
      dataIndex: 'description',
      key: 'description',
      render: (description: string | null) =>
        description ? (
          <Typography.Text type="secondary" ellipsis style={{ maxWidth: 360 }}>
            {description}
          </Typography.Text>
        ) : (
          <Typography.Text type="secondary">-</Typography.Text>
        ),
    },
  ];

  return (
    <>
      <TableToolbar
        searchValue={searchInput}
        onSearchValueChange={setSearchInput}
        onSearch={(v) => {
          setSearchValue(v);
          setPage(1);
        }}
        placeholder="캐릭터 이름 검색"
        filters={[
          {
            label: '역할군',
            control: (
              <FilterSelect
                value={types}
                options={TYPE_OPTIONS}
                dotColorOf={(v) => TYPE_COLOR[v].fg}
                onChange={(v) => {
                  setTypes(v);
                  setPage(1);
                }}
              />
            ),
          },
        ]}
        actions={
          <Button type="primary" onClick={() => setFormOpen(true)}>
            캐릭터 등록
          </Button>
        }
      />

      <FullHeightTable<AdminCharacter>
        rowKey="id"
        loading={isLoading}
        columns={columns}
        dataSource={data?.items}
        total={data?.total}
        onRow={(c) => ({
          onClick: () => setSelectedId(c.id),
          style: { cursor: 'pointer' },
        })}
        pagination={{
          current: page,
          pageSize,
          total: data?.total ?? 0,
          onChange: (nextPage, nextSize) => {
            if (nextSize !== pageSize) {
              setPageSize(nextSize);
              setPage(1);
            } else {
              setPage(nextPage);
            }
          },
        }}
      />

      <CharacterFormDrawer
        open={formOpen}
        submitting={submitting}
        onClose={() => setFormOpen(false)}
        onSubmit={submitCreate}
      />

      <CharacterDetailDrawer
        contentId={contentId}
        characterId={selectedId}
        onClose={() => setSelectedId(null)}
      />
    </>
  );
}
