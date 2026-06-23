import { useEffect, useMemo, useRef, useState } from 'react';
import { App as AntApp, Button, Drawer, Input, Select, Space, Tag, Typography } from 'antd';
import type { CropBox } from '@vooth/shared';
import { ContentStatus, CONTENT_STATUS_LABEL } from '@vooth/shared';
import { useTags } from '../tags/useTags';
import { ThumbnailCropper } from './ThumbnailCropper';
import { ContentThumb } from './ContentThumb';
import type { AdminContent, ContentTagRef } from '../../api/content.api';

export interface ContentFormPayload {
  title: string;
  description: string;
  tagIds: number[];
  /** 선택한 태그(표시용) */
  tags: ContentTagRef[];
  /** 신규 썸네일 파일(없으면 미변경) */
  thumbnailFile: File | null;
  /** 썸네일 크롭(파일이 있을 때만) */
  cropBox: CropBox | null;
}

interface ContentFormDrawerProps {
  open: boolean;
  /** null = 신규 등록, AdminContent = 수정 */
  target: AdminContent | null;
  /** 제출 진행 중(업로드/생성). 부모가 제어 */
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (payload: ContentFormPayload) => void;
}

export function ContentFormDrawer({
  open,
  target,
  submitting = false,
  onClose,
  onSubmit,
}: ContentFormDrawerProps) {
  const { message } = AntApp.useApp();
  const isEdit = target !== null;

  const { data: tagData } = useTags({ page: 1, limit: 100 });
  const tagOptions = (tagData?.items ?? []).map((t) => ({ value: t.id, label: t.name }));
  const tagColorById = useMemo(() => {
    const map = new Map<number, string>();
    (tagData?.items ?? []).forEach((t) => map.set(t.id, t.color));
    return map;
  }, [tagData]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tagIds, setTagIds] = useState<number[]>([]);
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [cropBox, setCropBox] = useState<CropBox | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setTitle(target?.title ?? '');
    setDescription(target?.description ?? '');
    setTagIds(target?.tags.map((t) => t.id) ?? []);
    setThumbFile(null);
    setCropBox(null);
  }, [open, target]);

  const pickThumb = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setThumbFile(file);
    setCropBox(null);
  };

  const submit = () => {
    if (!title.trim()) {
      message.warning('제목을 입력해주세요.');
      return;
    }
    if (!isEdit && !thumbFile) {
      message.warning('썸네일 이미지를 선택해주세요.');
      return;
    }
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      tagIds,
      tags: (tagData?.items ?? [])
        .filter((t) => tagIds.includes(t.id))
        .map((t) => ({ id: t.id, name: t.name, color: t.color })),
      thumbnailFile: thumbFile,
      cropBox,
    });
  };

  return (
    <Drawer
      title={isEdit ? '작품 수정' : '작품 등록'}
      open={open}
      onClose={onClose}
      maskClosable={false}
      width={520}
      extra={
        <Space>
          <Button onClick={onClose} disabled={submitting}>
            취소
          </Button>
          <Button type="primary" onClick={submit} loading={submitting}>
            {isEdit ? '수정' : '등록'}
          </Button>
        </Space>
      }
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 썸네일 + 크롭 */}
        <div>
          <span className="form-label">썸네일 (3:4)</span>
          {thumbFile ? (
            <ThumbnailCropper file={thumbFile} onChange={setCropBox} />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <ContentThumb
                url={target?.thumbnailUrl ?? null}
                crop={target?.thumbnailCropBox}
                title={title || '?'}
                width={108}
                height={144}
              />
              {isEdit && (
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  현재 썸네일 유지. 변경하려면 이미지를 선택하세요.
                </Typography.Text>
              )}
            </div>
          )}
          <div style={{ marginTop: 8 }}>
            <Button onClick={() => fileRef.current?.click()}>
              {thumbFile ? '다른 이미지 선택' : '이미지 선택'}
            </Button>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickThumb} />
          </div>
        </div>

        <div>
          <span className="form-label">제목</span>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="작품 제목"
            maxLength={50}
          />
        </div>

        <div>
          <span className="form-label">소개</span>
          <Input.TextArea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="작품 소개"
            rows={4}
            maxLength={300}
            showCount
          />
        </div>

        <div>
          <span className="form-label">태그</span>
          <Select
            mode="multiple"
            allowClear
            style={{ width: '100%' }}
            placeholder="태그 선택"
            value={tagIds}
            onChange={setTagIds}
            options={tagOptions}
            optionFilterProp="label"
            optionRender={(option) => (
              <Space size={8}>
                <span
                  style={{
                    display: 'inline-block',
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: tagColorById.get(option.value as number),
                    flex: 'none',
                  }}
                />
                {option.label}
              </Space>
            )}
            tagRender={({ label, value, closable, onClose }) => (
              <Tag
                color={tagColorById.get(value as number)}
                closable={closable}
                onClose={onClose}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                style={{ marginInlineEnd: 4 }}
              >
                {label}
              </Tag>
            )}
          />
        </div>

        {!isEdit && (
          <Typography.Text type="secondary">
            신규 작품은 <strong>{CONTENT_STATUS_LABEL[ContentStatus.DRAFT]}</strong> 상태로
            등록됩니다.
          </Typography.Text>
        )}
      </Space>
    </Drawer>
  );
}
