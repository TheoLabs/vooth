import { Link, useParams } from 'react-router-dom';
import { Button, Card, Empty, Input, Select, Space, Tag, Typography, message } from 'antd';
import { useContentStore } from '../../features/content/ContentStore';
import {
  EPISODE_STATUS_FLOW,
  EPISODE_STATUS_META,
} from '../../features/content/contentTypes';
import type { Cut, Line } from '../../features/content/contentTypes';

export function EpisodeEditPage() {
  const { id = '' } = useParams();
  const {
    getEpisode,
    getWebtoon,
    updateEpisode,
    addCut,
    removeCut,
    moveCut,
    addLine,
    removeLine,
    moveLine,
    updateLine,
  } = useContentStore();

  const ep = getEpisode(id);
  // 콘텐츠 상세에서 등록한 회차는 실제 콘텐츠 id(문자열)로 스코프되어 webtoon(mock)이 없을 수 있다.
  const webtoon = ep ? getWebtoon(ep.webtoonId) : undefined;

  if (!ep) {
    return (
      <div className="bo-page">
        <Typography.Text type="secondary">회차를 찾을 수 없습니다.</Typography.Text>
        <div>
          <Link to="/content/webtoons">← 작품 목록으로</Link>
        </div>
      </div>
    );
  }

  const characterOptions = webtoon?.characters.map((c) => ({ value: c.id, label: c.name })) ?? [];
  const statusIdx = EPISODE_STATUS_FLOW.indexOf(ep.status);
  const nextStatus = EPISODE_STATUS_FLOW[statusIdx + 1];

  const advance = () => {
    if (!nextStatus) return;
    updateEpisode(ep.id, { status: nextStatus });
    message.success(`상태가 "${EPISODE_STATUS_META[nextStatus].label}"(으)로 변경되었습니다.`);
  };

  const renderLine = (cut: Cut, line: Line, lineCount: number) => (
    <Space key={line.id} align="start" style={{ width: '100%' }} wrap>
      <Typography.Text type="secondary" style={{ width: 24, textAlign: 'right' }}>
        {line.order}
      </Typography.Text>
      <Input.TextArea
        value={line.text}
        placeholder="대사 내용"
        autoSize={{ minRows: 1, maxRows: 3 }}
        style={{ width: 360 }}
        onChange={(e) => updateLine(ep.id, cut.id, line.id, { text: e.target.value })}
      />
      <Select
        allowClear
        placeholder="캐릭터"
        style={{ width: 130 }}
        value={line.characterId}
        onChange={(v) => updateLine(ep.id, cut.id, line.id, { characterId: v })}
        options={characterOptions}
      />
      <Button size="small" disabled={line.order === 1} onClick={() => moveLine(ep.id, cut.id, line.id, -1)}>
        ↑
      </Button>
      <Button size="small" disabled={line.order === lineCount} onClick={() => moveLine(ep.id, cut.id, line.id, 1)}>
        ↓
      </Button>
      <Button size="small" danger type="text" onClick={() => removeLine(ep.id, cut.id, line.id)}>
        삭제
      </Button>
    </Space>
  );

  const renderCut = (cut: Cut, cutCount: number) => (
    <Card
      key={cut.id}
      size="small"
      style={{ marginBottom: 12 }}
      title={`컷 ${cut.order}`}
      extra={
        <Space>
          <Button size="small" disabled={cut.order === 1} onClick={() => moveCut(ep.id, cut.id, -1)}>
            ↑
          </Button>
          <Button size="small" disabled={cut.order === cutCount} onClick={() => moveCut(ep.id, cut.id, 1)}>
            ↓
          </Button>
          <Button size="small" danger onClick={() => removeCut(ep.id, cut.id)}>
            컷 삭제
          </Button>
        </Space>
      }
    >
      <Space align="start" size="large" style={{ width: '100%' }}>
        <Space direction="vertical" align="center">
          <img
            src={cut.imageKey}
            alt={`컷 ${cut.order}`}
            style={{ width: 200, borderRadius: 8, border: '1px solid #f0f0f0' }}
          />
          <Button size="small" onClick={() => message.info('이미지 업로드는 추후 지원됩니다(현재 placeholder).')}>
            이미지 업로드
          </Button>
        </Space>

        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          {cut.lines.length === 0 && <Typography.Text type="secondary">대사가 없습니다.</Typography.Text>}
          {cut.lines.map((line) => renderLine(cut, line, cut.lines.length))}
          <Button size="small" type="dashed" onClick={() => addLine(ep.id, cut.id)}>
            + 대사 추가
          </Button>
        </Space>
      </Space>
    </Card>
  );

  return (
    <div className="bo-page">
      <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
        <Space direction="vertical" size={0}>
          <Link to={`/content/contents/${ep.webtoonId}`}>← {webtoon?.title ?? '콘텐츠'} 상세로</Link>
          <Space align="center">
            <Typography.Title level={3} style={{ margin: 0 }}>
              {ep.episodeNo}화 · {ep.title}
            </Typography.Title>
            <Tag color={EPISODE_STATUS_META[ep.status].color}>{EPISODE_STATUS_META[ep.status].label}</Tag>
          </Space>
        </Space>
        <Space>
          {nextStatus ? (
            <Button type="primary" onClick={advance}>
              다음 단계: {EPISODE_STATUS_META[nextStatus].label}
            </Button>
          ) : (
            <Tag color="green">게시 완료</Tag>
          )}
          <Button onClick={() => addCut(ep.id)}>+ 컷 추가</Button>
        </Space>
      </Space>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', paddingRight: 4, marginTop: 8 }}>
        {ep.cuts.length === 0 ? (
          <Empty description="컷이 없습니다. '컷 추가'로 시작하세요." style={{ marginTop: 48 }} />
        ) : (
          ep.cuts.map((cut) => renderCut(cut, ep.cuts.length))
        )}
      </div>
    </div>
  );
}
