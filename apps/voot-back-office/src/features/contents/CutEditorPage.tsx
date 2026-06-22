import { useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  App as AntApp,
  Button,
  Empty,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Spin,
  Typography,
} from 'antd';
import { DeleteOutlined, DownOutlined, PlusOutlined, UpOutlined } from '@ant-design/icons';
import { EpisodeStatus, type CropBox } from '@vooth/shared';
import { useContent } from './useContents';
import { useEpisode } from './useEpisodes';
import { useCuts, useCreateCut, useDeleteCut } from './useCuts';
import { useCharacters } from './useCharacters';
import { EpisodeStatusBadge } from './EpisodeStatusBadge';
import { CutCropper } from './CutCropper';
import { avatarColor } from './characterDisplay';
import { uploadImage } from '../../api/file.api';
import type { AdminCut } from '../../api/cut.api';

const FULL_CROP: CropBox = { x: 0, y: 0, w: 1, h: 1 };

/** 파일에서 이미지 원본 픽셀 크기를 읽는다. */
function readImageSize(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('이미지를 읽을 수 없습니다.'));
    };
    img.src = url;
  });
}

// ── 대사(라인) MOCK ─ 라인 등록 API 준비 전, 컷별 로컬 상태 ──────────────────
let lineSeq = 0;
const uid = () => `line-${Date.now()}-${lineSeq++}`;
interface LineDraft {
  key: string;
  characterId?: number;
  text: string;
}
function move<T>(arr: T[], from: number, to: number): T[] {
  if (to < 0 || to >= arr.length) return arr;
  const copy = [...arr];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}

export function CutEditorPage() {
  const { contentId, episodeId } = useParams();
  const navigate = useNavigate();
  const { message } = AntApp.useApp();
  const cId = Number(contentId);
  const eId = Number(episodeId);

  const { data: content } = useContent(cId);
  const { data: episode, isLoading } = useEpisode(cId, eId);
  const { data: cutData, isLoading: cutsLoading } = useCuts(eId);
  const { data: characterData } = useCharacters(cId, { limit: 100 });
  const createCut = useCreateCut(eId);
  const deleteCut = useDeleteCut(eId);

  const cuts = [...(cutData?.items ?? [])].sort((a, b) => a.order - b.order);
  const characterOptions = (characterData?.items ?? []).map((c) => ({ value: c.id, label: c.name }));
  const characterColor = (id?: number) => {
    const c = characterData?.items.find((x) => x.id === id);
    return c ? avatarColor(c.name) : '#cbd5e1';
  };

  const isDraft = episode?.status === EpisodeStatus.DRAFT;

  const fileRef = useRef<HTMLInputElement>(null);
  const [adding, setAdding] = useState(false);

  // 컷 추가: 이미지 선택 → 크롭(초점 영역) 지정 → 저장
  const [pending, setPending] = useState<{ file: File; url: string } | null>(null);
  const [cropBox, setCropBox] = useState<CropBox>(FULL_CROP);

  // 대사(라인) MOCK 로컬 상태: cutId → lines
  const [linesByCut, setLinesByCut] = useState<Record<number, LineDraft[]>>({});
  const setLines = (cutId: number, updater: (prev: LineDraft[]) => LineDraft[]) =>
    setLinesByCut((prev) => ({ ...prev, [cutId]: updater(prev[cutId] ?? []) }));

  const pickCutImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setCropBox(FULL_CROP);
    setPending({ file, url: URL.createObjectURL(file) });
  };

  const cancelCrop = () => {
    if (pending) URL.revokeObjectURL(pending.url);
    setPending(null);
  };

  const confirmCrop = async () => {
    if (!pending) return;
    setAdding(true);
    try {
      const { width, height } = await readImageSize(pending.file);
      const imageFileId = await uploadImage(pending.file, 'episodes/cut');
      const nextOrder = cuts.reduce((m, c) => Math.max(m, c.order), 0) + 1;
      await createCut.mutateAsync({
        order: nextOrder,
        imageFileId,
        imageWidth: width,
        imageHeight: height,
        imageCropBox: cropBox,
      });
      message.success('컷을 추가했습니다.');
      cancelCrop();
    } catch (err) {
      message.error(err instanceof Error ? err.message : '컷 추가에 실패했습니다.');
    } finally {
      setAdding(false);
    }
  };

  const removeCut = (cutId: number) => {
    deleteCut.mutate(cutId, {
      onSuccess: () => message.success('컷을 삭제했습니다.'),
      onError: (err) => message.error(err.message),
    });
  };

  const goBack = () => navigate(`/contents/${cId}?tab=episodes`);

  if (isLoading) {
    return (
      <div className="bo-page" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Spin />
      </div>
    );
  }

  if (!episode) {
    return (
      <div className="bo-page">
        <Empty description="회차를 불러오지 못했습니다.">
          <Button type="primary" onClick={goBack}>
            회차 목록으로
          </Button>
        </Empty>
      </div>
    );
  }

  const totalLines = cuts.reduce((n, c) => n + (linesByCut[c.id]?.length ?? 0), 0);

  return (
    <div className="bo-page">
      {/* 상단 바 */}
      <Space style={{ justifyContent: 'space-between', width: '100%' }}>
        <Button type="text" onClick={goBack}>
          ← 회차 목록
        </Button>
        <Typography.Text type="secondary">
          컷 {cuts.length} · 대사 {totalLines}
        </Typography.Text>
      </Space>

      {/* 회차 헤더 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 16px',
          background: '#fff',
          border: '1px solid #f0f0f0',
          borderRadius: 12,
          flex: 'none',
        }}
      >
        <Typography.Text type="secondary">{content?.title ?? '작품'}</Typography.Text>
        <Typography.Text type="secondary">·</Typography.Text>
        <Typography.Text strong>{episode.chapter}화</Typography.Text>
        <Typography.Title level={5} style={{ margin: 0 }}>
          {episode.title}
        </Typography.Title>
        <EpisodeStatusBadge status={episode.status} />
        {!isDraft && (
          <Typography.Text type="warning" style={{ marginLeft: 'auto', fontSize: 12 }}>
            초안(draft) 상태에서만 컷을 추가할 수 있습니다.
          </Typography.Text>
        )}
      </div>

      {/* 컷 목록 */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          paddingRight: 4,
        }}
      >
        {cutsLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}>
            <Spin />
          </div>
        ) : cuts.length === 0 ? (
          <Empty description="등록된 컷이 없습니다." style={{ margin: '24px 0' }} />
        ) : (
          cuts.map((cut) => (
            <CutCard
              key={cut.id}
              cut={cut}
              lines={linesByCut[cut.id] ?? []}
              canDelete={isDraft}
              deleting={deleteCut.isPending}
              characterOptions={characterOptions}
              characterColor={characterColor}
              onRemove={() => removeCut(cut.id)}
              onAddLine={() => setLines(cut.id, (p) => [...p, { key: uid(), text: '' }])}
              onChangeLine={(lineKey, patch) =>
                setLines(cut.id, (p) => p.map((l) => (l.key === lineKey ? { ...l, ...patch } : l)))
              }
              onRemoveLine={(lineKey) =>
                setLines(cut.id, (p) => p.filter((l) => l.key !== lineKey))
              }
              onMoveLine={(idx, dir) => setLines(cut.id, (p) => move(p, idx, idx + dir))}
            />
          ))
        )}

        <Button
          type="dashed"
          icon={<PlusOutlined />}
          disabled={!isDraft}
          onClick={() => fileRef.current?.click()}
          style={{ height: 48, flex: 'none' }}
        >
          컷 추가 (이미지 업로드)
        </Button>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickCutImage} />
      </div>

      {/* 컷 이미지 크롭(초점 영역) 지정 후 저장 */}
      <Modal
        title="컷 초점 영역 지정"
        open={pending != null}
        onCancel={cancelCrop}
        maskClosable={false}
        okText="컷 추가"
        cancelText="취소"
        confirmLoading={adding}
        onOk={confirmCrop}
        width={520}
      >
        {pending && (
          <>
            <Typography.Paragraph type="secondary" style={{ fontSize: 12, marginTop: 4 }}>
              드래그로 이동, 모서리로 크기 조절. 지정한 영역이 컷의 초점(cropBox)으로 저장됩니다.
            </Typography.Paragraph>
            <CutCropper src={pending.url} value={cropBox} onChange={setCropBox} />
            <Space style={{ marginTop: 10 }}>
              <Button size="small" onClick={() => setCropBox(FULL_CROP)}>
                전체로 초기화
              </Button>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                x {Math.round(cropBox.x * 100)}% · y {Math.round(cropBox.y * 100)}% · w{' '}
                {Math.round(cropBox.w * 100)}% · h {Math.round(cropBox.h * 100)}%
              </Typography.Text>
            </Space>
          </>
        )}
      </Modal>
    </div>
  );
}

interface CutCardProps {
  cut: AdminCut;
  lines: LineDraft[];
  canDelete: boolean;
  deleting: boolean;
  characterOptions: { value: number; label: string }[];
  characterColor: (id?: number) => string;
  onRemove: () => void;
  onAddLine: () => void;
  onChangeLine: (lineKey: string, patch: Partial<LineDraft>) => void;
  onRemoveLine: (lineKey: string) => void;
  onMoveLine: (idx: number, dir: -1 | 1) => void;
}

function CutCard({
  cut,
  lines,
  canDelete,
  deleting,
  characterOptions,
  characterColor,
  onRemove,
  onAddLine,
  onChangeLine,
  onRemoveLine,
  onMoveLine,
}: CutCardProps) {
  return (
    <div
      style={{
        flex: 'none',
        background: '#fff',
        border: '1px solid #f0f0f0',
        borderRadius: 12,
        padding: 16,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
        <Typography.Text strong>컷 {cut.order}</Typography.Text>
        <Typography.Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
          {cut.imageWidth}×{cut.imageHeight}
        </Typography.Text>
        {canDelete && (
          <Popconfirm
            title="이 컷을 삭제할까요?"
            okText="삭제"
            cancelText="취소"
            okButtonProps={{ danger: true }}
            onConfirm={onRemove}
          >
            <Button
              size="small"
              type="text"
              danger
              icon={<DeleteOutlined />}
              loading={deleting}
              style={{ marginLeft: 'auto' }}
            />
          </Popconfirm>
        )}
      </div>

      <div style={{ display: 'flex', gap: 16 }}>
        {/* 컷 이미지 */}
        <img
          src={cut.imageUrl}
          alt={`컷 ${cut.order}`}
          style={{
            width: 140,
            flex: 'none',
            height: 'auto',
            maxHeight: 220,
            objectFit: 'contain',
            borderRadius: 8,
            border: '1px solid #e2e8f0',
            background: '#f8fafc',
          }}
        />

        {/* 대사(라인) — MOCK */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Typography.Text type="secondary" style={{ fontSize: 11 }}>
            대사 (라인 등록 API 준비 전 · mock)
          </Typography.Text>
          {lines.map((line, idx) => (
            <div key={line.key} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <Select<number>
                allowClear
                placeholder="나레이션"
                style={{ width: 150, flex: 'none' }}
                value={line.characterId}
                onChange={(v) => onChangeLine(line.key, { characterId: v })}
                options={characterOptions}
                optionFilterProp="label"
                optionRender={(option) => (
                  <Space size={8}>
                    <span
                      style={{
                        display: 'inline-block',
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: characterColor(option.value as number),
                        flex: 'none',
                      }}
                    />
                    {option.label}
                  </Space>
                )}
              />
              <Input.TextArea
                value={line.text}
                onChange={(e) => onChangeLine(line.key, { text: e.target.value })}
                placeholder="대사를 입력하세요"
                autoSize={{ minRows: 1, maxRows: 4 }}
                style={{ flex: 1 }}
              />
              <Space size={2} style={{ flex: 'none' }}>
                <Button
                  size="small"
                  type="text"
                  icon={<UpOutlined />}
                  disabled={idx === 0}
                  onClick={() => onMoveLine(idx, -1)}
                />
                <Button
                  size="small"
                  type="text"
                  icon={<DownOutlined />}
                  disabled={idx === lines.length - 1}
                  onClick={() => onMoveLine(idx, 1)}
                />
                <Button
                  size="small"
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => onRemoveLine(line.key)}
                />
              </Space>
            </div>
          ))}

          <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={onAddLine}>
            대사 추가
          </Button>
        </div>
      </div>
    </div>
  );
}
