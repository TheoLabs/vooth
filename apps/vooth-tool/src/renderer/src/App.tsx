import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './layouts/AppLayout'
import { ProtectedRoute } from './routes/ProtectedRoute'
import { ApprovalGate } from './routes/ApprovalGate'
import { LoginPage } from './features/auth/LoginPage'
import { HomePage } from './pages/HomePage'

function App(): React.JSX.Element {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<ApprovalGate />}>
          <Route element={<AppLayout />}>
            <Route index element={<HomePage />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
