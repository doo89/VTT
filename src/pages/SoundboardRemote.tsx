import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as icons from 'lucide-react';
import { Music, AlertCircle, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export const SoundboardRemote: React.FC = () => {
  const { roomId, passcode } = useParams<{ roomId: string, passcode: string }>();
  const navigate = useNavigate();
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error' | 'unauthorized'>('connecting');
  const [soundboardState, setSoundboardState] = useState<any>(null);
  const [playingIndices, setPlayingIndices] = useState<number[]>([]);

  useEffect(() => {
    if (!roomId || !supabase) return;

    const newChannel = supabase.channel(`room:${roomId}`, {
      config: { broadcast: { self: false, ack: false } }
    });

    newChannel
      .on('broadcast', { event: 'sync_state' }, ({ payload }) => {
        if (!payload.soundboard) return;
        if (!payload.soundboard.remoteEnabled) {
          setConnectionStatus('unauthorized');
          return;
        }
        setSoundboardState(payload.soundboard);
        if (connectionStatus !== 'connected') {
          setConnectionStatus('connected');
        }
      })
      .on('broadcast', { event: 'soundboard_playback' }, ({ payload }) => {
        if (payload?.playingIndices) {
          setPlayingIndices(payload.playingIndices);
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Ask for state init from host
          newChannel.send({ type: 'broadcast', event: 'get_state' });
          
          // Fallback if no state received within 5s
          setTimeout(() => {
            setConnectionStatus(prev => prev === 'connecting' ? 'error' : prev);
          }, 5000);
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          if (connectionStatus !== 'unauthorized') {
            setConnectionStatus('error');
          }
        }
      });

    setChannel(newChannel);

    return () => {
      if (supabase) {
        supabase.removeChannel(newChannel);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  const handlePlaySound = (index: number) => {
    if (!channel || !passcode || !soundboardState) return;
    
    // Add optimism
    if (!playingIndices.includes(index)) {
      setPlayingIndices(prev => [...prev, index]);
    }
    
    channel.send({
      type: 'broadcast',
      event: 'soundboard_action',
      payload: { index, passcode }
    }).catch(console.error);
  };

  const handleDisconnect = () => {
    navigate('/soundboard');
  };

  if (connectionStatus === 'connecting') {
    return (
      <div className="h-screen w-screen bg-zinc-950 text-zinc-50 flex flex-col items-center justify-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500 mb-4"></div>
        <p className="text-zinc-400">Connexion à la salle {roomId}...</p>
      </div>
    );
  }

  if (connectionStatus === 'unauthorized') {
    return (
      <div className="h-screen w-screen bg-zinc-950 text-zinc-50 flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 bg-red-600/20 text-red-500 rounded-full flex items-center justify-center mb-4">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-xl font-bold mb-2">Accès Refusé</h2>
        <p className="text-zinc-400 text-center max-w-sm mb-6">
          Le MJ n'a pas autorisé les connexions distantes pour la Soundboard. Demandez-lui de cocher la case d'autorisation dans ses paramètres.
        </p>
        <button onClick={handleDisconnect} className="bg-zinc-800 hover:bg-zinc-700 px-6 py-2 rounded-lg font-medium transition-colors">
          Retour
        </button>
      </div>
    );
  }

  if (connectionStatus === 'error' || !soundboardState) {
    return (
      <div className="h-screen w-screen bg-zinc-950 text-zinc-50 flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 bg-red-600/20 text-red-500 rounded-full flex items-center justify-center mb-4">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-xl font-bold mb-2">Erreur de connexion</h2>
        <p className="text-zinc-400 text-center max-w-sm mb-6">
          Impossible de se connecter à la salle {roomId}. Vérifiez que le MJ est bien en ligne et que le code est correct.
        </p>
        <button onClick={handleDisconnect} className="bg-zinc-800 hover:bg-zinc-700 px-6 py-2 rounded-lg font-medium transition-colors">
          Retour
        </button>
      </div>
    );
  }

  const { cols, rows, buttons } = soundboardState;
  const totalButtons = cols * rows;

  return (
    <div className="h-screen w-screen bg-zinc-950 text-zinc-50 flex flex-col max-w-md mx-auto shadow-2xl">
      <header className="flex items-center justify-between p-4 bg-zinc-900 border-b border-zinc-800 shrink-0">
        <div className="flex items-center gap-2">
          <div className="bg-pink-600 p-1.5 rounded text-white shadow-sm shadow-pink-900">
            <Music size={18} />
          </div>
          <div>
            <h1 className="font-bold leading-tight">Télécommande</h1>
            <p className="text-[10px] text-zinc-400 font-medium">Salle: {roomId}</p>
          </div>
        </div>
        <button
          onClick={handleDisconnect}
          className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-colors"
          title="Déconnexion"
        >
          <LogOut size={20} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-black touch-pan-y">
        <div
          className="grid gap-3 w-full h-fit min-h-full"
          style={{
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
            gridAutoRows: '1fr',
            aspectRatio: `${cols} / ${rows}`
          }}
        >
          {Array.from({ length: totalButtons }).map((_, i) => {
            const btn = buttons.find((b: any) => b.index === i);
            const hasSound = !!btn && btn.hasAudio;
            const isPlaying = playingIndices.includes(i);
            
            const IconComponent = btn?.icon && icons[btn.icon as keyof typeof icons] 
              ? icons[btn.icon as keyof typeof icons] as React.ElementType
              : Music;

            return (
              <button
                key={i}
                onClick={() => hasSound ? handlePlaySound(i) : undefined}
                disabled={!hasSound}
                className={`relative rounded-xl border flex flex-col items-center justify-center p-2 text-center transition-all overflow-hidden ${
                  hasSound
                    ? 'bg-zinc-900 border-zinc-700 hover:bg-zinc-800 active:scale-95 shadow-md'
                    : 'bg-zinc-950/50 border-dashed border-zinc-800 opacity-30 cursor-not-allowed'
                }`}
                style={{
                  boxShadow: isPlaying && btn?.color ? `0 0 15px ${btn.color}, inset 0 0 10px ${btn.color}40` : undefined,
                  borderColor: isPlaying && btn?.color ? btn.color : (hasSound ? btn?.color : undefined),
                  // Appliquer l'image si possible
                  backgroundImage: btn?.imageUrl ? `url(${btn.imageUrl})` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                {btn?.imageUrl && <div className="absolute inset-0 bg-black/50 z-0 drop-shadow-lg" />}

                {hasSound && (
                  <div className="relative z-10 flex flex-col items-center justify-center w-full h-full text-zinc-100 drop-shadow-md">
                    <IconComponent size={24} className="mb-2" style={{ color: btn.color || 'currentColor' }} />
                    <span 
                      className="text-xs font-bold leading-tight break-words w-full px-1"
                      style={{ color: btn.imageUrl ? '#fff' : (btn.color || 'inherit') }}
                    >
                      {btn.name || `Son ${i+1}`}
                    </span>
                    {!btn.isOneShot && isPlaying && (
                       <div className="absolute -top-1 -right-1">
                          <span className="flex h-2.5 w-2.5 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: btn.color || '#fff' }}></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ backgroundColor: btn.color || '#fff' }}></span>
                          </span>
                       </div>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
