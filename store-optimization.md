# Optimisation Performance Store VTT

## Status: Phases 1, 2, 3, 4 & 5 COMPLÉTÉES ✅

### Phase 1 - Optimisations Temps Réel:
- ✅ **Debounce du broadcast Supabase** (150ms)
- ✅ **Utilitaires de lookup optimisés** (entity-lookups.ts)
- ✅ **Utils debounce/throttle** réutilisables

### Phase 2 - Moteur d'actions extrait:
- ✅ **Store réduit de 2380 à 961 lignes** (-59.6%)
- ✅ **executeAction réduit de ~1400 à 3 lignes** (-99.8%)
- ✅ **Architecture modulaire** avec handlers par type d'effet
- ✅ **Build passe sans erreur** (3.79s)

### Phase 3 - Optimisations React:
- ✅ **80+ sélecteurs Zustand mémoisés** (store/selectors.ts)
- ✅ **12 composants React.memo** (MemoizedComponents.tsx)
- ✅ **VirtualList** pour les longues listes (@tanstack/react-virtual)
- ✅ **Code splitting** des routes (6 chunks séparés)
- ✅ **Bundle principal réduit de 83.6%** (1,740 → 286 kB)

### Phase 4 - Optimisations Avancées:
- ✅ **EntityCache** pour recherches O(1) avec invalidation automatique
- ✅ **State Diff** pour broadcasts incrémentaux (envoie uniquement les changements)
- ✅ **Throttle position** (500ms) pour éviter le spam pendant le drag
- ✅ **ConditionCache** avec LRU et TTL pour les évaluations de conditions

### Phase 5 - UX/UI Améliorations:
- ✅ **Système de Toast** pour les feedbacks utilisateur (4 types)
- ✅ **Skeleton Loaders** pour le code splitting (9 composants)
- ✅ **Keyboard Shortcuts** pour le GM (15 shortcuts)
- ✅ **Export/Import** de parties (JSON, CSV, logs)

---

## Goal
Optimiser les performances du Zustand store en réduisant les re-renders, en améliorant la recherche de données, et en découpant le code monolithique.

## Tasks - Phase 2 (À FAIRE)

### Optimisation du Store Principal

**Problème:** `store/index.ts` fait **2380 lignes** avec `executeAction` qui en fait ~1400 à lui seul.

**Solution recommandée:** Extraire le moteur d'actions dans un module séparé.

- [ ] 1. Créer `lib/action-engine/effects/` avec un fichier par type d'effet
  - `player-effects.ts` (kill, resurrect, sleep, wake, etc.)
  - `tag-effects.ts` (assignTag, removeTag, spreadTag, etc.)
  - `role-effects.ts` (assignRole, swapPlayerRole, etc.)
  - `team-effects.ts` (assignTeam, shuffleTeams, etc.)
  - `ui-effects.ts` (popup, alert, show/hide, etc.)
  - `timer-effects.ts` (togglePhaseTimer, setPhaseDuration, etc.)
  - `sound-effects.ts` (playSound)
  - `dice-effects.ts` (rollDice)
  
- [ ] 2. Créer `lib/action-engine/executor.ts` (~100 lignes)
  - Fonction principale qui orchestre l'exécution
  - Délègue chaque effet au handler approprié
  - Gère le contexte, les conditions, et le timing

- [ ] 3. Réduire `store/index.ts` à ~500 lignes
  - Garde uniquement les setters/getters basiques
  - Importe `executeAction` depuis l'engine
  - Preserve la compatibilité avec l'API existante

### Sélecteurs Optimisés

- [ ] 4. Créer des sélecteurs mémoisés dans `store/selectors.ts`
  ```typescript
  // Avant (re-render à chaque changement du store):
  const { players, roles } = useVttStore();
  
  // Après (re-render uniquement si players ou roles changent):
  const players = useVttStore(state => state.players);
  const roles = useVttStore(state => state.roles);
  ```

- [ ] 5. Ajouter des sélecteurs pour les données dérivées
  ```typescript
  export const selectAlivePlayers = (state) => state.players.filter(p => !p.isDead);
  export const selectPlayersByRole = (roleId) => (state) => 
    state.players.filter(p => p.roleId === roleId);
  ```

### Maps pour Recherches O(1)

- [ ] 6. Optimiser les recherches dans `executeAction`
  ```typescript
  // Avant (O(n)):
  const player = state.players.find(p => p.id === id);
  
  // Après (O(1)):
  const playerMap = createEntityMap(state.players);
  const player = playerMap.get(id);
  ```

## Tasks - Phase 3 (À FAIRE)

### Optimisations React

- [ ] 7. Ajouter `React.memo` sur les composants de liste
  - PlayerItem, RoleItem, TagItem, TeamItem
  - SoundButton, HandoutItem, LogItem

- [ ] 8. Virtualiser les longues listes
  - Installer `@tanstack/react-virtual`
  - Appliquer sur la liste des joueurs, logs, tags

- [ ] 9. Code splitting des routes
  ```typescript
  const PlayerView = lazy(() => import('./pages/PlayerView'));
  const SoundboardRemote = lazy(() => import('./pages/SoundboardRemote'));
  ```

### Optimisations Temps Réel

- [ ] 10. Diff state avant broadcast
  - Comparer ancien et nouvel état
  - N'envoyer que les différences

- [ ] 11. Throttle sur les updates de position
  - Pan/zoom ne doivent pas broadcaster à chaque pixel

## Done When
- [ ] Store principal fait < 500 lignes (au lieu de 2380)
- [ ] executeAction est externalisé et fait < 100 lignes dans le store
- [ ] Recherches par ID utilisent des Maps (O(1))
- [ ] Broadcasts sont debouncés et optimisés ✅
- [ ] Build et lint passent sans erreur
- [ ] L'application fonctionne comme avant (pas de régression)

## Notes
- **Ne pas casser la compatibilité** avec les clients joueurs existants
- **Préserver la persistance** localStorage (partialize doit rester cohérent)
- **Préserver zundo** (undo/redo) - les slices doivent être compatibles
- **Tests manuels requis**: GM view, player join, actions, soundboard, realtime sync
