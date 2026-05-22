# 🏗 Architecture Technique

Ce document décrit l'architecture technique de l'application VTT.

## Vue d'Ensemble

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Browser                          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                  React 19 App                         │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │  │
│  │  │   Pages     │  │ Components  │  │    Hooks    │   │  │
│  │  │             │  │             │  │             │   │  │
│  │  │ - GmView    │  │ - Windows   │  │ - useStore  │   │  │
│  │  │ - Player    │  │ - Modals    │  │ - useRealtime│  │  │
│  │  │ - Join      │  │ - Layout    │  │ - useAudio  │   │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘   │  │
│  │                                                       │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │              Zustand Store + Zundo              │  │  │
│  │  │  - State management                             │  │  │
│  │  │  - Undo/Redo middleware                         │  │  │
│  │  │  - Selectors optimisés                          │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  │                                                       │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │              Realtime Engine                    │  │  │
│  │  │  - Supabase subscriptions                       │  │  │
│  │  │  - Sync state                                   │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS / WebSocket
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Supabase Backend                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ PostgreSQL  │  │   Realtime  │  │    Auth     │         │
│  │  Database   │  │   Server    │  │             │         │
│  │             │  │             │  │             │         │
│  │ - Tables    │  │ - Channels  │  │ - Users     │         │
│  │ - RLS       │  │ - Broadcast │  │ - Sessions  │         │
│  │ - Functions │  │ - Presence  │  │             │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐                          │
│  │  Storage    │  │   Edge      │                          │
│  │  (Audio)    │  │  Functions  │                          │
│  └─────────────┘  └─────────────┘                          │
└─────────────────────────────────────────────────────────────┘
```

## Structure des Fichiers

### Arborescence Détaillée

```
src/
├── components/           # Composants UI réutilisables
│   ├── layout/          # Composants de structure
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── MainLayout.tsx
│   ├── tags/            # Composants liés aux tags
│   │   ├── TagBadge.tsx
│   │   ├── TagCreator.tsx
│   │   └── TagList.tsx
│   ├── timer/           # Composants de minuterie
│   │   ├── TimerDisplay.tsx
│   │   └── TimerControls.tsx
│   ├── ActionConditionWindow.tsx   # Édition des conditions
│   ├── ActionCreatorWindow.tsx     # Création d'actions
│   ├── ActionEffectWindow.tsx      # Édition des effets
│   ├── ChecklistContent.tsx        # Contenu de checklist
│   ├── ChecklistWindow.tsx         # Fenêtre de checklist
│   ├── ColorPicker.tsx             # Sélecteur de couleur
│   ├── ConfirmModal.tsx            # Modal de confirmation
│   ├── CustomPopupOverlay.tsx      # Overlay personnalisable
│   ├── DetachedSoundboard.tsx      # Soundboard détachable
│   ├── DetachedTimer.tsx           # Timer détachable
│   ├── DynamicColor.tsx            # Couleur dynamique
│   ├── EditingModal.tsx            # Modal d'édition générique
│   ├── ErrorBoundary.tsx           # Gestion des erreurs
│   ├── HandoutWindow.tsx           # Fenêtre de handout
│   ├── MemoizedComponents.tsx      # Composants mémoïsés
│   ├── RoleSelectorWindow.tsx      # Sélection de rôles
│   ├── ScoreboardWindow.tsx        # Tableau des scores
│   ├── Skeletons.tsx               # Loaders squelette
│   ├── TagDistributorWindow.tsx    # Distribution de tags
│   ├── TemplateSelectorModal.tsx   # Sélection de templates
│   ├── ThemeToggle.tsx             # Bascule de thème
│   ├── Toast.tsx                   # Notifications toast
│   ├── VirtualList.tsx             # Liste virtualisée
│   └── WikiWindow.tsx              # Fenêtre wiki
│
├── hooks/               # Hooks React personnalisés
│   ├── useAudio.ts      # Gestion audio
│   ├── usePlayer.ts     # État du joueur
│   ├── useSession.ts    # État de session
│   └── useTheme.ts      # Gestion du thème
│
├── lib/                 # Logique métier et utilitaires
│   ├── __tests__/       # Tests unitaires
│   │   ├── distribute-roles.test.ts
│   │   ├── game-export.test.ts
│   │   └── utils.test.ts
│   ├── action-engine/   # Moteur d'actions automatisées
│   │   ├── triggers.ts  # Déclencheurs
│   │   ├── conditions.ts # Conditions
│   │   ├── effects.ts   # Effets
│   │   └── executor.ts  # Exécuteur
│   ├── utils/           # Fonctions utilitaires
│   │   ├── cn.ts        # Classnames helper
│   │   ├── formatters.ts # Formatage
│   │   └── validators.ts # Validation
│   ├── audio-engine.ts  # Moteur audio
│   ├── audio-storage.ts # Stockage audio
│   ├── db.ts            # Utilitaires database
│   ├── distribute-roles.ts # Algorithme de distribution
│   ├── game-export.ts   # Export de partie (PDF, JSON)
│   ├── i18n.ts          # Configuration internationalisation
│   ├── icons.ts         # Icônes personnalisées
│   ├── name-generator.ts # Générateur de noms
│   ├── player-templates.ts # Templates de joueurs
│   ├── realtime-host.ts # Hôte temps réel
│   ├── role-templates.ts # Templates de rôles
│   ├── supabase.ts      # Client Supabase
│   ├── tag-templates.ts # Templates de tags
│   ├── timer-sound.ts   # Sons du timer
│   └── utils.ts         # Utilitaires généraux
│
├── pages/               # Pages de l'application
│   ├── GmView.tsx       # Interface Maître du Jeu
│   ├── PlayerJoin.tsx   # Page de connexion joueur
│   ├── PlayerView.tsx   # Interface Joueur
│   ├── ResetPage.tsx    # Réinitialisation
│   ├── SoundboardJoin.tsx # Connexion soundboard
│   └── SoundboardRemote.tsx # Contrôle soundboard
│
├── store/               # Stores Zustand
│   ├── index.ts         # Store principal
│   │   - State definition
│   │   - Actions
│   │   - Persist config
│   └── selectors.ts     # Sélecteurs optimisés
│       - Memoized selectors
│       - Computed values
│
├── templates/           # Templates de configuration
│   ├── default-game.json
│   ├── werewolf-classic.json
│   └── botc-scenario.json
│
├── types/               # Types TypeScript
│   ├── index.ts         # Types principaux
│   │   - Player
│   │   - Role
│   │   - Session
│   │   - Action
│   │   - Tag
│   │   - GameEvent
│   └── tag-form.ts      # Types formulaires tags
│
├── assets/              # Assets statiques
│   ├── images/
│   ├── sounds/
│   └── fonts/
│
├── 'BotC Images'/       # Assets Bloodborne
├── 'cartes LG'/         # Assets Loup-Garou
├── App.tsx              # Composant racine
├── App.css              # Styles de l'app
├── main.tsx             # Point d'entrée
└── index.css            # Styles globaux
```

## Flux de Données

### 1. Initialisation

```
User loads app
    ↓
main.tsx renders <App />
    ↓
App initializes Zustand store
    ↓
Store loads persisted state (localStorage)
    ↓
Supabase connection established
    ↓
Realtime subscriptions active
    ↓
UI renders with initial data
```

### 2. Synchronisation Temps Réel

```
GM makes change (e.g., assign role)
    ↓
Store updated locally (Zustand)
    ↓
Change sent to Supabase (players.update)
    ↓
Supabase broadcasts to channel
    ↓
All connected clients receive update
    ↓
Each client updates local store
    ↓
React re-renders affected components
```

### 3. Moteur d'Actions

```
Event occurs (timer, phase change, etc.)
    ↓
Action Engine checks triggers
    ↓
Matching action found
    ↓
Evaluate conditions
    ↓
Conditions met?
    ├─ No → Skip action
    └─ Yes → Execute effects
         ↓
    Apply effects sequentially
         ↓
    Update store state
         ↓
    Trigger UI updates
```

## Gestion d'État

### Zustand Store Structure

```typescript
interface AppState {
  // Session
  session: Session | null;
  sessionId: string | null;
  
  // Players
  players: Player[];
  currentPlayer: Player | null;
  
  // Roles
  roles: Role[];
  availableRoles: Role[];
  
  // Tags
  tags: Tag[];
  
  // Actions
  actions: Action[];
  
  // UI State
  ui: {
    currentView: 'gm' | 'player';
    activeWindows: WindowId[];
    theme: 'light' | 'dark';
    sidebarOpen: boolean;
  };
  
  // Audio
  audio: {
    isPlaying: boolean;
    currentTrack: string | null;
    volume: number;
  };
  
  // Actions
  setSession: (session: Session) => void;
  addPlayer: (player: Player) => void;
  updatePlayer: (id: string, updates: Partial<Player>) => void;
  assignRole: (playerId: string, roleId: string) => void;
  // ... more actions
}
```

### Sélecteurs Optimisés

```typescript
// src/store/selectors.ts
import { createSelector } from 'reselect'; // ou pattern similaire

export const selectAlivePlayers = createSelector(
  [state => state.players],
  players => players.filter(p => p.is_alive)
);

export const selectPlayersByTeam = createSelector(
  [state => state.players, state => state.roles, (_, team) => team],
  (players, roles, team) => 
    players.filter(p => {
      const role = roles.find(r => r.id === p.role_id);
      return role?.team === team && p.is_alive;
    })
);
```

## Performance

### Optimisations Implémentées

1. **Virtualisation** : `@tanstack/react-virtual` pour les longues listes
2. **Mémoïsation** : `React.memo` pour les composants purs
3. **Sélecteurs** : Sélecteurs Zustand pour éviter re-renders inutiles
4. **Code Splitting** : Chargement différé des routes
5. **Debouncing** : Limitation des updates fréquentes

### Points d'Attention

- Éviter les objets/fonctions inline dans le JSX
- Utiliser `useCallback` pour les callbacks passés en props
- Préférer les sélecteurs aux accès directs au store
- Limiter la profondeur de nesting des composants

## Sécurité

### Côté Client

- **DOMPurify** : Nettoyage HTML pour prévenir XSS
- **Validation** : Validation stricte des inputs
- **Tokens** : Gestion sécurisée des tokens Supabase

### Côté Serveur (Supabase)

- **RLS** : Row Level Security sur toutes les tables
- **Auth** : Authentification Supabase Auth
- **Rate Limiting** : Limitation des requêtes API

## Tests

### Stratégie de Test

```
Tests Unitaires (Vitest)
├── Logique métier (lib/)
├── Utilitaires
└── Hooks

Tests de Composants (à implémenter)
├── Rendu
├── Interactions
└── Props

Tests E2E (à implémenter)
├── Flux complets
├── Synchronisation
└── Performance
```

### Exécution

```bash
# Tests unitaires
npm run test

# Mode watch
npm run test:watch

# Avec UI
npm run test -- --ui

# Couverture
npm run test -- --coverage
```

## Build & Déploiement

### Processus de Build

```
Source files (TypeScript + React)
    ↓
Vite (esbuild + Rollup)
    ↓
Transpilation (TypeScript → JavaScript)
    ↓
Bundling + Tree Shaking
    ↓
Minification + Optimization
    ↓
Assets hashing
    ↓
Output in dist/
```

### Configuration Vite

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          zustand: ['zustand', 'zundo'],
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
  },
});
```

## Monitoring & Debugging

### Outils Recommandés

- **React DevTools** : Inspection des composants
- **Zustand DevTools** : Debug du store
- **Supabase Dashboard** : Logs database
- **Browser DevTools** : Network, Performance

### Logging

```typescript
// Pattern de logging recommandé
const log = createLogger('ComponentName', {
  level: import.meta.env.DEV ? 'debug' : 'error',
});

log.debug('Detailed info');
log.info('Important event');
log.warn('Potential issue');
log.error('Error occurred', error);
```

## Évolutions Futures

### Roadmap Technique

- [ ] PWA complet (offline support)
- [ ] WebRTC pour voice chat intégré
- [ ] Service Workers pour caching
- [ ] Lazy loading avancé des routes
- [ ] GraphQL API (optionnel)
- [ ] Micro-frontends pour modules
- [ ] Plugin system pour extensions

---

*Document maintenu à jour avec la version 0.709 de l'application.*
