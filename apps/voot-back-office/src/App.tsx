import { Navigate, Route, Routes } from 'react-router-dom';
import { LoginPage } from './features/auth/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { AccountsPage } from './pages/AccountsPage';
import { RolesPage } from './pages/RolesPage';
import { PermissionsPage } from './pages/PermissionsPage';
import { ContentLayout } from './features/content/ContentStore';
import { WebtoonsPage } from './pages/content/WebtoonsPage';
import { WebtoonDetailPage } from './pages/content/WebtoonDetailPage';
import { EpisodeEditPage } from './pages/content/EpisodeEditPage';
import { AppLayout } from './layouts/AppLayout';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { ApprovalGate } from './routes/ApprovalGate';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<ApprovalGate />}>
          <Route element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="/accounts" element={<AccountsPage />} />
            <Route path="/roles" element={<RolesPage />} />
            <Route path="/permissions" element={<PermissionsPage />} />
            <Route path="/content" element={<ContentLayout />}>
              <Route index element={<Navigate to="/content/webtoons" replace />} />
              <Route path="webtoons" element={<WebtoonsPage />} />
              <Route path="webtoons/:id" element={<WebtoonDetailPage />} />
              <Route path="episodes/:id" element={<EpisodeEditPage />} />
            </Route>
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
