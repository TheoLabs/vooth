interface WaveformProps {
  bars: number[]
  color?: string
  height?: number
}

/** mock 파형 placeholder(amplitude 막대). 실제 오디오 파형은 추후 waveformKey 로 대체. */
export function Waveform({ bars, color = '#94a3b8', height = 28 }: WaveformProps): React.JSX.Element {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        height,
        flex: 1,
        minWidth: 80
      }}
      aria-hidden="true"
    >
      {bars.map((v, i) => (
        <span
          key={i}
          style={{
            display: 'block',
            flex: 1,
            height: `${Math.max(8, v * 100)}%`,
            background: color,
            borderRadius: 1
          }}
        />
      ))}
    </div>
  )
}
