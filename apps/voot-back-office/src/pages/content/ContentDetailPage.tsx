import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Button,
  Card,
  ColorPicker,
  Descriptions,
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
import { ThumbnailUpload } from '../../components/ThumbnailUpload';
import { CONTENT_STATUS_META, type ContentListItem, type UpdateContentPayload } from '../../api/contents.api';
import { useContent } from '../../features/contents/useContent';
import { useUpdateContent } from '../../features/contents/useUpdateContent';
import { useTags } from '../../features/tags/useTags';
import { CharacterType } from '@vooth/shared';
import { CHARACTER_TYPE_META, type CharacterListItem } from '../../api/characters.api';
import { useCharacters } from '../../features/characters/useCharacters';
import { useCreateCharacter } from '../../features/characters/useCreateCharacter';
import { useContentStore } from '../../features/content/ContentStore';
import { buildSampleEpisodes } from '../../mocks/content.mock';
import { EPISODE_STATUS_META, TAG_COLOR_ANTD } from '../../features/content/contentTypes';
import type { Episode, EpisodeStatus } from '../../features/content/contentTypes';

/** 캐릭터 색상 프리셋/기본값. */
const CHARACTER_COLORS = ['#6366f1', '#ec4899', '#0ea5e9', '#f59e0b', '#14b8a6', '#a855f7'];

const CHARACTER_TYPE_OPTIONS = (Object.keys(CHARACTER_TYPE_META) as CharacterType[]).map((t) => ({
  value: t,
  label: CHARACTER_TYPE_META[t].label,
}));

/** 캐스팅용 mock 성우 목록(캐스팅 API 전까지). */
const VOICE_ACTOR_OPTIONS = ['김하늘', '박서준', '이도윤', '최유나', '정해인'].map((name) => ({
  value: name,
  label: name,
}));

/** ColorPicker 값(문자열 또는 Color 객체)을 hex 문자열로 정규화. */
function toHex(color: unknown): string {
  if (typeof color === 'string') return color;
  if (color && typeof (color as { toHexString?: () => string }).toHexString === 'function') {
    return (color as { toHexString: () => string }).toHexString();
  }
  return CHARACTER_COLORS[0];
}

interface EpisodeRow extends Episode {
  cutCount: number;
  lineCount: number;
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

  // 회차는 콘텐츠 id 로 스코프된 mock 스토어(ContentStore)에서 관리한다(등록/편집 유지).
  const { episodesByWebtoon, createEpisode, ensureEpisodes } = useContentStore();

  // 이 콘텐츠에 회차가 없으면 mock 샘플 회차를 한 번 시드한다.
  useEffect(() => {
    ensureEpisodes(id, () => buildSampleEpisodes(id));
  }, [id, ensureEpisodes]);

  const [keyword, setKeyword] = useState('');
  const [epOpen, setEpOpen] = useState(false);
  const [epForm] = Form.useForm<{ episodeNo: number; title: string }>();

  // 기본 정보 수정
  const updateMutation = useUpdateContent();
  const { data: tagsData } = useTags({ page: 1, limit: 100 });
  const tagOptions = useMemo(() => (tagsData?.items ?? []).map((t) => ({ value: t.id, label: t.name })), [tagsData]);
  const [editOpen, setEditOpen] = useState(false);
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

  const episodes = useMemo<EpisodeRow[]>(
    () =>
      episodesByWebtoon(id).map((e) => ({
        ...e,
        cutCount: e.cuts.length,
        lineCount: e.cuts.reduce((s, c) => s + c.lines.length, 0),
      })),
    [episodesByWebtoon, id],
  );

  const filteredEpisodes = useMemo(
    () => episodes.filter((e) => (keyword ? e.title.includes(keyword.trim()) : true)),
    [episodes, keyword],
  );

  const nextEpisodeNo = (episodes.at(-1)?.episodeNo ?? 0) + 1;

  const submitEpisode = async () => {
    const v = await epForm.validateFields();
    createEpisode(id, { episodeNo: v.episodeNo, title: v.title.trim() });
    message.success('회차가 등록되었습니다.');
    setEpOpen(false);
    epForm.resetFields();
  };

  // 등장인물 (API)
  const { data: charactersData } = useCharacters(Number(id));
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

  // 캐스팅 (mock, 로컬 상태): characterId → 성우 이름[]
  const [casting, setCasting] = useState<Record<number, string[]>>({});
  const [castingTarget, setCastingTarget] = useState<CharacterListItem | null>(null);
  const [castValue, setCastValue] = useState<string[]>([]);

  const openCasting = (ch: CharacterListItem) => {
    setCastingTarget(ch);
    setCastValue(casting[ch.id] ?? []);
  };

  const saveCasting = () => {
    if (!castingTarget) return;
    setCasting((prev) => ({ ...prev, [castingTarget.id]: castValue }));
    message.success('캐스팅이 저장되었습니다.');
    setCastingTarget(null);
  };

  // 등장인물 전체 보기 Drawer (검색·유형 필터·페이지네이션 — 클라이언트 측)
  const [charDrawerOpen, setCharDrawerOpen] = useState(false);
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
      render: (t: CharacterType) => <Tag color={CHARACTER_TYPE_META[t].color}>{CHARACTER_TYPE_META[t].label}</Tag>,
    },
    {
      title: '캐스팅',
      key: 'cast',
      render: (_: unknown, ch) => {
        const cast = casting[ch.id] ?? [];
        return cast.length === 0 ? (
          <Typography.Text type="secondary">—</Typography.Text>
        ) : (
          <Space size={[4, 4]} wrap>
            {cast.map((name) => (
              <Tag key={name}>{name}</Tag>
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

  const episodeColumns: ColumnsType<EpisodeRow> = [
    { title: '회차', dataIndex: 'episodeNo', key: 'episodeNo', width: 80, render: (n: number) => `${n}화` },
    { title: '제목', dataIndex: 'title', key: 'title' },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (s: EpisodeStatus) => <Tag color={EPISODE_STATUS_META[s].color}>{EPISODE_STATUS_META[s].label}</Tag>,
    },
    { title: '컷', dataIndex: 'cutCount', key: 'cutCount', width: 70, align: 'center' },
    { title: '대사', dataIndex: 'lineCount', key: 'lineCount', width: 70, align: 'center' },
  ];

  return (
    <div className="bo-page">
      <Space direction="vertical" size={0} style={{ marginBottom: 8 }}>
        <Link to="/content/webtoons">← 작품 목록으로</Link>
        <Typography.Title level={4} style={{ margin: 0 }}>
          콘텐츠 상세
        </Typography.Title>
      </Space>

      {isError && (
        <Alert type="error" showIcon message="콘텐츠를 불러오지 못했습니다." description={error?.message} />
      )}
      {isLoading && !content && <Spin />}

      {/* 기본 정보(좌) + 등장인물·캐스팅(우) flex 배치 */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <Card
          size="small"
          title="기본 정보"
          style={{ flex: '2 1 440px' }}
          extra={
            <Button size="small" onClick={openEdit} disabled={!content}>
              수정
            </Button>
          }
        >
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
        </Card>

        <Card
          size="small"
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
        </Card>
      </div>

      <Space align="center" style={{ width: '100%', justifyContent: 'space-between', marginTop: 16 }}>
        <Typography.Title level={5} style={{ margin: 0 }}>
          회차 <Typography.Text type="secondary">(mock)</Typography.Text>
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
          onSearch={(v) => setKeyword(v)}
        />

        <Table<EpisodeRow>
          rowKey="id"
          size="small"
          columns={episodeColumns}
          dataSource={filteredEpisodes}
          pagination={false}
          onRow={(record) => ({
            onClick: () => navigate(`/content/episodes/${record.id}`),
            style: { cursor: 'pointer' },
          })}
          style={{ marginTop: 8 }}
        />
      </div>

      <Modal
        title="회차 등록"
        open={epOpen}
        onOk={submitEpisode}
        onCancel={() => {
          setEpOpen(false);
          epForm.resetFields();
        }}
        okText="등록"
        cancelText="취소"
        destroyOnClose
      >
        <Form form={epForm} layout="vertical" initialValues={{ episodeNo: nextEpisodeNo }}>
          <Form.Item
            name="episodeNo"
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
        onCancel={() => setCastingTarget(null)}
        okText="저장"
        cancelText="취소"
        destroyOnClose
      >
        <Typography.Paragraph type="secondary" style={{ marginTop: 0 }}>
          이 캐릭터를 연기할 성우를 선택하세요. (멀티캐스팅 가능)
        </Typography.Paragraph>
        <Select
          mode="multiple"
          allowClear
          placeholder="성우 선택"
          style={{ width: '100%' }}
          value={castValue}
          onChange={(v) => setCastValue(v)}
          options={VOICE_ACTOR_OPTIONS}
        />
      </Modal>

      <Drawer
        title="등장인물 & 캐스팅"
        width={680}
        open={charDrawerOpen}
        onClose={() => setCharDrawerOpen(false)}
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
        />
      </Drawer>
    </div>
  );
}
