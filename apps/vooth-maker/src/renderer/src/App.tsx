import { Navigate, Route, Routes } from 'react-router-dom'
import { LoginPage } from './features/auth/LoginPage'
import { AppLayout } from './layouts/AppLayout'
import { HomePage } from './pages/HomePage'
import { WorkListPage } from './pages/WorkListPage'
import { ContentDetailPage } from './pages/ContentDetailPage'
import { RecordingPage } from './pages/RecordingPage'
import { ReviewsPage } from './pages/ReviewsPage'
import { SettingsPage } from './features/profile/SettingsPage'
import { ProtectedRoute } from './routes/ProtectedRoute'
import { ApprovalGate } from './routes/ApprovalGate'

function App(): React.JSX.Element {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<ApprovalGate />}>
          <Route element={<AppLayout />}>
            <Route index element={<HomePage />} />
            <Route path="works" element={<WorkListPage />} />
            <Route path="works/contents/:contentId" element={<ContentDetailPage />} />
            <Route
              path="works/contents/:contentId/episodes/:episodeId"
              element={<RecordingPage />}
            />
            <Route path="reviews" element={<ReviewsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
