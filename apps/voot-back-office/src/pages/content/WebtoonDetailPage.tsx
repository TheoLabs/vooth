import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Tag,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { FullHeightTable } from '../../components/FullHeightTable';
import { useContentStore } from '../../features/content/ContentStore';
import {
  EPISODE_STATUS_META,
  WEBTOON_STATUS_META,
} from '../../features/content/contentTypes';
import type { Episode, EpisodeStatus, WebtoonStatus } from '../../features/content/contentTypes';
import '../../components/DataTable.css';

const WEBTOON_STATUS_OPTIONS = (Object.keys(WEBTOON_STATUS_META) as WebtoonStatus[]).map((s) => ({
  value: s,
  label: WEBTOON_STATUS_META[s].label,
}));

interface EpisodeRow extends Episode {
  cutCount: number;
  lineCount: number;
}

export function WebtoonDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const {
    getWebtoon,
    episodesByWebtoon,
    voiceActors,
    updateWebtoon,
    addCharacter,
    updateCharacter,
    removeCharacter,
    createEpisode,
  } = useContentStore();

  const webtoon = getWebtoon(id);

  const [editOpen, setEditOpen] = useState(false);
  const [editForm] = Form.useForm<{ title: string; description?: string; status: WebtoonStatus }>();
  const [newCharName, setNewCharName] = useState('');
  const [epOpen, setEpOpen] = useState(false);
  const [epForm] = Form.useForm<{ episodeNo: number; title: string }>();

  const episodes = useMemo<EpisodeRow[]>(
    () =>
      episodesByWebtoon(id).map((e) => ({
        ...e,
        cutCount: e.cuts.length,
        lineCount: e.cuts.reduce((s, c) => s + c.lines.length, 0),
      })),
    [episodesByWebtoon, id],
  );

  if (!webtoon) {
    return (
      <div className="bo-page">
        <Typography.Text type="secondary">작품을 찾을 수 없습니다.</Typography.Text>
      </div>
    );
  }

  const voiceActorOptions = voiceActors.map((v) => ({ value: v.id, label: v.name }));
  const nextEpisodeNo = (episodes.at(-1)?.episodeNo ?? 0) + 1;

  const openEdit = () => {
    editForm.setFieldsValue({ title: webtoon.title, description: webtoon.description, status: webtoon.status });
    setEditOpen(true);
  };

  const submitEdit = async () => {
    const v = await editForm.validateFields();
    updateWebtoon(webtoon.id, { title: v.title.trim(), description: v.description?.trim(), status: v.status });
    message.success('작품 정보가 수정되었습니다.');
    setEditOpen(false);
  };

  const submitAddCharacter = () => {
    const name = newCharName.trim();
    if (!name) return;
    addCharacter(webtoon.id, { name });
    setNewCharName('');
  };

  const submitEpisode = async () => {
    const v = await epForm.validateFields();
    createEpisode(webtoon.id, { episodeNo: v.episodeNo, title: v.title.trim() });
    message.success('회차가 등록되었습니다.');
    setEpOpen(false);
    epForm.resetFields();
  };

  const columns: ColumnsType<EpisodeRow> = [
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
      <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
        <Space align="center">
          <Typography.Title level={3} style={{ margin: 0 }}>
            {webtoon.title}
          </Typography.Title>
          <Tag color={WEBTOON_STATUS_META[webtoon.status].color}>
            {WEBTOON_STATUS_META[webtoon.status].label}
          </Tag>
        </Space>
        <Button onClick={openEdit}>작품 수정</Button>
      </Space>

      <Card size="small" title="등장인물 & 캐스팅" style={{ marginTop: 4 }}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {webtoon.characters.length === 0 && (
            <Typography.Text type="secondary">등록된 등장인물이 없습니다.</Typography.Text>
          )}
          {webtoon.characters.map((ch) => (
            <Space key={ch.id} align="center" style={{ width: '100%' }} wrap>
              <Typography.Text
                strong
                style={{ width: 120, color: ch.color }}
                editable={{ onChange: (val) => updateCharacter(webtoon.id, ch.id, { name: val.trim() || ch.name }) }}
              >
                {ch.name}
              </Typography.Text>
              <Select
                mode="multiple"
                allowClear
                placeholder="성우 캐스팅(복수)"
                style={{ minWidth: 320 }}
                value={ch.castVoiceActorIds}
                onChange={(val) => updateCharacter(webtoon.id, ch.id, { castVoiceActorIds: val })}
                options={voiceActorOptions}
                maxTagCount="responsive"
              />
              <Button danger type="text" onClick={() => removeCharacter(webtoon.id, ch.id)}>
                삭제
              </Button>
            </Space>
          ))}
          <Space.Compact>
            <Input
              placeholder="등장인물 이름"
              value={newCharName}
              onChange={(e) => setNewCharName(e.target.value)}
              onPressEnter={submitAddCharacter}
              style={{ width: 200 }}
            />
            <Button onClick={submitAddCharacter}>등장인물 추가</Button>
          </Space.Compact>
        </Space>
      </Card>

      <Space align="center" style={{ width: '100%', justifyContent: 'space-between', marginTop: 4 }}>
        <Typography.Title level={5} style={{ margin: 0 }}>
          회차
        </Typography.Title>
        <Button type="primary" onClick={() => setEpOpen(true)}>
          회차 등록
        </Button>
      </Space>

      <FullHeightTable<EpisodeRow>
        className="data-table"
        rowKey="id"
        columns={columns}
        dataSource={episodes}
        onRow={(record) => ({
          onClick: () => navigate(`/content/episodes/${record.id}`),
          style: { cursor: 'pointer' },
        })}
        pagination={{ pageSize: 30, showSizeChanger: true, pageSizeOptions: [30, 50, 100] }}
      />

      <Modal
        title="작품 수정"
        open={editOpen}
        onOk={submitEdit}
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
          <Form.Item name="description" label="설명">
            <Input.TextArea rows={3} maxLength={500} />
          </Form.Item>
          <Form.Item name="status" label="상태">
            <Select options={WEBTOON_STATUS_OPTIONS} />
          </Form.Item>
        </Form>
      </Modal>

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
        maskClosable={false}
      >
        <Form form={epForm} layout="vertical" initialValues={{ episodeNo: nextEpisodeNo }}>
          <Form.Item name="episodeNo" label="회차 번호" rules={[{ required: true, message: '회차 번호를 입력하세요.' }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="title" label="제목" rules={[{ required: true, message: '제목을 입력하세요.' }]}>
            <Input maxLength={200} placeholder="회차 제목" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
