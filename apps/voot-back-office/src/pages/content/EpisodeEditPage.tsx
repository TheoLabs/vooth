import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Alert,
  App,
  Button,
  Card,
  Descriptions,
  Divider,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Spin,
  Tag,
  Typography,
} from 'antd';
import { EpisodeStatus, EPISODE_STATUS_TRANSITIONS } from '@vooth/shared';
import { useEpisode } from '../../features/episodes/useEpisodes';
import { useUpdateEpisode } from '../../features/episodes/useUpdateEpisode';
import { useCharacters } from '../../features/characters/useCharacters';
import { EPISODE_STATUS_META, type UpdateEpisodePayload } from '../../api/episodes.api';
import { SectionCard } from '../../components/SectionCard';
import { ThumbnailUpload } from '../../components/ThumbnailUpload';

/** 컷/대사 편집기 로컬 모델(저장 API 전까지 화면 상태). */
interface DraftLine {
  id: string;
  text: string;
  characterId?: number;
}
interface DraftCut {
  id: string;
  imageUrl?: string;
  lines: DraftLine[];
}

const uid = () => crypto.randomUUID();

/**
 * 회차 상세/수정. 기본 정보(제목/회차)는 수정 모달, 상태는 기본 정보 카드 내 허용 전이 버튼.
 * 컷 & 대사는 생성/편집 UI 를 제공하되, 저장 API 가 아직 없어 화면(로컬 상태)에서만 편집된다.
 */
export function EpisodeEditPage() {
  const { contentId = '', episodeId = '' } = useParams();
  const cid = Number(contentId);
  const eid = Number(episodeId);
  const { message, modal } = App.useApp();

  const { data: episode, isLoading, isError, error } = useEpisode(cid, eid);
  const updateMutation = useUpdateEpisode();

  // 대사 화자(캐릭터)는 실제 캐릭터 목록에서 고른다.
  const { data: charactersData } = useCharacters(cid);
  const characterOptions = (charactersData?.items ?? []).map((ch) => ({ value: ch.id, label: ch.name }));

  const [editOpen, setEditOpen] = useState(false);
  const [form] = Form.useForm<{ title: string; chapter: number }>();

  // 컷/대사 (로컬 상태)
  const [cuts, setCuts] = useState<DraftCut[]>([]);

  const statusMeta = episode ? EPISODE_STATUS_META[episode.status] : undefined;
  const statusTag = episode ? (
    statusMeta ? <Tag color={statusMeta.color}>{statusMeta.label}</Tag> : <Tag>{episode.status}</Tag>
  ) : null;

  const openEdit = () => {
    if (!episode) return;
    form.setFieldsValue({ title: episode.title, chapter: episode.chapter });
    setEditOpen(true);
  };

  const submitEdit = async () => {
    if (!episode) return;
    const v = await form.validateFields();
    const patch: UpdateEpisodePayload = {};
    const title = v.title.trim();
    if (title !== episode.title) patch.title = title;
    if (v.chapter !== episode.chapter) patch.chapter = v.chapter;

    if (Object.keys(patch).length === 0) {
      message.info('변경된 내용이 없습니다.');
      setEditOpen(false);
      return;
    }
    updateMutation.mutate(
      { contentId: cid, episodeId: eid, payload: patch },
      {
        onSuccess: () => {
          message.success('회차가 수정되었습니다.');
          setEditOpen(false);
        },
        onError: (err) => message.error(err.message),
      },
    );
  };

  const transition = (next: EpisodeStatus) => {
    const run = () =>
      updateMutation.mutate(
        { contentId: cid, episodeId: eid, payload: { status: next } },
        {
          onSuccess: () => message.success(`상태가 "${EPISODE_STATUS_META[next].label}"(으)로 변경되었습니다.`),
          onError: (err) => message.error(err.message),
        },
      );
    if (episode && next < episode.status) {
      modal.confirm({
        title: '반려할까요?',
        content: `회차를 "${EPISODE_STATUS_META[next].label}" 단계로 되돌립니다.`,
        okText: '반려',
        cancelText: '취소',
        okButtonProps: { danger: true },
        onOk: run,
      });
    } else {
      run();
    }
  };

  const allowedNext = episode ? EPISODE_STATUS_TRANSITIONS[episode.status] ?? [] : [];

  // --- 컷/대사 핸들러 ---
  const addCut = () => setCuts((p) => [...p, { id: uid(), lines: [] }]);
  const removeCut = (cutId: string) => setCuts((p) => p.filter((c) => c.id !== cutId));
  const updateCut = (cutId: string, patch: Partial<DraftCut>) =>
    setCuts((p) => p.map((c) => (c.id === cutId ? { ...c, ...patch } : c)));
  const moveCut = (cutId: string, dir: -1 | 1) =>
    setCuts((p) => {
      const i = p.findIndex((c) => c.id === cutId);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= p.length) return p;
      const next = [...p];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const addLine = (cutId: string) =>
    setCuts((p) => p.map((c) => (c.id === cutId ? { ...c, lines: [...c.lines, { id: uid(), text: '' }] } : c)));
  const removeLine = (cutId: string, lineId: string) =>
    setCuts((p) => p.map((c) => (c.id === cutId ? { ...c, lines: c.lines.filter((l) => l.id !== lineId) } : c)));
  const updateLine = (cutId: string, lineId: string, patch: Partial<DraftLine>) =>
    setCuts((p) =>
      p.map((c) =>
        c.id === cutId ? { ...c, lines: c.lines.map((l) => (l.id === lineId ? { ...l, ...patch } : l)) } : c,
      ),
    );
  const moveLine = (cutId: string, lineId: string, dir: -1 | 1) =>
    setCuts((p) =>
      p.map((c) => {
        if (c.id !== cutId) return c;
        const i = c.lines.findIndex((l) => l.id === lineId);
        const j = i + dir;
        if (i < 0 || j < 0 || j >= c.lines.length) return c;
        const lines = [...c.lines];
        [lines[i], lines[j]] = [lines[j], lines[i]];
        return { ...c, lines };
      }),
    );

  return (
    <div style={{ height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Space align="center">
        <Typography.Title level={3} style={{ margin: 0 }}>
          {episode ? `${episode.chapter}화 · ${episode.title}` : '회차'}
        </Typography.Title>
        {statusTag}
      </Space>

      {isError && <Alert type="error" showIcon message="회차를 불러오지 못했습니다." description={error?.message} />}
      {isLoading && <Spin />}

      {episode && (
        <SectionCard title="기본 정보" onEdit={openEdit} style={{ maxWidth: 480 }}>
          <Descriptions column={1} size="small">
            <Descriptions.Item label="회차 번호">{episode.chapter}화</Descriptions.Item>
            <Descriptions.Item label="제목">{episode.title}</Descriptions.Item>
            <Descriptions.Item label="상태">{statusTag}</Descriptions.Item>
          </Descriptions>

          {allowedNext.length > 0 && (
            <>
              <Divider style={{ margin: '8px 0' }} />
              <Space align="center" wrap>
                <Typography.Text type="secondary">상태 변경</Typography.Text>
                {allowedNext.map((next) => {
                  const back = next < episode.status;
                  return (
                    <Button
                      key={next}
                      size="small"
                      type={back ? 'default' : 'primary'}
                      danger={back}
                      loading={updateMutation.isPending}
                      onClick={() => transition(next)}
                    >
                      {back ? '반려' : `${EPISODE_STATUS_META[next].label}(으)로`}
                    </Button>
                  );
                })}
              </Space>
            </>
          )}
        </SectionCard>
      )}

      <SectionCard
        title="컷 & 대사"
        extra={
          <Button size="small" type="primary" onClick={addCut}>
            + 컷 추가
          </Button>
        }
      >
        <Typography.Paragraph type="secondary" style={{ marginTop: 0, fontSize: 12 }}>
          * 컷/대사는 아직 저장 API가 없어 화면에서만 편집됩니다(추후 연동).
        </Typography.Paragraph>

        {cuts.length === 0 ? (
          <Empty description="컷이 없습니다. '컷 추가'로 시작하세요." image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            {cuts.map((cut, ci) => (
              <Card
                key={cut.id}
                size="small"
                type="inner"
                title={`컷 ${ci + 1}`}
                extra={
                  <Space>
                    <Button size="small" disabled={ci === 0} onClick={() => moveCut(cut.id, -1)}>
                      ↑
                    </Button>
                    <Button size="small" disabled={ci === cuts.length - 1} onClick={() => moveCut(cut.id, 1)}>
                      ↓
                    </Button>
                    <Button size="small" danger onClick={() => removeCut(cut.id)}>
                      컷 삭제
                    </Button>
                  </Space>
                }
              >
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                  <ThumbnailUpload value={cut.imageUrl} onChange={(url) => updateCut(cut.id, { imageUrl: url })} />

                  <div style={{ flex: '1 1 320px', minWidth: 280 }}>
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                      {cut.lines.length === 0 && (
                        <Typography.Text type="secondary">대사가 없습니다.</Typography.Text>
                      )}
                      {cut.lines.map((line, li) => (
                        <Space key={line.id} align="start" wrap>
                          <Typography.Text type="secondary" style={{ width: 20, textAlign: 'right' }}>
                            {li + 1}
                          </Typography.Text>
                          <Select
                            allowClear
                            placeholder="캐릭터"
                            style={{ width: 130 }}
                            value={line.characterId}
                            onChange={(v) => updateLine(cut.id, line.id, { characterId: v })}
                            options={characterOptions}
                          />
                          <Input.TextArea
                            value={line.text}
                            placeholder="대사 내용"
                            autoSize={{ minRows: 1, maxRows: 3 }}
                            style={{ width: 320 }}
                            onChange={(e) => updateLine(cut.id, line.id, { text: e.target.value })}
                          />
                          <Button size="small" disabled={li === 0} onClick={() => moveLine(cut.id, line.id, -1)}>
                            ↑
                          </Button>
                          <Button
                            size="small"
                            disabled={li === cut.lines.length - 1}
                            onClick={() => moveLine(cut.id, line.id, 1)}
                          >
                            ↓
                          </Button>
                          <Button size="small" danger type="text" onClick={() => removeLine(cut.id, line.id)}>
                            삭제
                          </Button>
                        </Space>
                      ))}
                      <Button size="small" type="dashed" onClick={() => addLine(cut.id)}>
                        + 대사 추가
                      </Button>
                    </Space>
                  </div>
                </div>
              </Card>
            ))}
          </Space>
        )}
      </SectionCard>

      <Modal
        title="회차 수정"
        open={editOpen}
        onOk={submitEdit}
        confirmLoading={updateMutation.isPending}
        onCancel={() => setEditOpen(false)}
        okText="저장"
        cancelText="취소"
        destroyOnClose
        maskClosable={false}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="chapter" label="회차 번호" rules={[{ required: true, message: '회차 번호를 입력하세요.' }]}>
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
