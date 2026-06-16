/** mock UI 재시작 시작점(placeholder). 화면은 여기서부터 다시 채운다. */
export function HomePage(): React.JSX.Element {
  return (
    <div style={{ padding: 28 }}>
      <h2 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 800, color: '#0f172a' }}>Vooth Tool</h2>
      <p style={{ margin: 0, color: '#64748b' }}>화면은 mock 기반으로 다시 시작합니다. (로그인/인증만 유지됨)</p>
    </div>
  )
}
