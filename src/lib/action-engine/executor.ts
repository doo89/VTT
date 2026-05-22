import type { Action, ActionCondition, ActionEffect } from '../../types';
import { useVttStore } from '../../store';
import type { EffectContext, EffectState, EffectResult } from './types';
import { effectRegistry } from './effects/registry';

function getVariableValue(varName: string, state: any, context: EffectContext): number {
  if (varName === '$Jour') return state.isNight ? 0 : state.cycleNumber;
  if (varName === '$Nuit') return state.isNight ? state.cycleNumber : 0;
  if (varName === '$Cycle') return state.cycleNumber;
  if (varName === '$Ordre') return state.callOrderIndex;
  if (varName === '$Parité') return state.cycleNumber % 2;
  if (varName === '$Phase') return state.isNight ? 1 : 0;
  if (varName === '$Timer') {
    const t = state.timer;
    return t.isRunning ? t.minutes * 60 + t.seconds : 0;
  }
  if (varName === '$NbEnLigne') return (state.onlinePlayerIds || []).length;
  if (varName === '$NbTotal') return (state.players || []).length;
  if (varName === '$NbVivants') return (state.players || []).filter((p: any) => !p.isDead).length;
  if (varName === '$NbMorts') return (state.players || []).filter((p: any) => p.isDead).length;
  if (state.customVariables && state.customVariables[varName] !== undefined) {
    return state.customVariables[varName];
  }
  return 0;
}

function compareValues(actual: number, operator: string, expected: number): boolean {
  switch (operator) {
    case '=': return actual === expected;
    case '!=': return actual !== expected;
    case '<': return actual < expected;
    case '>': return actual > expected;
    case '<=': return actual <= expected;
    case '>=': return actual >= expected;
    case 'modulo': return expected !== 0 && actual % expected === 0;
    default: return true;
  }
}

function evaluateConditions(
  conditions: ActionCondition[],
  state: any,
  context: EffectContext
): { success: boolean } {
  const activeConditions = (conditions || []).filter(c => c.enabled);
  if (activeConditions.length === 0) return { success: true };

  const conditionGroups: ActionCondition[][] = [[]];
  activeConditions.forEach(c => {
    if (c.logic === 'OR' && conditionGroups[conditionGroups.length - 1].length > 0) {
      conditionGroups.push([c]);
    } else {
      conditionGroups[conditionGroups.length - 1].push(c);
    }
  });

  const groupResults = conditionGroups.map(group => {
    let success = true;
    group.forEach(c => {
      success = success && checkSingleCondition(c, state, context);
    });
    return { success };
  });

  const finalOk = groupResults.some(g => g.success);
  return { success: finalOk };
}

function checkSingleCondition(
  condition: ActionCondition,
  state: any,
  context: EffectContext
): boolean {
  const players: any[] = state.players || [];
  const roles: any[] = state.roles || [];
  const tags: any[] = state.tags || [];
  const joueur = context.$Joueur;

  switch (condition.type) {
    case 'day':
      return compareValues(state.isNight ? 0 : state.cycleNumber, condition.operator, condition.value);
    case 'night':
      return compareValues(state.isNight ? state.cycleNumber : 0, condition.operator, condition.value);
    case 'turn':
      return compareValues(state.cycleNumber, condition.operator, condition.value);
    case 'cycleCheck': {
      const varVal = getVariableValue(condition.cycleCheckType || '$Jour', state, context);
      return compareValues(varVal, condition.operator, condition.value);
    }
    case 'isNightPhase':
      return state.isNight === true;
    case 'isDayPhase':
      return state.isNight === false;
    case 'playerRole': {
      if (!joueur) return false;
      const playerRole = players.find(p => p.id === joueur.id)?.roleId;
      return condition.operator === '=' ? playerRole === condition.roleId : playerRole !== condition.roleId;
    }
    case 'playerTag': {
      if (!joueur) return false;
      const player = players.find(p => p.id === joueur.id);
      const hasTag = player?.tags?.some((t: any) => t.id === condition.tagId);
      return condition.operator === '=' ? hasTag : !hasTag;
    }
    case 'playerPastille': {
      if (!joueur) return false;
      const player = players.find(p => p.id === joueur.id);
      const hasPastille = player?.selectionPastilles?.some((p: any) => p.icon === condition.pastilleIcon);
      return condition.operator === '=' ? hasPastille : !hasPastille;
    }
    case 'playerSelection':
    case 'playerSelectionRole':
    case 'playerSelectionTag':
    case 'playerSelectionPastille':
    case 'playerSelectionTeam':
    case 'playerSelectionStatus':
    case 'playerSelectionRoleAndTeam': {
      let filtered = [...players];
      if (condition.selectionType === 'callOrder') {
        const orderIdx = state.callOrderIndex;
        filtered = filtered.filter((_, i) => i === orderIdx);
      } else if (condition.selectionType === 'numeric') {
        const idx = condition.value - 1;
        filtered = filtered.filter((_, i) => i === idx);
      } else if (condition.selectionType === 'random') {
        if (filtered.length === 0) return false;
        filtered = [filtered[Math.floor(Math.random() * filtered.length)]];
      } else if (condition.selectionType === 'first') {
        filtered = filtered.slice(0, 1);
      } else if (condition.selectionType === 'last') {
        filtered = filtered.slice(-1);
      }

      if (condition.type === 'playerSelectionRole' || condition.type === 'playerSelection') {
        filtered = filtered.filter(p => p.roleId === condition.selectionRoleId);
      } else if (condition.type === 'playerSelectionTag') {
        filtered = filtered.filter(p => p.tags?.some((t: any) => t.id === condition.tagId));
      } else if (condition.type === 'playerSelectionPastille') {
        filtered = filtered.filter(p => p.selectionPastilles?.some((p: any) => p.icon === condition.pastilleIcon));
      } else if (condition.type === 'playerSelectionTeam') {
        filtered = filtered.filter(p => p.teamId === condition.selectionTeamId);
      } else if (condition.type === 'playerSelectionStatus') {
        filtered = filtered.filter(p => condition.distanceTargetStatus === 'alive' ? !p.isDead : p.isDead);
      } else if (condition.type === 'playerSelectionRoleAndTeam') {
        filtered = filtered.filter(p => p.roleId === condition.selectionRoleId && p.teamId === condition.selectionTeamId);
      }

      return condition.operator === '=' ? filtered.length > 0 : filtered.length === 0;
    }
    case 'callOrderRole': {
      const orderIdx = state.callOrderIndex;
      const player = players[orderIdx];
      if (!player) return false;
      return condition.operator === '=' ? player.roleId === condition.roleId : player.roleId !== condition.roleId;
    }
    case 'roleTeamCheck': {
      if (!joueur) return false;
      const player = players.find(p => p.id === joueur.id);
      return condition.operator === '=' ? player?.teamId === condition.teamId : player?.teamId !== condition.teamId;
    }
    case 'playerDistance':
    case 'playerDistanceTag':
    case 'playerDistancePastille':
    case 'playerDistanceTeam':
    case 'playerDistanceStatus':
    case 'playerDistanceSelf':
    case 'playerDistanceSelected': {
      const sourceId = condition.distanceFromPlayerId === '$Selected' 
        ? (state.selectedEntityIds?.[0] || joueur?.id) 
        : joueur?.id;
      if (!sourceId) return false;
      const source = players.find(p => p.id === sourceId);
      if (!source) return false;

      let targets: any[] = [];
      if (condition.type === 'playerDistance') {
        targets = players.filter(p => p.roleId === condition.distanceTargetRoleId);
      } else if (condition.type === 'playerDistanceTag') {
        targets = players.filter(p => p.tags?.some((t: any) => t.id === condition.tagId));
      } else if (condition.type === 'playerDistancePastille') {
        targets = players.filter(p => p.selectionPastilles?.some((p: any) => p.icon === condition.pastilleIcon));
      } else if (condition.type === 'playerDistanceTeam') {
        targets = players.filter(p => p.teamId === condition.distanceTargetTeamId);
      } else if (condition.type === 'playerDistanceStatus') {
        targets = players.filter(p => condition.distanceTargetStatus === 'alive' ? !p.isDead : p.isDead);
      } else if (condition.type === 'playerDistanceSelf') {
        targets = [source];
      } else if (condition.type === 'playerDistanceSelected') {
        targets = players.filter(p => state.selectedEntityIds?.includes(p.id) && p.roleId === condition.distanceTargetRoleId);
      }

      const distances = targets.map(t => {
        if (condition.distanceUnit === 'physical') {
          return Math.sqrt((t.x - source.x) ** 2 + (t.y - source.y) ** 2);
        }
        const srcIdx = players.indexOf(source);
        const tgtIdx = players.indexOf(t);
        return Math.abs(tgtIdx - srcIdx);
      });

      const minDist = distances.length > 0 ? Math.min(...distances) : Infinity;
      const maxDist = distances.length > 0 ? Math.max(...distances) : -Infinity;
      const minVal = condition.minValue ?? 0;
      const maxVal = condition.maxValue ?? Infinity;
      return minDist >= minVal && maxDist <= maxVal;
    }
    case 'roleCount': {
      let count = players.filter(p => p.roleId === condition.roleId).length;
      if (condition.distanceTargetStatus === 'alive') count = players.filter(p => p.roleId === condition.roleId && !p.isDead).length;
      else if (condition.distanceTargetStatus === 'dead') count = players.filter(p => p.roleId === condition.roleId && p.isDead).length;
      return compareValues(count, condition.operator, condition.value);
    }
    case 'hasTag': {
      const targetId = condition.targetPlayerId === '$Joueur' ? joueur?.id : condition.targetPlayerId;
      if (!targetId) return false;
      const player = players.find(p => p.id === targetId);
      const hasTag = player?.tags?.some((t: any) => t.id === condition.tagId);
      return condition.operator === '=' ? hasTag : !hasTag;
    }
    case 'randomChance': {
      const chance = condition.chancePercent ?? condition.value;
      return Math.random() * 100 < chance;
    }
    case 'isCouple': {
      if (!joueur) return false;
      const player = players.find(p => p.id === joueur.id);
      return condition.operator === '=' ? !!player?.coupleId : !player?.coupleId;
    }
    case 'partnerDead': {
      if (!joueur) return false;
      const player = players.find(p => p.id === joueur.id);
      if (!player?.coupleId) return false;
      const partner = players.find(p => p.coupleId === player.coupleId && p.id !== joueur.id);
      if (!partner) return false;
      return condition.operator === '=' ? partner.isDead : !partner.isDead;
    }
    case 'targetExists': {
      let targets: any[] = [...players];
      if (condition.roleId) targets = targets.filter(p => p.roleId === condition.roleId);
      if (condition.tagId) targets = targets.filter(p => p.tags?.some((t: any) => t.id === condition.tagId));
      if (condition.teamId) targets = targets.filter(p => p.teamId === condition.teamId);
      if (condition.distanceTargetStatus === 'alive') targets = targets.filter(p => !p.isDead);
      if (condition.distanceTargetStatus === 'dead') targets = targets.filter(p => p.isDead);
      return condition.operator === '=' ? targets.length > 0 : targets.length === 0;
    }
    case 'playerAlive': {
      if (!joueur) return false;
      const player = players.find(p => p.id === joueur.id);
      return condition.operator === '=' ? !player?.isDead : player?.isDead;
    }
    case 'playerDead': {
      if (!joueur) return false;
      const player = players.find(p => p.id === joueur.id);
      return condition.operator === '=' ? player?.isDead : !player?.isDead;
    }
    default:
      return true;
  }
}

/**
 * Execute a single effect using the registry
 */
function executeEffect(
  effect: ActionEffect,
  context: EffectContext,
  state: EffectState,
  storeApi: any
): EffectResult | void {
  if (!effect.enabled) return;
  
  const handler = effectRegistry[effect.type];
  if (handler) {
    return handler(effect, context, state, storeApi);
  } else {
    console.warn(`[ACTION] No handler registered for effect type: ${effect.type}`);
  }
}

/**
 * Main action executor
 * Replaces the massive executeAction in the store
 */
export function executeAction(
  actionId: string,
  initialContext?: EffectContext,
  depth: number = 0
): void {
  console.log(`[ACTION] Début exécution: ${actionId}`, initialContext);
  const storeState = useVttStore.getState();
  const action = storeState.actions.find((a: Action) => a.id === actionId);
  
  if (!action) {
    console.warn(`[ACTION] Action non trouvée: ${actionId}`);
    return;
  }
  
  console.log(`[ACTION] Nom de l'action: ${action.name}`);

  // Cancellation logic
  if (action.currentRepeatExecution && action.currentRepeatExecution > 0) {
    useVttStore.setState((s: any) => ({
      actions: s.actions.map((a: Action) => a.id === actionId ? { ...a, currentRepeatExecution: 0 } : a)
    }));
    return;
  }

  const run = (remaining: number, startEffectIndex: number = 0) => {
    if (depth > 5) {
      useVttStore.setState((s: any) => {
        s.addLog(`Action annulée : profondeur maximale atteinte (SINON)`, 'system');
        return {};
      });
      return;
    }
    
    useVttStore.setState((storeState: any) => {
      const action = storeState.actions.find((a: Action) => a.id === actionId);
      if (!action) return {};
      
      const totalSteps = action.isRecurring ? (action.repeatCount || 2) : 1;
      if (remaining < totalSteps && action.currentRepeatExecution === 0) {
        return {};
      }
      
      if (action.enabled === false) return {};

      // Build context
      let actionContext: EffectContext = initialContext ? { ...initialContext } : {};

      if (!actionContext['$Joueur'] && storeState.selectedEntityIds.length > 0) {
        const selectedPlayers = storeState.players.filter((p: any) => storeState.selectedEntityIds.includes(p.id));
        if (selectedPlayers.length > 0) {
          const names = selectedPlayers.map((p: any) => p.name).join(', ');
          const ids = selectedPlayers.map((p: any) => p.id);
          actionContext['$Joueur'] = { 
            ...selectedPlayers[0], 
            name: names, 
            _isMultiple: true, 
            _ids: ids 
          };
        }
      }

      // Evaluate conditions
      if (startEffectIndex === 0) {
        const evaluation = evaluateConditions(action.conditions || [], storeState, actionContext);
        if (!evaluation.success) {
          storeState.addLog(`Action "${action.name}" annulée : condition non remplie`, 'system');
          if (action.elseActionId && depth < 5) {
            setTimeout(() => {
              const currentState = useVttStore.getState() as any;
              currentState.executeAction(action.elseActionId, initialContext, depth + 1);
            }, 100);
          }
          return {};
        }
      }
      
      // Create mutable state for effects
      const effectState: EffectState = {
        players: [...storeState.players],
        roles: [...storeState.roles],
        tags: [...storeState.tags],
        teams: [...storeState.teams],
        markers: [...storeState.markers],
        actions: [...storeState.actions],
        handouts: [...storeState.handouts],
        customPopups: [...storeState.customPopups],
        logs: [...storeState.logs],
        customVariables: { ...storeState.customVariables },
        displaySettings: { ...storeState.displaySettings },
        soundboard: { ...storeState.soundboard },
        room: { ...storeState.room },
        checklist: [...storeState.checklist],
        cycleMode: storeState.cycleMode,
        isNight: storeState.isNight,
        cycleNumber: storeState.cycleNumber,
        callOrderIndex: storeState.callOrderIndex,
        timer: { ...storeState.timer },
        activeGroupVote: storeState.activeGroupVote,
        smartphoneCountdown: storeState.smartphoneCountdown,
        smartphoneActionMessage: storeState.smartphoneActionMessage,
        activeCustomPopupId: storeState.activeCustomPopupId,
      };

      const effectsToRun = action.effects || [];
      let currentEffectIndex = startEffectIndex;
      let hasWait = false;
      let waitTime = 0;
      let phaseShift = 0;
      let resetValue: number | null = null;
      let triggeredAction: { id: string, context: EffectContext } | null = null;
      
      // Execute effects
      for (; currentEffectIndex < effectsToRun.length; currentEffectIndex++) {
        const effect = effectsToRun[currentEffectIndex];
        if (!effect.enabled) continue;
        
        const result = executeEffect(effect, actionContext, effectState, storeState);
        
        // Handle special return values
        if (result) {
          if ((result as any)._waitTime !== undefined) {
            hasWait = true;
            waitTime = (result as any)._waitTime;
            break;
          }
          if ((result as any)._stopExecution) {
            remaining = 0;
            break;
          }
          if ((result as any)._phaseShift !== undefined) {
            phaseShift += (result as any)._phaseShift;
          }
          if ((result as any)._resetValue !== undefined) {
            resetValue = (result as any)._resetValue;
            if ((result as any)._isNight !== undefined) {
              effectState.isNight = (result as any)._isNight;
            }
          }
          if ((result as any)._triggerAction) {
            if (depth < 5) {
              triggeredAction = {
                id: (result as any)._triggerAction,
                context: (result as any)._actionContext || actionContext
              };
            } else {
              storeState.addLog(`Action annulée : boucle infinie détectée (${action.name})`, 'system');
            }
          }
        }
      }

      // Build new state
      const newState: any = { 
        markers: effectState.markers, 
        players: effectState.players, 
        roles: effectState.roles,
        tags: effectState.tags,
        teams: effectState.teams,
        customVariables: effectState.customVariables,
        displaySettings: effectState.displaySettings,
        cycleMode: effectState.cycleMode,
        handouts: effectState.handouts,
        room: effectState.room,
        checklist: effectState.checklist,
        timer: effectState.timer,
        activeGroupVote: effectState.activeGroupVote,
        smartphoneCountdown: effectState.smartphoneCountdown,
        smartphoneActionMessage: effectState.smartphoneActionMessage,
        activeCustomPopupId: effectState.activeCustomPopupId,
        customPopups: effectState.customPopups,
        callOrderIndex: effectState.callOrderIndex,
      };
      
      // Handle phase shifts
      if (resetValue !== null) {
        newState.isNight = effectState.isNight;
        newState.cycleNumber = resetValue;
      } else if (phaseShift !== 0) {
        let currentIsNight = storeState.isNight, currentCycle = storeState.cycleNumber;
        const absoluteShift = Math.abs(phaseShift), direction = phaseShift > 0 ? 1 : -1;
        for (let i = 0; i < absoluteShift; i++) {
          if (direction === 1) {
            const goingToDay = currentIsNight;
            currentIsNight = !currentIsNight;
            if (goingToDay) currentCycle++;
          } else {
            const goingToNight = !currentIsNight;
            if (goingToNight && currentCycle <= 0) break;
            currentIsNight = !currentIsNight;
            if (goingToNight) currentCycle--;
          }
        }
        newState.isNight = currentIsNight;
        newState.cycleNumber = currentCycle;
      }
      
      // Update action state
      newState.actions = effectState.actions.map((a: Action) => {
        if (a.id === actionId) {
          return { 
            ...a, 
            currentRepeatExecution: hasWait ? a.currentRepeatExecution : (remaining > 1 ? remaining - 1 : 0),
            enabled: (!hasWait && action.once && remaining === 1) ? false : a.enabled,
            isExecuted: (!hasWait && action.once && remaining === 1) ? true : a.isExecuted
          };
        }
        return a;
      });
      
      // Handle wait
      if (hasWait) {
        const waitEffect = effectsToRun[currentEffectIndex];
        setTimeout(() => {
          if (waitEffect.showCountdown) {
            storeState.setSmartphoneCountdown(null);
          }
          run(remaining, currentEffectIndex + 1);
        }, waitTime * 1000);
      } else if (remaining > 1) {
        setTimeout(() => run(remaining - 1, 0), (action.intervalSeconds || 5) * 1000);
      } else {
        newState.activeActionId = null;
      }
      
      // Trigger nested action if needed
      if (triggeredAction) {
        setTimeout(() => {
          const currentState = useVttStore.getState() as any;
          currentState.executeAction(triggeredAction!.id, triggeredAction!.context, depth + 1);
        }, 50);
      }
      
      return newState;
    });
  };

  const startExecution = () => {
    if (action.isRecurring) {
      useVttStore.setState((s: any) => ({
        actions: s.actions.map((a: Action) => a.id === actionId ? { ...a, currentRepeatExecution: action.repeatCount || 2 } : a)
      }));
      run(action.repeatCount || 2);
    } else {
      run(1);
    }
  };

  if (action.delaySeconds && action.delaySeconds > 0) {
    setTimeout(startExecution, action.delaySeconds * 1000);
  } else {
    startExecution();
  }
}
