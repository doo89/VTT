import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

const searchParams = new URLSearchParams(window.location.search);
const sburl = searchParams.get('sburl');
const sbkey = searchParams.get('sbkey');

if (sburl && sbkey) {
  try {
    localStorage.setItem('VTT_SUPABASE_URL', atob(sburl));
    localStorage.setItem('VTT_SUPABASE_ANON_KEY', atob(sbkey));
    sessionStorage.setItem('VTT_SB_URL_OVERRIDE', atob(sburl));
    sessionStorage.setItem('VTT_SB_KEY_OVERRIDE', atob(sbkey));
    
    // Preserve 'code' param when stripping sburl/sbkey
    const code = searchParams.get('code');
    const newUrl = code ? `${window.location.pathname}?code=${code}` : window.location.pathname;
    window.location.replace(newUrl);
  } catch (e) {
    console.error('Failed to parse Supabase URL/Key from query string', e);
  }
} else if (localStorage.getItem('VTT_USE_ENV_EXAMPLE') === 'true' && !localStorage.getItem('VTT_SUPABASE_URL')) {
  fetch('/env.example')
    .then(res => res.ok ? res.text() : null)
    .then(text => {
      if (!text) return;
      const lines = text.split('\n');
      let url = '';
      let key = '';
      lines.forEach(line => {
        if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1]?.trim() || '';
        if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) key = line.split('=')[1]?.trim() || '';
      });
      if (url && key) {
        localStorage.setItem('VTT_SUPABASE_URL', url);
        localStorage.setItem('VTT_SUPABASE_ANON_KEY', key);
        window.location.reload();
      }
    })
    .catch(() => {});
}

import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'
import { ToastProvider } from './components/Toast.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <App />
      </ToastProvider>
    </ErrorBoundary>
  </StrictMode>,
)

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
