/**
 * 파형(peaks) 계산 유틸.
 * - 실제 녹음(blob): Web Audio 로 디코딩해 실제 진폭 peaks 를 뽑는다(캐시).
 * - mock(오디오 없음): lineId 로 결정적(deterministic) 합성 파형을 만든다(샘플 표시용).
 */

let sharedCtx: AudioContext | null = null
function getCtx(): AudioContext {
  if (!sharedCtx) sharedCtx = new AudioContext()
  return sharedCtx
}

const peakCache = new Map<string, number[]>()

/** lineId(또는 seed) 기반 결정적 합성 파형(0.18~1.0). 실제 오디오가 없을 때 사용. */
export function synthPeaks(seed: string, count = 56): number[] {
  let h = 2166136261 >>> 0
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619) >>> 0
  }
  const out: number[] = []
  for (let i = 0; i < count; i += 1) {
    h = (Math.imul(h, 1664525) + 1013904223) >>> 0
    const r = (h % 1000) / 1000
    // 가운데가 더 큰 봉투(envelope)로 말소리처럼 보이게.
    const env = Math.sin((i / Math.max(1, count - 1)) * Math.PI)
    out.push(0.18 + r * 0.82 * (0.4 + 0.6 * env))
  }
  return out
}

/** blob 오디오를 디코딩해 0~1 정규화된 peaks 반환(실패 시 합성 파형). */
export async function decodePeaks(url: string, count = 56): Promise<number[]> {
  const cached = peakCache.get(url)
  if (cached) return cached
  const arrayBuffer = await fetch(url).then((r) => r.arrayBuffer())
  const audio = await getCtx().decodeAudioData(arrayBuffer)
  const ch = audio.getChannelData(0)
  const block = Math.max(1, Math.floor(ch.length / count))
  const raw: number[] = []
  let max = 0.0001
  for (let i = 0; i < count; i += 1) {
    let peak = 0
    for (let j = 0; j < block; j += 1) {
      const v = Math.abs(ch[i * block + j] || 0)
      if (v > peak) peak = v
    }
    raw.push(peak)
    if (peak > max) max = peak
  }
  const norm = raw.map((v) => Math.min(1, v / max))
  peakCache.set(url, norm)
  return norm
}
