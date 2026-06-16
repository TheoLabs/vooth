import { Navigate, Route, Routes } from 'react-router-dom'
import { LoginPage } from './features/auth/LoginPage'
import { AppLayout } from './layouts/AppLayout'
import { HomePage } from './pages/HomePage'
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
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
