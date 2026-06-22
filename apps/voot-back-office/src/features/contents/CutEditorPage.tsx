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
import {
  CheckOutlined,
  CloseOutlined,
  DeleteOutlined,
  DownOutlined,
  EditOutlined,
  PlusOutlined,
  UpOutlined,
} from '@ant-design/icons';
import { EpisodeStatus, type CropBox } from '@vooth/shared';
import { useContent } from './useContents';
import { useEpisode } from './useEpisodes';
import {
  useCuts,
  useCreateCut,
  useCreateLine,
  useDeleteCut,
  useDeleteLine,
  useUpdateCut,
  useUpdateLine,
} from './useCuts';
import { useCharacters } from './useCharacters';
import { EpisodeStatusBadge } from './EpisodeStatusBadge';
import { CutCropper } from './CutCropper';
import { avatarColor } from './characterDisplay';
import { useQueryClient } from '@tanstack/react-query';
import { uploadImage } from '../../api/file.api';
import { updateCut as updateCutApi, updateLine as updateLineApi } from '../../api/cut.api';
import type { AdminCut, AdminLine } from '../../api/cut.api';
import { CUTS_KEY } from './useCuts';

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

// ── 대사(라인) ──────────────────────────────────────────────────────────────
// 컷 목록 응답에 lines 가 조인되어 온다. 등록(create)만 제공되며(수정/삭제 없음),
// 등록 후 컷 목록을 무효화해 최신 lines 를 다시 불러온다.
interface LineDraftInput {
  characterId?: number;
  script: string;
}

export function CutEditorPage() {
  const { contentId, episodeId } = useParams();
  const navigate = useNavigate();
  const { message } = AntApp.useApp();
  const queryClient = useQueryClient();
  const cId = Number(contentId);
  const eId = Number(episodeId);

  const { data: content } = useContent(cId);
  const { data: episode, isLoading } = useEpisode(cId, eId);
  const { data: cutData, isLoading: cutsLoading } = useCuts(eId);
  const { data: characterData } = useCharacters(cId, { limit: 100 });
  const createCut = useCreateCut(eId);
  const updateCut = useUpdateCut(eId);
  const deleteCut = useDeleteCut(eId);
  const createLine = useCreateLine(eId);
  const updateLineMut = useUpdateLine(eId);
  const deleteLineMut = useDeleteLine(eId);

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

  // 대사(라인): 목록은 cut.lines(서버 조인)에서 읽고, 입력 드래프트만 컷별 로컬 관리
  const [draftByCut, setDraftByCut] = useState<Record<number, LineDraftInput>>({});
  const setDraft = (cutId: number, patch: Partial<LineDraftInput>) =>
    setDraftByCut((prev) => {
      const base: LineDraftInput = prev[cutId] ?? { script: '' };
      return { ...prev, [cutId]: { ...base, ...patch } };
    });

  const submitLine = async (cut: AdminCut) => {
    const draft = draftByCut[cut.id] ?? { script: '' };
    if (draft.characterId == null) {
      message.warning('화자(캐릭터)를 선택해주세요.');
      return;
    }
    if (!draft.script.trim()) {
      message.warning('대사를 입력해주세요.');
      return;
    }
    const order = cut.lines.reduce((m, l) => Math.max(m, l.order), 0) + 1;
    try {
      await createLine.mutateAsync({
        cutId: cut.id,
        input: { characterId: draft.characterId, script: draft.script.trim(), order },
      });
      setDraftByCut((prev) => ({ ...prev, [cut.id]: { characterId: draft.characterId, script: '' } }));
      message.success('대사를 등록했습니다.');
    } catch (err) {
      message.error(err instanceof Error ? err.message : '대사 등록에 실패했습니다.');
    }
  };

  /** 대사 수정: 원본과 비교해 변경된 필드만 전송. */
  const updateLine = async (
    cutId: number,
    line: AdminLine,
    next: { characterId: number; script: string },
  ) => {
    const input: { characterId?: number; script?: string } = {};
    if (next.characterId !== line.characterId) input.characterId = next.characterId;
    if (next.script !== line.script) input.script = next.script;
    if (Object.keys(input).length === 0) {
      message.info('변경된 내용이 없습니다.');
      return;
    }
    await updateLineMut.mutateAsync({ cutId, lineId: line.id, input });
    message.success('대사를 수정했습니다.');
  };

  const removeLine = (cutId: number, lineId: number) => {
    deleteLineMut.mutate(
      { cutId, lineId },
      {
        onSuccess: () => message.success('대사를 삭제했습니다.'),
        onError: (err) => message.error(err.message),
      },
    );
  };

  // 대사 순서 변경: (cutId, order) 유니크 제약 때문에 임시값(-1)을 거쳐 스왑.
  // 중간 단계마다 무효화하면 -1 상태가 잠깐 렌더돼 깜빡이므로, raw API 로 스왑 후 한 번만 무효화.
  const [lineReordering, setLineReordering] = useState(false);
  const moveLine = async (cut: AdminCut, index: number, dir: -1 | 1) => {
    const sorted = [...cut.lines].sort((a, b) => a.order - b.order);
    const a = sorted[index];
    const b = sorted[index + dir];
    if (!a || !b) return;
    setLineReordering(true);
    try {
      await updateLineApi(cut.id, a.id, { order: -1 });
      await updateLineApi(cut.id, b.id, { order: a.order });
      await updateLineApi(cut.id, a.id, { order: b.order });
    } catch (err) {
      message.error(err instanceof Error ? err.message : '대사 순서 변경에 실패했습니다.');
    } finally {
      await queryClient.invalidateQueries({ queryKey: [CUTS_KEY, 'list', eId] });
      setLineReordering(false);
    }
  };

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

  // 순서 변경: order 유니크 제약 때문에 임시값(-1)을 거쳐 스왑.
  const [reordering, setReordering] = useState(false);
  const moveCut = async (index: number, dir: -1 | 1) => {
    const a = cuts[index];
    const b = cuts[index + dir];
    if (!a || !b) return;
    setReordering(true);
    try {
      await updateCutApi(eId, a.id, { order: -1 });
      await updateCutApi(eId, b.id, { order: a.order });
      await updateCutApi(eId, a.id, { order: b.order });
    } catch (err) {
      message.error(err instanceof Error ? err.message : '순서 변경에 실패했습니다.');
    } finally {
      await queryClient.invalidateQueries({ queryKey: [CUTS_KEY, 'list', eId] });
      setReordering(false);
    }
  };

  // 크롭(초점 영역) 수정
  const [editingCut, setEditingCut] = useState<AdminCut | null>(null);
  const [editCrop, setEditCrop] = useState<CropBox>(FULL_CROP);
  const openCropEdit = (cut: AdminCut) => {
    setEditCrop(cut.imageCropBox ?? FULL_CROP);
    setEditingCut(cut);
  };
  const confirmCropEdit = async () => {
    if (!editingCut) return;
    try {
      await updateCut.mutateAsync({ cutId: editingCut.id, input: { imageCropBox: editCrop } });
      message.success('크롭을 수정했습니다.');
      setEditingCut(null);
    } catch (err) {
      message.error(err instanceof Error ? err.message : '크롭 수정에 실패했습니다.');
    }
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

  const totalLines = cuts.reduce((n, c) => n + c.lines.length, 0);

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
          cuts.map((cut, index) => (
            <CutCard
              key={cut.id}
              cut={cut}
              index={index}
              isFirst={index === 0}
              isLast={index === cuts.length - 1}
              lines={[...cut.lines].sort((a, b) => a.order - b.order)}
              draft={draftByCut[cut.id] ?? { script: '' }}
              lineSubmitting={createLine.isPending}
              lineUpdating={updateLineMut.isPending}
              lineDeleting={deleteLineMut.isPending}
              lineReordering={lineReordering}
              onUpdateLine={(line, next) => updateLine(cut.id, line, next)}
              onRemoveLine={(lineId) => removeLine(cut.id, lineId)}
              onMoveLine={(index, dir) => moveLine(cut, index, dir)}
              editable={isDraft}
              busy={reordering || updateCut.isPending}
              deleting={deleteCut.isPending}
              characterOptions={characterOptions}
              characterColor={characterColor}
              onMove={(dir) => moveCut(index, dir)}
              onEditCrop={() => openCropEdit(cut)}
              onRemove={() => removeCut(cut.id)}
              onDraftChange={(patch) => setDraft(cut.id, patch)}
              onSubmitLine={() => submitLine(cut)}
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

      {/* 기존 컷의 크롭(초점 영역) 수정 */}
      <Modal
        title={editingCut ? `컷 ${editingCut.order} 크롭 수정` : '크롭 수정'}
        open={editingCut != null}
        onCancel={() => setEditingCut(null)}
        maskClosable={false}
        okText="저장"
        cancelText="취소"
        confirmLoading={updateCut.isPending}
        onOk={confirmCropEdit}
        width={520}
      >
        {editingCut && (
          <>
            <Typography.Paragraph type="secondary" style={{ fontSize: 12, marginTop: 4 }}>
              드래그로 이동, 모서리로 크기 조절.
            </Typography.Paragraph>
            <CutCropper src={editingCut.imageUrl} value={editCrop} onChange={setEditCrop} />
            <Space style={{ marginTop: 10 }}>
              <Button size="small" onClick={() => setEditCrop(FULL_CROP)}>
                전체로 초기화
              </Button>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                x {Math.round(editCrop.x * 100)}% · y {Math.round(editCrop.y * 100)}% · w{' '}
                {Math.round(editCrop.w * 100)}% · h {Math.round(editCrop.h * 100)}%
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
  index: number;
  isFirst: boolean;
  isLast: boolean;
  lines: AdminLine[];
  draft: LineDraftInput;
  lineSubmitting: boolean;
  lineUpdating: boolean;
  lineDeleting: boolean;
  lineReordering: boolean;
  onUpdateLine: (line: AdminLine, next: { characterId: number; script: string }) => Promise<void>;
  onRemoveLine: (lineId: number) => void;
  onMoveLine: (index: number, dir: -1 | 1) => void;
  /** 초안 회차에서만 컷 수정/삭제 가능 */
  editable: boolean;
  /** 순서/크롭 수정 진행 중 */
  busy: boolean;
  deleting: boolean;
  characterOptions: { value: number; label: string }[];
  characterColor: (id?: number) => string;
  onMove: (dir: -1 | 1) => void;
  onEditCrop: () => void;
  onRemove: () => void;
  onDraftChange: (patch: Partial<LineDraftInput>) => void;
  onSubmitLine: () => void;
}

function CutCard({
  cut,
  isFirst,
  isLast,
  lines,
  draft,
  lineSubmitting,
  lineUpdating,
  lineDeleting,
  lineReordering,
  onUpdateLine,
  onRemoveLine,
  onMoveLine,
  editable,
  busy,
  deleting,
  characterOptions,
  characterColor,
  onMove,
  onEditCrop,
  onRemove,
  onDraftChange,
  onSubmitLine,
}: CutCardProps) {
  const { message } = AntApp.useApp();
  const characterName = (id: number) =>
    characterOptions.find((o) => o.value === id)?.label ?? '알 수 없음';

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<LineDraftInput>({ script: '' });

  const startEdit = (line: AdminLine) => {
    setEditingId(line.id);
    setEditDraft({ characterId: line.characterId, script: line.script });
  };
  const saveEdit = async (line: AdminLine) => {
    if (editDraft.characterId == null) {
      message.warning('화자(캐릭터)를 선택해주세요.');
      return;
    }
    if (!editDraft.script.trim()) {
      message.warning('대사를 입력해주세요.');
      return;
    }
    try {
      await onUpdateLine(line, {
        characterId: editDraft.characterId,
        script: editDraft.script.trim(),
      });
      setEditingId(null);
    } catch (err) {
      message.error(err instanceof Error ? err.message : '대사 수정에 실패했습니다.');
    }
  };
  const characterSelect = (
    value: number | undefined,
    onChange: (v: number | undefined) => void,
  ) => (
    <Select<number>
      showSearch
      placeholder="화자 선택"
      style={{ width: 150, flex: 'none' }}
      value={value}
      onChange={onChange}
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
  );

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
        {editable && (
          <Space size={4} style={{ marginLeft: 'auto' }}>
            <Button
              size="small"
              type="text"
              icon={<UpOutlined />}
              disabled={isFirst || busy}
              onClick={() => onMove(-1)}
            />
            <Button
              size="small"
              type="text"
              icon={<DownOutlined />}
              disabled={isLast || busy}
              onClick={() => onMove(1)}
            />
            <Button size="small" onClick={onEditCrop} disabled={busy}>
              크롭 수정
            </Button>
            <Popconfirm
              title="이 컷을 삭제할까요?"
              okText="삭제"
              cancelText="취소"
              okButtonProps={{ danger: true }}
              onConfirm={onRemove}
            >
              <Button size="small" type="text" danger icon={<DeleteOutlined />} loading={deleting} />
            </Popconfirm>
          </Space>
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

        {/* 대사(라인) */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Typography.Text type="secondary" style={{ fontSize: 11 }}>
            대사 {lines.length > 0 && `(${lines.length})`}
          </Typography.Text>

          {lines.map((line, idx) =>
            editingId === line.id ? (
              /* 인라인 수정 */
              <div key={line.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                {characterSelect(editDraft.characterId, (v) =>
                  setEditDraft((d) => ({ ...d, characterId: v })),
                )}
                <Input.TextArea
                  value={editDraft.script}
                  onChange={(e) => setEditDraft((d) => ({ ...d, script: e.target.value }))}
                  autoSize={{ minRows: 1, maxRows: 4 }}
                  style={{ flex: 1 }}
                />
                <Space size={2} style={{ flex: 'none' }}>
                  <Button
                    size="small"
                    type="text"
                    icon={<CheckOutlined />}
                    loading={lineUpdating}
                    onClick={() => saveEdit(line)}
                    aria-label="저장"
                  />
                  <Button
                    size="small"
                    type="text"
                    icon={<CloseOutlined />}
                    disabled={lineUpdating}
                    onClick={() => setEditingId(null)}
                    aria-label="취소"
                  />
                </Space>
              </div>
            ) : (
              /* 읽기 전용 행 + 수정/삭제 */
              <div
                key={line.id}
                className="cut-line-row"
                style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 13 }}
              >
                <Typography.Text type="secondary" style={{ flex: 'none', width: 20 }}>
                  {idx + 1}
                </Typography.Text>
                <span
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flex: 'none', width: 110 }}
                >
                  <span
                    style={{
                      display: 'inline-block',
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: characterColor(line.characterId),
                      flex: 'none',
                    }}
                  />
                  <Typography.Text ellipsis style={{ fontSize: 13 }}>
                    {characterName(line.characterId)}
                  </Typography.Text>
                </span>
                <Typography.Text style={{ flex: 1, whiteSpace: 'pre-wrap' }}>
                  {line.script}
                </Typography.Text>
                {editable && (
                  <Space size={2} style={{ flex: 'none' }}>
                    <Button
                      size="small"
                      type="text"
                      icon={<UpOutlined />}
                      disabled={idx === 0 || lineReordering}
                      onClick={() => onMoveLine(idx, -1)}
                      aria-label="위로"
                    />
                    <Button
                      size="small"
                      type="text"
                      icon={<DownOutlined />}
                      disabled={idx === lines.length - 1 || lineReordering}
                      onClick={() => onMoveLine(idx, 1)}
                      aria-label="아래로"
                    />
                    <Button
                      size="small"
                      type="text"
                      icon={<EditOutlined />}
                      onClick={() => startEdit(line)}
                      aria-label="대사 수정"
                    />
                    <Popconfirm
                      title="이 대사를 삭제할까요?"
                      okText="삭제"
                      cancelText="취소"
                      okButtonProps={{ danger: true }}
                      onConfirm={() => onRemoveLine(line.id)}
                    >
                      <Button
                        size="small"
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        loading={lineDeleting}
                        aria-label="대사 삭제"
                      />
                    </Popconfirm>
                  </Space>
                )}
              </div>
            ),
          )}

          {/* 대사 등록 폼 (초안 회차에서만) */}
          {editable ? (
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginTop: 4 }}>
              {characterSelect(draft.characterId, (v) => onDraftChange({ characterId: v }))}
              <Input.TextArea
                value={draft.script}
                onChange={(e) => onDraftChange({ script: e.target.value })}
                placeholder="대사를 입력하세요"
                autoSize={{ minRows: 1, maxRows: 4 }}
                style={{ flex: 1 }}
              />
              <Button
                type="primary"
                icon={<PlusOutlined />}
                loading={lineSubmitting}
                onClick={onSubmitLine}
                style={{ flex: 'none' }}
                aria-label="대사 등록"
              />
            </div>
          ) : (
            lines.length === 0 && (
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                초안(draft) 회차에서만 대사를 등록할 수 있습니다.
              </Typography.Text>
            )
          )}
        </div>
      </div>
    </div>
  );
}
