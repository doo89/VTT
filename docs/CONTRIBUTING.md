# 🤝 Guide de Contribution

Merci de votre intérêt pour contribuer à VTT App ! Ce guide vous aidera à démarrer.

## Table des Matières

1. [Code de Conduite](#code-de-conduite)
2. [Comment Contribuer](#comment-contribuer)
3. [Configuration du Développement](#configuration-du-développement)
4. [Standards de Code](#standards-de-code)
5. [Commits](#commits)
6. [Pull Requests](#pull-requests)
7. [Tests](#tests)
8. [Documentation](#documentation)

## Code de Conduite

Soyez respectueux et inclusif. Nous accueillons les contributions de tous, quels que soient :
- Le niveau d'expérience
- Le genre, l'orientation sexuelle, l'identité
- L'origine ethnique, la religion
- Le handicap, l'apparence physique

## Comment Contribuer

### Types de Contributions

🐛 **Bug Reports**
- Signalez les bugs via les [GitHub Issues](https://github.com/your-org/vtt-app/issues)
- Incluez les étapes pour reproduire
- Ajoutez des captures d'écran si pertinent

✨ **Nouvelles Fonctionnalités**
- Proposez d'abord via une Issue
- Décrivez le cas d'usage
- Expliquez pourquoi c'est utile

📝 **Documentation**
- Corrections typo
- Améliorations clarté
- Exemples supplémentaires

🎨 **UI/UX**
- Améliorations visuelles
- Accessibilité
- Responsive design

⚡ **Performance**
- Optimisations
- Réduction bundle size
- Amélioration temps de chargement

🧪 **Tests**
- Tests unitaires manquants
- Tests E2E
- Augmentation couverture

### Processus de Contribution

```
1. Fork le projet
2. Créez une branche feature
3. Développez vos changements
4. Testez localement
5. Commitez avec un message clair
6. Push vers GitHub
7. Ouvrez une Pull Request
8. Répondez aux reviews
9. Merge après approbation
```

## Configuration du Développement

### Prérequis

- Node.js >= 20.x
- npm >= 10.x
- Git
- Un compte Supabase (pour le développement complet)

### Installation

```bash
# 1. Fork et clone
git clone https://github.com/VOTRE_USERNAME/vtt-app.git
cd vtt-app

# 2. Installer les dépendances
npm install

# 3. Configurer l'environnement
cp .env.example .env
# Éditez .env avec vos clés Supabase

# 4. Lancer en développement
npm run dev
```

### Branches

```bash
# Branche principale
main

# Branches de fonctionnalité
feature/nom-de-la-fonctionnalite

# Correction de bugs
fix/description-du-bug

# Documentation
docs/sujet-documentation

# Refactoring
refactor/composant-x
```

## Standards de Code

### TypeScript

```typescript
// ✅ Bien : Typage explicite
interface PlayerProps {
  id: string;
  name: string;
  isAlive: boolean;
}

const PlayerCard: React.FC<PlayerProps> = ({ id, name, isAlive }) => {
  // ...
};

// ❌ À éviter : any implicite
const PlayerCard = ({ id, name, isAlive }) => {
  // ...
};
```

### React

```typescript
// ✅ Bien : Composants fonctionnels avec hooks
export const PlayerList: React.FC<PlayerListProps> = ({ players }) => {
  const selectedPlayers = useStore(state => state.selectedPlayers);
  
  return (
    <ul>
      {players.map(player => (
        <PlayerItem key={player.id} player={player} />
      ))}
    </ul>
  );
};

// ✅ Bien : Mémoïsation quand nécessaire
const ExpensiveComponent = React.memo(({ data }) => {
  return <div>{/* rendu coûteux */}</div>;
});
```

### CSS / Tailwind

```tsx
// ✅ Bien : Classes Tailwind organisées
<div className="flex items-center justify-between gap-4 p-4 bg-white rounded-lg shadow-md">
  {/* contenu */}
</div>

// ✅ Bien : Utilisation de clsx/tailwind-merge
import { cn } from '@/lib/utils';

<button className={cn(
  'px-4 py-2 rounded font-medium',
  isActive ? 'bg-blue-500 text-white' : 'bg-gray-200',
  className
)}>
```

### Nommage

```typescript
// Fichiers : PascalCase pour composants, kebab-case pour autres
ActionCreatorWindow.tsx    // Composant
distribute-roles.ts        // Utilitaire
player-templates.ts        // Templates

// Variables : camelCase
const currentPlayer = {};
let sessionCount = 0;

// Constantes : UPPER_SNAKE_CASE
const MAX_PLAYERS = 20;
const DEFAULT_THEME = 'dark';

// Types/Interfaces : PascalCase
interface GameState {
  // ...
}

type PlayerRole = 'villager' | 'werewolf' | 'seer';
```

### Structure des Composants

```typescript
import React from 'react';
import { useStore } from '@/store';
import { cn } from '@/lib/utils';

// Types
interface MonComposantProps {
  title: string;
  isVisible: boolean;
  onClose: () => void;
}

// Composant
export const MonComposant: React.FC<MonComposantProps> = ({
  title,
  isVisible,
  onClose,
}) => {
  // Hooks
  const players = useStore(state => state.players);
  
  // State local
  const [isLoading, setIsLoading] = React.useState(false);
  
  // Handlers
  const handleClick = React.useCallback(() => {
    // logique
  }, []);
  
  // Render conditionnel
  if (!isVisible) return null;
  
  // Rendu
  return (
    <div className="...">
      {/* JSX */}
    </div>
  );
};
```

## Commits

### Convention

Nous suivons [Conventional Commits](https://www.conventionalcommits.org/) :

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Types

- `feat`: Nouvelle fonctionnalité
- `fix`: Correction de bug
- `docs`: Documentation uniquement
- `style`: Code style (formatting, etc.)
- `refactor`: Refactoring sans changement fonctionnel
- `perf`: Amélioration performance
- `test`: Ajout/modification de tests
- `chore`: Maintenance (build, deps, etc.)
- `ci`: Configuration CI/CD

### Exemples

```bash
# Fonctionnalité
git commit -m "feat(soundboard): ajouter contrôle volume distant"

# Bug fix
git commit -m "fix(players): corriger synchronisation état joueur"

# Documentation
git commit -m "docs(readme): améliorer section installation"

# Refactoring
git commit -m "refactor(store): optimiser sélecteurs Zustand"

# Breaking change
git commit -m "feat(api): changer format réponse actions

BREAKING CHANGE: L'API des actions retourne maintenant un objet au lieu d'un tableau.
```

## Pull Requests

### Template de PR

```markdown
## Description
<!-- Décrivez vos changements -->

## Type de changement
<!-- Cochez les cases pertinentes -->
- [ ] Bug fix (changement non cassant qui corrige un problème)
- [ ] Nouvelle fonctionnalité (changement non cassant qui ajoute une fonctionnalité)
- [ ] Breaking change (correction ou fonctionnalité qui affecte une fonctionnalité existante)
- [ ] Refactoring
- [ ] Documentation

## Checklist
<!-- Vérifiez les points suivants -->
- [ ] Mon code suit les standards du projet
- [ ] J'ai testé mes changements localement
- [ ] J'ai ajouté des tests si pertinent
- [ ] J'ai mis à jour la documentation si nécessaire
- [ ] Les tests passent (`npm run test`)
- [ ] Le linting passe (`npm run lint`)

## Screenshots (si pertinent)
<!-- Ajoutez des captures d'écran pour les changements UI -->

## Issue liée
<!-- Mentionnez l'issue résolue, ex: Fixes #123 -->
```

### Processus de Review

1. **Création** : Ouvrez la PR avec une description claire
2. **CI** : Attendez que les checks automatisés passent
3. **Review** : Au moins un mainteneur doit approuver
4. **Changes** : Répondez aux commentaires et push les corrections
5. **Merge** : Un mainteneur merge la PR

### Délais de Review

- PR mineures (docs, typo) : 1-2 jours
- PR moyennes (bug fixes) : 3-5 jours
- PR majeures (features) : 5-7 jours

## Tests

### Exécuter les Tests

```bash
# Tous les tests
npm run test

# Mode watch (développement)
npm run test:watch

# Avec interface graphique
npm run test -- --ui

# Couverture de code
npm run test -- --coverage
```

### Écrire un Test

```typescript
// src/lib/__tests__/mon-module.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { distributeRoles } from '../distribute-roles';

describe('distributeRoles', () => {
  beforeEach(() => {
    // Setup avant chaque test
  });

  it('devrait distribuer les rôles équitablement', () => {
    const players = [
      { id: '1', name: 'Joueur 1' },
      { id: '2', name: 'Joueur 2' },
    ];
    const roles = [
      { id: 'r1', name: 'Loup-Garou' },
      { id: 'r2', name: 'Villageois' },
    ];

    const result = distributeRoles(players, roles);

    expect(result).toHaveLength(2);
    expect(result[0]).toHaveProperty('role_id');
  });

  it('devrait gérer le cas sans joueurs', () => {
    const result = distributeRoles([], []);
    expect(result).toEqual([]);
  });

  it('devrait lancer une erreur si pas assez de rôles', () => {
    expect(() => distributeRoles([{ id: '1' }], [])).toThrow();
  });
});
```

### Couverture Cible

- Logique métier : > 80%
- Utilitaires : > 90%
- Composants UI : > 60% (à améliorer)

## Documentation

### Mettre à Jour la Documentation

```markdown
# Dans le fichier approprié (README.md, docs/*.md)

## Section ajoutée

Description claire avec exemples de code si pertinent.

```typescript
// Exemple de code
const example = 'well documented';
```
```

### Commentaires de Code

```typescript
/**
 * Distribue aléatoirement des rôles parmi les joueurs.
 * 
 * @param players - Liste des joueurs participants
 * @param roles - Pool de rôles disponibles
 * @returns Liste des joueurs avec rôle attribué
 * @throws Error si pas assez de rôles pour les joueurs
 * 
 * @example
 * ```typescript
 * const result = distributeRoles(players, roles);
 * ```
 */
export function distributeRoles(players: Player[], roles: Role[]): PlayerWithRole[] {
  // Implémentation
}
```

## Ressources Utiles

- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Zustand Documentation](https://zustand-demo.pmnd.rs/)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Vitest](https://vitest.dev/)

## Questions ?

- 💬 [GitHub Discussions](https://github.com/your-org/vtt-app/discussions)
- 🐛 [GitHub Issues](https://github.com/your-org/vtt-app/issues)
- 📧 contact@vtt-app.example.com

---

Merci pour votre contribution ! 🎉

*Guide basé sur les meilleures pratiques open source.*
