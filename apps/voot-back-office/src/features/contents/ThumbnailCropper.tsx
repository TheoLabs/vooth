import { useEffect, useRef, useState } from 'react';
import { Slider, Typography } from 'antd';
import type { CropBox } from '@vooth/shared';

const FRAME_W = 216;
const FRAME_H = 288; // 3:4 세로형

interface ThumbnailCropperProps {
  file: File;
  onChange: (crop: CropBox) => void;
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/**
 * 썸네일 크롭(드래그 이동 + 줌). cover 모델로 3:4 프레임을 채우고,
 * 보이는 영역을 정규화 CropBox(0~1)로 변환해 onChange 로 전달한다.
 */
export function ThumbnailCropper({ file, onChange }: ThumbnailCropperProps) {
  const [url, setUrl] = useState('');
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const drag = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // 파일 → objectURL + 원본 크기
  useEffect(() => {
    const u = URL.createObjectURL(file);
    setUrl(u);
    const img = new Image();
    img.onload = () => setDims({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = u;
    return () => URL.revokeObjectURL(u);
  }, [file]);

  const cover = dims ? Math.max(FRAME_W / dims.w, FRAME_H / dims.h) : 1;
  const dispSize = (z: number) => {
    if (!dims) return { dW: 0, dH: 0 };
    const s = cover * z;
    return { dW: dims.w * s, dH: dims.h * s };
  };
  const clampOffset = (o: { x: number; y: number }, dW: number, dH: number) => ({
    x: Math.min(0, Math.max(FRAME_W - dW, o.x)),
    y: Math.min(0, Math.max(FRAME_H - dH, o.y)),
  });

  // 원본 로드 시 중앙 정렬
  useEffect(() => {
    if (!dims) return;
    const s = Math.max(FRAME_W / dims.w, FRAME_H / dims.h);
    const dW = dims.w * s;
    const dH = dims.h * s;
    setZoom(1);
    setOffset({ x: (FRAME_W - dW) / 2, y: (FRAME_H - dH) / 2 });
  }, [dims]);

  // 크롭 산출 → 부모로 전달 (onChange 는 ref 로 안정화)
  useEffect(() => {
    if (!dims) return;
    const { dW, dH } = dispSize(zoom);
    if (!dW || !dH) return;
    const x = clamp01(-offset.x / dW);
    const y = clamp01(-offset.y / dH);
    const w = clamp01(FRAME_W / dW);
    const h = clamp01(FRAME_H / dH);
    onChangeRef.current({ x, y, w: Math.min(w, 1 - x), h: Math.min(h, 1 - y) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dims, zoom, offset]);

  const handleZoom = (z: number) => {
    const old = dispSize(zoom);
    const next = dispSize(z);
    // 프레임 중심을 기준으로 확대/축소
    const cx = old.dW ? (FRAME_W / 2 - offset.x) / old.dW : 0.5;
    const cy = old.dH ? (FRAME_H / 2 - offset.y) / old.dH : 0.5;
    const nx = FRAME_W / 2 - cx * next.dW;
    const ny = FRAME_H / 2 - cy * next.dH;
    setZoom(z);
    setOffset(clampOffset({ x: nx, y: ny }, next.dW, next.dH));
  };

  const onPointerDown = (e: React.PointerEvent) => {
    drag.current = { sx: e.clientX, sy: e.clientY, ox: offset.x, oy: offset.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const { dW, dH } = dispSize(zoom);
    setOffset(
      clampOffset(
        {
          x: drag.current.ox + (e.clientX - drag.current.sx),
          y: drag.current.oy + (e.clientY - drag.current.sy),
        },
        dW,
        dH,
      ),
    );
  };
  const onPointerUp = () => {
    drag.current = null;
  };

  const { dW, dH } = dispSize(zoom);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{
          position: 'relative',
          width: FRAME_W,
          height: FRAME_H,
          borderRadius: 10,
          overflow: 'hidden',
          background: '#0f172a',
          cursor: 'grab',
          touchAction: 'none',
          userSelect: 'none',
        }}
      >
        {url && dims && (
          <img
            src={url}
            alt="썸네일 크롭"
            draggable={false}
            style={{
              position: 'absolute',
              left: offset.x,
              top: offset.y,
              width: dW,
              height: dH,
              maxWidth: 'none',
              pointerEvents: 'none',
            }}
          />
        )}
        {/* 격자 가이드 */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.4)',
            pointerEvents: 'none',
          }}
        />
      </div>

      <div style={{ width: FRAME_W }}>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          드래그로 위치 조정 · 슬라이더로 확대
        </Typography.Text>
        <Slider min={1} max={3} step={0.01} value={zoom} onChange={handleZoom} />
      </div>
    </div>
  );
}
