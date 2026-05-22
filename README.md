# 🎭 VTT App - Application de Table Virtuelle

[![Version](https://img.shields.io/badge/version-0.709-blue.svg)](https://github.com/your-org/vtt-app)
[![React](https://img.shields.io/badge/React-19.2.0-61dafb.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7.3-646cff.svg)](https://vitejs.dev/)

Application web de type **VTT (Virtual Tabletop)** spécialement conçue pour le jeu de société **Bloodborne: The Card Game** (BotC) et autres jeux de rôle sociaux comme Loup-Garou.

## 📋 Table des Matières

- [Fonctionnalités](#-fonctionnalités)
- [Technologies](#-technologies)
- [Démarrage Rapide](#-démarrage-rapide)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Structure du Projet](#-structure-du-projet)
- [Guide d'Utilisation](#-guide-dutilisation)
- [Architecture](#-architecture)
- [Développement](#-développement)
- [Tests](#-tests)
- [Déploiement](#-déploiement)
- [Contribution](#-contribution)
- [FAQ](#-faq)
- [Licence](#-licence)

## ✨ Fonctionnalités

### Pour le Maître du Jeu (MJ)
- **Gestion des Joueurs** : Création, modification et suppression des joueurs
- **Distribution des Rôles** : Attribution automatique ou manuelle des rôles
- **Système de Tags** : Distribution et gestion des tags personnalisés
- **Actions Automatisées** : Moteur d'actions conditionnelles et effets dynamiques
- **Tableau de Bord** : Vue d'ensemble complète de la partie en cours
- **Handouts** : Génération de documents à distribuer aux joueurs
- **Soundboard Intégrée** : Gestion des effets sonores pendant la partie
- **Minuteur Personnalisable** : Timer avec sons de fin configurables
- **Mode Sombre/Clair** : Thème adaptatif

### Pour les Joueurs
- **Interface Dédiée** : Vue simplifiée avec informations pertinentes
- **Rejoindre une Partie** : Connexion via code de session ou QR Code
- **Cartes Personnalisées** : Affichage des rôles et tags attribués
- **Soundboard à Distance** : Contrôle audio depuis mobile (optionnel)

### Fonctionnalités Avancées
- **Synchronisation Temps Réel** : Mise à jour instantanée via Supabase
- **Export PDF** : Génération de récapitulatifs de partie
- **Templates Personnalisables** : Modèles de rôles, tags et actions
- **Internationalisation (i18n)** : Support multi-langues (FR, EN, etc.)
- **Historique & Undo/Redo** : Navigation dans l'historique des actions
- **Liste Virtuelle** : Optimisation des performances pour les grandes listes

## 🛠 Technologies

### Frontend
- **React 19.2** - Bibliothèque UI avec React Compiler
- **TypeScript 5.9** - Typage statique avancé
- **Vite 7.3** - Build tool ultra-rapide
- **React Router DOM 7.1** - Routing déclaratif
- **Tailwind CSS 4.2** - Framework CSS utilitaire

### State Management
- **Zustand 5.0** - Gestion d'état légère et performante
- **Zundo 2.3** - Middleware undo/redo pour Zustand

### Drag & Drop
- **@dnd-kit** - Bibliothèque moderne de drag & drop

### Backend & Données
- **Supabase** - Backend as a Service (PostgreSQL, Realtime, Auth)
- **QRCode.react** - Génération de QR Codes

### Utilitaires
- **clsx + tailwind-merge** - Gestion des classes CSS conditionnelles
- **Lucide React** - Bibliothèque d'icônes modernes
- **DOMPurify** - Nettoyage HTML pour la sécurité
- **jsPDF** - Génération de documents PDF
- **@tanstack/react-virtual** - Virtualisation de listes

### Tests & Qualité
- **Vitest 4.1** - Framework de tests unitaires
- **ESLint 9** - Linting du code
- **TypeScript ESLint** - Rules TypeScript spécifiques

## 🚀 Démarrage Rapide

### Prérequis
- Node.js >= 20.x
- npm >= 10.x
- Un compte Supabase (gratuit)

### Installation en 5 minutes

```bash
# 1. Cloner le dépôt
git clone https://github.com/your-org/vtt-app.git
cd vtt-app

# 2. Installer les dépendances
npm install

# 3. Copier le fichier d'environnement
cp .env.example .env

# 4. Configurer Supabase (voir section Configuration)
# Éditez .env avec vos clés Supabase

# 5. Lancer le serveur de développement
npm run dev
```

L'application est maintenant accessible sur `http://localhost:5173`

## 📦 Installation

### Installation Locale

```bash
# Installation complète
npm ci

# Vérification de l'installation
npm run lint
npm run test
```

### Installation pour Développement

```bash
# Mode développement avec hot-reload
npm run dev

# Mode développement avec hôte réseau
npm run dev -- --host
```

### Build de Production

```bash
# Compilation optimisée
npm run build

# Prévisualisation du build
npm run preview
```

## ⚙️ Configuration

### Configuration Supabase

1. Créez un projet sur [supabase.com](https://supabase.com)
2. Récupérez l'URL et la clé anonyme dans les paramètres du projet
3. Mettez à jour votre fichier `.env` :

```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-clé-anonyme
```

### Schéma de Base de Données

Le schéma Supabase requis est documenté dans [docs/DATABASE.md](./docs/DATABASE.md).

Exemple de tables principales :
- `sessions` : Sessions de jeu actives
- `players` : Joueurs connectés
- `roles` : Rôles disponibles
- `tags` : Tags personnalisés
- `actions` : Actions automatisées

### Variables d'Environnement

| Variable | Description | Requis |
|----------|-------------|--------|
| `VITE_SUPABASE_URL` | URL de votre projet Supabase | ✅ |
| `VITE_SUPABASE_ANON_KEY` | Clé anonyme Supabase | ✅ |

Voir [.env.example](./.env.example) pour un modèle.

## 📁 Structure du Projet

```
vtt-app/
├── public/                 # Assets statiques
│   └── env.example         # Exemple de configuration
├── src/
│   ├── components/         # Composants React réutilisables
│   │   ├── layout/         # Composants de mise en page
│   │   ├── tags/           # Composants liés aux tags
│   │   ├── timer/          # Composants de minuterie
│   │   ├── ActionConditionWindow.tsx
│   │   ├── ActionCreatorWindow.tsx
│   │   ├── ActionEffectWindow.tsx
│   │   ├── ChecklistWindow.tsx
│   │   ├── ColorPicker.tsx
│   │   ├── ConfirmModal.tsx
│   │   ├── CustomPopupOverlay.tsx
│   │   ├── DetachedSoundboard.tsx
│   │   ├── DetachedTimer.tsx
│   │   ├── DynamicColor.tsx
│   │   ├── EditingModal.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── HandoutWindow.tsx
│   │   ├── MemoizedComponents.tsx
│   │   ├── RoleSelectorWindow.tsx
│   │   ├── ScoreboardWindow.tsx
│   │   ├── Skeletons.tsx
│   │   ├── TagDistributorWindow.tsx
│   │   ├── TemplateSelectorModal.tsx
│   │   ├── ThemeToggle.tsx
│   │   ├── Toast.tsx
│   │   ├── VirtualList.tsx
│   │   └── WikiWindow.tsx
│   ├── hooks/              # Hooks React personnalisés
│   ├── lib/                # Utilitaires et logique métier
│   │   ├── __tests__/      # Tests unitaires
│   │   ├── action-engine/  # Moteur d'actions
│   │   ├── utils/          # Fonctions utilitaires
│   │   ├── audio-engine.ts
│   │   ├── audio-storage.ts
│   │   ├── db.ts
│   │   ├── distribute-roles.ts
│   │   ├── game-export.ts
│   │   ├── i18n.ts         # Configuration i18n
│   │   ├── icons.ts
│   │   ├── name-generator.ts
│   │   ├── player-templates.ts
│   │   ├── realtime-host.ts
│   │   ├── role-templates.ts
│   │   ├── supabase.ts
│   │   ├── tag-templates.ts
│   │   ├── timer-sound.ts
│   │   └── utils.ts
│   ├── pages/              # Pages de l'application
│   │   ├── GmView.tsx      # Interface MJ
│   │   ├── PlayerJoin.tsx  # Page de connexion joueur
│   │   ├── PlayerView.tsx  # Interface joueur
│   │   ├── ResetPage.tsx
│   │   ├── SoundboardJoin.tsx
│   │   └── SoundboardRemote.tsx
│   ├── store/              # Stores Zustand
│   │   ├── index.ts        # Store principal
│   │   └── selectors.ts    # Sélecteurs optimisés
│   ├── templates/          # Templates de configuration
│   ├── types/              # Types TypeScript
│   │   ├── index.ts        # Types principaux
│   │   └── tag-form.ts     # Types liés aux tags
│   ├── assets/             # Images, polices, etc.
│   ├── 'BotC Images'/      # Assets Bloodborne
│   ├── 'cartes LG'/        # Assets Loup-Garou
│   ├── App.tsx             # Composant racine
│   ├── App.css
│   ├── main.tsx            # Point d'entrée
│   └── index.css           # Styles globaux
├── docs/                   # Documentation
│   ├── DATABASE.md         # Schéma de base de données
│   ├── ARCHITECTURE.md     # Architecture technique
│   ├── API.md              # Documentation API
│   └── CONTRIBUTING.md     # Guide de contribution
├── tests/                  # Tests E2E (à venir)
├── .env.example            # Modèle de configuration
├── .eslintrc.cjs           # Configuration ESLint
├── .gitignore
├── index.html
├── package.json
├── tsconfig.app.json       # Config TypeScript app
├── tsconfig.node.json      # Config TypeScript node
├── vite.config.ts          # Configuration Vite
└── README.md
```

## 📖 Guide d'Utilisation

### Créer une Nouvelle Partie

1. **Accéder à l'interface MJ** : Naviguez vers `/gm`
2. **Configurer la session** :
   - Définir le nombre de joueurs
   - Sélectionner les rôles disponibles
   - Configurer les options de jeu
3. **Inviter les joueurs** :
   - Partager le code de session
   - Ou scanner le QR Code généré
4. **Distribuer les rôles** :
   - Automatiquement via le bouton "Distribuer"
   - Ou manuellement par glisser-déposer
5. **Lancer la partie** : Utiliser les actions et timers

### Gérer les Joueurs

- **Ajouter** : Cliquez sur "+" dans la liste des joueurs
- **Modifier** : Double-cliquez sur un joueur
- **Supprimer** : Cliquez sur l'icône poubelle
- **Attribuer un rôle** : Glissez-déposez depuis le panneau des rôles

### Utiliser les Actions Automatisées

Le moteur d'actions permet de créer des déclencheurs conditionnels :

```typescript
// Exemple d'action conditionnelle
{
  trigger: "night_start",
  conditions: [
    { type: "role_exists", role: "loup_garou" }
  ],
  effects: [
    { type: "show_message", text: "Les loups-garous se réveillent" },
    { type: "play_sound", soundId: "wolf_howl" }
  ]
}
```

### Personnaliser les Tags

1. Accédez à l'onglet "Tags"
2. Créez un nouveau tag avec nom, couleur et icône
3. Configurez les règles de distribution
4. Appliquez aux joueurs souhaités

### Exporter une Partie

- **PDF** : Bouton "Exporter" → Génère un résumé complet
- **JSON** : Sauvegarde de la configuration pour réutilisation

## 🏗 Architecture

### Flux de Données

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   UI React  │────▶│   Zustand    │────▶│  Supabase   │
│  Components │◀────│    Store     │◀────│  Realtime   │
└─────────────┘     └──────────────┘     └─────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │    Zundo     │
                    │ (Undo/Redo)  │
                    └──────────────┘
```

### Gestion d'État

- **Zustand** : État global de l'application
- **Sélecteurs** : Optimisation des re-renders avec `selectors.ts`
- **Persistance** : Synchronisation automatique avec Supabase
- **Historique** : Middleware Zundo pour undo/redo

### Moteur d'Actions

Situé dans `src/lib/action-engine/`, il gère :
- **Triggers** : Événements déclencheurs (timer, action utilisateur, etc.)
- **Conditions** : Prédicats pour valider l'exécution
- **Effets** : Actions exécutées (messages, sons, modifications d'état)

### Synchronisation Temps Réel

Utilise les subscriptions Supabase pour :
- Mise à jour instantanée des états joueurs
- Synchronisation des actions entre MJ et joueurs
- Gestion des connexions/déconnexions

## 💻 Développement

### Scripts Disponibles

```bash
# Développement
npm run dev              # Lance le serveur de développement
npm run dev -- --host    #Expose sur le réseau local

# Build
npm run build            # Compile pour la production
npm run preview          # Prévisualise le build

# Tests
npm run test             # Exécute les tests unitaires
npm run test:watch       # Mode watch pour les tests
npm run test -- --ui     # Interface graphique Vitest

# Qualité de code
npm run lint             # Vérifie le code avec ESLint
npm run lint -- --fix    # Corrige automatiquement
```

### Bonnes Pratiques de Développement

1. **Typage Fort** : Toujours typer les props et états
2. **Composants Mémoïsés** : Utiliser `MemoizedComponents.tsx` pour les listes
3. **Sélecteurs Zustand** : Préférer les sélecteurs aux accès directs
4. **Tests Unitaires** : Couvrir la logique métier dans `lib/__tests__/`
5. **Commits Atomiques** : Un changement = un commit

### Ajouter un Nouveau Composant

```tsx
// src/components/MonNouveauComposant.tsx
import React from 'react';
import { useStore } from '../store';

interface MonNouveauComposantProps {
  // Props typées
}

export const MonNouveauComposant: React.FC<MonNouveauComposantProps> = ({
  // Destructuring
}) => {
  // Logique avec hooks
  const state = useStore(state => state.maPropriété);
  
  return (
    <div className="...">
      {/* JSX */}
    </div>
  );
};
```

### Ajouter une Nouvelle Action

1. Créer le trigger dans `src/lib/action-engine/triggers.ts`
2. Définir les conditions dans `src/lib/action-engine/conditions.ts`
3. Implémenter l'effet dans `src/lib/action-engine/effects.ts`
4. Tester avec des cas limites

## 🧪 Tests

### Exécuter les Tests

```bash
# Tous les tests
npm run test

# Mode interactif
npm run test:watch

# Avec interface graphique
npm run test -- --ui

# Couverture de code
npm run test -- --coverage
```

### Écrire un Test

```typescript
// src/lib/__tests__/mon-module.test.ts
import { describe, it, expect, vi } from 'vitest';
import { maFonction } from '../mon-module';

describe('maFonction', () => {
  it('devrait retourner la valeur attendue', () => {
    const result = maFonction('input');
    expect(result).toBe('output');
  });

  it('devrait gérer les cas limites', () => {
    expect(() => maFonction(null)).toThrow();
  });
});
```

### Zones à Tester

- [ ] Moteur d'actions (triggers, conditions, effets)
- [ ] Distribution des rôles
- [ ] Synchronisation Supabase
- [ ] Gestion des tags
- [ ] Export PDF
- [ ] Audio engine

## 🚀 Déploiement

### Build de Production

```bash
# Compilation optimisée
npm run build

# Le output est dans dist/
```

### Hébergement Statique

L'application peut être déployée sur :

- **Vercel** : `vercel deploy`
- **Netlify** : Drag & drop du dossier `dist/`
- **GitHub Pages** : Via GitHub Actions
- **Cloudflare Pages** : Connecter le dépôt Git

### Configuration de Production

1. Définir les variables d'environnement sur la plateforme
2. Builder avec `npm run build`
3. Servir le dossier `dist/`

### Docker (Optionnel)

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
FROM nginx:alpine
COPY --from=0 /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 🤝 Contribution

Nous accueillons les contributions avec plaisir !

### Comment Contribuer

1. **Fork** le projet
2. **Créer une branche** (`git checkout -b feature/AmazingFeature`)
3. **Commit** vos changements (`git commit -m 'Add AmazingFeature'`)
4. **Push** vers la branche (`git push origin feature/AmazingFeature`)
5. **Ouvrir une Pull Request**

### Standards de Code

- **ESLint** : Suivre les règles configurées
- **Prettier** : Formatage automatique (si configuré)
- **Conventional Commits** : Messages de commit structurés

### Types de Contributions

- 🐛 Bug fixes
- ✨ Nouvelles fonctionnalités
- 📝 Documentation
- 🎨 Améliorations UI/UX
- ⚡ Optimisations de performance
- 🧪 Tests supplémentaires

### Guide de Contribution Détaillé

Voir [docs/CONTRIBUTING.md](./docs/CONTRIBUTING.md) pour plus de détails.

## ❓ FAQ

### Q: Comment réinitialiser une partie ?
R: Utilisez le bouton "Reset" dans l'interface MJ ou accédez à `/reset`.

### Q: Les joueurs ne voient pas les mises à jour ?
R: Vérifiez la connexion Supabase et les permissions RLS.

### Q: Comment ajouter de nouveaux rôles ?
R: Modifiez `src/lib/role-templates.ts` ou utilisez l'interface de création.

### Q: L'audio ne fonctionne pas ?
R: Les navigateurs bloquent l'autoplay. Une interaction utilisateur est requise.

### Q: Support mobile ?
R: L'application est responsive. La soundboard a une vue mobile dédiée.

### Q: Puis-je utiliser cette app pour d'autres jeux ?
R: Oui ! Adaptez les templates de rôles et actions dans `src/lib/`.

## 📄 Licence

Ce projet est sous licence MIT - voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 🙏 Remerciements

- **React Team** pour React 19
- **Vite Team** pour l'outil de build incroyable
- **Supabase** pour le backend temps réel
- **Zustand Team** pour la gestion d'état simple
- **dnd-kit** pour le drag & drop moderne
- **La communauté Bloodborne** pour l'inspiration

## 📞 Contact

- **Issues** : [GitHub Issues](https://github.com/your-org/vtt-app/issues)
- **Discussions** : [GitHub Discussions](https://github.com/your-org/vtt-app/discussions)

---

**Développé avec ❤️ pour la communauté VTT**

*Version actuelle : 0.709*
