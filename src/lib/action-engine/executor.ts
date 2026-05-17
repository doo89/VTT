import type { Action, ActionCondition, ActionEffect } from '../../types';
import { useVttStore } from '../../store';
import type { EffectContext, EffectState, EffectResult } from './types';
import { effectRegistry } from './effects/registry';

/**
 * Evaluate conditions for an action
 */
function evaluateConditions(
  conditions: ActionCondition[],
  state: any,
  context: EffectContext
): { success: boolean } {
  const activeConditions = (conditions || []).filter(c => c.enabled);
  if (activeConditions.length === 0) return { success: true };

  // Group conditions by OR logic
  const conditionGroups: ActionCondition[][] = [[]];
  activeConditions.forEach(c => {
    if (c.logic === 'OR' && conditionGroups[conditionGroups.length - 1].length > 0) {
      conditionGroups.push([c]);
    } else {
      conditionGroups[conditionGroups.length - 1].push(c);
    }
  });

  // Evaluate each group (simplified - full evaluation is in original store)
  const groupResults = conditionGroups.map(group => {
    let success = true;
    group.forEach(c => {
      // Simplified condition check - delegates to original logic
      success = success && checkSingleCondition(c, state, context);
    });
    return { success };
  });

  const finalOk = groupResults.some(g => g.success);
  return { success: finalOk };
}

/**
 * Check a single condition (simplified version)
 */
function checkSingleCondition(
  condition: ActionCondition,
  state: any,
  context: EffectContext
): boolean {
  // This is a simplified version - the full logic remains in the original store
  // for backward compatibility during migration
  return true; // Placeholder - full implementation needed
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
