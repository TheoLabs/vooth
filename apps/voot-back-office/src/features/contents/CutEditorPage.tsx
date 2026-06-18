import { useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  App as AntApp,
  Button,
  Empty,
  Input,
  Popconfirm,
  Select,
  Space,
  Spin,
  Typography,
} from 'antd';
import {
  DeleteOutlined,
  DownOutlined,
  PictureOutlined,
  PlusOutlined,
  UpOutlined,
} from '@ant-design/icons';
import { useContent } from './useContents';
import { useEpisode } from './useEpisodes';
import { useCharacters } from './useCharacters';
import { EpisodeStatusBadge } from './EpisodeStatusBadge';
import { avatarColor } from './characterDisplay';

/** 임시 키 생성기(저장 전 로컬 식별). */
let seq = 0;
const uid = () => `tmp-${Date.now()}-${seq++}`;

interface LineDraft {
  key: string;
  /** 화자 캐릭터 id (없으면 나레이션) */
  characterId?: number;
  text: string;
}

interface CutDraft {
  key: string;
  imageUrl: string | null;
  imageFile: File | null;
  lines: LineDraft[];
}

function newLine(): LineDraft {
  return { key: uid(), text: '' };
}
function newCut(): CutDraft {
  return { key: uid(), imageUrl: null, imageFile: null, lines: [newLine()] };
}

/** 회차당 mock 초기 컷(컷 등록 API 준비 전 UI/UX). */
function makeMockCuts(): CutDraft[] {
  return [
    { key: uid(), imageUrl: null, imageFile: null, lines: [{ key: uid(), text: '...' }] },
    { key: uid(), imageUrl: null, imageFile: null, lines: [newLine()] },
  ];
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
  const { data: characterData } = useCharacters(cId, { limit: 100 });

  const characterOptions = useMemo(
    () => (characterData?.items ?? []).map((c) => ({ value: c.id, label: c.name })),
    [characterData],
  );
  const characterColor = (id?: number) => {
    const c = characterData?.items.find((x) => x.id === id);
    return c ? avatarColor(c.name) : '#cbd5e1';
  };

  // 컷/대사는 mock 로컬 상태.
  const [cuts, setCuts] = useState<CutDraft[]>(makeMockCuts);

  const updateCut = (key: string, patch: Partial<CutDraft>) =>
    setCuts((prev) => prev.map((c) => (c.key === key ? { ...c, ...patch } : c)));

  const updateLine = (cutKey: string, lineKey: string, patch: Partial<LineDraft>) =>
    setCuts((prev) =>
      prev.map((c) =>
        c.key === cutKey
          ? { ...c, lines: c.lines.map((l) => (l.key === lineKey ? { ...l, ...patch } : l)) }
          : c,
      ),
    );

  const addCut = () => setCuts((prev) => [...prev, newCut()]);
  const removeCut = (key: string) => setCuts((prev) => prev.filter((c) => c.key !== key));
  const moveCut = (idx: number, dir: -1 | 1) => setCuts((prev) => move(prev, idx, idx + dir));

  const addLine = (cutKey: string) =>
    setCuts((prev) =>
      prev.map((c) => (c.key === cutKey ? { ...c, lines: [...c.lines, newLine()] } : c)),
    );
  const removeLine = (cutKey: string, lineKey: string) =>
    setCuts((prev) =>
      prev.map((c) =>
        c.key === cutKey ? { ...c, lines: c.lines.filter((l) => l.key !== lineKey) } : c,
      ),
    );
  const moveLine = (cutKey: string, idx: number, dir: -1 | 1) =>
    setCuts((prev) =>
      prev.map((c) => (c.key === cutKey ? { ...c, lines: move(c.lines, idx, idx + dir) } : c)),
    );

  const totalLines = cuts.reduce((n, c) => n + c.lines.length, 0);

  const handleSave = () => {
    message.info('컷 저장 API 연동 준비 중입니다. (mock)');
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

  return (
    <div className="bo-page">
      {/* 상단 바 */}
      <Space style={{ justifyContent: 'space-between', width: '100%' }}>
        <Button type="text" onClick={goBack}>
          ← 회차 목록
        </Button>
        <Space>
          <Typography.Text type="secondary">
            컷 {cuts.length} · 대사 {totalLines}
          </Typography.Text>
          <Button type="primary" onClick={handleSave}>
            저장
          </Button>
        </Space>
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
      </div>

      {/* 컷 목록 (남은 높이 채우고 내부 스크롤) */}
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
        {cuts.map((cut, idx) => (
          <CutCard
            key={cut.key}
            index={idx}
            cut={cut}
            isFirst={idx === 0}
            isLast={idx === cuts.length - 1}
            characterOptions={characterOptions}
            characterColor={characterColor}
            onMove={(dir) => moveCut(idx, dir)}
            onRemove={() => removeCut(cut.key)}
            onSetImage={(file, url) => updateCut(cut.key, { imageFile: file, imageUrl: url })}
            onAddLine={() => addLine(cut.key)}
            onRemoveLine={(lineKey) => removeLine(cut.key, lineKey)}
            onMoveLine={(lineIdx, dir) => moveLine(cut.key, lineIdx, dir)}
            onChangeLine={(lineKey, patch) => updateLine(cut.key, lineKey, patch)}
          />
        ))}

        <Button
          type="dashed"
          icon={<PlusOutlined />}
          onClick={addCut}
          style={{ height: 48, flex: 'none' }}
        >
          컷 추가
        </Button>
      </div>
    </div>
  );
}

interface CutCardProps {
  index: number;
  cut: CutDraft;
  isFirst: boolean;
  isLast: boolean;
  characterOptions: { value: number; label: string }[];
  characterColor: (id?: number) => string;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
  onSetImage: (file: File, url: string) => void;
  onAddLine: () => void;
  onRemoveLine: (lineKey: string) => void;
  onMoveLine: (lineIdx: number, dir: -1 | 1) => void;
  onChangeLine: (lineKey: string, patch: Partial<LineDraft>) => void;
}

function CutCard({
  index,
  cut,
  isFirst,
  isLast,
  characterOptions,
  characterColor,
  onMove,
  onRemove,
  onSetImage,
  onAddLine,
  onRemoveLine,
  onMoveLine,
  onChangeLine,
}: CutCardProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  const pickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onSetImage(file, URL.createObjectURL(file));
    e.target.value = '';
  };

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
      {/* 컷 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
        <Typography.Text strong>컷 {index + 1}</Typography.Text>
        <Space size={4} style={{ marginLeft: 'auto' }}>
          <Button
            size="small"
            type="text"
            icon={<UpOutlined />}
            disabled={isFirst}
            onClick={() => onMove(-1)}
          />
          <Button
            size="small"
            type="text"
            icon={<DownOutlined />}
            disabled={isLast}
            onClick={() => onMove(1)}
          />
          <Popconfirm title="이 컷을 삭제할까요?" okText="삭제" cancelText="취소" onConfirm={onRemove}>
            <Button size="small" type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      </div>

      <div style={{ display: 'flex', gap: 16 }}>
        {/* 컷 이미지 */}
        <div style={{ flex: 'none' }}>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            style={{
              width: 132,
              height: 176,
              borderRadius: 8,
              border: cut.imageUrl ? '1px solid #e2e8f0' : '1px dashed #cbd5e1',
              background: cut.imageUrl ? `center/cover no-repeat url(${cut.imageUrl})` : '#f8fafc',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              color: '#94a3b8',
              padding: 0,
            }}
          >
            {!cut.imageUrl && (
              <>
                <PictureOutlined style={{ fontSize: 22 }} />
                <span style={{ fontSize: 12 }}>이미지 업로드</span>
              </>
            )}
          </button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickImage} />
        </div>

        {/* 대사 목록 */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {cut.lines.map((line, lineIdx) => (
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
                  disabled={lineIdx === 0}
                  onClick={() => onMoveLine(lineIdx, -1)}
                />
                <Button
                  size="small"
                  type="text"
                  icon={<DownOutlined />}
                  disabled={lineIdx === cut.lines.length - 1}
                  onClick={() => onMoveLine(lineIdx, 1)}
                />
                <Button
                  size="small"
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  disabled={cut.lines.length === 1}
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
