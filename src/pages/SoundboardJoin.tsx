import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Music } from 'lucide-react';

export const SoundboardJoin: React.FC = () => {
  const [roomCode, setRoomCode] = useState('');
  const [passcode, setPasscode] = useState('');
  const navigate = useNavigate();

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCode.trim() || !passcode.trim()) return;

    const cleanRoomCode = roomCode.trim().toUpperCase();
    navigate(`/remote/${cleanRoomCode}/${encodeURIComponent(passcode.trim())}`);
  };

  return (
    <div className="h-screen w-screen bg-zinc-950 text-zinc-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-6 flex flex-col gap-6">

        <div className="text-center flex flex-col items-center gap-2">
          <div className="w-16 h-16 bg-pink-600 rounded-full flex items-center justify-center shadow-lg shadow-pink-900/50 mb-2">
            <Music size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Télécommande du MJ</h1>
          <p className="text-sm text-zinc-400">Connectez-vous à une salle .</p>
        </div>

        <form onSubmit={handleJoin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Code de la Salle</label>
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="ABCD"
              maxLength={6}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-center text-2xl font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all placeholder:text-zinc-700"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Code d'accès personnalisé</label>
            <input
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="Ex: 1234"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-lg font-medium focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all placeholder:text-zinc-700"
              required
            />
          </div>

          <button
            type="submit"
            disabled={!roomCode.trim() || !passcode.trim()}
            className="mt-4 w-full bg-pink-600 hover:bg-pink-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-bold py-3.5 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-lg shadow-pink-900/20"
          >
            <LogIn size={20} /> Se connecter
          </button>
        </form>

      </div>
    </div>
  );
};
