import { Navigate, Route, Routes } from 'react-router-dom'
import { LoginPage } from './features/auth/LoginPage'
import { AppLayout } from './layouts/AppLayout'
import { WorkListPage } from './pages/WorkListPage'
import { WebtoonListPage } from './pages/WebtoonListPage'
import { EpisodeListPage } from './pages/EpisodeListPage'
import { EpisodeViewerPage } from './pages/EpisodeViewerPage'
import { ReviewLayout } from './features/review/ReviewContext'
import { ReviewWebtoonsPage } from './pages/ReviewWebtoonsPage'
import { ReviewEpisodesPage } from './pages/ReviewEpisodesPage'
import { ReviewEpisodePage } from './pages/ReviewEpisodePage'
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
            <Route path="webtoons" element={<WebtoonListPage />} />
            <Route path="webtoons/:id" element={<EpisodeListPage />} />
            <Route path="review" element={<ReviewLayout />}>
              <Route index element={<ReviewWebtoonsPage />} />
              <Route path="webtoons/:id" element={<ReviewEpisodesPage />} />
              <Route path="episodes/:id" element={<ReviewEpisodePage />} />
            </Route>
            <Route path="episodes/:id" element={<EpisodeViewerPage />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
