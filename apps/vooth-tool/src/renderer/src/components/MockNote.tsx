/** "MOCK 데이터" 안내 배지. 모든 연출 화면 상단에 표시해 데이터 출처를 명확히 한다. */
export function MockNote({ text = 'MOCK 데이터 — directors/* API 미배선' }: { text?: string }): React.JSX.Element {
  return <span className="tool-mock-note">⚠ {text}</span>
}
