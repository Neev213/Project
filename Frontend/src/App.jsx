import { Navigate, Route, Routes } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { SceneProvider } from './context/SceneContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import CanvasRoot from './three/CanvasRoot'
import FlashOverlay from './components/FlashOverlay'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'

function Protected({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || 'not-set'}>
      <SceneProvider>
        <AuthProvider>
          <CanvasRoot />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/dashboard"
              element={
                <Protected>
                  <Dashboard />
                </Protected>
              }
            />
          </Routes>
          <FlashOverlay />
        </AuthProvider>
      </SceneProvider>
    </GoogleOAuthProvider>
  )
}