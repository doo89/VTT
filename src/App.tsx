import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GmView } from './pages/GmView';
import { PlayerJoin } from './pages/PlayerJoin';
import { PlayerView } from './pages/PlayerView';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<GmView />} />
        <Route path="/join" element={<PlayerJoin />} />
        <Route path="/player/:roomId/:playerName" element={<PlayerView />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;