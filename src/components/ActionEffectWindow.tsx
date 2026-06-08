import React, { useState, useRef, useEffect } from 'react';
import { useVttStore } from '../store';
import { X, Check, Pipette } from 'lucide-react';
import * as icons from 'lucide-react';
import type { ActionEffectType } from '../types';

const ACTION_CATEGORIES = [
  { id: 'all', label: 'Toutes les actions' },
  { id: 'cycle', label: 'Cycle & Phase' },
  { id: 'variables', label: 'Variables & Ordre' },
  { id: 'alerts', label: 'Alertes & Popups' },
  { id: 'visibility', label: 'Visibilité & Interface' },
  { id: 'players', label: 'Gestion des Joueurs' },
  { id: 'attributes', label: 'Tags, Rôles & Équipes' },
  { id: 'remote', label: 'Smartphone & Outils' },
  { id: 'system', label: 'Système & Divers' }
];

interface ActionOption {
  value: ActionEffectType;
  label: string;
  category: string;
}

const ACTION_OPTIONS: ActionOption[] = ([
  { value: 'modifyVariable', label: 'Modifier Variable ($Ordre, $Cycle...)', category: 'variables' },
  { value: 'incrementCallOrder', label: '$Ordre + 1', category: 'variables' },
  { value: 'decrementCallOrder', label: '$Ordre - 1', category: 'variables' },
  { value: 'alertVariable', label: 'Afficher $Variable', category: 'alerts' },
  { value: 'alertPlayerName', label: 'Afficher $Joueur', category: 'alerts' },
  { value: 'popupVariable', label: 'Popup $Variable', category: 'alerts' },
  { value: 'showRoleImage', label: "Afficher l'image du Rôle", category: 'visibility' },
  { value: 'showPlayerImage', label: "Afficher l'image du joueur", category: 'visibility' },
  { value: 'showPlayerTooltip', label: "Afficher l'info bulle des joueurs", category: 'visibility' },
  { value: 'showTagTooltip', label: "Afficher l'info bulle des tags", category: 'visibility' },
  { value: 'showRoleColor', label: "Afficher la couleur du rôle", category: 'visibility' },
  { value: 'showAllPlayers', label: 'Afficher tous les joueurs', category: 'visibility' },
  { value: 'hideRoleImage', label: "Cacher l'image du Rôle", category: 'visibility' },
  { value: 'hidePlayerImage', label: "Cacher l'image du joueur", category: 'visibility' },
  { value: 'setCycleNone', label: 'Cycle : Aucun', category: 'cycle' },
  { value: 'setCycleDayNight', label: 'Cycle : Jour/Nuit', category: 'cycle' },
  { value: 'setCycleTurn', label: 'Cycle : par Tour', category: 'cycle' },
  { value: 'setDayNumber', label: 'Aller au Jour X', category: 'cycle' },
  { value: 'setNightNumber', label: 'Aller à la Nuit X', category: 'cycle' },
  { value: 'togglePhaseTimer', label: 'Mettre en pause / Reprendre le cycle', category: 'cycle' },
  { value: 'setPhaseDuration', label: 'Définir la durée de la phase', category: 'cycle' },
  { value: 'distributeRoles', label: 'Distribuer (Rôles)', category: 'attributes' },
  { value: 'triggerAction', label: 'Exécuter une Action', category: 'system' },
  { value: 'assignTag', label: 'Assigner un Tag ($Joueur)', category: 'attributes' },
  { value: 'removeTag', label: 'Retirer un Tag ($Joueur)', category: 'attributes' },
  { value: 'checkTag', label: 'Vérifier un Tag ($Joueur)', category: 'attributes' },
  { value: 'assignRole', label: 'Assigner un Rôle ($Joueur)', category: 'attributes' },
  { value: 'assignTagToRole', label: 'Assigner un tag à un rôle', category: 'attributes' },
  { value: 'removeTagFromRole', label: 'Enlever un tag à un rôle', category: 'attributes' },
  { value: 'assignTeam', label: 'Assigner une équipe ($Joueur)', category: 'attributes' },
  { value: 'assignTeamToRole', label: 'Assigner une équipe à un rôle', category: 'attributes' },
  { value: 'hidePlayerTooltip', label: "Masquer l'info bulle des joueurs", category: 'visibility' },
  { value: 'hideTagTooltip', label: "Masquer l'info bulle des tags", category: 'visibility' },
  { value: 'hideRoleColor', label: "Masquer la couleur du rôle", category: 'visibility' },
  { value: 'hideAllPlayers', label: 'Masquer tous les joueurs', category: 'visibility' },
  { value: 'nextPhase', label: 'Passer à la phase suivante', category: 'cycle' },
  { value: 'popupPlayer', label: 'Popup $Joueur', category: 'alerts' },
  { value: 'resurrectAllPlayers', label: 'Ressusciter tous les joueurs', category: 'players' },
  { value: 'previousPhase', label: 'Revenir à la phase précédente', category: 'cycle' },
  { value: 'resetCallOrder', label: 'Réinitialiser $Ordre', category: 'variables' },
  { value: 'resetCycle', label: 'Réinitialiser le Cycle (Jour 1)', category: 'cycle' },
  { value: 'wakeAllPlayers', label: 'Réveil de tous les Joueurs', category: 'players' },
  { value: 'selectCallOrderPlayer', label: 'Sélectionner joueur $Ordre', category: 'variables' },
  { value: 'shuffleCallOrder', label: "Mélanger l'ordre d'appel ($Ordre)", category: 'variables' },
  { value: 'selectPlayer', label: 'Sélectionner $Joueur', category: 'players' },
  { value: 'sleepAllPlayers', label: 'Tous les Joueurs dorment', category: 'players' },
  { value: 'sleepPlayer', label: '$Joueur dort', category: 'players' },
  { value: 'wakePlayer', label: '$Joueur réveil', category: 'players' },
  { value: 'switchSleepPlayer', label: '$Joueur switch éveille', category: 'players' },
  { value: 'killPlayer', label: 'Tuer $Joueur', category: 'players' },
  { value: 'resurrectPlayer', label: 'Ressusciter $Joueur', category: 'players' },
  { value: 'clearPlayer', label: 'Purger $Joueur (Retirer tags, pastilles...)', category: 'players' },
  { value: 'removePlayerRole', label: 'Retirer le rôle de $Joueur', category: 'players' },
  { value: 'swapPlayerRole', label: 'Échanger le rôle de $Joueur avec $Cible', category: 'players' },
  { value: 'movePlayerToGraveyard', label: 'Isoler $Joueur / Envoyer au cimetière', category: 'players' },
  { value: 'moveCibleToGraveyard', label: 'Isoler $Cible / Envoyer au cimetière', category: 'players' },
  { value: 'gatherPlayers', label: 'Rassembler les joueurs (Cercle)', category: 'players' },
  { value: 'changePlayerShape', label: 'Changer la forme du pion de $Joueur', category: 'players' },
  { value: 'deleteSelectionPastilles', label: 'Supprimer les pastilles tags', category: 'attributes' },
  { value: 'swapPlayerTags', label: 'Échanger tous les Tags entre $Joueur et $Cible', category: 'attributes' },
  { value: 'incrementTagValue', label: 'Ajouter/Soustraire des charges au Tag de $Joueur', category: 'attributes' },
  { value: 'spreadTag', label: 'Propager un Tag en zone autour de $Joueur', category: 'attributes' },
  { value: 'clearPlayerTeam', label: "Dissoudre l'Équipe de $Joueur", category: 'attributes' },
  { value: 'joinTargetTeam', label: "Rallier à l'Équipe de $Cible", category: 'attributes' },
  { value: 'shuffleTeams', label: 'Mélanger les Équipes (Aléatoire)', category: 'attributes' },
  { value: 'setFakeRole', label: "Falsifier le rôle vu par le système ($Joueur)", category: 'attributes' },
  { value: 'stealRoleAndKill', label: "Voler le Rôle de $Cible (et le tuer)", category: 'attributes' },
  { value: 'deleteAllTags', label: 'Supprimer tous les tags dans la salle', category: 'attributes' },
  { value: 'deleteAllPlayerTags', label: 'Supprimer tous les tags des joueurs', category: 'attributes' },
  { value: 'showTimerOnSmartphone', label: 'Afficher le chronomètre (Smartphone)', category: 'remote' },
  { value: 'hideTimerOnSmartphone', label: 'Masquer le chronomètre (Smartphone)', category: 'remote' },
  { value: 'showDiceOnSmartphone', label: 'Afficher le lanceur de dés (Smartphone)', category: 'remote' },
  { value: 'hideDiceOnSmartphone', label: 'Masquer le lanceur de dés (Smartphone)', category: 'remote' },
  { value: 'forceSmartphoneTab', label: "Forcer la navigation vers l'onglet X (Smartphone)", category: 'remote' },
  { value: 'vibrateSmartphone', label: "Faire vibrer le Smartphone ($Joueur)", category: 'remote' },
  { value: 'lockSmartphone', label: "Verrouiller le Smartphone ($Joueur)", category: 'remote' },
  { value: 'sendPollToSmartphone', label: "Envoyer un Choix / Sondage ($Joueur)", category: 'remote' },
  { value: 'sendGroupVoteToSmartphone', label: "Lancer un Vote de Groupe (Joueurs)", category: 'remote' },
  { value: 'blindPlayer', label: "Masquer la Salle / Aveugler ($Joueur)", category: 'remote' },
  { value: 'rollDice', label: "Lancer un Dé ($Joueur)", category: 'remote' },
  { value: 'playParticleEffect', label: "Jouer un Effet de Particules ($Joueur)", category: 'remote' },
  { value: 'wait', label: 'Attendre x secondes', category: 'system' },
  { value: 'stopExecution', label: "Arrêter l'exécution de la séquence", category: 'system' },
  { value: 'toggleActionEnabled', label: "Activer / Désactiver une autre Action", category: 'system' },
  { value: 'resetBoard', label: "Nettoyage complet du Plateau (Reset)", category: 'system' },
  { value: 'playSound', label: 'Jouer un effet sonore', category: 'alerts' },
  { value: 'showHandout', label: 'Afficher un Document / Handout', category: 'alerts' },
  { value: 'sendPrivateMessage', label: 'Envoyer un Message Privé ($Joueur)', category: 'alerts' },
  { value: 'addSystemLog', label: "Ajouter un Log Système (Journal)", category: 'system' },
  { value: 'setRoomBackground', label: "Changer le Fond d'écran de la salle", category: 'visibility' },
  { value: 'setRoomColor', label: "Changer l'Ambiance (Couleur) de la salle", category: 'visibility' },
  { value: 'revealPlayerRole', label: "Révéler publiquement le Rôle de $Joueur", category: 'visibility' },
  { value: 'hidePlayerRole', label: "Cacher publiquement le Rôle de $Joueur", category: 'visibility' },
  { value: 'togglePlayerPastille', label: "Afficher / Masquer une Pastille sur $Joueur", category: 'visibility' }
] as ActionOption[]).sort((a, b) => a.label.localeCompare(b.label));

export const ActionEffectWindow: React.FC = () => {
  const { 
    actionEffectCreatorState, 
    setActionEffectCreatorState, 
    addPendingEffect,
    updatePendingEffect,
    pendingActionEffects,
    actions,
    players,
    roles,
    tags,
    teams,
    soundboard,
    handouts,
    coordinatePicker, 
    setCoordinatePicker
  } = useVttStore();
  
  const [type, setType] = useState<ActionEffectType>('deleteAllTags');
  const [category, setCategory] = useState<string>('attributes');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [enabled, setEnabled] = useState(true);
  const [variable, setVariable] = useState('$Ordre');
  const [operator, setOperator] = useState('=');
  const [value, setValue] = useState<number>(0);
  const [targetActionId, setTargetActionId] = useState<string>('');
  const [tagId, setTagId] = useState<string>('');
  const [roleId, setRoleId] = useState<string>('');
  const [teamId, setTeamId] = useState<string>('unchanged');
  const [roleTeamId, setRoleTeamId] = useState<string>('unchanged');
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdownMessage, setCountdownMessage] = useState('');
  const [soundName, setSoundName] = useState<string>('');
  const [handoutId, setHandoutId] = useState<string>('');
  const [privateMessage, setPrivateMessage] = useState<string>('');
  const [logMessage, setLogMessage] = useState<string>('');
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string>('');
  const [roomColor, setRoomColor] = useState<string>('#6B7280');
  const [pingColor, setPingColor] = useState<string>('#3b82f6');
  const [revealOnBoard, setRevealOnBoard] = useState(true);
  const [revealInSmartphoneRoom, setRevealInSmartphoneRoom] = useState(false);
  const [revealInSmartphonePlayers, setRevealInSmartphonePlayers] = useState(false);
  const [revealInSmartphoneGamePopup, setRevealInSmartphoneGamePopup] = useState(false);
  const [pastilleId, setPastilleId] = useState<string>('');
  const [pastilleIcon, setPastilleIcon] = useState<string>('Shield');
  const [pastilleColor, setPastilleColor] = useState<string>('#eab308');
  const [pastilleMode, setPastilleMode] = useState<'add' | 'remove' | 'toggle'>('toggle');
  const [swapTargetMode, setSwapTargetMode] = useState<'role' | 'tag' | 'random' | 'cible'>('tag');
  const [targetX, setTargetX] = useState<number>(0);
  const [targetY, setTargetY] = useState<number>(0);
  const [gatherRadius, setGatherRadius] = useState<number>(150);
  const [targetShape, setTargetShape] = useState<string>('circle');
  const [tagIncrement, setTagIncrement] = useState<number>(1);
  const [spreadRadius, setSpreadRadius] = useState<number>(200);
  const [seenAsRoleId, setSeenAsRoleId] = useState<string | null>(null);
  const [targetTab, setTargetTab] = useState<string>('game');
  const [vibrationDuration, setVibrationDuration] = useState<number>(200);
  const [lockMode, setLockMode] = useState<'lock' | 'unlock' | 'toggle'>('lock');
  const [pollQuestion, setPollQuestion] = useState<string>('');
  const [pollOptions, setPollOptions] = useState<string[]>(['Oui', 'Non']);
  const [groupVoteVotersRoleColor, setGroupVoteVotersRoleColor] = useState<string>('#ef4444');
  const [groupVoteHideVoters, setGroupVoteHideVoters] = useState<boolean>(false);
  const [groupVoteExcludeVoters, setGroupVoteExcludeVoters] = useState<boolean>(false);
  const [groupVoteMandatory, setGroupVoteMandatory] = useState<boolean>(false);
  const [groupVoteNoTies, setGroupVoteNoTies] = useState<boolean>(false);
  const [groupVoteTagId, setGroupVoteTagId] = useState<string>('');
  const [blindMode, setBlindMode] = useState<'blind' | 'unblind' | 'toggle'>('blind');
  const [diceSides, setDiceSides] = useState<number>(20);
  const [diceCount, setDiceCount] = useState<number>(1);
  const [actionEnabledMode, setActionEnabledMode] = useState<'enable' | 'disable' | 'toggle'>('enable');
  const [particleType, setParticleType] = useState<'confetti' | 'blood' | 'magic' | 'fire' | 'poison'>('confetti');
  const [particleDuration, setParticleDuration] = useState<number>(3000);
  const [killOnGraveyard, setKillOnGraveyard] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number, y: number, startX: number, startY: number } | null>(null);
  
  // Context override for triggerAction
  const [contextOverrideTargetPlayerId, setContextOverrideTargetPlayerId] = useState<string | null>(null);
  const [contextOverrideTargetCibleId, setContextOverrideTargetCibleId] = useState<string | null>(null);

  const isEditing = !!actionEffectCreatorState.editingEffectId;

  useEffect(() => {
    if (isEditing) {
      const effect = pendingActionEffects.find(e => e.id === actionEffectCreatorState.editingEffectId);
      if (effect) {
        setType(effect.type);
        const effectCategory = ACTION_OPTIONS.find(o => o.value === effect.type)?.category || 'all';
        setCategory(effectCategory);
        setEnabled(effect.enabled);
        setVariable(effect.variable || '$Ordre');
        setOperator(effect.operator || '=');
        setValue(effect.value || 0);
        setTargetActionId(effect.targetActionId || (actions.length > 0 ? actions[0].id : ''));
        setTagId(effect.tagId || (tags.length > 0 ? tags[0].id : ''));
        setRoleId(effect.roleId || (roles.length > 0 ? roles[0].id : ''));
        setTeamId(effect.teamId || 'unchanged');
        setRoleTeamId(effect.roleTeamId || 'unchanged');
        setShowCountdown(effect.showCountdown || false);
        setCountdownMessage(effect.countdownMessage || '');
        setSoundName(effect.soundName || (soundboard.buttons.length > 0 ? soundboard.buttons[0].name : ''));
        setHandoutId(effect.handoutId || (handouts.length > 0 ? handouts[0].id : ''));
        setPrivateMessage(effect.privateMessage || '');
        setLogMessage(effect.logMessage || '');
        setBackgroundImageUrl(effect.backgroundImageUrl || '');
        setRoomColor(effect.roomColor || '#6B7280');
        setPingColor(effect.pingColor || '#3b82f6');
        setRevealOnBoard(effect.revealOnBoard ?? true);
        setRevealInSmartphoneRoom(effect.revealInSmartphoneRoom ?? false);
        setRevealInSmartphonePlayers(effect.revealInSmartphonePlayers ?? false);
        setRevealInSmartphoneGamePopup(effect.revealInSmartphoneGamePopup ?? false);
        setPastilleId(effect.pastilleId || '');
        setPastilleIcon(effect.pastilleIcon || 'Shield');
        setPastilleColor(effect.pastilleColor || '#eab308');
        setPastilleMode(effect.pastilleMode || 'toggle');
        setSwapTargetMode(effect.swapTargetMode || 'tag');
        setTargetX(effect.targetX || 0);
        setTargetY(effect.targetY || 0);
        setGatherRadius(effect.gatherRadius || 150);
        setTargetShape(effect.targetShape || 'circle');
        setTagIncrement(effect.tagIncrement || 1);
        setSpreadRadius(effect.spreadRadius || 200);
        setSeenAsRoleId(effect.seenAsRoleId || null);
        setTargetTab(effect.targetTab || 'game');
        setVibrationDuration(effect.vibrationDuration || 200);
        setLockMode(effect.lockMode || 'lock');
        setPollQuestion(effect.pollQuestion || '');
        setPollOptions(effect.pollOptions || ['Oui', 'Non']);
        setGroupVoteVotersRoleColor(effect.groupVoteVotersRoleColor || '#ef4444');
        setGroupVoteHideVoters(effect.groupVoteHideVoters || false);
        setGroupVoteExcludeVoters(effect.groupVoteExcludeVoters || false);
        setGroupVoteMandatory(effect.groupVoteMandatory || false);
        setGroupVoteNoTies(effect.groupVoteNoTies || false);
        setGroupVoteTagId(effect.groupVoteTagId || '');
        setBlindMode(effect.blindMode || 'blind');
        setDiceSides(effect.diceSides || 20);
        setDiceCount(effect.diceCount || 1);
        setActionEnabledMode(effect.actionEnabledMode || 'enable');
        setParticleType(effect.particleType || 'confetti');
        setParticleDuration(effect.particleDuration || 3000);
        setKillOnGraveyard(effect.killOnGraveyard || false);
        setContextOverrideTargetPlayerId(effect.contextOverride?.targetPlayerId ?? null);
        setContextOverrideTargetCibleId(effect.contextOverride?.targetCibleId ?? null);
      }
    } else {
      setType('deleteAllTags');
      setCategory('attributes');
      setEnabled(true);
      setVariable('$Ordre');
      setOperator('=');
      setValue(0);
      setTargetActionId(actions.length > 0 ? actions[0].id : '');
      setTagId(tags.length > 0 ? tags[0].id : '');
      setRoleId(roles.length > 0 ? roles[0].id : '');
      setTeamId('unchanged');
      setRoleTeamId('unchanged');
      setShowCountdown(false);
      setCountdownMessage('');
      setContextOverrideTargetPlayerId(null);
      setContextOverrideTargetCibleId(null);
      setSoundName(soundboard.buttons.length > 0 ? soundboard.buttons[0].name : '');
      setHandoutId(handouts.length > 0 ? handouts[0].id : '');
      setPrivateMessage('');
      setLogMessage('');
      setBackgroundImageUrl('');
      setRoomColor('#6B7280');
      setPingColor('#3b82f6');
      setRevealOnBoard(true);
      setRevealInSmartphoneRoom(false);
      setRevealInSmartphonePlayers(false);
      setRevealInSmartphoneGamePopup(false);
      setPastilleId('');
      setPastilleIcon('Shield');
      setPastilleColor('#eab308');
      setPastilleMode('toggle');
      setSwapTargetMode('tag');
      setTargetX(0);
      setTargetY(0);
      setGatherRadius(150);
      setTargetShape('circle');
      setTagIncrement(1);
      setSpreadRadius(200);
      setSeenAsRoleId(null);
      setTargetTab('game');
      setVibrationDuration(200);
      setLockMode('lock');
      setPollQuestion('');
      setPollOptions(['Oui', 'Non']);
      setGroupVoteVotersRoleColor('#ef4444');
      setGroupVoteHideVoters(false);
      setGroupVoteExcludeVoters(false);
      setGroupVoteMandatory(false);
      setGroupVoteNoTies(false);
      setGroupVoteTagId('');
      setBlindMode('blind');
      setDiceSides(20);
      setDiceCount(1);
      setActionEnabledMode('enable');
    setParticleType('confetti');
    setParticleDuration(3000);
    setKillOnGraveyard(false);
  }
  }, [isEditing, actionEffectCreatorState.editingEffectId, pendingActionEffects, actions, tags, roles, teams, soundboard, handouts]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !dragStartRef.current) return;
      
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      
      setActionEffectCreatorState({
        x: dragStartRef.current.startX + dx,
        y: dragStartRef.current.startY + dy
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragStartRef.current = null;
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, setActionEffectCreatorState]);

  if (!actionEffectCreatorState.isOpen) return null;

  const handleClose = () => {
    setActionEffectCreatorState({ isOpen: false, editingEffectId: null });
  };

  const handleOK = () => {
    const data = { 
      type, 
      enabled,
      variable: (type === 'modifyVariable' || type === 'sortCallOrderByStat' || type === 'alertVariable' || type === 'popupVariable') ? variable : undefined,
      operator: (type === 'modifyVariable' || type === 'sortCallOrderByStat') ? operator : undefined,
      value: (type === 'modifyVariable' || type === 'wait' || type === 'setDayNumber' || type === 'setNightNumber' || type === 'setPhaseDuration') ? value : undefined,
      targetActionId: type === 'triggerAction' ? targetActionId : undefined,
      tagId: (type === 'assignTagToRole' || type === 'removeTagFromRole') ? tagId : undefined,
      roleId: (type === 'assignTagToRole' || type === 'removeTagFromRole' || type === 'assignTeamToRole') ? roleId : undefined,
      teamId: (type === 'assignTeam' || type === 'assignTeamToRole') ? teamId : undefined,
      roleTeamId: type === 'assignTeam' ? roleTeamId : undefined,
      showCountdown: type === 'wait' ? showCountdown : undefined,
      countdownMessage: type === 'wait' ? countdownMessage : undefined,
      soundName: type === 'playSound' ? soundName : undefined,
      handoutId: type === 'showHandout' ? handoutId : undefined,
      privateMessage: type === 'sendPrivateMessage' ? privateMessage : undefined,
      logMessage: type === 'addSystemLog' ? logMessage : undefined,
      backgroundImageUrl: type === 'setRoomBackground' ? backgroundImageUrl : undefined,
      roomColor: type === 'setRoomColor' ? roomColor : undefined,
      pingColor: type === 'pingPlayer' ? pingColor : undefined,
      revealOnBoard: type === 'revealPlayerRole' ? revealOnBoard : undefined,
      revealInSmartphoneRoom: type === 'revealPlayerRole' ? revealInSmartphoneRoom : undefined,
      revealInSmartphonePlayers: type === 'revealPlayerRole' ? revealInSmartphonePlayers : undefined,
      revealInSmartphoneGamePopup: type === 'revealPlayerRole' ? revealInSmartphoneGamePopup : undefined,
      pastilleId: type === 'togglePlayerPastille' ? pastilleId : undefined,
      pastilleIcon: type === 'togglePlayerPastille' ? pastilleIcon : undefined,
      pastilleColor: type === 'togglePlayerPastille' ? pastilleColor : undefined,
      pastilleMode: type === 'togglePlayerPastille' ? pastilleMode : undefined,
      swapTargetMode: (type === 'swapPlayerRole' || type === 'swapPlayerTags' || type === 'joinTargetTeam' || type === 'stealRoleAndKill') ? swapTargetMode : undefined,
      targetX: (type === 'movePlayerToGraveyard' || type === 'moveCibleToGraveyard' || type === 'gatherPlayers') ? targetX : undefined,
      targetY: (type === 'movePlayerToGraveyard' || type === 'moveCibleToGraveyard' || type === 'gatherPlayers') ? targetY : undefined,
      gatherRadius: type === 'gatherPlayers' ? gatherRadius : undefined,
      targetShape: type === 'changePlayerShape' ? (targetShape as any) : undefined,
      tagIncrement: type === 'incrementTagValue' ? tagIncrement : undefined,
      spreadRadius: type === 'spreadTag' ? spreadRadius : undefined,
      seenAsRoleId: type === 'setFakeRole' ? seenAsRoleId : undefined,
      targetTab: type === 'forceSmartphoneTab' ? targetTab : undefined,
      vibrationDuration: type === 'vibrateSmartphone' ? vibrationDuration : undefined,
      lockMode: type === 'lockSmartphone' ? lockMode : undefined,
      pollQuestion: (type === 'sendPollToSmartphone' || type === 'sendGroupVoteToSmartphone') ? pollQuestion : undefined,
      pollOptions: type === 'sendPollToSmartphone' ? pollOptions : undefined,
      groupVoteVotersRoleColor: type === 'sendGroupVoteToSmartphone' ? groupVoteVotersRoleColor : undefined,
      groupVoteHideVoters: type === 'sendGroupVoteToSmartphone' ? groupVoteHideVoters : undefined,
      groupVoteExcludeVoters: type === 'sendGroupVoteToSmartphone' ? groupVoteExcludeVoters : undefined,
      groupVoteMandatory: type === 'sendGroupVoteToSmartphone' ? groupVoteMandatory : undefined,
      groupVoteNoTies: type === 'sendGroupVoteToSmartphone' ? groupVoteNoTies : undefined,
      groupVoteTagId: type === 'sendGroupVoteToSmartphone' ? groupVoteTagId : undefined,
      blindMode: type === 'blindPlayer' ? blindMode : undefined,
      diceSides: type === 'rollDice' ? diceSides : undefined,
      diceCount: type === 'rollDice' ? diceCount : undefined,
      actionEnabledMode: type === 'toggleActionEnabled' ? actionEnabledMode : undefined,
      particleType: type === 'playParticleEffect' ? particleType : undefined,
      particleDuration: type === 'playParticleEffect' ? particleDuration : undefined,
      killOnGraveyard: (type === 'movePlayerToGraveyard' || type === 'moveCibleToGraveyard') ? killOnGraveyard : undefined,
      contextOverride: type === 'triggerAction' ? {
        targetPlayerId: contextOverrideTargetPlayerId,
        targetCibleId: contextOverrideTargetCibleId
      } : undefined
    };
    if (isEditing && actionEffectCreatorState.editingEffectId) {
      updatePendingEffect(actionEffectCreatorState.editingEffectId, data);
    } else {
      addPendingEffect(data);
    }
    handleClose();
  };

  return (
    <div 
      className={`fixed z-[3100] w-96 bg-card border-2 border-indigo-500/30 rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 ${isDragging ? 'opacity-90' : ''} ${coordinatePicker?.isActive ? 'opacity-0 pointer-events-none' : ''}`}
      style={{
        left: actionEffectCreatorState.x,
        top: actionEffectCreatorState.y,
      }}
    >
      <div 
        className="px-4 py-3 bg-indigo-500/10 border-b border-indigo-500/20 flex items-center justify-between cursor-move group select-none"
        onMouseDown={(e) => {
          setIsDragging(true);
          dragStartRef.current = {
            x: e.clientX,
            y: e.clientY,
            startX: actionEffectCreatorState.x,
            startY: actionEffectCreatorState.y
          };
        }}
      >
        <div className="flex items-center gap-2 text-indigo-400">
          <span className="font-bold text-sm tracking-tight text-foreground uppercase">Ajouter une action</span>
        </div>
        <button 
          onClick={handleClose}
          onMouseDown={e => e.stopPropagation()}
          className="p-1.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-full transition-all"
          title="Fermer la fenêtre"
          aria-label="Fermer la fenêtre"
        >
          <X size={16} />
        </button>
      </div>

      <div className="p-5 flex flex-col gap-5 bg-background/50">
        <div className="flex flex-col gap-4">
          {/* Status first */}
          <label htmlFor="effect-enabled-toggle" className="flex items-center gap-3 p-3 bg-muted/20 border border-border rounded-lg cursor-pointer hover:bg-muted/40 transition-colors">
            <input
              id="effect-enabled-toggle"
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="w-5 h-5 rounded border-border text-indigo-500 focus:ring-indigo-500 transition-all"
            />
            <div className="flex flex-col">
              <span className="text-sm font-bold">Activer cette action</span>
              <span className="text-[10px] text-muted-foreground italic">Définit si cette action spécifique sera exécutée</span>
            </div>
          </label>

          {/* Catégorie */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="effect-category-select" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Catégorie d'action</label>
            <select
              id="effect-category-select"
              value={category}
              onChange={(e) => {
                const newCat = e.target.value;
                setCategory(newCat);
                const availableOptions = ACTION_OPTIONS.filter(o => newCat === 'all' || o.category === newCat);
                if (availableOptions.length > 0 && !availableOptions.some(o => o.value === type)) {
                  const newType = availableOptions[0].value;
                  setType(newType);
                  if (newType === 'sortCallOrderByStat') {
                    setVariable('lives');
                    setOperator('asc');
                  }
                }
              }}
              className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm outline-none transition-all shadow-sm focus:border-indigo-500/50 font-bold"
            >
              {ACTION_CATEGORIES.map(c => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Recherche */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="effect-search" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Rechercher une action</label>
            <input
              id="effect-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Taper pour filtrer les actions..."
              className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm outline-none transition-all shadow-sm focus:border-indigo-500/50"
            />
          </div>

          {/* Type second */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="effect-type-select" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Type d'action</label>
            <select
              id="effect-type-select"
              value={type}
              onChange={(e) => {
                const newType = e.target.value as any;
                setType(newType);
                if (newType === 'sortCallOrderByStat') {
                  setVariable('lives');
                  setOperator('asc');
                }
              }}
              className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm outline-none transition-all shadow-sm focus:border-indigo-500/50"
            >
              {ACTION_OPTIONS
                .filter(o => category === 'all' || o.category === category)
                .filter(o => searchQuery === '' || o.label.toLowerCase().includes(searchQuery.toLowerCase()))
                .map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            {searchQuery && (
              <p className="text-[9px] text-muted-foreground pl-1">
                {ACTION_OPTIONS.filter(o => category === 'all' || o.category === category).filter(o => o.label.toLowerCase().includes(searchQuery.toLowerCase())).length} action(s) trouvée(s)
              </p>
            )}
          </div>

          {(type === 'setDayNumber' || type === 'setNightNumber' || type === 'setPhaseDuration') && (
            <div className="flex flex-col gap-3 p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-lg animate-in slide-in-from-top-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="effect-cycle-value" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">
                  {type === 'setPhaseDuration' ? 'Durée de la phase (en secondes)' : `Numéro du ${type === 'setDayNumber' ? 'Jour' : 'Nuit'}`}
                </label>
                <input
                  id="effect-cycle-value"
                  type="number"
                  min={type === 'setPhaseDuration' ? "0" : "1"}
                  value={value}
                  onChange={(e) => setValue(Number(e.target.value))}
                  className="w-full bg-input border border-border rounded-lg px-3 py-1.5 text-xs outline-none focus:border-indigo-500/50"
                />
              </div>
            </div>
          )}

          {type === 'sortCallOrderByStat' && (
            <div className="flex flex-col gap-3 p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-lg animate-in slide-in-from-top-2">
               <div className="flex flex-col gap-1.5">
                  <label htmlFor="effect-stat-select" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Statistique</label>
                  <select
                    id="effect-stat-select"
                    value={variable}
                    onChange={(e) => setVariable(e.target.value)}
                    className="w-full bg-input border border-border rounded-lg px-3 py-1.5 text-xs outline-none focus:border-indigo-500/50"
                  >
                    <option value="lives">Points de Vie</option>
                    <option value="points">Points de victoire</option>
                    <option value="votes">Votes reçus</option>
                  </select>
               </div>
               <div className="flex flex-col gap-1.5">
                  <label htmlFor="effect-sort-direction" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Ordre de tri</label>
                  <select
                    id="effect-sort-direction"
                    value={operator}
                    onChange={(e) => setOperator(e.target.value)}
                    className="w-full bg-input border border-border rounded-lg px-3 py-1.5 text-xs outline-none focus:border-indigo-500/50"
                  >
                    <option value="asc">Croissant (Le plus faible en premier)</option>
                    <option value="desc">Décroissant (Le plus fort en premier)</option>
                  </select>
               </div>
            </div>
          )}

          {type === 'wait' && (
            <div className="flex flex-col gap-3 p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-lg animate-in slide-in-from-top-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="effect-wait-value" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Durée (secondes)</label>
                <input
                  id="effect-wait-value"
                  type="number"
                  min="0"
                  step="0.1"
                  value={value}
                  onChange={(e) => setValue(Number(e.target.value))}
                  className="w-full bg-input border border-border rounded-lg px-3 py-1.5 text-xs outline-none focus:border-indigo-500/50"
                />
              </div>
              
              <div className="flex flex-col gap-2 pt-1 border-t border-indigo-500/10 mt-1">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${showCountdown ? 'bg-indigo-500 border-indigo-500' : 'border-border group-hover:border-indigo-500/50'}`}>
                    {showCountdown && <Check size={12} className="text-white" />}
                  </div>
                  <input
                    type="checkbox"
                    checked={showCountdown}
                    onChange={(e) => setShowCountdown(e.target.checked)}
                    className="hidden"
                  />
                  <span className="text-xs font-medium">Compte à rebours sur smartphone</span>
                </label>

                {showCountdown && (
                  <div className="flex flex-col gap-1.5 animate-in slide-in-from-top-1">
                    <label htmlFor="effect-countdown-message" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Message sur smartphone</label>
                    <input
                      id="effect-countdown-message"
                      type="text"
                      value={countdownMessage}
                      onChange={(e) => setCountdownMessage(e.target.value)}
                      placeholder="Ex: Fin du vote dans..."
                      className="w-full bg-input border border-border rounded-lg px-3 py-1.5 text-xs outline-none focus:border-indigo-500/50"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {type === 'forceSmartphoneTab' && (
            <div className="flex flex-col gap-1.5 p-3 bg-fuchsia-500/5 border border-fuchsia-500/20 rounded-lg animate-in slide-in-from-top-2">
              <label htmlFor="effect-target-tab-select" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Onglet cible (Smartphone)</label>
              <select
                id="effect-target-tab-select"
                value={targetTab}
                onChange={(e) => setTargetTab(e.target.value)}
                className="w-full bg-input border border-border rounded-lg px-3 py-1.5 text-xs outline-none focus:border-fuchsia-500/50"
              >
                <option value="game">Onglet : Jeu</option>
                <option value="room">Onglet : Salle</option>
                <option value="players">Onglet : Joueurs</option>
                <option value="wiki">Onglet : Wiki</option>
                <option value="handouts">Onglet : Documents</option>
                <option value="logs">Onglet : Journal</option>
              </select>
              <p className="text-[10px] text-zinc-500 italic px-1 mt-1">L'interface du joueur basculera automatiquement sur cet onglet.</p>
            </div>
          )}

          {type === 'vibrateSmartphone' && (
            <div className="flex flex-col gap-1.5 p-3 bg-fuchsia-500/5 border border-fuchsia-500/20 rounded-lg animate-in slide-in-from-top-2">
              <label htmlFor="effect-vibration-duration" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Durée de la vibration (ms)</label>
              <div className="flex items-center gap-3">
                <input
                  id="effect-vibration-duration"
                  type="number"
                  min="50"
                  max="5000"
                  step="50"
                  value={vibrationDuration}
                  onChange={(e) => setVibrationDuration(parseInt(e.target.value) || 200)}
                  className="flex-1 bg-input border border-border rounded-lg px-3 py-1.5 text-xs outline-none focus:border-fuchsia-500/50"
                />
                <span className="text-[10px] text-zinc-500 font-medium">ms</span>
              </div>
              <p className="text-[10px] text-zinc-500 italic px-1 mt-1">Le smartphone de $Joueur vibrera pendant cette durée.</p>
            </div>
          )}

          {type === 'lockSmartphone' && (
            <div className="flex flex-col gap-1.5 p-3 bg-fuchsia-500/5 border border-fuchsia-500/20 rounded-lg animate-in slide-in-from-top-2">
              <label htmlFor="effect-lock-mode" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Action de verrouillage</label>
              <select
                id="effect-lock-mode"
                value={lockMode}
                onChange={(e) => setLockMode(e.target.value as any)}
                className="w-full bg-input border border-border rounded-lg px-3 py-1.5 text-xs outline-none focus:border-fuchsia-500/50"
              >
                <option value="lock">Verrouiller</option>
                <option value="unlock">Déverrouiller</option>
                <option value="toggle">Basculer (Verrouiller / Déverrouiller)</option>
              </select>
              <p className="text-[10px] text-zinc-500 italic px-1 mt-1">Empêche toute interaction sur le smartphone de $Joueur.</p>
            </div>
          )}

          {type === 'sendPollToSmartphone' && (
            <div className="flex flex-col gap-3 p-3 bg-fuchsia-500/5 border border-fuchsia-500/20 rounded-lg animate-in slide-in-from-top-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="poll-question" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Question du sondage</label>
                <input
                  id="poll-question"
                  type="text"
                  placeholder="Posez votre question ici..."
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                  className="w-full bg-input border border-border rounded-lg px-3 py-1.5 text-xs outline-none focus:border-fuchsia-500/50"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between pl-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Options de réponse</label>
                  <button 
                    onClick={() => setPollOptions([...pollOptions, ''])}
                    title="Ajouter une option de réponse"
                    aria-label="Ajouter une option de réponse"
                    className="text-[9px] font-bold text-fuchsia-400 hover:text-fuchsia-300 uppercase tracking-widest"
                  >
                    + Ajouter
                  </button>
                </div>
                <div className="flex flex-col gap-2">
                  {pollOptions.map((option, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder={`Option ${idx + 1}`}
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...pollOptions];
                          newOptions[idx] = e.target.value;
                          setPollOptions(newOptions);
                        }}
                        className="flex-1 bg-zinc-950/40 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-fuchsia-500/30"
                      />
                      {pollOptions.length > 2 && (
                        <button 
                          onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== idx))}
                          title="Supprimer cette option"
                          aria-label="Supprimer cette option"
                          className="p-1.5 bg-zinc-800 hover:bg-red-950/50 hover:text-red-400 rounded-lg transition-colors"
                        >
                          <icons.X size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-[10px] text-zinc-500 italic px-1 mt-1">Le joueur recevra ce choix sur son smartphone et pourra y répondre une seule fois.</p>
            </div>
          )}

          {type === 'sendGroupVoteToSmartphone' && (
            <div className="flex flex-col gap-3 p-3 bg-fuchsia-500/5 border border-fuchsia-500/20 rounded-lg animate-in slide-in-from-top-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="group-vote-question" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Question du Vote</label>
                <input
                  id="group-vote-question"
                  type="text"
                  placeholder="Ex: Qui voulez-vous dévorer ?"
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                  className="w-full bg-input border border-border rounded-lg px-3 py-1.5 text-xs outline-none focus:border-fuchsia-500/50"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="group-vote-color" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Couleur des votants (ex: #ff0000)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    id="group-vote-color"
                    value={groupVoteVotersRoleColor}
                    onChange={(e) => setGroupVoteVotersRoleColor(e.target.value)}
                    className="w-8 h-8 rounded border-none cursor-pointer bg-transparent"
                  />
                  <span className="text-xs font-mono">{groupVoteVotersRoleColor}</span>
                </div>
                <p className="text-[10px] text-zinc-500 italic px-1">La couleur utilisée pour mettre en évidence les noms des votants (ex: rouge pour les loups).</p>
              </div>

              <div className="flex flex-col gap-2 pt-1 border-t border-indigo-500/10 mt-1">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${groupVoteHideVoters ? 'bg-indigo-500 border-indigo-500' : 'border-border group-hover:border-indigo-500/50'}`}>
                    {groupVoteHideVoters && <Check size={12} className="text-white" />}
                  </div>
                  <input
                    type="checkbox"
                    checked={groupVoteHideVoters}
                    onChange={(e) => setGroupVoteHideVoters(e.target.checked)}
                    className="hidden"
                  />
                  <span className="text-xs font-medium">Masquer les votants</span>
                </label>
                <p className="text-[10px] text-zinc-500 italic px-6 -mt-1">Si coché, les joueurs ne verront pas qui a voté quoi (vote anonyme).</p>
              </div>

              <div className="flex flex-col gap-2 pt-1 border-t border-indigo-500/10 mt-1">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${groupVoteExcludeVoters ? 'bg-indigo-500 border-indigo-500' : 'border-border group-hover:border-indigo-500/50'}`}>
                    {groupVoteExcludeVoters && <Check size={12} className="text-white" />}
                  </div>
                  <input
                    type="checkbox"
                    checked={groupVoteExcludeVoters}
                    onChange={(e) => setGroupVoteExcludeVoters(e.target.checked)}
                    className="hidden"
                  />
                  <span className="text-xs font-medium">Exclure les votants de la sélection</span>
                </label>
                <p className="text-[10px] text-zinc-500 italic px-6 -mt-1">Si coché, les joueurs ayant le droit de voter ne pourront pas être choisis comme cible.</p>
              </div>

              <div className="flex flex-col gap-2 pt-1 border-t border-indigo-500/10 mt-1">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${groupVoteMandatory ? 'bg-indigo-500 border-indigo-500' : 'border-border group-hover:border-indigo-500/50'}`}>
                    {groupVoteMandatory && <Check size={12} className="text-white" />}
                  </div>
                  <input
                    type="checkbox"
                    checked={groupVoteMandatory}
                    onChange={(e) => setGroupVoteMandatory(e.target.checked)}
                    className="hidden"
                  />
                  <span className="text-xs font-medium">Vote obligatoire</span>
                </label>
                <p className="text-[10px] text-zinc-500 italic px-6 -mt-1">Si coché, le bouton de validation n'apparaîtra que lorsque tous les votants auront voté.</p>
              </div>

              <div className="flex flex-col gap-2 pt-1 border-t border-indigo-500/10 mt-1">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${groupVoteNoTies ? 'bg-indigo-500 border-indigo-500' : 'border-border group-hover:border-indigo-500/50'}`}>
                    {groupVoteNoTies && <Check size={12} className="text-white" />}
                  </div>
                  <input
                    type="checkbox"
                    checked={groupVoteNoTies}
                    onChange={(e) => setGroupVoteNoTies(e.target.checked)}
                    className="hidden"
                  />
                  <span className="text-xs font-medium">Interdire les égalités</span>
                </label>
                <p className="text-[10px] text-zinc-500 italic px-6 -mt-1">Si coché, le bouton de validation n'apparaîtra pas s'il y a une égalité entre les cibles les plus votées.</p>
              </div>

              <div className="flex flex-col gap-1.5 pt-2 border-t border-indigo-500/10 mt-1">
                <label htmlFor="group-vote-tag-select" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Tag à poser sur le vainqueur</label>
                <select
                  id="group-vote-tag-select"
                  value={groupVoteTagId}
                  onChange={(e) => setGroupVoteTagId(e.target.value)}
                  className="w-full bg-input border border-border rounded-lg px-3 py-1.5 text-xs outline-none focus:border-indigo-500/50"
                >
                  <option value="">Aucun tag</option>
                  {[...useVttStore.getState().tags].sort((a, b) => a.name.localeCompare(b.name)).map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                <p className="text-[10px] text-zinc-500 italic px-1">Le tag choisi sera automatiquement assigné au joueur ayant reçu le plus de votes.</p>
              </div>

              <p className="text-[10px] text-zinc-500 italic px-1 mt-1">Un vote global sera affiché. Les joueurs ciblés par la condition verront ce vote sur la liste des joueurs.</p>
            </div>
          )}

          {type === 'blindPlayer' && (
            <div className="flex flex-col gap-1.5 p-3 bg-fuchsia-500/5 border border-fuchsia-500/20 rounded-lg animate-in slide-in-from-top-2">
              <label htmlFor="effect-blind-mode" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Action de cécité</label>
              <select
                id="effect-blind-mode"
                value={blindMode}
                onChange={(e) => setBlindMode(e.target.value as any)}
                className="w-full bg-input border border-border rounded-lg px-3 py-1.5 text-xs outline-none focus:border-fuchsia-500/50"
              >
                <option value="blind">Aveugler (Masquer la salle)</option>
                <option value="unblind">Rendre la vue (Afficher la salle)</option>
                <option value="toggle">Basculer l'état</option>
              </select>
              <p className="text-[10px] text-zinc-500 italic px-1 mt-1">Empêche $Joueur de voir la miniature de la salle sur son smartphone.</p>
            </div>
          )}

          {type === 'rollDice' && (
            <div className="flex flex-col gap-3 p-3 bg-fuchsia-500/5 border border-fuchsia-500/20 rounded-lg animate-in slide-in-from-top-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="effect-dice-count" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Nombre de dés</label>
                  <input
                    id="effect-dice-count"
                    type="number"
                    min="1"
                    max="100"
                    value={diceCount}
                    onChange={(e) => setDiceCount(parseInt(e.target.value) || 1)}
                    className="w-full bg-input border border-border rounded-lg px-3 py-1.5 text-xs outline-none focus:border-fuchsia-500/50"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="effect-dice-sides" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Faces (ex: 6, 20)</label>
                  <input
                    id="effect-dice-sides"
                    type="number"
                    min="2"
                    max="1000"
                    value={diceSides}
                    onChange={(e) => setDiceSides(parseInt(e.target.value) || 20)}
                    className="w-full bg-input border border-border rounded-lg px-3 py-1.5 text-xs outline-none focus:border-fuchsia-500/50"
                  />
                </div>
              </div>
              <p className="text-[10px] text-zinc-500 italic px-1 mt-1">Génère un lancer de {diceCount}d{diceSides} pour $Joueur.</p>
            </div>
          )}

          {type === 'toggleActionEnabled' && (
            <div className="flex flex-col gap-3 p-3 bg-fuchsia-500/5 border border-fuchsia-500/20 rounded-lg animate-in slide-in-from-top-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="effect-toggle-action-target" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Action cible</label>
                <select
                  id="effect-toggle-action-target"
                  value={targetActionId}
                  onChange={(e) => setTargetActionId(e.target.value)}
                  className="w-full bg-input border border-border rounded-lg px-3 py-1.5 text-xs outline-none focus:border-fuchsia-500/50"
                >
                  <option value="">Sélectionner une action...</option>
                  {actions.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="effect-action-enabled-mode" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Nouvel état</label>
                <select
                  id="effect-action-enabled-mode"
                  value={actionEnabledMode}
                  onChange={(e) => setActionEnabledMode(e.target.value as any)}
                  className="w-full bg-input border border-border rounded-lg px-3 py-1.5 text-xs outline-none focus:border-fuchsia-500/50"
                >
                  <option value="enable">Activer l'action</option>
                  <option value="disable">Désactiver l'action</option>
                  <option value="toggle">Basculer l'état (On/Off)</option>
                </select>
              </div>
              <p className="text-[10px] text-zinc-500 italic px-1 mt-1">Modifie la disponibilité de l'action cible pour les futures exécutions.</p>
            </div>
          )}

          {type === 'playParticleEffect' && (
            <div className="flex flex-col gap-3 p-3 bg-fuchsia-500/5 border border-fuchsia-500/20 rounded-lg animate-in slide-in-from-top-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="effect-particle-type" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Type de Particules</label>
                <select
                  id="effect-particle-type"
                  value={particleType}
                  onChange={(e) => setParticleType(e.target.value as any)}
                  className="w-full bg-input border border-border rounded-lg px-3 py-1.5 text-xs outline-none focus:border-fuchsia-500/50"
                >
                  <option value="confetti">🎉 Confettis (Victoire, Réussite)</option>
                  <option value="blood">🩸 Éclaboussure de Sang (Dégâts physiques)</option>
                  <option value="magic">✨ Étincelles Magiques (Soins, Buff, Magie)</option>
                  <option value="fire">🔥 Flammes / Explosion (Feu, Dégâts de zone)</option>
                  <option value="poison">☠️ Bulles Toxiques (Poison, Malédiction)</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="effect-particle-duration" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Durée (millisecondes)</label>
                <input
                  id="effect-particle-duration"
                  type="number"
                  min="500"
                  max="10000"
                  step="500"
                  value={particleDuration}
                  onChange={(e) => setParticleDuration(parseInt(e.target.value) || 3000)}
                  className="w-full bg-input border border-border rounded-lg px-3 py-1.5 text-xs outline-none focus:border-fuchsia-500/50"
                />
              </div>
              <p className="text-[10px] text-zinc-500 italic px-1 mt-1">Déclenche une animation immersive sur l'écran du joueur cible.</p>
            </div>
          )}

          {type === 'triggerAction' && (
            <div className="flex flex-col gap-1.5 p-3 bg-orange-500/5 border border-orange-500/20 rounded-lg animate-in slide-in-from-top-2">
              <label htmlFor="effect-trigger-action" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Action à exécuter</label>
              <select
                id="effect-trigger-action"
                value={targetActionId}
                onChange={(e) => setTargetActionId(e.target.value)}
                className="w-full bg-input border border-border rounded-lg px-3 py-1.5 text-xs outline-none focus:border-orange-500/50"
              >
                {actions.length === 0 && <option value="">Aucune action disponible</option>}
                {actions.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
              
              {/* Context Override Section */}
              <div className="border-t border-orange-500/20 pt-3 mt-2">
                <label className="text-[10px] font-bold text-orange-400 uppercase tracking-widest pl-1 mb-2 block">Contexte d'exécution (optionnel)</label>
                
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="context-joueur" className="text-[9px] text-muted-foreground pl-1">$Joueur →</label>
                  <select
                    id="context-joueur"
                    value={contextOverrideTargetPlayerId ?? ''}
                    onChange={(e) => setContextOverrideTargetPlayerId(e.target.value || null)}
                    className="w-full bg-input border border-border rounded-lg px-2 py-1 text-xs outline-none focus:border-orange-500/50"
                  >
                    <option value="">Hériter du parent</option>
                    <option value="null">Aucun (vide)</option>
                    {players.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex flex-col gap-1.5 mt-2">
                  <label htmlFor="context-cible" className="text-[9px] text-muted-foreground pl-1">$Cible →</label>
                  <select
                    id="context-cible"
                    value={contextOverrideTargetCibleId ?? ''}
                    onChange={(e) => setContextOverrideTargetCibleId(e.target.value || null)}
                    className="w-full bg-input border border-border rounded-lg px-2 py-1 text-xs outline-none focus:border-orange-500/50"
                  >
                    <option value="">Hériter du parent</option>
                    <option value="null">Aucun (vide)</option>
                    {players.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                
                <p className="text-[9px] text-muted-foreground italic px-1 mt-2">
                  Permet de changer les variables $Joueur et $Cible pour cette sous-action uniquement.
                </p>
              </div>
            </div>
          )}

          {(type === 'assignTag' || type === 'removeTag' || type === 'checkTag' || type === 'incrementTagValue' || type === 'spreadTag') && (
            <div className="flex flex-col gap-3 p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-lg animate-in slide-in-from-top-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="effect-tag-select" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">
                  {type === 'spreadTag' ? 'Tag à propager' : (type === 'assignTag' ? 'Tag à assigner' : (type === 'removeTag' ? 'Tag à enlever' : 'Tag cible'))}
                </label>
                <select
                  id="effect-tag-select"
                  value={tagId}
                  onChange={(e) => setTagId(e.target.value)}
                  className="w-full bg-input border border-border rounded-lg px-3 py-1.5 text-xs outline-none focus:border-indigo-500/50"
                >
                  {tags.length === 0 && <option value="">Aucun tag disponible</option>}
                  {tags.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              
              {type === 'incrementTagValue' && (
                <div className="flex flex-col gap-1.5 animate-in fade-in pt-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1 text-fuchsia-400">Combien de charges à ajouter ?</label>
                  <input
                    title="Valeur à ajouter ou soustraire"
                    type="number"
                    value={tagIncrement}
                    onChange={(e) => setTagIncrement(Number(e.target.value))}
                    className="w-full bg-input border border-border rounded-lg px-3 py-1.5 text-xs outline-none focus:border-fuchsia-500/50"
                  />
                  <p className="text-[10px] text-zinc-500 italic px-1 mt-1">Utilisez un nombre négatif pour soustraire (ex: -1).</p>
                </div>
              )}
              {type === 'spreadTag' && (
                <div className="flex flex-col gap-1.5 animate-in fade-in pt-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1 text-fuchsia-400">Rayon de propagation</label>
                  <div className="flex items-center gap-3">
                    <input
                      title="Rayon de propagation"
                      type="range"
                      min="50"
                      max="1000"
                      step="10"
                      value={spreadRadius}
                      onChange={(e) => setSpreadRadius(Number(e.target.value))}
                      className="flex-1 accent-fuchsia-500"
                    />
                    <span className="text-xs font-bold w-12 text-right">{spreadRadius}px</span>
                  </div>
                  <p className="text-[10px] text-zinc-500 italic px-1 mt-1">Tous les joueurs présents dans ce rayon autour de la cible recevront le Tag.</p>
                </div>
              )}
            </div>
          )}

          {type === 'setFakeRole' && (
            <div className="flex flex-col gap-1.5 p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-lg animate-in slide-in-from-top-2">
              <label htmlFor="effect-fake-role-select" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Rôle factice à assigner à $Joueur</label>
              <select
                id="effect-fake-role-select"
                value={seenAsRoleId || ''}
                onChange={(e) => setSeenAsRoleId(e.target.value || null)}
                className="w-full bg-input border border-border rounded-lg px-3 py-1.5 text-xs outline-none focus:border-indigo-500/50"
              >
                <option value="">(Aucun / Réinitialiser)</option>
                {roles.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
              <p className="text-[10px] text-zinc-500 italic px-1 mt-1">Ce rôle sera celui détecté par les actions de vérification (ex: inspection).</p>
            </div>
          )}

          {type === 'assignRole' && (
            <div className="flex flex-col gap-1.5 p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-lg animate-in slide-in-from-top-2">
              <label htmlFor="effect-assign-role-select" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Rôle à assigner à $Joueur</label>
              <select
                id="effect-assign-role-select"
                value={roleId}
                onChange={(e) => setRoleId(e.target.value)}
                className="w-full bg-input border border-border rounded-lg px-3 py-1.5 text-xs outline-none focus:border-indigo-500/50"
              >
                {roles.length === 0 && <option value="">Aucun rôle disponible</option>}
                {roles.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
          )}

          {(type === 'assignTagToRole' || type === 'removeTagFromRole') && (
            <div className="flex flex-col gap-3 p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-lg animate-in slide-in-from-top-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="effect-tag-role-select" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">
                  {type === 'assignTagToRole' ? 'Tag à assigner' : 'Tag à enlever'}
                </label>
                <select
                  id="effect-tag-role-select"
                  value={tagId}
                  onChange={(e) => setTagId(e.target.value)}
                  className="w-full bg-input border border-border rounded-lg px-3 py-1.5 text-xs outline-none focus:border-indigo-500/50"
                >
                  {tags.length === 0 && <option value="">Aucun tag disponible</option>}
                  {tags.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="effect-role-target-select" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Rôle cible (Tous les joueurs de ce rôle)</label>
                <select
                  id="effect-role-target-select"
                  value={roleId}
                  onChange={(e) => setRoleId(e.target.value)}
                  className="w-full bg-input border border-border rounded-lg px-3 py-1.5 text-xs outline-none focus:border-indigo-500/50"
                >
                  {roles.length === 0 && <option value="">Aucun rôle disponible</option>}
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {type === 'assignTeam' && (
            <div className="flex flex-col gap-3 p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-lg animate-in slide-in-from-top-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="effect-team-player-select" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Équipe à assigner à $Joueur</label>
                <select
                  id="effect-team-player-select"
                  value={teamId}
                  onChange={(e) => setTeamId(e.target.value)}
                  className="w-full bg-input border border-border rounded-lg px-3 py-1.5 text-xs outline-none focus:border-indigo-500/50"
                >
                  <option value="unchanged">Ne pas modifier</option>
                  <option value="">Aucune équipe (Retirer l'équipe)</option>
                  {teams.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="effect-team-role-select" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Équipe à assigner au rôle du $Joueur</label>
                <select
                  id="effect-team-role-select"
                  value={roleTeamId}
                  onChange={(e) => setRoleTeamId(e.target.value)}
                  className="w-full bg-input border border-border rounded-lg px-3 py-1.5 text-xs outline-none focus:border-indigo-500/50"
                >
                  <option value="unchanged">Ne pas modifier</option>
                  <option value="">Aucune équipe (Retirer l'équipe)</option>
                  {teams.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
          
          {type === 'assignTeamToRole' && (
            <div className="flex flex-col gap-3 p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-lg animate-in slide-in-from-top-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="effect-role-target-select" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Rôle cible</label>
                <select
                  id="effect-role-target-select"
                  value={roleId}
                  onChange={(e) => setRoleId(e.target.value)}
                  className="w-full bg-input border border-border rounded-lg px-3 py-1.5 text-sm outline-none focus:border-indigo-500/50"
                >
                  {roles.length === 0 && <option value="">Aucun rôle disponible</option>}
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="effect-team-target-select" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Équipe à assigner</label>
                <select
                  id="effect-team-target-select"
                  value={teamId}
                  onChange={(e) => setTeamId(e.target.value)}
                  className="w-full bg-input border border-border rounded-lg px-3 py-1.5 text-xs outline-none focus:border-indigo-500/50"
                >
                  <option value="unchanged">Ne pas modifier</option>
                  <option value="">Aucune équipe (Retirer l'équipe)</option>
                  {teams.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {(type === 'swapPlayerRole' || type === 'swapPlayerTags' || type === 'joinTargetTeam' || type === 'stealRoleAndKill') && (
            <div className="flex flex-col gap-4 animate-in slide-in-from-top-2 p-3 bg-fuchsia-500/5 border border-fuchsia-500/20 rounded-lg">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1 text-fuchsia-400">Comment définir la cible ($Cible) ?</label>
                <select
                  title="Mode de ciblage"
                  value={swapTargetMode}
                  onChange={(e) => setSwapTargetMode(e.target.value as any)}
                  className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-fuchsia-500/50"
                >
                  <option value="cible">La variable $Cible (sélection smartphone / action)</option>
                  <option value="tag">Le joueur qui possède un Tag spécifique</option>
                  <option value="role">Le joueur qui possède un Rôle spécifique</option>
                  <option value="random">Un joueur au hasard (parmi les vivants)</option>
                </select>
              </div>

              {swapTargetMode === 'tag' && (
                <div className="flex flex-col gap-1.5 animate-in fade-in">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Quel Tag la cible doit-elle avoir ?</label>
                  <select
                    title="Tag cible"
                    value={tagId}
                    onChange={(e) => setTagId(e.target.value)}
                    className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/50"
                  >
                    <option value="">Sélectionnez un tag...</option>
                    {tags.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {swapTargetMode === 'role' && (
                <div className="flex flex-col gap-1.5 animate-in fade-in">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Quel Rôle la cible doit-elle avoir ?</label>
                  <select
                    title="Rôle cible"
                    value={roleId}
                    onChange={(e) => setRoleId(e.target.value)}
                    className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/50"
                  >
                    <option value="">Sélectionnez un rôle...</option>
                    {roles.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {type === 'movePlayerToGraveyard' && (
            <div className="flex flex-col gap-3 animate-in slide-in-from-top-2 p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-1.5 flex-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1 text-red-400">Position X</label>
                  <input
                    title="Position X cible"
                    type="number"
                    value={targetX}
                    onChange={(e) => setTargetX(Number(e.target.value))}
                    className="w-full bg-input border border-border rounded-lg px-3 py-1.5 text-xs outline-none focus:border-red-500/50"
                  />
                </div>
                <div className="flex flex-col gap-1.5 flex-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1 text-red-400">Position Y</label>
                  <input
                    title="Position Y cible"
                    type="number"
                    value={targetY}
                    onChange={(e) => setTargetY(Number(e.target.value))}
                    className="w-full bg-input border border-border rounded-lg px-3 py-1.5 text-xs outline-none focus:border-red-500/50"
                  />
                </div>
                <div className="flex flex-col gap-1.5 pt-4">
                   <button
                     title="Choisir sur la carte"
                     onClick={() => setCoordinatePicker({ isActive: true, onPick: (x: number, y: number) => { setTargetX(Math.round(x)); setTargetY(Math.round(y)); } })}
                     className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg border border-red-500/30 transition-all"
                   >
                     <Pipette size={16} />
                   </button>
                </div>
              </div>
              <p className="text-[10px] text-zinc-500 italic px-1">Le centre du plateau est en X: 0, Y: 0.</p>
              
              <div className="flex items-center gap-3 px-1 mt-1 border-t border-red-500/10 pt-2">
                <input
                  id="kill-on-graveyard"
                  type="checkbox"
                  checked={killOnGraveyard}
                  onChange={(e) => setKillOnGraveyard(e.target.checked)}
                  className="w-4 h-4 rounded border-red-500/30 text-red-600 focus:ring-red-500 transition-all cursor-pointer"
                />
                <label htmlFor="kill-on-graveyard" className="text-xs font-medium text-red-400/80 cursor-pointer select-none">
                  Tuer également le(s) joueur(s) envoyé(s) au cimetière
                </label>
              </div>
            </div>
          )}

          {type === 'moveCibleToGraveyard' && (
            <div className="flex flex-col gap-3 animate-in slide-in-from-top-2 p-3 bg-fuchsia-500/5 border border-fuchsia-500/20 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-1.5 flex-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1 text-fuchsia-400">Position X</label>
                  <input
                    title="Position X cible"
                    type="number"
                    value={targetX}
                    onChange={(e) => setTargetX(Number(e.target.value))}
                    className="w-full bg-input border border-border rounded-lg px-3 py-1.5 text-xs outline-none focus:border-fuchsia-500/50"
                  />
                </div>
                <div className="flex flex-col gap-1.5 flex-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1 text-fuchsia-400">Position Y</label>
                  <input
                    title="Position Y cible"
                    type="number"
                    value={targetY}
                    onChange={(e) => setTargetY(Number(e.target.value))}
                    className="w-full bg-input border border-border rounded-lg px-3 py-1.5 text-xs outline-none focus:border-fuchsia-500/50"
                  />
                </div>
                <div className="flex flex-col gap-1.5 pt-4">
                   <button
                     title="Choisir sur la carte"
                     onClick={() => setCoordinatePicker({ isActive: true, onPick: (x: number, y: number) => { setTargetX(Math.round(x)); setTargetY(Math.round(y)); } })}
                     className="p-2 bg-fuchsia-500/10 text-fuchsia-400 hover:bg-fuchsia-500/20 rounded-lg border border-fuchsia-500/30 transition-all"
                   >
                     <Pipette size={16} />
                   </button>
                </div>
              </div>
              <p className="text-[10px] text-zinc-500 italic px-1">Le centre du plateau est en X: 0, Y: 0. Envoie la $Cible au cimetière.</p>
              
              <div className="flex items-center gap-3 px-1 mt-1 border-t border-fuchsia-500/10 pt-2">
                <input
                  id="kill-on-graveyard-cible"
                  type="checkbox"
                  checked={killOnGraveyard}
                  onChange={(e) => setKillOnGraveyard(e.target.checked)}
                  className="w-4 h-4 rounded border-fuchsia-500/30 text-fuchsia-600 focus:ring-fuchsia-500 transition-all cursor-pointer"
                />
                <label htmlFor="kill-on-graveyard-cible" className="text-xs font-medium text-fuchsia-400/80 cursor-pointer select-none">
                  Tuer également la $Cible envoyée au cimetière
                </label>
              </div>
            </div>
          )}

          {type === 'gatherPlayers' && (
            <div className="flex flex-col gap-3 animate-in slide-in-from-top-2 p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1 text-red-400">Rayon du cercle (Espacement)</label>
                <div className="flex items-center gap-3">
                  <input
                    title="Rayon de rassemblement"
                    type="range"
                    min="50"
                    max="500"
                    step="10"
                    value={gatherRadius}
                    onChange={(e) => setGatherRadius(Number(e.target.value))}
                    className="flex-1 accent-red-500"
                  />
                  <span className="text-xs font-bold w-12 text-right">{gatherRadius}px</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-1.5 flex-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1 text-red-400">Centre X</label>
                  <input
                    title="Centre X"
                    type="number"
                    value={targetX}
                    onChange={(e) => setTargetX(Number(e.target.value))}
                    className="w-full bg-input border border-border rounded-lg px-3 py-1.5 text-xs outline-none focus:border-red-500/50"
                  />
                </div>
                <div className="flex flex-col gap-1.5 flex-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1 text-red-400">Centre Y</label>
                  <input
                    title="Centre Y"
                    type="number"
                    value={targetY}
                    onChange={(e) => setTargetY(Number(e.target.value))}
                    className="w-full bg-input border border-border rounded-lg px-3 py-1.5 text-xs outline-none focus:border-red-500/50"
                  />
                </div>
                <div className="flex flex-col gap-1.5 pt-4">
                   <button
                     title="Choisir sur la carte"
                     onClick={() => setCoordinatePicker({ isActive: true, onPick: (x: number, y: number) => { setTargetX(Math.round(x)); setTargetY(Math.round(y)); } })}
                     className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg border border-red-500/30 transition-all"
                   >
                     <Pipette size={16} />
                   </button>
                </div>
              </div>
              <p className="text-[10px] text-zinc-500 italic px-1">Les joueurs vivants formeront un cercle autour de ce point (0, 0 = centre).</p>
            </div>
          )}

          {type === 'changePlayerShape' && (
            <div className="flex flex-col gap-3 animate-in slide-in-from-top-2 p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1 text-red-400">Nouvelle Forme du Pion</label>
                <select
                  title="Nouvelle forme"
                  value={targetShape}
                  onChange={(e) => setTargetShape(e.target.value)}
                  className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-red-500/50"
                >
                  <option value="circle">Cercle</option>
                  <option value="square">Carré</option>
                  <option value="triangle">Triangle</option>
                  <option value="hexagon">Hexagone</option>
                  <option value="octagon">Octogone</option>
                  <option value="pentagon">Pentagone</option>
                  <option value="star">Étoile</option>
                  <option value="oval">Ovale</option>
                  <option value="trapezoid">Trapèze</option>
                  <option value="diamond">Diamant</option>
                  <option value="shield">Bouclier</option>
                  <option value="cross">Croix</option>
                  <option value="heart">Cœur</option>
                  <option value="crescent">Croissant</option>
                </select>
              </div>
            </div>
          )}

          {/* New row for variable modification and alerts */}
          {(type === 'modifyVariable' || type === 'alertVariable' || type === 'popupVariable') && (
            <div className="flex flex-col gap-3 p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-lg animate-in slide-in-from-top-2">
               <div className="flex flex-col gap-1.5">
                  <label htmlFor="effect-variable-select" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Variable</label>
                  <input
                    id="effect-variable-select"
                    list="effect-variable-list"
                    value={variable}
                    onChange={(e) => setVariable(e.target.value)}
                    placeholder="Saisissez un nom (ex: $Temp1)"
                    className="w-full bg-input border border-border rounded-lg px-3 py-1.5 text-xs outline-none focus:border-indigo-500/50"
                  />
                  <datalist id="effect-variable-list">
                    <option value="$Ordre" />
                    <option value="$Cycle" />
                    <option value="$Jour" />
                    <option value="$Nuit" />
                  </datalist>
               </div>
               
               {type === 'modifyVariable' && (
                 <div className="flex gap-2">
                    <div className="flex-1 flex flex-col gap-1.5">
                      <label htmlFor="effect-operator-select" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Opérateur</label>
                      <select
                        id="effect-operator-select"
                        value={operator}
                        onChange={(e) => setOperator(e.target.value)}
                        className="w-full bg-input border border-border rounded-lg px-3 py-1.5 text-xs outline-none focus:border-indigo-500/50"
                      >
                        <option value="=">=</option>
                        <option value="+">+</option>
                        <option value="-">-</option>
                        <option value="*">*</option>
                        <option value="/">/</option>
                      </select>
                    </div>
                    <div className="flex-1 flex flex-col gap-1.5">
                      <label htmlFor="effect-variable-value" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Valeur</label>
                      <input
                        id="effect-variable-value"
                        type="number"
                        value={value}
                        onChange={(e) => setValue(Number(e.target.value))}
                        className="w-full bg-input border border-border rounded-lg px-3 py-1.5 text-xs outline-none focus:border-indigo-500/50 shadow-inner"
                      />
                    </div>
                 </div>
               )}
            </div>
          )}

          {type === 'playSound' && (
            <div className="flex flex-col gap-1.5 p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-lg animate-in slide-in-from-top-2">
              <label htmlFor="effect-sound-select" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Effet sonore</label>
              <select
                id="effect-sound-select"
                value={soundName}
                onChange={(e) => setSoundName(e.target.value)}
                className="w-full bg-input border border-border rounded-lg px-3 py-1.5 text-xs outline-none focus:border-indigo-500/50"
              >
                {soundboard.buttons.length === 0 && <option value="">Aucun son disponible</option>}
                {soundboard.buttons.map(b => (
                  <option key={b.index} value={b.name}>{b.name}</option>
                ))}
              </select>
            </div>
          )}

          {type === 'showHandout' && (
            <div className="flex flex-col gap-1.5 p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-lg animate-in slide-in-from-top-2">
              <label htmlFor="effect-handout-select" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Document / Handout</label>
              <select
                id="effect-handout-select"
                value={handoutId}
                onChange={(e) => setHandoutId(e.target.value)}
                className="w-full bg-input border border-border rounded-lg px-3 py-1.5 text-xs outline-none focus:border-indigo-500/50"
              >
                {handouts.length === 0 && <option value="">Aucun document disponible</option>}
                {handouts.map(h => (
                  <option key={h.id} value={h.id}>{h.name}</option>
                ))}
              </select>
            </div>
          )}

          {type === 'sendPrivateMessage' && (
            <div className="flex flex-col gap-1.5 p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-lg animate-in slide-in-from-top-2">
              <label htmlFor="effect-private-message" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Message Privé ($Joueur)</label>
              <textarea
                id="effect-private-message"
                value={privateMessage}
                onChange={(e) => setPrivateMessage(e.target.value)}
                placeholder="Ex: Le loup a flairé votre piste..."
                rows={3}
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-xs outline-none focus:border-indigo-500/50 resize-none shadow-inner"
              />
            </div>
          )}

          {type === 'addSystemLog' && (
            <div className="flex flex-col gap-1.5 p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-lg animate-in slide-in-from-top-2">
              <label htmlFor="effect-log-message" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Message du Journal</label>
              <textarea
                id="effect-log-message"
                value={logMessage}
                onChange={(e) => setLogMessage(e.target.value)}
                placeholder="Ex: Le joueur $Joueur a été infecté."
                rows={3}
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-xs outline-none focus:border-indigo-500/50 resize-none shadow-inner"
              />
              <p className="text-[10px] text-muted-foreground px-1">Vous pouvez utiliser <strong>$Joueur</strong> et <strong>$Rôle</strong> pour insérer le nom et le rôle de la cible.</p>
            </div>
          )}

          {type === 'setRoomBackground' && (
            <div className="flex flex-col gap-1.5 p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-lg animate-in slide-in-from-top-2">
              <label htmlFor="effect-bg-url" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Image de Fond (URL)</label>
              <div className="flex gap-2">
                <input
                  id="effect-bg-url"
                  type="text"
                  value={backgroundImageUrl}
                  onChange={(e) => setBackgroundImageUrl(e.target.value)}
                  placeholder="URL de l'image..."
                  className="flex-1 bg-input border border-border rounded-lg px-3 py-1.5 text-xs outline-none focus:border-indigo-500/50"
                />
                <select
                  aria-label="Choisir un document"
                  title="Choisir un document"
                  className="w-1/3 bg-input border border-border rounded-lg px-2 py-1.5 text-[10px] outline-none focus:border-indigo-500/50"
                  onChange={(e) => setBackgroundImageUrl(e.target.value)}
                  value={handouts.find(h => h.imageUrl === backgroundImageUrl)?.imageUrl || ''}
                >
                  <option value="">Document...</option>
                  {handouts.filter(h => h.type === 'image').map(h => (
                    <option key={h.id} value={h.imageUrl}>{h.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {type === 'setRoomColor' && (
            <div className="flex flex-col gap-1.5 p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-lg animate-in slide-in-from-top-2">
              <label htmlFor="effect-room-color" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Couleur d'Ambiance</label>
              <div className="flex items-center gap-3">
                <input
                  id="effect-room-color"
                  type="color"
                  value={roomColor}
                  onChange={(e) => setRoomColor(e.target.value)}
                  className="w-10 h-10 bg-transparent border-none rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={roomColor}
                  onChange={(e) => setRoomColor(e.target.value)}
                  placeholder="#FFFFFF"
                  title="Code couleur hexadécimal"
                  aria-label="Code couleur hexadécimal"
                  className="flex-1 bg-input border border-border rounded-lg px-3 py-1.5 text-xs outline-none focus:border-indigo-500/50"
                />
              </div>
            </div>
          )}

          {type === 'pingPlayer' && (
            <div className="flex flex-col gap-1.5 p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-lg animate-in slide-in-from-top-2">
              <label htmlFor="effect-ping-color" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Couleur du Ping / Halo</label>
              <div className="flex items-center gap-3">
                <input
                  id="effect-ping-color"
                  type="color"
                  value={pingColor}
                  onChange={(e) => setPingColor(e.target.value)}
                  title="Choisir la couleur du ping"
                  className="w-10 h-10 bg-transparent border-none rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={pingColor}
                  onChange={(e) => setPingColor(e.target.value)}
                  placeholder="#3b82f6"
                  title="Code couleur hexadécimal du ping"
                  aria-label="Code couleur hexadécimal du ping"
                  className="flex-1 bg-input border border-border rounded-lg px-3 py-1.5 text-xs outline-none focus:border-indigo-500/50"
                />
              </div>
              <p className="text-[10px] text-muted-foreground px-1 mt-1">Crée un effet pulsant autour du pion pendant 5 secondes.</p>
            </div>
          )}

          {type === 'revealPlayerRole' && (
            <div className="flex flex-col gap-2 p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-lg animate-in slide-in-from-top-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Où révéler le rôle ?</label>
              
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={revealOnBoard}
                    onChange={(e) => setRevealOnBoard(e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className="w-4 h-4 rounded bg-zinc-800 border border-zinc-700 peer-checked:bg-blue-500 peer-checked:border-blue-500 transition-colors" />
                  <Check size={12} className="absolute text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                </div>
                <span className="text-xs text-zinc-300 group-hover:text-white transition-colors">Sur le Plateau (MJ) - Carte à côté du pion</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={revealInSmartphoneRoom}
                    onChange={(e) => setRevealInSmartphoneRoom(e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className="w-4 h-4 rounded bg-zinc-800 border border-zinc-700 peer-checked:bg-blue-500 peer-checked:border-blue-500 transition-colors" />
                  <Check size={12} className="absolute text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                </div>
                <span className="text-xs text-zinc-300 group-hover:text-white transition-colors">Smartphone (Onglet SALLE) - Sous la miniature + Highlight</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={revealInSmartphonePlayers}
                    onChange={(e) => setRevealInSmartphonePlayers(e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className="w-4 h-4 rounded bg-zinc-800 border border-zinc-700 peer-checked:bg-blue-500 peer-checked:border-blue-500 transition-colors" />
                  <Check size={12} className="absolute text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                </div>
                <span className="text-xs text-zinc-300 group-hover:text-white transition-colors">Smartphone (Onglet JOUEURS) - À côté du nom</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={revealInSmartphoneGamePopup}
                    onChange={(e) => setRevealInSmartphoneGamePopup(e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className="w-4 h-4 rounded bg-zinc-800 border border-zinc-700 peer-checked:bg-blue-500 peer-checked:border-blue-500 transition-colors" />
                  <Check size={12} className="absolute text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                </div>
                <span className="text-xs text-zinc-300 group-hover:text-white transition-colors">Smartphone (Onglet JEU) - Popup d'alerte visuelle</span>
              </label>
            </div>
          )}

          {type === 'togglePlayerPastille' && (
            <div className="flex flex-col gap-3 p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-lg animate-in slide-in-from-top-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Identifiant de la pastille (ID)</label>
                <input
                  title="Identifiant de la pastille"
                  type="text"
                  value={pastilleId}
                  onChange={(e) => setPastilleId(e.target.value)}
                  placeholder="Ex: poison, silence, shield..."
                  className="w-full bg-input border border-border rounded-lg px-3 py-1.5 text-xs outline-none focus:border-indigo-500/50"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Action</label>
                <select
                  title="Mode d'action de la pastille"
                  value={pastilleMode}
                  onChange={(e) => setPastilleMode(e.target.value as any)}
                  className="w-full bg-input border border-border rounded-lg px-3 py-1.5 text-xs outline-none focus:border-indigo-500/50"
                >
                  <option value="add">Forcer l'Ajout (Afficher)</option>
                  <option value="remove">Forcer la Suppression (Masquer)</option>
                  <option value="toggle">Basculer (Afficher si absent, Masquer si présent)</option>
                </select>
              </div>

              {pastilleMode !== 'remove' && (
                <div className="flex items-center gap-3">
                  <div className="flex flex-col gap-1.5 flex-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Icône</label>
                    <select
                      title="Icône de la pastille"
                      value={pastilleIcon}
                      onChange={(e) => setPastilleIcon(e.target.value)}
                      className="w-full bg-input border border-border rounded-lg px-3 py-1.5 text-xs outline-none focus:border-indigo-500/50"
                    >
                      <option value="Shield">Bouclier (Shield)</option>
                      <option value="Skull">Crâne (Skull)</option>
                      <option value="Star">Étoile (Star)</option>
                      <option value="Heart">Cœur (Heart)</option>
                      <option value="Zap">Éclair (Zap)</option>
                      <option value="Flame">Flamme (Flame)</option>
                      <option value="Droplets">Gouttes (Droplets)</option>
                      <option value="Eye">Œil (Eye)</option>
                      <option value="Crown">Couronne (Crown)</option>
                      <option value="Ghost">Fantôme (Ghost)</option>
                      <option value="Sword">Épée (Sword)</option>
                      <option value="Target">Cible (Target)</option>
                      <option value="Lock">Cadenas (Lock)</option>
                    </select>
                  </div>
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Couleur</label>
                    <div className="flex items-center gap-2">
                      <input
                        title="Couleur de la pastille"
                        type="color"
                        value={pastilleColor}
                        onChange={(e) => setPastilleColor(e.target.value)}
                        className="w-8 h-8 bg-transparent border-none rounded cursor-pointer"
                      />
                      <div 
                        className="w-8 h-8 rounded-full border-2 bg-zinc-900 shadow-md flex items-center justify-center"
                        style={{ borderColor: pastilleColor }}
                      >
                        {pastilleIcon && (icons as any)[pastilleIcon] && React.createElement((icons as any)[pastilleIcon], { size: 14, style: { color: pastilleColor } })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 pt-2">
          <button
            onClick={handleClose}
            className="flex-1 py-2 px-4 bg-muted hover:bg-accent text-foreground text-xs font-bold rounded-lg transition-colors border border-border"
          >
            Annuler
          </button>
          <button
            onClick={handleOK}
            className="flex-1 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
          >
            <Check size={14} />
            OK
          </button>
        </div>
      </div>
    </div>
  );
};
