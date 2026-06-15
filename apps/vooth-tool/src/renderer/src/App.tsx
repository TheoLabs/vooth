import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './layouts/AppLayout'
import { ProtectedRoute } from './routes/ProtectedRoute'
import { ApprovalGate } from './routes/ApprovalGate'
import { LoginPage } from './features/auth/LoginPage'
import { ToolHomePage } from './pages/ToolHomePage'
import { DirectionEditorPage } from './pages/DirectionEditorPage'
import { ReviewListPage } from './pages/ReviewListPage'
import { ReviewContentPage } from './pages/ReviewContentPage'
import { ReviewPage } from './pages/ReviewPage'
import { RenderListPage } from './pages/RenderListPage'
import { RenderPage } from './pages/RenderPage'

// directors API 는 admin(DirectorGuard) 기반 → 로그인(토큰) + 승인(역할) 게이트가 필요하다.
// ProtectedRoute: 토큰 유무로 /login 리다이렉트. ApprovalGate: /directors/me 결과로 승인 통제.
function App(): React.JSX.Element {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<ApprovalGate />}>
          <Route element={<AppLayout />}>
            <Route index element={<ToolHomePage />} />
            <Route path="episodes/:id" element={<DirectionEditorPage />} />
            <Route path="review" element={<ReviewListPage />} />
            <Route path="review/contents/:contentId" element={<ReviewContentPage />} />
            <Route path="review/episodes/:id" element={<ReviewPage />} />
            <Route path="render" element={<RenderListPage />} />
            <Route path="render/:id" element={<RenderPage />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
