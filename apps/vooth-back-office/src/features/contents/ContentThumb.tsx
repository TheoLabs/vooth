import type { CropBox } from '@vooth/shared';
import { thumbGradient } from './content.types';

interface ContentThumbProps {
  url: string | null;
  crop?: CropBox;
  title: string;
  width: number;
  height: number;
}

/**
 * 작품 썸네일. thumbnailUrl + cropBox(0~1) 로 크롭 영역만 보여준다.
 * URL 이 없으면 제목 기반 그라데이션 플레이스홀더.
 */
export function ContentThumb({ url, crop, title, width, height }: ContentThumbProps) {
  const radius = Math.max(6, Math.round(width * 0.08));

  if (!url) {
    return (
      <div
        style={{
          width,
          height,
          borderRadius: radius,
          background: thumbGradient(title),
          flex: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontWeight: 800,
          fontSize: width * 0.42,
        }}
      >
        {title.slice(0, 1)}
      </div>
    );
  }

  const c = crop ?? { x: 0, y: 0, w: 1, h: 1 };
  const sizeX = 100 / (c.w || 1);
  const sizeY = 100 / (c.h || 1);
  const posX = c.w < 1 ? (c.x / (1 - c.w)) * 100 : 0;
  const posY = c.h < 1 ? (c.y / (1 - c.h)) * 100 : 0;

  return (
    <div
      style={{
        width,
        height,
        borderRadius: radius,
        flex: 'none',
        backgroundColor: '#0f172a',
        backgroundImage: `url(${url})`,
        backgroundSize: `${sizeX}% ${sizeY}%`,
        backgroundPosition: `${posX}% ${posY}%`,
        backgroundRepeat: 'no-repeat',
      }}
    />
  );
}
