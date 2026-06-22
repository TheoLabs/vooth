import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import {
  App as AntApp,
  Button,
  DatePicker,
  Input,
  InputNumber,
  Space,
  Switch,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import type { CropBox } from '@vooth/shared';
import { ThumbnailCropper } from './ThumbnailCropper';
import { ContentThumb } from './ContentThumb';
import type { AdminEpisode } from '../../api/episode.api';

export interface EpisodeFormPayload {
  title: string;
  /** 신규 등록 시에만 사용(수정 시 회차 번호는 변경 불가) */
  chapter: number;
  thumbnailFile: File | null;
  cropBox: CropBox | null;
  /** 수정 시 사용 */
  isFree: boolean;
  /** 수정 시 사용. 'YYYY-MM-DD' 또는 null */
  expectedPublishOn: string | null;
}

export interface EpisodeFormHandle {
  /** 유효성 검증 후 페이로드 반환. 유효하지 않으면 null. */
  getPayload: () => EpisodeFormPayload | null;
}

interface EpisodeFormFieldsProps {
  /** null = 신규, AdminEpisode = 수정(프리필) */
  target?: AdminEpisode | null;
  /** 신규 등록 시 기본 회차 번호 제안값 */
  defaultChapter?: number;
}

/**
 * 회차 생성/수정 공용 폼 필드. 마운트 시 target 기준으로 초기화하므로,
 * 폼을 새로 열 때마다 remount(조건부 렌더)한다.
 */
export const EpisodeFormFields = forwardRef<EpisodeFormHandle, EpisodeFormFieldsProps>(
  function EpisodeFormFields({ target = null, defaultChapter = 1 }, ref) {
    const { message } = AntApp.useApp();
    const isEdit = target !== null;

    const [title, setTitle] = useState(target?.title ?? '');
    const [chapter, setChapter] = useState<number>(target?.chapter ?? defaultChapter);
    const [thumbFile, setThumbFile] = useState<File | null>(null);
    const [cropBox, setCropBox] = useState<CropBox | null>(null);
    const [isFree, setIsFree] = useState(target?.isFree ?? false);
    const [expectedPublishOn, setExpectedPublishOn] = useState<string | null>(
      target?.expectedPublishOn ?? null,
    );
    const fileRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => ({
      getPayload: () => {
        if (!title.trim()) {
          message.warning('회차 제목을 입력해주세요.');
          return null;
        }
        if (!isEdit && (!Number.isInteger(chapter) || chapter < 1)) {
          message.warning('회차 번호를 올바르게 입력해주세요.');
          return null;
        }
        return {
          title: title.trim(),
          chapter,
          thumbnailFile: thumbFile,
          cropBox,
          isFree,
          expectedPublishOn,
        };
      },
    }));

    const pickThumb = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setThumbFile(file);
        setCropBox(null);
      }
      e.target.value = '';
    };

    return (
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <span className="form-label">회차 번호</span>
          {isEdit ? (
            <div>
              <Typography.Text strong>{chapter}화</Typography.Text>
              <Typography.Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                회차 번호는 수정할 수 없습니다.
              </Typography.Text>
            </div>
          ) : (
            <InputNumber
              min={1}
              value={chapter}
              onChange={(v) => setChapter(typeof v === 'number' ? v : 1)}
              style={{ width: 160 }}
            />
          )}
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

        {isEdit && (
          <>
            <div>
              <span className="form-label">무료 공개</span>
              <div>
                <Switch
                  checked={isFree}
                  onChange={setIsFree}
                  checkedChildren="무료"
                  unCheckedChildren="유료"
                />
              </div>
            </div>

            <div>
              <span className="form-label">발행 예정일</span>
              <div>
                <DatePicker
                  value={expectedPublishOn ? dayjs(expectedPublishOn) : null}
                  onChange={(d) => setExpectedPublishOn(d ? d.format('YYYY-MM-DD') : null)}
                  style={{ width: 200 }}
                  placeholder="발행 예정일 선택"
                />
              </div>
            </div>
          </>
        )}

        <div>
          <span className="form-label">썸네일 (3:4, 선택)</span>
          {thumbFile ? (
            <ThumbnailCropper file={thumbFile} onChange={setCropBox} />
          ) : isEdit && target?.thumbnailUrl ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <ContentThumb
                url={target.thumbnailUrl}
                crop={target.thumbnailCropBox ?? undefined}
                title={title || '?'}
                width={108}
                height={144}
              />
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                현재 썸네일 유지. 변경하려면 이미지를 선택하세요.
              </Typography.Text>
            </div>
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
    );
  },
);
