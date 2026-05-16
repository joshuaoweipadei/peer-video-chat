import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Lobby from './pages/Lobby'
import Room  from './pages/Room'

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/lobby" replace />} />
        <Route path="/lobby" element={<Lobby />} />
        <Route path="/room/:roomId" element={<Room />} />
        <Route path="*" element={<Navigate to="/lobby" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
