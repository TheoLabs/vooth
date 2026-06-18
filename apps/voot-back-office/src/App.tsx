import type { ReactElement } from 'react';
import { Route, Routes } from 'react-router-dom';
import { LoginPage } from './features/auth/LoginPage';
import { PlaceholderPage } from './pages/PlaceholderPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { AppLayout } from './layouts/AppLayout';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { ApprovalGate } from './routes/ApprovalGate';
import { MENU_ROUTES } from './layouts/menu';
import { AccountsPage } from './features/accounts/AccountsPage';
import { RolesPage } from './features/roles/RolesPage';
import { PermissionsPage } from './features/permissions/PermissionsPage';
import { CreatorsPage } from './features/creators/CreatorsPage';
import { TagsPage } from './features/tags/TagsPage';
import { ContentsPage } from './features/contents/ContentsPage';
import { ContentDetailPage } from './features/contents/ContentDetailPage';
import { CutEditorPage } from './features/contents/CutEditorPage';

/** 실제 구현된 화면(나머지는 PlaceholderPage). */
const CUSTOM_PAGES: Record<string, ReactElement> = {
  '/accounts': <AccountsPage />,
  '/roles': <RolesPage />,
  '/permissions': <PermissionsPage />,
  '/creators': <CreatorsPage />,
  '/contents': <ContentsPage />,
  '/contents/tags': <TagsPage />,
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/404" element={<NotFoundPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<ApprovalGate />}>
          <Route element={<AppLayout />}>
            {/* 메뉴에 없는 동적 상세 라우트 */}
            <Route path="/contents/:id" element={<ContentDetailPage />} />
            <Route
              path="/contents/:contentId/episodes/:episodeId/cuts"
              element={<CutEditorPage />}
            />
            {MENU_ROUTES.map(({ path, label }) => {
              const element = CUSTOM_PAGES[path] ?? <PlaceholderPage title={label} />;
              return path === '/' ? (
                <Route key={path} index element={element} />
              ) : (
                <Route key={path} path={path} element={element} />
              );
            })}
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
