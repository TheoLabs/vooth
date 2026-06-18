import { useEffect, useRef, useState } from 'react';
import { App as AntApp, Button, Drawer, Input, InputNumber, Space, Typography } from 'antd';
import type { CropBox } from '@vooth/shared';
import { ThumbnailCropper } from './ThumbnailCropper';

export interface EpisodeFormPayload {
  title: string;
  chapter: number;
  thumbnailFile: File | null;
  cropBox: CropBox | null;
}

interface EpisodeFormDrawerProps {
  open: boolean;
  /** 신규 등록 시 기본 회차 번호 제안값 */
  defaultChapter?: number;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (payload: EpisodeFormPayload) => void;
}

export function EpisodeFormDrawer({
  open,
  defaultChapter = 1,
  submitting = false,
  onClose,
  onSubmit,
}: EpisodeFormDrawerProps) {
  const { message } = AntApp.useApp();

  const [title, setTitle] = useState('');
  const [chapter, setChapter] = useState<number>(defaultChapter);
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [cropBox, setCropBox] = useState<CropBox | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setTitle('');
    setChapter(defaultChapter);
    setThumbFile(null);
    setCropBox(null);
  }, [open, defaultChapter]);

  const pickThumb = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbFile(file);
      setCropBox(null);
    }
    e.target.value = '';
  };

  const submit = () => {
    if (!title.trim()) {
      message.warning('회차 제목을 입력해주세요.');
      return;
    }
    if (!Number.isInteger(chapter) || chapter < 1) {
      message.warning('회차 번호를 올바르게 입력해주세요.');
      return;
    }
    onSubmit({ title: title.trim(), chapter, thumbnailFile: thumbFile, cropBox });
  };

  return (
    <Drawer
      title="회차 등록"
      open={open}
      onClose={onClose}
      maskClosable={false}
      width={480}
      extra={
        <Space>
          <Button onClick={onClose} disabled={submitting}>
            취소
          </Button>
          <Button type="primary" onClick={submit} loading={submitting}>
            등록
          </Button>
        </Space>
      }
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <span className="form-label">회차 번호</span>
          <InputNumber
            min={1}
            value={chapter}
            onChange={(v) => setChapter(typeof v === 'number' ? v : 1)}
            style={{ width: 160 }}
          />
        </div>

        <div>
          <span className="form-label">제목</span>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="회차 제목"
            maxLength={100}
          />
        </div>

        <div>
          <span className="form-label">썸네일 (3:4, 선택)</span>
          {thumbFile ? (
            <ThumbnailCropper file={thumbFile} onChange={setCropBox} />
          ) : (
            <Typography.Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
              썸네일을 지정하지 않으면 작품 썸네일이 사용됩니다.
            </Typography.Text>
          )}
          <div style={{ marginTop: 8 }}>
            <Button onClick={() => fileRef.current?.click()}>
              {thumbFile ? '다른 이미지 선택' : '이미지 선택'}
            </Button>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickThumb} />
          </div>
        </div>
      </Space>
    </Drawer>
  );
}
