import { Routes, Route } from 'react-router-dom'
import { SceneProvider } from './context/SceneContext'
import CanvasRoot from './three/CanvasRoot'
import Landing from './pages/Landing'
import Login from './pages/Login'

export default function App() {
  return (
    <SceneProvider>
      <CanvasRoot />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </SceneProvider>
  )
}