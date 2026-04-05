import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, User } from 'lucide-react';

export const PlayerJoin: React.FC = () => {
  const [roomCode, setRoomCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const navigate = useNavigate();

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCode.trim() || !playerName.trim()) return;

    // Pour l'instant, on redirige simplement vers une vue joueur fictive avec le nom
    // Plus tard, cela se connectera à la base de données pour vérifier le code et créer l'entrée
    const cleanRoomCode = roomCode.trim().toUpperCase();
    const cleanName = playerName.trim().replace(/[^a-zA-Z0-9 ]/g, ''); // Basic sanitize for URL
    navigate(`/player/${cleanRoomCode}/${encodeURIComponent(cleanName)}`);
  };

  return (
    <div className="h-screen w-screen bg-zinc-950 text-zinc-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-6 flex flex-col gap-6">

        <div className="text-center flex flex-col items-center gap-2">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-900/50 mb-2">
            <User size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Rejoindre la Partie</h1>
          <p className="text-sm text-zinc-400">Entrez le code fourni par votre Maître du Jeu.</p>
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
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-center text-2xl font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-zinc-700"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Votre Pseudo</label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Ex: Legolas"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-zinc-700"
              required
            />
          </div>

          <button
            type="submit"
            disabled={!roomCode.trim() || !playerName.trim()}
            className="mt-4 w-full bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-bold py-3.5 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-lg shadow-blue-900/20"
          >
            <LogIn size={20} /> Rejoindre
          </button>
        </form>

      </div>
    </div>
  );
};
