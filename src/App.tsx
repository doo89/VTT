import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import React, { Suspense, lazy } from 'react';
import { CustomPopupOverlay } from './components/CustomPopupOverlay';
import { SkeletonGMView, SkeletonPlayerView } from './components/Skeletons';

// Helper to convert named exports to default exports for lazy loading
function lazyWithNamed(importFunc: () => Promise<any>, exportName: string) {
  return () => importFunc().then(module => ({ default: module[exportName] }));
}

// Lazy load pages for code splitting
const GmView = lazy(lazyWithNamed(() => import('./pages/GmView'), 'GmView'));
const PlayerJoin = lazy(lazyWithNamed(() => import('./pages/PlayerJoin'), 'PlayerJoin'));
const PlayerView = lazy(lazyWithNamed(() => import('./pages/PlayerView'), 'PlayerView'));
const SoundboardJoin = lazy(lazyWithNamed(() => import('./pages/SoundboardJoin'), 'SoundboardJoin'));
const SoundboardRemote = lazy(lazyWithNamed(() => import('./pages/SoundboardRemote'), 'SoundboardRemote'));
const ResetPage = lazy(lazyWithNamed(() => import('./pages/ResetPage'), 'ResetPage'));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<SkeletonGMView />}>
        <Routes>
          <Route path="/" element={<GmView />} />
          <Route path="/join" element={<PlayerJoin />} />
          <Route path="/player/:roomId/:playerName" element={<PlayerView />} />
          <Route path="/remote" element={<SoundboardJoin />} />
          <Route path="/remote/:roomId/:passcode" element={<SoundboardRemote />} />
          <Route path="/reset" element={<ResetPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <CustomPopupOverlay />
    </BrowserRouter>
  );
}

export default App;
