import { useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  App,
  Button,
  ColorPicker,
  Descriptions,
  Divider,
  Drawer,
  Form,
  Image,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { TableToolbar } from '../../components/TableToolbar';
import { FilterBar, FilterField } from '../../components/FilterBar';
import { SectionCard } from '../../components/SectionCard';
import { ThumbnailUpload } from '../../components/ThumbnailUpload';
import { CONTENT_STATUS_META, type ContentListItem, type UpdateContentPayload } from '../../api/contents.api';
import { useContent } from '../../features/contents/useContent';
import { useUpdateContent } from '../../features/contents/useUpdateContent';
import { useTags } from '../../features/tags/useTags';
import { CharacterType } from '@vooth/shared';
import { CHARACTER_TYPE_META, type CharacterListItem } from '../../api/characters.api';
import type { CastingListItem } from '../../api/castings.api';
import { useCharacters } from '../../features/characters/useCharacters';
import { useCreateCharacter } from '../../features/characters/useCreateCharacter';
import { ExclamationCircleFilled } from '@ant-design/icons';
import { useCastings } from '../../features/castings/useCastings';
import { useCreateCasting } from '../../features/castings/useCreateCasting';
import { useDeleteCasting } from '../../features/castings/useDeleteCasting';
import { useCreators } from '../../features/creators/useCreators';
import { useEpisodes } from '../../features/episodes/useEpisodes';
import { useCreateEpisode } from '../../features/episodes/useCreateEpisode';
import { EPISODE_STATUS_META, EPISODE_STATUS_OPTIONS, type EpisodeListItem } from '../../api/episodes.api';
import type { EpisodeStatus } from '@vooth/shared';
import { TAG_COLOR_ANTD } from '../../features/content/contentTypes';

/** 캐릭터 색상 프리셋/기본값. */
const CHARACTER_COLORS = ['#6366f1', '#ec4899', '#0ea5e9', '#f59e0b', '#14b8a6', '#a855f7'];

const EPISODE_PAGE_SIZE = 10;

// CharacterType 은 숫자 enum 이라 Object.keys 는 문자열 키를 주므로, 숫자 값만 추린다.
const CHARACTER_TYPE_OPTIONS = (Object.values(CharacterType).filter((v): v is CharacterType => typeof v === 'number')).map(
  (t) => ({ value: t, label: CHARACTER_TYPE_META[t].label }),
);

/** ColorPicker 값(문자열 또는 Color 객체)을 hex 문자열로 정규화. */
function toHex(color: unknown): string {
  if (typeof color === 'string') return color;
  if (color && typeof (color as { toHexString?: () => string }).toHexString === 'function') {
    return (color as { toHexString: () => string }).toHexString();
  }
  return CHARACTER_COLORS[0];
}

/**
 * createdAt/updatedAt 은 서버에서 UTC(ISO) 로 내려온다.
 * `new Date(value)` 가 UTC 로 파싱하고 get* 는 로컬 타임존을 돌려주므로, 로컬 날짜+시간으로 표시한다.
 */
function formatDateTime(value?: string): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function ContentDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  // 목록에서 넘어온 콘텐츠를 초기값으로 쓰고, 상세 조회 API 로 최신화한다.
  const initialContent = (location.state as { content?: ContentListItem } | null)?.content;
  const { data: content, isLoading, isError, error } = useContent(Number(id), initialContent);

  // 회차 (API) — 제목 검색은 서버(searchKey/searchValue), 페이지네이션은 화면(클라).
  const [keyword, setKeyword] = useState('');
  const [episodeSearch, setEpisodeSearch] = useState('');
  const [epStatusFilter, setEpStatusFilter] = useState<EpisodeStatus[]>([]);
  const [epSort, setEpSort] = useState<{ field: 'chapter' | 'title' | 'status'; order: 'ASC' | 'DESC' } | null>(null);
  const [epPage, setEpPage] = useState(1);
  const { data: episodesData } = useEpisodes(Number(id), {
    page: epPage,
    limit: EPISODE_PAGE_SIZE,
    searchValue: episodeSearch,
    statuses: epStatusFilter,
    sort: epSort?.field,
    order: epSort?.order,
  });
  const createEpisodeMutation = useCreateEpisode();

  /** 현재 정렬 상태를 AntD 컬럼 sortOrder 로 변환. */
  const epSortOrderOf = (field: 'chapter' | 'title' | 'status') =>
    epSort?.field === field ? (epSort.order === 'ASC' ? ('ascend' as const) : ('descend' as const)) : null;

  const [epOpen, setEpOpen] = useState(false);
  const [epForm] = Form.useForm<{ chapter: number; title: string }>();

  // 기본 정보 수정
  const updateMutation = useUpdateContent();
  const [editOpen, setEditOpen] = useState(false);
  // 태그 선택지는 수정 모달을 열 때만 조회한다.
  const { data: tagsData } = useTags({ page: 1, limit: 100 }, { enabled: editOpen });
  const tagOptions = useMemo(() => (tagsData?.items ?? []).map((t) => ({ value: t.id, label: t.name })), [tagsData]);
  const [editForm] = Form.useForm<{
    title: string;
    description: string;
    thumbnailImageUrl: string;
    tagIds: number[];
  }>();

  const openEdit = () => {
    if (!content) return;
    editForm.setFieldsValue({
      title: content.title,
      description: content.description,
      thumbnailImageUrl: content.thumbnailImageUrl,
      tagIds: content.tags.map((t) => t.id),
    });
    setEditOpen(true);
  };

  const submitEdit = async () => {
    if (!content) return;
    const v = await editForm.validateFields();

    // 룰: 변경된 필드만 PUT 으로 보낸다(기존값과 비교, 동일하면 제외).
    const patch: UpdateContentPayload = {};
    const title = v.title.trim();
    const description = v.description.trim();
    if (title !== content.title) patch.title = title;
    if (description !== content.description) patch.description = description;
    if (v.thumbnailImageUrl !== content.thumbnailImageUrl) patch.thumbnailImageUrl = v.thumbnailImageUrl;

    const currentTagIds = content.tags.map((t) => t.id);
    const nextTagIds = v.tagIds ?? [];
    const sameTags =
      currentTagIds.length === nextTagIds.length &&
      [...currentTagIds].sort().join(',') === [...nextTagIds].sort().join(',');
    if (!sameTags) patch.tagIds = nextTagIds;

    if (Object.keys(patch).length === 0) {
      message.info('변경된 내용이 없습니다.');
      setEditOpen(false);
      return;
    }

    updateMutation.mutate(
      { id: content.id, payload: patch },
      {
        onSuccess: () => {
          message.success('기본 정보가 수정되었습니다.');
          setEditOpen(false);
        },
        onError: (err) => message.error(err.message),
      },
    );
  };

  const episodes = useMemo<EpisodeListItem[]>(() => episodesData?.items ?? [], [episodesData]);

  // 다음 회차 번호 = 전체 회차 수 + 1(서버 페이지네이션이라 전체 기준은 total 사용).
  const nextChapter = (episodesData?.total ?? 0) + 1;

  const submitEpisode = async () => {
    const v = await epForm.validateFields();
    createEpisodeMutation.mutate(
      { contentId: Number(id), payload: { title: v.title.trim(), chapter: v.chapter } },
      {
        onSuccess: () => {
          message.success('회차가 등록되었습니다.');
          setEpOpen(false);
          epForm.resetFields();
        },
        onError: (err) => message.error(err.message),
      },
    );
  };

  // 등장인물 (API) — 정렬은 서버(sort/order)로 쏜다. 기본 type ASC.
  const [charSort, setCharSort] = useState<{ field: 'name' | 'type'; order: 'ASC' | 'DESC' }>({
    field: 'type',
    order: 'ASC',
  });
  const { data: charactersData } = useCharacters(Number(id), { sort: charSort.field, order: charSort.order });
  const characters: CharacterListItem[] = charactersData?.items ?? [];
  const createCharacterMutation = useCreateCharacter();
  const [charOpen, setCharOpen] = useState(false);
  const [charForm] = Form.useForm<{ name: string; type: CharacterType; color?: unknown }>();

  const submitCharacter = async () => {
    const v = await charForm.validateFields();
    createCharacterMutation.mutate(
      { contentId: Number(id), payload: { name: v.name.trim(), type: v.type, color: toHex(v.color) } },
      {
        onSuccess: () => {
          message.success('등장인물이 추가되었습니다.');
          setCharOpen(false);
          charForm.resetFields();
        },
        onError: (err) => message.error(err.message),
      },
    );
  };

  // 등장인물 전체 보기 Drawer 상태 — 캐스팅/성우는 이 Drawer 를 열 때만 조회한다.
  const [charDrawerOpen, setCharDrawerOpen] = useState(false);

  // 캐스팅 (API): 캐릭터 ↔ 크리에이터(성우) 연결 — Drawer 열 때만 로드.
  const { data: castingsData } = useCastings(Number(id), { enabled: charDrawerOpen });
  const castings: CastingListItem[] = useMemo(() => castingsData?.items ?? [], [castingsData]);
  const createCastingMutation = useCreateCasting();

  // characterId → 해당 캐릭터의 캐스팅[]
  const castingsByCharacter = useMemo(() => {
    return castings.reduce<Record<number, CastingListItem[]>>((acc, c) => {
      (acc[c.characterId] ??= []).push(c);
      return acc;
    }, {});
  }, [castings]);

  // 크리에이터(성우) 피커 옵션 — Drawer 열 때만 로드.
  const { data: creatorsData } = useCreators({ enabled: charDrawerOpen });
  const creatorOptions = useMemo(
    () => (creatorsData?.items ?? []).map((c) => ({ value: c.id, label: c.account.name })),
    [creatorsData],
  );

  const [castingTarget, setCastingTarget] = useState<CharacterListItem | null>(null);
  // 백엔드는 생성만 지원(삭제 없음) → 모달은 "신규 추가할 creatorId[]" 만 다룬다.
  const [castValue, setCastValue] = useState<number[]>([]);

  const existingCast = castingTarget ? (castingsByCharacter[castingTarget.id] ?? []) : [];
  const existingCreatorIds = new Set(existingCast.map((c) => c.creatorId));
  // 이미 캐스팅된 성우는 추가 후보에서 제외(중복 캐스팅 에러 방지).
  const addableCreatorOptions = creatorOptions.filter((o) => !existingCreatorIds.has(o.value));

  const openCasting = (ch: CharacterListItem) => {
    setCastingTarget(ch);
    setCastValue([]);
  };

  const saveCasting = async () => {
    if (!castingTarget) return;
    if (castValue.length === 0) {
      message.info('추가할 성우를 선택하세요.');
      return;
    }
    try {
      // 선택한 성우마다 캐스팅 생성(중복은 후보에서 이미 제외됨).
      await Promise.all(
        castValue.map((creatorId) =>
          createCastingMutation.mutateAsync({
            contentId: Number(id),
            payload: { characterId: castingTarget.id, creatorId },
          }),
        ),
      );
      message.success('캐스팅이 추가되었습니다.');
      setCastingTarget(null);
      setCastValue([]);
    } catch (err) {
      message.error(err instanceof Error ? err.message : '캐스팅 추가에 실패했습니다.');
    }
  };

  // 캐스팅 삭제 (API + 경고 다이얼로그)
  const { modal } = App.useApp();
  const deleteCastingMutation = useDeleteCasting();
  const confirmDeleteCasting = (ch: CharacterListItem, casting: CastingListItem) => {
    modal.confirm({
      title: '캐스팅을 삭제할까요?',
      icon: <ExclamationCircleFilled style={{ color: '#ff4d4f' }} />,
      content: `${ch.name} 의 성우 "${casting.creator.account.name}" 캐스팅이 제거됩니다. 이 작업은 되돌릴 수 없습니다.`,
      okText: '삭제',
      cancelText: '취소',
      okButtonProps: { danger: true },
      onOk: () =>
        deleteCastingMutation
          .mutateAsync({ contentId: Number(id), castingId: casting.id })
          .then(() => {
            message.success('캐스팅이 삭제되었습니다.');
          })
          .catch((err) => {
            message.error(err instanceof Error ? err.message : '삭제에 실패했습니다.');
            throw err; // 실패 시 다이얼로그 유지
          }),
    });
  };

  // 등장인물 전체 보기 Drawer (검색·유형 필터·페이지네이션 — 클라이언트 측)
  const [charKeyword, setCharKeyword] = useState('');
  const [charTypeFilter, setCharTypeFilter] = useState<CharacterType[]>([]);

  const filteredCharacters = useMemo(
    () =>
      characters
        .filter((c) => (charKeyword ? c.name.includes(charKeyword.trim()) : true))
        .filter((c) => (charTypeFilter.length ? charTypeFilter.includes(c.type) : true)),
    [characters, charKeyword, charTypeFilter],
  );

  const characterColumns: ColumnsType<CharacterListItem> = [
    {
      title: '이름',
      dataIndex: 'name',
      key: 'name',
      sorter: true,
      sortOrder: charSort.field === 'name' ? (charSort.order === 'ASC' ? 'ascend' : 'descend') : null,
      render: (name: string, ch) => (
        <Space align="center">
          <span style={{ width: 12, height: 12, borderRadius: '50%', background: ch.color, display: 'inline-block' }} />
          <Typography.Text strong style={{ color: ch.color }}>
            {name}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: '유형',
      dataIndex: 'type',
      key: 'type',
      width: 90,
      sorter: true,
      sortOrder: charSort.field === 'type' ? (charSort.order === 'ASC' ? 'ascend' : 'descend') : null,
      render: (t: CharacterType) => <Tag color={CHARACTER_TYPE_META[t].color}>{CHARACTER_TYPE_META[t].label}</Tag>,
    },
    {
      title: '캐스팅',
      key: 'cast',
      render: (_: unknown, ch) => {
        const cast = castingsByCharacter[ch.id] ?? [];
        return cast.length === 0 ? (
          <Typography.Text type="secondary">—</Typography.Text>
        ) : (
          <Space size={[4, 4]} wrap>
            {cast.map((c) => (
              <Tag
                key={c.id}
                closable
                onClose={(e) => {
                  e.preventDefault(); // 자동 제거 막고 확인 다이얼로그 후 삭제
                  confirmDeleteCasting(ch, c);
                }}
              >
                {c.creator.account.name}
              </Tag>
            ))}
          </Space>
        );
      },
    },
    {
      title: '',
      key: 'action',
      width: 90,
      render: (_: unknown, ch) => (
        <Button size="small" onClick={() => openCasting(ch)}>
          캐스팅
        </Button>
      ),
    },
  ];

  const episodeColumns: ColumnsType<EpisodeListItem> = [
    {
      title: '회차',
      dataIndex: 'chapter',
      key: 'chapter',
      width: 80,
      sorter: true,
      sortOrder: epSortOrderOf('chapter'),
      render: (n: number) => `${n}화`,
    },
    { title: '제목', dataIndex: 'title', key: 'title', sorter: true, sortOrder: epSortOrderOf('title') },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      sorter: true,
      sortOrder: epSortOrderOf('status'),
      render: (s: EpisodeStatus) => {
        const meta = EPISODE_STATUS_META[s];
        return meta ? <Tag color={meta.color}>{meta.label}</Tag> : <Tag>{s}</Tag>;
      },
    },
    // 컷/대사 수는 아직 API 미제공 → 플레이스홀더(추후 maker 연동).
    { title: '컷', key: 'cutCount', width: 70, align: 'center', render: () => '—' },
    { title: '대사', key: 'lineCount', width: 70, align: 'center', render: () => '—' },
  ];

  return (
    <div className="bo-page">
      <Typography.Title level={4} style={{ margin: '0 0 8px' }}>
        콘텐츠 상세
      </Typography.Title>

      {isError && (
        <Alert type="error" showIcon message="콘텐츠를 불러오지 못했습니다." description={error?.message} />
      )}
      {isLoading && !content && <Spin />}

      {/* 기본 정보(좌) + 등장인물·캐스팅(우) flex 배치 */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <SectionCard title="기본 정보" onEdit={openEdit} editDisabled={!content} style={{ flex: '2 1 440px' }}>
          {/* 썸네일 묶음 + 정보 묶음을 카드 안에서 flex */}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'stretch' }}>
            <Image
              width={200}
              rootClassName="bo-detail-thumb"
              style={{ objectFit: 'cover', borderRadius: 8, background: '#f0f0f0' }}
              src={content?.thumbnailImageUrl}
              fallback="https://placehold.co/480x300?text=Cover"
              alt={content?.title ?? ''}
            />
            <Descriptions column={1} size="small" style={{ flex: '1 1 260px', minWidth: 260 }}>
              <Descriptions.Item label="제목">{content?.title ?? `콘텐츠 #${id}`}</Descriptions.Item>
              <Descriptions.Item label="상태">
                {content ? (
                  <Tag color={CONTENT_STATUS_META[content.status].color}>
                    {CONTENT_STATUS_META[content.status].label}
                  </Tag>
                ) : (
                  '—'
                )}
              </Descriptions.Item>
              <Descriptions.Item label="태그">
                {content && content.tags.length > 0 ? (
                  <Space size={[4, 4]} wrap>
                    {content.tags.map((t) => (
                      <Tag key={t.id} color={TAG_COLOR_ANTD[t.color]} style={{ marginInlineEnd: 0 }}>
                        {t.name}
                      </Tag>
                    ))}
                  </Space>
                ) : (
                  '—'
                )}
              </Descriptions.Item>
              <Descriptions.Item label="설명">{content?.description ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="등록일">{formatDateTime(content?.createdAt)}</Descriptions.Item>
              <Descriptions.Item label="수정일">{formatDateTime(content?.updatedAt)}</Descriptions.Item>
            </Descriptions>
          </div>
        </SectionCard>

        <SectionCard
          title="등장인물 & 캐스팅"
          extra={
            <Space>
              <Button size="small" onClick={() => setCharDrawerOpen(true)}>
                전체 보기
              </Button>
              <Button size="small" type="primary" onClick={() => setCharOpen(true)}>
                캐릭터 추가
              </Button>
            </Space>
          }
          style={{ flex: '1 1 300px' }}
        >
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Typography.Text type="secondary">총 {characters.length}명</Typography.Text>
            {characters.length === 0 && (
              <Typography.Text type="secondary">등록된 등장인물이 없습니다.</Typography.Text>
            )}
            {characters.slice(0, 5).map((ch) => (
              <Space key={ch.id} align="center" style={{ width: '100%' }}>
                <span
                  style={{ width: 12, height: 12, borderRadius: '50%', background: ch.color, flex: '0 0 auto' }}
                />
                <Typography.Text strong style={{ flex: 1, color: ch.color }}>
                  {ch.name}
                </Typography.Text>
                <Tag color={CHARACTER_TYPE_META[ch.type].color}>{CHARACTER_TYPE_META[ch.type].label}</Tag>
              </Space>
            ))}
            {characters.length > 5 && (
              <Button type="link" style={{ padding: 0, alignSelf: 'flex-start' }} onClick={() => setCharDrawerOpen(true)}>
                +{characters.length - 5}명 더보기
              </Button>
            )}
          </Space>
        </SectionCard>
      </div>

      <Divider style={{ margin: '20px 0 12px' }} />

      <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
        <Typography.Title level={5} style={{ margin: 0 }}>
          회차 <Typography.Text type="secondary">({episodesData?.total ?? 0})</Typography.Text>
        </Typography.Title>
        <Button type="primary" onClick={() => setEpOpen(true)}>
          회차 등록
        </Button>
      </Space>

      <div style={{ marginTop: 8 }}>
        <TableToolbar<'title'>
          fields={[{ value: 'title', label: '제목' }]}
          searchField="title"
          onSearchFieldChange={() => undefined}
          keyword={keyword}
          onKeywordChange={setKeyword}
          onSearch={(v) => {
            setEpisodeSearch(v);
            setEpPage(1);
          }}
          right={
            <Select<EpisodeStatus[]>
              mode="multiple"
              allowClear
              placeholder="상태 필터"
              style={{ minWidth: 200 }}
              value={epStatusFilter}
              onChange={(v) => {
                setEpStatusFilter(v ?? []);
                setEpPage(1);
              }}
              options={EPISODE_STATUS_OPTIONS}
              maxTagCount="responsive"
            />
          }
        />

        <Table<EpisodeListItem>
          rowKey="id"
          size="small"
          columns={episodeColumns}
          dataSource={episodes}
          pagination={{
            current: epPage,
            pageSize: EPISODE_PAGE_SIZE,
            total: episodesData?.total ?? 0,
            showSizeChanger: false,
          }}
          onChange={(pagination, _filters, sorter) => {
            // 단일 정렬만 사용. 해제 시 정렬 없음.
            const s = Array.isArray(sorter) ? sorter[0] : sorter;
            if (s && s.order && (s.field === 'chapter' || s.field === 'title' || s.field === 'status')) {
              setEpSort({ field: s.field, order: s.order === 'ascend' ? 'ASC' : 'DESC' });
            } else {
              setEpSort(null);
            }
            setEpPage(pagination.current ?? 1);
          }}
          onRow={(record) => ({
            onClick: () => navigate(`/content/contents/${id}/episodes/${record.id}`),
            style: { cursor: 'pointer' },
          })}
          style={{ marginTop: 8 }}
        />
      </div>

      <Modal
        title="회차 등록"
        open={epOpen}
        onOk={submitEpisode}
        confirmLoading={createEpisodeMutation.isPending}
        onCancel={() => {
          setEpOpen(false);
          epForm.resetFields();
        }}
        okText="등록"
        cancelText="취소"
        destroyOnClose
        maskClosable={false}
      >
        <Form form={epForm} layout="vertical" initialValues={{ chapter: nextChapter }}>
          <Form.Item
            name="chapter"
            label="회차 번호"
            rules={[{ required: true, message: '회차 번호를 입력하세요.' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="title" label="제목" rules={[{ required: true, message: '제목을 입력하세요.' }]}>
            <Input maxLength={200} placeholder="회차 제목" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="기본 정보 수정"
        open={editOpen}
        onOk={submitEdit}
        confirmLoading={updateMutation.isPending}
        onCancel={() => setEditOpen(false)}
        okText="저장"
        cancelText="취소"
        destroyOnClose
        maskClosable={false}
      >
        <Form form={editForm} layout="vertical">
          <Form.Item name="title" label="제목" rules={[{ required: true, message: '제목을 입력하세요.' }]}>
            <Input maxLength={200} />
          </Form.Item>
          <Form.Item name="description" label="설명" rules={[{ required: true, message: '설명을 입력하세요.' }]}>
            <Input.TextArea rows={3} maxLength={2000} />
          </Form.Item>
          <Form.Item name="thumbnailImageUrl" label="썸네일" rules={[{ required: true, message: '썸네일을 업로드하세요.' }]}>
            <ThumbnailUpload />
          </Form.Item>
          <Form.Item name="tagIds" label="태그">
            <Select mode="multiple" allowClear placeholder="태그 선택" options={tagOptions} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="캐릭터 추가"
        open={charOpen}
        onOk={submitCharacter}
        confirmLoading={createCharacterMutation.isPending}
        onCancel={() => {
          setCharOpen(false);
          charForm.resetFields();
        }}
        okText="추가"
        cancelText="취소"
        destroyOnClose
        maskClosable={false}
      >
        <Form
          form={charForm}
          layout="vertical"
          initialValues={{ type: CharacterType.MAIN, color: CHARACTER_COLORS[0] }}
        >
          <Form.Item name="name" label="이름" rules={[{ required: true, message: '이름을 입력하세요.' }]}>
            <Input maxLength={50} placeholder="등장인물 이름" />
          </Form.Item>
          <Form.Item name="type" label="유형" rules={[{ required: true, message: '유형을 선택하세요.' }]}>
            <Select options={CHARACTER_TYPE_OPTIONS} />
          </Form.Item>
          <Form.Item name="color" label="색상" rules={[{ required: true }]}>
            <ColorPicker format="hex" presets={[{ label: '추천 색상', colors: CHARACTER_COLORS }]} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={castingTarget ? `${castingTarget.name} 캐스팅` : '캐스팅'}
        open={castingTarget !== null}
        onOk={saveCasting}
        confirmLoading={createCastingMutation.isPending}
        onCancel={() => {
          setCastingTarget(null);
          setCastValue([]);
        }}
        okText="추가"
        cancelText="취소"
        destroyOnClose
        maskClosable={false}
      >
        {existingCast.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <Typography.Text type="secondary">현재 캐스팅</Typography.Text>
            <div style={{ marginTop: 4 }}>
              <Space size={[4, 4]} wrap>
                {existingCast.map((c) => (
                  <Tag key={c.id}>{c.creator.account.name}</Tag>
                ))}
              </Space>
            </div>
          </div>
        )}
        <Typography.Paragraph type="secondary" style={{ marginTop: 0 }}>
          이 캐릭터를 연기할 성우를 추가하세요. (멀티캐스팅 가능)
        </Typography.Paragraph>
        <Select
          mode="multiple"
          allowClear
          placeholder="추가할 성우 선택"
          style={{ width: '100%' }}
          value={castValue}
          onChange={(v) => setCastValue(v)}
          options={addableCreatorOptions}
          optionFilterProp="label"
          notFoundContent="추가할 수 있는 성우가 없습니다."
        />
      </Modal>

      <Drawer
        title="등장인물 & 캐스팅"
        width={680}
        open={charDrawerOpen}
        onClose={() => setCharDrawerOpen(false)}
        maskClosable={false}
        extra={
          <Button type="primary" onClick={() => setCharOpen(true)}>
            캐릭터 추가
          </Button>
        }
      >
        <TableToolbar<'name'>
          fields={[{ value: 'name', label: '이름' }]}
          searchField="name"
          onSearchFieldChange={() => undefined}
          keyword={charKeyword}
          onKeywordChange={setCharKeyword}
          onSearch={(v) => setCharKeyword(v)}
        />
        <FilterBar>
          <FilterField label="유형">
            <Select<CharacterType[]>
              mode="multiple"
              allowClear
              placeholder="전체"
              value={charTypeFilter}
              onChange={(v) => setCharTypeFilter(v ?? [])}
              options={CHARACTER_TYPE_OPTIONS}
              maxTagCount="responsive"
            />
          </FilterField>
        </FilterBar>
        <Typography.Text type="secondary">총 {filteredCharacters.length}명</Typography.Text>
        <Table<CharacterListItem>
          rowKey="id"
          size="small"
          columns={characterColumns}
          dataSource={filteredCharacters}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          style={{ marginTop: 8 }}
          onChange={(_pagination, _filters, sorter) => {
            // 단일 정렬만 사용. 정렬 해제 시 기본(type ASC)으로 되돌린다.
            const s = Array.isArray(sorter) ? sorter[0] : sorter;
            if (s && s.order && (s.field === 'name' || s.field === 'type')) {
              setCharSort({ field: s.field, order: s.order === 'ascend' ? 'ASC' : 'DESC' });
            } else {
              setCharSort({ field: 'type', order: 'ASC' });
            }
          }}
        />
      </Drawer>
    </div>
  );
}
