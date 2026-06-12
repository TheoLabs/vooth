import { useCallback, useState } from 'react';
import { Button, Modal, Slider, Space, Typography, message } from 'antd';
import { UploadOutlined, ExpandOutlined } from '@ant-design/icons';
import { Upload } from 'antd';
import type { UploadProps } from 'antd';
import Cropper, { type Area, type MediaSize, type Point } from 'react-easy-crop';
import { useFileUpload } from '../features/files/useFileUpload';
import { CropFrame } from './CropFrame';
import { defaultCropBox, FRAME_RATIO, type CropBox } from '../lib/cropBox';

/** 컷/콘텐츠 이미지 값: 원본 1장 + 크기 + 16:10 크롭 박스(저장 모델 B). */
export interface CropImageValue {
  imageUrl: string;
  imageWidth?: number;
  imageHeight?: number;
  /** 미지정(레거시/미설정)이면 표시 측에서 cover 폴백. */
  cropBox?: CropBox;
}

interface CropImageFieldProps {
  value?: CropImageValue | null;
  onChange?: (value: CropImageValue) => void;
  /** 표시 프레임 가로폭(px). */
  width?: number;
}

/** 원본의 자연 크기를 읽는다(업로드 직후 기본 크롭 박스 계산용). */
function readNaturalSize(url: string): Promise<{ w: number; h: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => resolve({ w: 0, h: 0 });
    img.src = url;
  });
}

/**
 * 이미지 필드(저장 모델 B).
 * - 업로드는 **원본 그대로**(크롭 파일을 따로 만들지 않음).
 * - "16:10 영역 지정"으로 정규화 크롭 박스만 캡처한다(react-easy-crop 의 percent area).
 * - 표시는 CropFrame 이 원본+박스를 CSS 로 16:10 으로 그린다.
 */
export function CropImageField({ value, onChange, width = 200 }: CropImageFieldProps) {
  const upload = useFileUpload();
  const [editorOpen, setEditorOpen] = useState(false);

  // 에디터 로컬 상태
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [areaPct, setAreaPct] = useState<Area | null>(null);
  const [mediaSize, setMediaSize] = useState<MediaSize | null>(null);

  const customRequest: UploadProps['customRequest'] = ({ file, onSuccess, onError }) => {
    upload.mutate(file as File, {
      onSuccess: async ({ publicUrl }) => {
        const { w, h } = await readNaturalSize(publicUrl);
        onChange?.({
          imageUrl: publicUrl,
          imageWidth: w,
          imageHeight: h,
          cropBox: defaultCropBox(w, h),
        });
        onSuccess?.({});
      },
      onError: (error) => {
        message.error(error.message);
        onError?.(error);
      },
    });
  };

  const openEditor = useCallback(() => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setAreaPct(null);
    setEditorOpen(true);
  }, []);

  const onCropComplete = useCallback((_: Area, areaPercent: Area) => {
    setAreaPct(areaPercent);
  }, []);

  const applyCrop = useCallback(() => {
    if (!value || !areaPct) {
      setEditorOpen(false);
      return;
    }
    const cropBox: CropBox = {
      x: areaPct.x / 100,
      y: areaPct.y / 100,
      w: areaPct.width / 100,
      h: areaPct.height / 100,
    };
    const w = mediaSize?.naturalWidth || value.imageWidth;
    const h = mediaSize?.naturalHeight || value.imageHeight;
    onChange?.({ ...value, imageWidth: w, imageHeight: h, cropBox });
    setEditorOpen(false);
  }, [value, areaPct, mediaSize, onChange]);

  return (
    <Space direction="vertical" size="small">
      {value?.imageUrl && <CropFrame src={value.imageUrl} cropBox={value.cropBox} width={width} />}

      <Space>
        <Upload accept="image/*" maxCount={1} showUploadList={false} customRequest={customRequest}>
          <Button icon={<UploadOutlined />} loading={upload.isPending}>
            {value?.imageUrl ? '원본 변경' : '이미지 업로드'}
          </Button>
        </Upload>
        {value?.imageUrl && (
          <Button icon={<ExpandOutlined />} onClick={openEditor}>
            16:10 영역 지정
          </Button>
        )}
      </Space>

      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        원본을 그대로 저장하고 16:10 은 영역(박스)만 지정합니다. 표시는 박스로 잘라 보여줍니다.
      </Typography.Text>

      <Modal
        title="16:10 표시 영역 지정"
        open={editorOpen}
        onOk={applyCrop}
        onCancel={() => setEditorOpen(false)}
        okText="적용"
        cancelText="취소"
        maskClosable={false}
        width={640}
      >
        <div style={{ position: 'relative', height: 360, background: '#1f1f1f' }}>
          {value?.imageUrl && (
            <Cropper
              image={value.imageUrl}
              crop={crop}
              zoom={zoom}
              aspect={FRAME_RATIO}
              restrictPosition
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              onMediaLoaded={setMediaSize}
            />
          )}
        </div>
        <div style={{ marginTop: 12 }}>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            확대
          </Typography.Text>
          <Slider min={1} max={3} step={0.01} value={zoom} onChange={setZoom} />
        </div>
      </Modal>
    </Space>
  );
}
