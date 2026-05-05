import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVttStore } from '../store';

export const ResetPage: React.FC = () => {
  const navigate = useNavigate();
  const resetStore = useVttStore(state => state.resetStore);

  useEffect(() => {
    // Clear everything
    localStorage.clear();
    resetStore();
    
    // Small delay to ensure state is cleared before redirect
    const timer = setTimeout(() => {
      navigate('/', { replace: true });
      window.location.reload(); // Force reload to be absolutely sure
    }, 500);

    return () => clearTimeout(timer);
  }, [resetStore, navigate]);

  return (
    <div className="fixed inset-0 bg-zinc-950 flex flex-col items-center justify-center gap-4 text-white p-6 text-center">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <h1 className="text-xl font-bold">Réinitialisation en cours...</h1>
      <p className="text-sm text-zinc-400">Toutes les données locales vont être effacées.</p>
    </div>
  );
};
