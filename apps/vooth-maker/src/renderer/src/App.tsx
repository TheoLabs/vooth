import { Navigate, Route, Routes } from 'react-router-dom'
import { LoginPage } from './features/auth/LoginPage'
import { AppLayout } from './layouts/AppLayout'
import { WorkListPage } from './pages/WorkListPage'
import { EpisodeViewerPage } from './pages/EpisodeViewerPage'
import { ProtectedRoute } from './routes/ProtectedRoute'
import { ApprovalGate } from './routes/ApprovalGate'

function App(): React.JSX.Element {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<ApprovalGate />}>
          <Route element={<AppLayout />}>
            <Route index element={<WorkListPage />} />
            <Route path="episodes/:id" element={<EpisodeViewerPage />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
