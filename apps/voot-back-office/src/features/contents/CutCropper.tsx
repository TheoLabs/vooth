import { useEffect, useRef, useState } from 'react';
import type { CropBox } from '@vooth/shared';

const MIN = 0.05;
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

type Corner = 'nw' | 'ne' | 'sw' | 'se';

type Drag =
  | { kind: 'move'; offX: number; offY: number; w: number; h: number }
  | { kind: 'resize'; fx: number; fy: number };

interface CutCropperProps {
  src: string;
  value: CropBox;
  onChange: (box: CropBox) => void;
}

/**
 * 컷 이미지 위에서 초점 영역(cropBox, 정규화 0~1)을 드래그/리사이즈로 지정한다.
 * 비율 고정 없음(컷은 임의 비율) — 영역 자체를 선택하는 방식.
 */
export function CutCropper({ src, value, onChange }: CutCropperProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<Drag | null>(null);

  useEffect(() => {
    if (!drag) return;
    const onMove = (e: PointerEvent) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const px = clamp01((e.clientX - rect.left) / rect.width);
      const py = clamp01((e.clientY - rect.top) / rect.height);
      if (drag.kind === 'move') {
        const x = Math.min(clamp01(px - drag.offX), 1 - drag.w);
        const y = Math.min(clamp01(py - drag.offY), 1 - drag.h);
        onChange({ x: Math.max(0, x), y: Math.max(0, y), w: drag.w, h: drag.h });
      } else {
        const x = Math.min(drag.fx, px);
        const y = Math.min(drag.fy, py);
        const w = Math.max(MIN, Math.abs(px - drag.fx));
        const h = Math.max(MIN, Math.abs(py - drag.fy));
        onChange({ x, y, w: Math.min(w, 1 - x), h: Math.min(h, 1 - y) });
      }
    };
    const onUp = () => setDrag(null);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [drag, onChange]);

  const startMove = (e: React.PointerEvent) => {
    e.preventDefault();
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    setDrag({ kind: 'move', offX: px - value.x, offY: py - value.y, w: value.w, h: value.h });
  };

  /** 리사이즈: 반대편 코너를 고정점으로. */
  const startResize = (corner: Corner) => (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const fx = corner === 'nw' || corner === 'sw' ? value.x + value.w : value.x;
    const fy = corner === 'nw' || corner === 'ne' ? value.y + value.h : value.y;
    setDrag({ kind: 'resize', fx, fy });
  };

  const pct = (n: number) => `${n * 100}%`;
  const handle = (corner: Corner, style: React.CSSProperties) => (
    <span
      onPointerDown={startResize(corner)}
      style={{
        position: 'absolute',
        width: 12,
        height: 12,
        background: '#fff',
        border: '2px solid #6366f1',
        borderRadius: 2,
        touchAction: 'none',
        ...style,
      }}
    />
  );

  return (
    <div
      ref={ref}
      style={{
        position: 'relative',
        width: '100%',
        userSelect: 'none',
        lineHeight: 0,
        background: '#0f172a',
        borderRadius: 8,
        overflow: 'hidden',
      }}
    >
      <img
        src={src}
        alt="컷 미리보기"
        style={{ width: '100%', display: 'block', maxHeight: '60vh', objectFit: 'contain' }}
        draggable={false}
      />

      {/* 선택 영역 (box-shadow 로 바깥 디밍) */}
      <div
        onPointerDown={startMove}
        style={{
          position: 'absolute',
          left: pct(value.x),
          top: pct(value.y),
          width: pct(value.w),
          height: pct(value.h),
          border: '2px solid #6366f1',
          boxShadow: '0 0 0 9999px rgba(15,23,42,0.5)',
          cursor: 'move',
          touchAction: 'none',
        }}
      >
        {handle('nw', { left: -7, top: -7, cursor: 'nwse-resize' })}
        {handle('ne', { right: -7, top: -7, cursor: 'nesw-resize' })}
        {handle('sw', { left: -7, bottom: -7, cursor: 'nesw-resize' })}
        {handle('se', { right: -7, bottom: -7, cursor: 'nwse-resize' })}
      </div>
    </div>
  );
}
