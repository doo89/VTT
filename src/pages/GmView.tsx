import React from 'react';
import { LeftPanel } from '../components/layout/LeftPanel';
import { RightPanel } from '../components/layout/RightPanel';
import { Canvas } from '../components/layout/Canvas';
import { ThemeToggle } from '../components/ThemeToggle';
import { EditingModal } from '../components/EditingModal';
import { HandoutWindow } from '../components/HandoutWindow';
import { DetachedTimer } from '../components/DetachedTimer';
import { DetachedSoundboard } from '../components/DetachedSoundboard';
import { useVttStore } from '../store';
import { setupHostRealtimeSubscription, cleanupHostRealtime } from '../lib/realtime-host';
import { X, MessageSquareWarning } from 'lucide-react';

export const GmView: React.FC = () => {
  const { isNight, editingEntity, handouts, smartphoneActionMessage, setSmartphoneActionMessage } = useVttStore();

  React.useEffect(() => {
    const unsubscribe = setupHostRealtimeSubscription();
    return () => {
      cleanupHostRealtime();
      unsubscribe();
    };
  }, []);

  return (
    <div className={`h-screen w-screen flex overflow-hidden bg-background text-foreground transition-colors duration-300 ${isNight ? 'dark' : ''}`}>
      <ThemeToggle />
      <LeftPanel />
      <Canvas />
      <RightPanel />
      {editingEntity && <EditingModal />}

      {/* Render open handouts over everything */}
      {handouts.filter(h => h.isOpen).map(handout => (
        <HandoutWindow key={handout.id} handout={handout} />
      ))}

      <DetachedTimer />
      <DetachedSoundboard />

      {/* Smartphone Action Popup */}
      {smartphoneActionMessage && (
        <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-zinc-900 border-2 border-blue-500/50 text-white rounded-xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="bg-blue-500/20 border-b border-blue-500/30 p-4 flex justify-between items-center">
              <div className="flex flex-row items-center gap-2">
                <MessageSquareWarning className="text-blue-400 h-5 w-5" />
                <h3 className="font-bold text-lg text-blue-100 drop-shadow-sm">
                  Retour de {smartphoneActionMessage.playerName}
                </h3>
              </div>
              <button 
                onClick={() => setSmartphoneActionMessage(null)}
                className="text-zinc-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 text-zinc-200 whitespace-pre-wrap text-base leading-relaxed">
              {smartphoneActionMessage.message}
            </div>
            <div className="p-4 bg-zinc-950/50 flex justify-end">
              <button
                onClick={() => setSmartphoneActionMessage(null)}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded-lg transition-colors border border-blue-500/50"
              >
                Compris
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
