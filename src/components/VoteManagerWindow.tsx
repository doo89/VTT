import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { useVttStore } from '../store';
import { getChannel } from '../lib/realtime-host';
import type { GroupVote } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface VoteManagerWindowProps {
  onClose: () => void;
}

export const VoteManagerWindow: React.FC<VoteManagerWindowProps> = ({ onClose }) => {
  const { players, roles, teams, tags, activeGroupVote, setActiveGroupVote } = useVttStore();

  // Liste des joueurs vivants
  const livingPlayers = players.filter(p => !p.isDead);

  // États de configuration du vote
  const [question, setQuestion] = useState('Qui doit être éliminé ?');
  const [allowedVoters, setAllowedVoters] = useState<string[]>(livingPlayers.map(p => p.id));
  const [hideVoters, setHideVoters] = useState(false); // vote secret
  const [mandatory, setMandatory] = useState(true); // fermer à 100%
  const [noTies, setNoTies] = useState(false);
  const [tagIdToAssign, setTagIdToAssign] = useState<string>('');
  
  // Compte à rebours
  const [useTimer, setUseTimer] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(60);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // Synchronisation du minuteur actif
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (activeGroupVote && timeLeft !== null) {
      if (timeLeft <= 0) {
        handleCloseVote();
      } else {
        interval = setInterval(() => {
          setTimeLeft(prev => (prev !== null ? prev - 1 : null));
        }, 1000);
      }
    }
    return () => clearInterval(interval);
  }, [activeGroupVote, timeLeft]);

  // Si un vote est déjà en cours, synchroniser les états de participation
  const totalVoters = activeGroupVote?.allowedVoterIds?.length || 0;
  const votedCount = activeGroupVote ? Object.keys(activeGroupVote.votes).length : 0;
  const votingProgress = totalVoters > 0 ? (votedCount / totalVoters) * 100 : 0;

  // Calculer les résultats en direct pour affichage MJ
  const getVoteResults = () => {
    if (!activeGroupVote) return [];
    const counts: Record<string, number> = {};
    Object.values(activeGroupVote.votes).forEach(targetId => {
      counts[targetId] = (counts[targetId] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([targetId, count]) => {
        const player = players.find(p => p.id === targetId);
        return {
          id: targetId,
          name: player?.name || 'Inconnu',
          count,
          percentage: votedCount > 0 ? (count / votedCount) * 100 : 0
        };
      })
      .sort((a, b) => b.count - a.count);
  };

  const handleSelectAllVoters = (select: boolean) => {
    if (select) {
      setAllowedVoters(livingPlayers.map(p => p.id));
    } else {
      setAllowedVoters([]);
    }
  };

  const handleSelectRoleVoters = (roleId: string) => {
    const rolePlayerIds = livingPlayers.filter(p => p.roleId === roleId).map(p => p.id);
    setAllowedVoters(rolePlayerIds);
  };

  const handleStartVote = () => {
    if (!question.trim()) {
      alert("Veuillez saisir une question.");
      return;
    }
    if (allowedVoters.length === 0) {
      alert("Veuillez sélectionner au moins un votant.");
      return;
    }

    const newVote: GroupVote = {
      id: uuidv4(),
      question: question.trim(),
      allowedVoterIds: allowedVoters,
      hideVoters,
      excludeVoters: false,
      mandatory,
      noTies,
      tagIdToAssign: tagIdToAssign || undefined,
      votes: {},
      isOpen: true
    };

    setActiveGroupVote(newVote);
    if (useTimer) {
      setTimeLeft(timerSeconds);
    } else {
      setTimeLeft(null);
    }
  };

  const handleCloseVote = () => {
    if (!activeGroupVote) return;
    
    // Envoyer la clôture du vote via le canal Supabase Realtime
    const channel = getChannel();
    if (channel) {
      channel.send({
        type: 'broadcast',
        event: 'close_group_vote',
        payload: { voteId: activeGroupVote.id }
      }).catch(console.error);
    } else {
      // Fallback local si Supabase n'est pas connecté
      setActiveGroupVote(null);
    }
    setTimeLeft(null);
  };

  const handleCancelVote = () => {
    setActiveGroupVote(null);
    setTimeLeft(null);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[999] p-4 text-neutral-200">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 px-6 py-4">
          <div className="flex items-center gap-2">
            <Icons.Vote className="h-6 w-6 text-fuchsia-500" />
            <h2 className="text-lg font-bold">Gestion des Votes en Temps Réel</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-neutral-850 rounded-lg transition-all text-neutral-400 hover:text-neutral-200">
            <Icons.X className="h-5 w-5" />
          </button>
        </div>

        {/* Corps de la fenêtre */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeGroupVote ? (
            /* ================= DASHBOARD DE VOTE ACTIF ================= */
            <div className="space-y-6">
              <div className="bg-neutral-950/40 border border-neutral-800 rounded-xl p-4 text-center space-y-2">
                <span className="text-[10px] uppercase tracking-wider text-fuchsia-400 font-semibold">Scrutin en cours</span>
                <h3 className="text-xl font-bold italic text-white">"{activeGroupVote.question}"</h3>
                
                {timeLeft !== null && (
                  <div className="flex items-center justify-center gap-1.5 text-amber-500 font-mono text-sm font-bold mt-2">
                    <Icons.Clock className="h-4 w-4 animate-pulse" />
                    <span>Temps restant : {timeLeft}s</span>
                  </div>
                )}
              </div>

              {/* Barre de participation */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold text-neutral-400">
                  <span>Participation</span>
                  <span>{votedCount} / {totalVoters} Joueurs ({Math.round(votingProgress)}%)</span>
                </div>
                <div className="w-full bg-neutral-950 rounded-full h-3 overflow-hidden border border-neutral-800">
                  <div 
                    style={{ width: `${votingProgress}%` }}
                    className="bg-fuchsia-500 h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(217,70,239,0.3)]"
                  />
                </div>
              </div>

              {/* Résultats en direct (toujours visibles par le MJ) */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Résultats du scrutin (MJ)</h4>
                <div className="bg-neutral-950/30 border border-neutral-850 rounded-xl p-4 space-y-3">
                  {getVoteResults().map(res => (
                    <div key={res.id} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span>{res.name}</span>
                        <span className="font-bold text-fuchsia-400">{res.count} vote{res.count > 1 ? 's' : ''}</span>
                      </div>
                      <div className="w-full bg-neutral-900 rounded-full h-2 overflow-hidden">
                        <div 
                          style={{ width: `${res.percentage}%` }}
                          className="bg-fuchsia-600/70 h-full rounded-full transition-all"
                        />
                      </div>
                    </div>
                  ))}
                  {getVoteResults().length === 0 && (
                    <div className="text-center text-xs text-neutral-500 py-4 italic">
                      En attente des premiers votes...
                    </div>
                  )}
                </div>
              </div>

              {/* Boutons d'action scrutin actif */}
              <div className="flex gap-4 pt-4 border-t border-neutral-800">
                <button
                  onClick={handleCancelVote}
                  className="flex-1 bg-red-950/30 border border-red-900 hover:bg-red-900/40 text-red-400 py-2.5 rounded-xl text-xs font-semibold transition-all"
                >
                  Annuler le vote
                </button>
                <button
                  onClick={handleCloseVote}
                  className="flex-1 bg-fuchsia-600 hover:bg-fuchsia-500 active:bg-fuchsia-700 text-white py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg shadow-fuchsia-500/20"
                >
                  Clôturer & Appliquer
                </button>
              </div>
            </div>
          ) : (
            /* ================= CRÉATEUR DE SCRUTIN ================= */
            <div className="space-y-5">
              {/* Question */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider">Question de vote</label>
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-fuchsia-500 transition-all font-semibold"
                />
              </div>

              {/* Sélection des votants */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider">Votants Éligibles ({allowedVoters.length})</label>
                  <div className="flex gap-2 text-[10px] font-bold">
                    <button onClick={() => handleSelectAllVoters(true)} className="text-fuchsia-400 hover:underline">Tous</button>
                    <span className="text-neutral-600">|</span>
                    <button onClick={() => handleSelectAllVoters(false)} className="text-fuchsia-400 hover:underline">Aucun</button>
                  </div>
                </div>

                {/* Filtres par Rôles */}
                <div className="flex flex-wrap gap-1.5 py-1">
                  {roles.filter(r => livingPlayers.some(p => p.roleId === r.id)).map(r => (
                    <button
                      key={r.id}
                      onClick={() => handleSelectRoleVoters(r.id)}
                      className="px-2.5 py-1 bg-neutral-850 hover:bg-neutral-800 border border-neutral-750 text-[10px] font-semibold rounded-lg transition-all"
                    >
                      {r.name}
                    </button>
                  ))}
                </div>

                <div className="bg-neutral-950/30 border border-neutral-850 rounded-xl p-3 max-h-36 overflow-y-auto grid grid-cols-2 gap-2">
                  {livingPlayers.map(player => (
                    <label key={player.id} className="flex items-center gap-2 cursor-pointer text-xs select-none">
                      <input
                        type="checkbox"
                        checked={allowedVoters.includes(player.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setAllowedVoters(prev => [...prev, player.id]);
                          } else {
                            setAllowedVoters(prev => prev.filter(id => id !== player.id));
                          }
                        }}
                        className="accent-fuchsia-500 h-4 w-4"
                      />
                      <span className="truncate">{player.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Options de scrutin */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-neutral-950/20 border border-neutral-850 rounded-xl p-3.5 space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Confidentialité</span>
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-neutral-300">
                    <input
                      type="checkbox"
                      checked={hideVoters}
                      onChange={(e) => setHideVoters(e.target.checked)}
                      className="accent-fuchsia-500 h-4 w-4"
                    />
                    Scrutin Secret
                  </label>
                </div>

                <div className="bg-neutral-950/20 border border-neutral-850 rounded-xl p-3.5 space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Clôture automatique</span>
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-neutral-300">
                    <input
                      type="checkbox"
                      checked={mandatory}
                      onChange={(e) => setMandatory(e.target.checked)}
                      className="accent-fuchsia-500 h-4 w-4"
                    />
                    Fermer à 100% de votes
                  </label>
                </div>
              </div>

              {/* Minuteur & Récompense */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Minuteur */}
                <div className="bg-neutral-950/20 border border-neutral-850 rounded-xl p-3.5 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Minuteur</span>
                    <input
                      type="checkbox"
                      checked={useTimer}
                      onChange={(e) => setUseTimer(e.target.checked)}
                      className="accent-fuchsia-500 h-3.5 w-3.5 cursor-pointer"
                    />
                  </div>
                  {useTimer && (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="10"
                        value={timerSeconds}
                        onChange={(e) => setTimerSeconds(parseInt(e.target.value) || 60)}
                        className="w-20 bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1 text-xs text-center font-bold text-amber-500 focus:outline-none"
                      />
                      <span className="text-[10px] text-neutral-500 font-semibold">secondes</span>
                    </div>
                  )}
                </div>

                {/* Attribuer un Tag */}
                <div className="bg-neutral-950/20 border border-neutral-850 rounded-xl p-3.5 space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Récompense de scrutin</span>
                  <select
                    value={tagIdToAssign}
                    onChange={(e) => setTagIdToAssign(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1 text-xs text-neutral-300 focus:outline-none"
                  >
                    <option value="">Aucun effet / Tag</option>
                    {tags.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Lancement */}
              <button
                onClick={handleStartVote}
                className="w-full bg-fuchsia-600 hover:bg-fuchsia-500 active:bg-fuchsia-700 text-white font-bold py-3 rounded-xl text-sm transition-all shadow-lg shadow-fuchsia-500/15 tracking-wider mt-4"
              >
                Lancer le scrutin temps réel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
