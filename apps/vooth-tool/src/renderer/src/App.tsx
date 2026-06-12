import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './layouts/AppLayout'
import { ToolHomePage } from './pages/ToolHomePage'
import { DirectionEditorPage } from './pages/DirectionEditorPage'

// 인증 없이 사용(임시). 로그인/승인 게이트 제거 — directors API 는 공개 엔드포인트.
function App(): React.JSX.Element {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<ToolHomePage />} />
        <Route path="episodes/:id" element={<DirectionEditorPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
