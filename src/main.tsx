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
    // Remove query params and reload so that supabase.ts gets the newly saved values
    window.location.href = window.location.pathname;
  } catch (e) {
    console.error('Failed to parse Supabase URL/Key from query string', e);
  }
}

import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
