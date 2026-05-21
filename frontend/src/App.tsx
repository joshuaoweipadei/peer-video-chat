import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Lobby from '@/screens/Lobby';
import Room from '@/screens/Room';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Lobby />} />
        <Route path="/room/:roomId" element={<Room />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
