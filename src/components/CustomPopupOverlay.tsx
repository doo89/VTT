import React, { useEffect } from 'react';
import { useVttStore } from '../store';
import { X } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export const CustomPopupOverlay: React.FC = () => {
  const { customPopups, activeCustomPopupId, triggerCustomPopup, previewPopup, setPreviewPopup, players, roles } = useVttStore();
  const location = useLocation();

  const activePopup = previewPopup || customPopups?.find(p => p.id === activeCustomPopupId);
  const lastPlayedId = React.useRef<string | null>(null);

  const handleClose = () => {
    if (previewPopup) {
      setPreviewPopup(null);
    } else {
      triggerCustomPopup(null);
    }
  };

  useEffect(() => {
    if (activePopup?.autoCloseTimer) {
      const duration = (activePopup.autoCloseDuration || 10) * 1000;
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [activeCustomPopupId, activePopup?.autoCloseTimer, activePopup?.autoCloseDuration, previewPopup, triggerCustomPopup, setPreviewPopup]);

  useEffect(() => {
    if (activePopup?.soundUrl && activeCustomPopupId !== lastPlayedId.current) {
      const isGM = location.pathname === '/';
      const isSmartphone = location.pathname.startsWith('/player/') || location.pathname.startsWith('/remote/');
      
      const shouldShow = isGM ? (activePopup.showToGM !== false) : (isSmartphone ? (activePopup.showToSmartphone !== false) : false);
      
      if (shouldShow) {
        const audio = new Audio(activePopup.soundUrl);
        audio.volume = 0.5;
        audio.play().catch(e => console.error("Failed to play popup sound:", e));
        lastPlayedId.current = activeCustomPopupId;
      }
    } else if (!activeCustomPopupId) {
      lastPlayedId.current = null;
    }
  }, [activeCustomPopupId, location.pathname, activePopup?.soundUrl]);

  if (!activePopup) return null;

  const isGM = location.pathname === '/';
  const isSmartphone = location.pathname.startsWith('/player/') || location.pathname.startsWith('/remote/');
  
  // Récupération des infos du joueur si on est sur la vue Smartphone
  // L'URL est de la forme /player/:roomId/:playerName
  const match = location.pathname.match(/^\/player\/[^\/]+\/([^\/]+)/);
  const playerNameFromUrl = match ? decodeURIComponent(match[1]) : null;
  
  // Trouver le joueur par son nom (comme dans PlayerView)
  const normalize = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const localPlayer = playerNameFromUrl 
    ? players.find(p => normalize(p.name) === normalize(playerNameFromUrl))
    : null;
  const playerId = localPlayer?.id || null;
  
  console.log('[Popup Debug] pathname:', location.pathname, 'playerNameFromUrl:', playerNameFromUrl, 'Found:', localPlayer, 'playerId:', playerId);
  console.log('[Popup Debug] Players array:', players.map(p => ({ id: p.id, name: p.name, roleId: p.roleId, teamId: p.teamId })));
  
  // Check targeting
  const isTargeted = () => {
    // If no targeting specified, show to all
    if (!activePopup.targetRoleIds?.length && !activePopup.targetTeamIds?.length && !activePopup.targetPlayerIds?.length) {
      return true;
    }
    
    console.log('[Popup Targeting] Checking targeting for player:', {
      playerId,
      localPlayer,
      localPlayerRoleId: localPlayer?.roleId,
      localPlayerTeamId: localPlayer?.teamId,
      targetPlayerIds: activePopup.targetPlayerIds,
      targetRoleIds: activePopup.targetRoleIds,
      targetTeamIds: activePopup.targetTeamIds,
      totalPlayers: players.length,
      totalRoles: roles.length
    });
    
    // Check player targeting
    if (activePopup.targetPlayerIds?.length && playerId) {
      console.log('[Popup Targeting] Checking player targeting:', playerId, 'in', activePopup.targetPlayerIds);
      if (activePopup.targetPlayerIds.includes(playerId)) {
        console.log('[Popup Targeting] ✓ Player matched!');
        return true;
      }
    }
    
    // Check role targeting
    if (activePopup.targetRoleIds?.length && localPlayer?.roleId) {
      console.log('[Popup Targeting] Checking role targeting:', localPlayer.roleId, 'in', activePopup.targetRoleIds);
      if (activePopup.targetRoleIds.includes(localPlayer.roleId)) {
        console.log('[Popup Targeting] ✓ Role matched!');
        return true;
      }
    }
    
    // Check team targeting (via role teamId)
    if (activePopup.targetTeamIds?.length && localPlayer?.roleId) {
      const playerRole = roles.find(r => r.id === localPlayer.roleId);
      console.log('[Popup Targeting] Checking team targeting via role:', {
        roleId: localPlayer.roleId,
        playerRole,
        playerRoleTeamId: playerRole?.teamId,
        targetTeamIds: activePopup.targetTeamIds
      });
      if (playerRole?.teamId && activePopup.targetTeamIds.includes(playerRole.teamId)) {
        console.log('[Popup Targeting] ✓ Team matched via role!');
        return true;
      }
    }
    
    // Also check team targeting via player's direct teamId
    if (activePopup.targetTeamIds?.length && localPlayer?.teamId) {
      console.log('[Popup Targeting] Checking team targeting via player teamId:', {
        playerTeamId: localPlayer.teamId,
        targetTeamIds: activePopup.targetTeamIds
      });
      if (activePopup.targetTeamIds.includes(localPlayer.teamId)) {
        console.log('[Popup Targeting] ✓ Team matched via player!');
        return true;
      }
    }
    
    console.log('[Popup Targeting] ✗ No match found');
    return false;
  };

  const shouldShow = isGM ? (activePopup.showToGM !== false) : (isSmartphone ? (activePopup.showToSmartphone !== false && isTargeted()) : false);

  if (!shouldShow) return null;
  
  const parseVariables = (text: string) => {
    if (!text || !localPlayer) return text;
    let res = text;
    res = res.replace(/\$Vie/gi, localPlayer.lives?.toString() || '0');
    res = res.replace(/\$Points/gi, localPlayer.points?.toString() || '0');
    res = res.replace(/\$Votes/gi, localPlayer.votes?.toString() || '0');
    res = res.replace(/\$Nom/gi, localPlayer.name || '');
    const role = roles.find(r => r.id === localPlayer.roleId);
    res = res.replace(/\$R[ôo]le/gi, role?.name || 'Inconnu');
    return res;
  };

  const parsedTitle = parseVariables(activePopup.title);
  const parsedContent = parseVariables(activePopup.content);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm shadow-2xl">
      <div className="bg-popover text-popover-foreground rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 border border-border shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/50 shrink-0">
          <h2 className="text-xl font-black uppercase tracking-widest text-primary">{parsedTitle}</h2>
          {activePopup.showCloseButton && (
            <button
              onClick={handleClose}
              className="p-1.5 bg-background/50 hover:bg-destructive hover:text-white rounded-full transition-colors"
              title="Fermer"
            >
              <X size={24} />
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="flex flex-col flex-1 overflow-y-auto custom-scrollbar">
          {activePopup.imageUrl && (
            <div className="w-full shrink-0">
              <img
                src={activePopup.imageUrl}
                alt={activePopup.title}
                className="w-full max-h-[40vh] object-contain bg-black/20"
              />
            </div>
          )}
          <div className="p-6">
            <div
              className="prose prose-sm sm:prose-base dark:prose-invert max-w-none text-foreground whitespace-pre-wrap leading-relaxed"
              dangerouslySetInnerHTML={{ __html: parsedContent }}
            />
          </div>
        </div>

        {/* Footer / Timer indicator */}
        {activePopup.autoCloseTimer && (
          <div className="h-1.5 w-full bg-muted/50 overflow-hidden shrink-0">
            <div 
              className="h-full bg-primary animate-[shrink_custom_linear_forwards]" 
              style={{ 
                width: '100%',
                animationDuration: `${activePopup.autoCloseDuration || 10}s`
              }} 
            />
          </div>
        )}
      </div>
      <style>{`
        @keyframes shrink_custom {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
};
