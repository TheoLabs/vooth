import { useEffect, useMemo, useState } from 'react';
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
import { useUploadScript } from '../../features/episodes/useUploadScript';
import { useCharacters } from '../../features/characters/useCharacters';
import {
  EPISODE_STATUS_META,
  type CropBox,
  type UpdateEpisodePayload,
  type UploadScriptPayload,
} from '../../api/episodes.api';
import { SectionCard } from '../../components/SectionCard';
import { CropImageField } from '../../components/CropImageField';

/** 컷/대사 편집기 로컬 모델. id=로컬 React key, serverId=DB id(있으면 upsert, 없으면 신규). */
interface DraftLine {
  id: string;
  serverId?: number;
  text: string;
  characterId?: number;
  /** 연출용: 컷 내 세로 위치(0~1). 미지정이면 표시/렌더 측 균등 분배. */
  anchorY?: number;
  /** 연출용: 이 대사 앞 간격(ms, 페이싱). */
  gapBeforeMs?: number;
}
interface DraftCut {
  id: string;
  serverId?: number;
  // imageUrl=원본. cropBox=표시용 16:10 영역(저장 모델 B). imageWidth/Height=원본 크기.
  imageUrl?: string;
  imageWidth?: number;
  imageHeight?: number;
  cropBox?: CropBox;
  /** 연출용: 컷 끝 머무는 시간(ms). */
  holdMs?: number;
  lines: DraftLine[];
}

const uid = () => crypto.randomUUID();

/** 자동 전이(시스템 처리 → 관리자 수동 버튼 미노출). READY→RECORDING 은 성우가 녹음하면 자동 전환. */
const AUTO_EPISODE_TRANSITIONS: ReadonlyArray<readonly [EpisodeStatus, EpisodeStatus]> = [
  [EpisodeStatus.READY, EpisodeStatus.RECORDING],
];
const isAutoEpisodeTransition = (from: EpisodeStatus, to: EpisodeStatus): boolean =>
  AUTO_EPISODE_TRANSITIONS.some(([f, t]) => f === from && t === to);

/** 변경 감지용 시그니처(로컬 key 제외, 순서·내용·serverId 반영). */
function scriptSignature(cuts: DraftCut[]): string {
  return JSON.stringify(
    cuts.map((cut) => ({
      serverId: cut.serverId ?? null,
      imageUrl: cut.imageUrl ?? null,
      imageWidth: cut.imageWidth ?? null,
      imageHeight: cut.imageHeight ?? null,
      cropBox: cut.cropBox ?? null,
      holdMs: cut.holdMs ?? null,
      lines: cut.lines.map((l) => ({
        serverId: l.serverId ?? null,
        text: l.text,
        characterId: l.characterId ?? null,
        anchorY: l.anchorY ?? null,
        gapBeforeMs: l.gapBeforeMs ?? null,
      })),
    })),
  );
}

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
  // 로드/저장 시점의 스냅샷(시그니처). 현재 상태와 다르면 dirty.
  const [baseline, setBaseline] = useState('');
  const uploadScriptMutation = useUploadScript();

  // 상세에서 받은 컷/대사를 에디터 초기값으로 로드(회차 진입 시 1회, position 순 정렬).
  useEffect(() => {
    if (!episode?.cuts) return;
    const sortedCuts = [...episode.cuts].sort((a, b) => a.position - b.position);
    const draft: DraftCut[] = sortedCuts.map((cut) => ({
      id: uid(),
      serverId: cut.id,
      imageUrl: cut.imageUrl,
      imageWidth: cut.imageWidth ?? undefined,
      imageHeight: cut.imageHeight ?? undefined,
      cropBox: cut.cropBox ?? undefined,
      holdMs: cut.holdMs ?? undefined,
      lines: [...cut.lines]
        .sort((a, b) => a.position - b.position)
        .map((line) => ({
          id: uid(),
          serverId: line.id,
          text: line.script,
          characterId: line.characterId,
          anchorY: line.anchorY ?? undefined,
          gapBeforeMs: line.gapBeforeMs ?? undefined,
        })),
    }));
    setCuts(draft);
    setBaseline(scriptSignature(draft));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [episode?.id]);

  // 변경 여부(컷/대사가 로드/저장 시점과 다른가).
  const isDirty = useMemo(() => scriptSignature(cuts) !== baseline, [cuts, baseline]);

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

  // 자동 전이(예: READY→RECORDING)는 관리자 수동 버튼에서 제외.
  const allowedNext = episode
    ? (EPISODE_STATUS_TRANSITIONS[episode.status] ?? []).filter(
        (next) => !isAutoEpisodeTransition(episode.status, next),
      )
    : [];

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

  // 스크립트 저장: 화면 순서대로 position(index+1) 부여 후 통째 업로드(교체).
  const handleSaveScript = () => {
    for (const [ci, cut] of cuts.entries()) {
      if (!cut.imageUrl) {
        message.error(`컷 ${ci + 1}: 이미지를 업로드하세요.`);
        return;
      }
      for (const [li, line] of cut.lines.entries()) {
        if (line.characterId == null) {
          message.error(`컷 ${ci + 1} · 대사 ${li + 1}: 캐릭터를 선택하세요.`);
          return;
        }
        if (!line.text.trim()) {
          message.error(`컷 ${ci + 1} · 대사 ${li + 1}: 대사를 입력하세요.`);
          return;
        }
      }
    }

    const payload: UploadScriptPayload = {
      cutItems: cuts.map((cut, ci) => ({
        id: cut.serverId,
        imageUrl: cut.imageUrl as string,
        imageWidth: cut.imageWidth,
        imageHeight: cut.imageHeight,
        cropBox: cut.cropBox,
        holdMs: cut.holdMs,
        position: ci + 1,
        lineItems: cut.lines.map((line, li) => ({
          id: line.serverId,
          characterId: line.characterId as number,
          script: line.text.trim(),
          position: li + 1,
          anchorY: line.anchorY,
          gapBeforeMs: line.gapBeforeMs,
        })),
      })),
    };

    const savedSignature = scriptSignature(cuts);
    uploadScriptMutation.mutate(
      { contentId: cid, episodeId: eid, payload },
      {
        onSuccess: () => {
          message.success('스크립트가 저장되었습니다.');
          setBaseline(savedSignature);
        },
        onError: (err) => message.error(err.message),
      },
    );
  };

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

      <SectionCard title="컷 & 대사">
        <Typography.Paragraph type="secondary" style={{ marginTop: 0, fontSize: 12 }}>
          * 저장하면 현재 화면의 컷/대사 순서대로 전체 교체됩니다(편집중 상태에서만 가능).
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
                  <CropImageField
                    value={
                      cut.imageUrl
                        ? {
                            imageUrl: cut.imageUrl,
                            imageWidth: cut.imageWidth,
                            imageHeight: cut.imageHeight,
                            cropBox: cut.cropBox,
                          }
                        : null
                    }
                    onChange={(v) =>
                      updateCut(cut.id, {
                        imageUrl: v.imageUrl,
                        imageWidth: v.imageWidth,
                        imageHeight: v.imageHeight,
                        cropBox: v.cropBox,
                      })
                    }
                  />

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

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 8,
            marginTop: 16,
            paddingTop: 16,
            borderTop: '1px solid #f0f0f0',
          }}
        >
          <Button onClick={addCut}>+ 컷 추가</Button>
          <Button
            type="primary"
            loading={uploadScriptMutation.isPending}
            disabled={!isDirty}
            onClick={handleSaveScript}
          >
            저장
          </Button>
        </div>
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
