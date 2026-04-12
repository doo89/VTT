import React, { useState, useRef, useMemo } from 'react';
import { useVttStore } from '../store';
import { Trophy, X, Shield, Heart, Vote } from 'lucide-react';

export const ScoreboardWindow: React.FC = () => {
  const { scoreboard, setScoreboard, players, roles } = useVttStore();
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; initX: number; initY: number } | null>(null);

  const sortedPlayers = useMemo(() => {
    return [...players].sort((a, b) => (b.points || 0) - (a.points || 0));
  }, [players]);

  if (!scoreboard.isOpen || !scoreboard.isDetached) return null;

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!(e.target as HTMLElement).closest('.drag-handle')) return;
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: scoreboard.x,
      initY: scoreboard.y
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setScoreboard({
      x: dragRef.current.initX + dx,
      y: dragRef.current.initY + dy
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      e.currentTarget.releasePointerCapture(e.pointerId);
      dragRef.current = null;
    }
  };

  return (
    <div
      className="fixed bg-card border border-border shadow-2xl rounded-xl overflow-hidden flex flex-col z-[150] w-[450px] touch-none"
      style={{
        left: scoreboard.x,
        top: scoreboard.y,
        transition: isDragging ? 'none' : 'opacity 0.2s',
        maxHeight: '80vh'
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div className="drag-handle flex items-center justify-between bg-muted p-3 cursor-grab active:cursor-grabbing border-b border-border">
        <div className="flex items-center gap-2 text-sm font-bold text-yellow-500 select-none">
          <Trophy size={16} /> Tableau des Scores
        </div>
        <div className="flex items-center gap-1">
          <button
            onPointerDown={(e) => {
              e.stopPropagation();
              setScoreboard({ isDetached: false });
            }}
            className="p-1.5 hover:bg-accent hover:text-foreground text-muted-foreground rounded transition-colors text-[10px] font-bold uppercase tracking-tighter"
            title="Rattacher au panneau"
          >
            Rattacher
          </button>
          <button
            onPointerDown={(e) => {
              e.stopPropagation();
              setScoreboard({ isOpen: false });
            }}
            className="p-1 hover:bg-destructive hover:text-white text-muted-foreground rounded transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="p-0 overflow-y-auto custom-scrollbar flex-1">
        <table className="w-full text-left text-xs">
          <thead className="sticky top-0 bg-muted/90 backdrop-blur-sm z-10">
            <tr>
              <th className="p-3 font-bold uppercase tracking-wider text-muted-foreground border-b border-border w-12 text-center">#</th>
              <th className="p-3 font-bold uppercase tracking-wider text-muted-foreground border-b border-border">Joueur</th>
              {scoreboard.showPoints && <th className="p-3 font-bold uppercase tracking-wider text-muted-foreground border-b border-border text-center">Points</th>}
              {scoreboard.showLives && <th className="p-3 font-bold uppercase tracking-wider text-muted-foreground border-b border-border text-center">Vie</th>}
              {scoreboard.showVotes && <th className="p-3 font-bold uppercase tracking-wider text-muted-foreground border-b border-border text-center">Vote</th>}
              {scoreboard.showStatus && <th className="p-3 font-bold uppercase tracking-wider text-muted-foreground border-b border-border text-center">Statut</th>}
            </tr>
          </thead>
          <tbody>
            {sortedPlayers.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center italic text-muted-foreground bg-muted/5">
                  Aucun joueur dans la salle.
                </td>
              </tr>
            ) : (
              sortedPlayers.map((player, index) => {
                const role = roles.find(r => r.id === player.roleId);
                return (
                  <tr key={player.id} className={`hover:bg-accent/30 transition-colors border-b border-border/50 ${player.isDead ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                    <td className="p-3 text-center font-mono font-bold text-muted-foreground/50">
                      {index + 1}
                    </td>
                    <td className="p-3">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: player.color }} />
                          <span className="font-bold text-sm truncate max-w-[120px]">{player.name}</span>
                        </div>
                        {scoreboard.showRoles && (
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium uppercase truncate">
                            <Shield size={10} className="shrink-0" /> {role?.name || 'Sans Rôle'}
                          </div>
                        )}
                      </div>
                    </td>
                    {scoreboard.showPoints && (
                      <td className="p-3 text-center">
                         <span className="font-black text-blue-400 text-sm">{player.points || 0}</span>
                      </td>
                    )}
                    {scoreboard.showLives && (
                      <td className="p-3 text-center">
                         <div className="flex items-center justify-center gap-1 text-red-500 font-bold">
                           <Heart size={12} fill={player.lives && player.lives > 0 ? "currentColor" : "none"} />
                           <span>{player.lives ?? 0}</span>
                         </div>
                      </td>
                    )}
                    {scoreboard.showVotes && (
                      <td className="p-3 text-center">
                         <div className="flex items-center justify-center gap-1 text-purple-400 font-bold">
                           <Vote size={12} />
                           <span>{player.votes ?? 0}</span>
                         </div>
                      </td>
                    )}
                    {scoreboard.showStatus && (
                      <td className="p-3 text-center">
                         {player.isDead ? (
                           <span className="bg-destructive/10 text-destructive text-[10px] font-black px-2 py-0.5 rounded-full border border-destructive/20 uppercase tracking-tighter">Mort</span>
                         ) : (
                           <span className="bg-green-500/10 text-green-500 text-[10px] font-black px-2 py-0.5 rounded-full border border-green-500/20 uppercase tracking-tighter">Vivant</span>
                         )}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
