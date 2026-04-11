import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GmView } from './pages/GmView';
import { PlayerJoin } from './pages/PlayerJoin';
import { PlayerView } from './pages/PlayerView';
import { SoundboardJoin } from './pages/SoundboardJoin';
import { SoundboardRemote } from './pages/SoundboardRemote';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<GmView />} />
        <Route path="/join" element={<PlayerJoin />} />
        <Route path="/player/:roomId/:playerName" element={<PlayerView />} />
        <Route path="/soundboard" element={<SoundboardJoin />} />
        <Route path="/soundboard/:roomId/:passcode" element={<SoundboardRemote />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;