import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './layouts/AppLayout'
import { ProtectedRoute } from './routes/ProtectedRoute'
import { ApprovalGate } from './routes/ApprovalGate'
import { LoginPage } from './features/auth/LoginPage'
import { HomePage } from './pages/HomePage'
import { EpisodeListPage } from './pages/EpisodeListPage'
import { EpisodeEditorPage } from './pages/EpisodeEditorPage'
import { AnchorContentListPage } from './pages/AnchorContentListPage'
import { AnchorContentDetailPage } from './pages/AnchorContentDetailPage'
import { EpisodeAnchorPage } from './pages/EpisodeAnchorPage'
import { EpisodeAdoptPage } from './pages/EpisodeAdoptPage'
import { EpisodePreviewPage } from './pages/EpisodePreviewPage'
import { RenderPage } from './pages/RenderPage'

function App(): React.JSX.Element {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<ApprovalGate />}>
          <Route element={<AppLayout />}>
            <Route index element={<HomePage />} />
            <Route path="anchors" element={<AnchorContentListPage />} />
            <Route path="anchors/contents/:contentId" element={<AnchorContentDetailPage />} />
            <Route
              path="anchors/contents/:contentId/episodes/:episodeId"
              element={<EpisodeAnchorPage />}
            />
            <Route path="episodes" element={<EpisodeListPage />} />
            <Route path="episodes/:episodeId" element={<EpisodeEditorPage />} />
            <Route path="episodes/:episodeId/adopt" element={<EpisodeAdoptPage />} />
            <Route path="episodes/:episodeId/preview" element={<EpisodePreviewPage />} />
            <Route path="episodes/:episodeId/render" element={<RenderPage />} />
            <Route path="render" element={<RenderPage />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
