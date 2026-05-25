import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import React, { Suspense, lazy } from 'react';
import { CustomPopupOverlay } from './components/CustomPopupOverlay';
import { SkeletonGMView, SkeletonPlayerView } from './components/Skeletons';

// Helper to convert named exports to default exports for lazy loading
// Includes automatic recovery for chunk loading errors (e.g. after a new deployment)
function lazyWithNamed(importFunc: () => Promise<any>, exportName: string) {
  return () =>
    importFunc()
      .then(module => ({ default: module[exportName] }))
      .catch(error => {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const isChunkError =
          errorMessage.includes('Failed to fetch dynamically imported module') ||
          errorMessage.includes('error loading dynamically imported module') ||
          errorMessage.includes('Failed to fetch');

        if (isChunkError) {
          const lastReload = sessionStorage.getItem('chunk-error-reload');
          const now = Date.now();
          // Prevent infinite reload loops by checking if we reloaded in the last 10 seconds
          if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
            sessionStorage.setItem('chunk-error-reload', now.toString());
            window.location.reload();
            return new Promise<any>(() => {}); // Return a pending promise to prevent rendering half-broken state before reload
          }
        }
        throw error;
      });
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
