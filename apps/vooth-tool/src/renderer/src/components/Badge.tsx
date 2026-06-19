interface BadgeProps {
  label: string
  color: string
  background: string
}

/** 상태/라벨 pill 배지. */
export function Badge({ label, color, background }: BadgeProps): React.JSX.Element {
  return (
    <span className="tool-badge" style={{ color, background }}>
      {label}
    </span>
  )
}
