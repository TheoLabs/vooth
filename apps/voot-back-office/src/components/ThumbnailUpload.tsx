import { Button, Image, Space, Upload, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import ImgCrop from 'antd-img-crop';
import { useFileUpload } from '../features/files/useFileUpload';

interface ThumbnailUploadProps {
  /** 폼 컨트롤 값(publicUrl). AntD Form.Item 이 주입한다. */
  value?: string;
  onChange?: (url: string) => void;
}

/**
 * 썸네일 업로드 폼 컨트롤.
 * 파일 선택 → presign → S3 직접 업로드 → commit(useFileUpload) → publicUrl 을 value 로 세팅.
 * `<Form.Item name="thumbnailImageUrl"><ThumbnailUpload /></Form.Item>` 형태로 쓴다.
 */
export function ThumbnailUpload({ value, onChange }: ThumbnailUploadProps) {
  const upload = useFileUpload();

  const customRequest: UploadProps['customRequest'] = ({ file, onSuccess, onError }) => {
    upload.mutate(file as File, {
      onSuccess: ({ publicUrl }) => {
        onChange?.(publicUrl);
        onSuccess?.({});
      },
      onError: (error) => {
        message.error(error.message);
        onError?.(error);
      },
    });
  };

  return (
    <Space direction="vertical">
      {value && (
        <Image
          src={value}
          width={160}
          height={100}
          style={{ objectFit: 'cover', borderRadius: 8, background: '#f0f0f0' }}
        />
      )}
      {/* 선택한 이미지를 16:10 으로 크롭한 뒤 업로드한다. */}
      <ImgCrop aspect={16 / 10} quality={0.9} modalTitle="썸네일 자르기 (16:10)" showGrid rotationSlider>
        <Upload accept="image/*" maxCount={1} showUploadList={false} customRequest={customRequest}>
          <Button icon={<UploadOutlined />} loading={upload.isPending}>
            {value ? '이미지 변경' : '이미지 업로드'}
          </Button>
        </Upload>
      </ImgCrop>
    </Space>
  );
}
