# API Documentation

Documentation complète de l'API pour VTT App (Bloodborne: The Card Game).

## Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Authentification](#authentification)
3. [Endpoints](#endpoints)
4. [Modèles de données](#modèles-de-données)
5. [Exemples d'utilisation](#exemples-dutilisation)
6. [Gestion des erreurs](#gestion-des-erreurs)
7. [Limites et quotas](#limites-et-quotas)

---

## Vue d'ensemble

L'API de VTT App est construite sur **Supabase** et expose des endpoints REST et temps réel via WebSocket.

### Base URL
```
Production: https://votre-projet.supabase.co/rest/v1
Développement: http://localhost:54321/rest/v1
```

### Headers requis
```http
Authorization: Bearer <JWT_TOKEN>
apikey: <SUPABASE_ANON_KEY>
Content-Type: application/json
```

### Versions de l'API
- Version actuelle: `v1`
- Endpoint: `/rest/v1/`

---

## Authentification

### Inscription
```http
POST /auth/v1/signup
```

**Body:**
```json
{
  "email": "joueur@example.com",
  "password": "motdepasse123",
  "options": {
    "data": {
      "username": "Joueur1",
      "role": "player"
    }
  }
}
```

**Response (201):**
```json
{
  "id": "uuid-user",
  "email": "joueur@example.com",
  "user_metadata": {
    "username": "Joueur1",
    "role": "player"
  }
}
```

### Connexion
```http
POST /auth/v1/token?grant_type=password
```

**Body:**
```json
{
  "email": "joueur@example.com",
  "password": "motdepasse123"
}
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "expires_in": 3600,
  "refresh_token": "v1.MaKeReFrEsH...",
  "user": {
    "id": "uuid-user",
    "email": "joueur@example.com"
  }
}
```

### Rafraîchissement de token
```http
POST /auth/v1/token?grant_type=refresh_token
```

**Body:**
```json
{
  "refresh_token": "v1.MaKeReFrEsH..."
}
```

### Déconnexion
```http
POST /auth/v1/logout
```

---

## Endpoints

### Sessions

#### Lister les sessions
```http
GET /sessions?select=*&order=created_at.desc
```

**Query Parameters:**
- `select`: Champs à retourner (ex: `id,name,players(count)`)
- `order`: Tri (ex: `created_at.desc`)
- `status`: Filtre par statut (`pending`, `active`, `completed`)

**Response (200):**
```json
[
  {
    "id": "uuid-session",
    "name": "Partie du 15 Janvier",
    "status": "active",
    "game_mode": "classic",
    "max_players": 10,
    "current_players": 5,
    "created_at": "2024-01-15T10:00:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
]
```

#### Créer une session
```http
POST /sessions
```

**Body:**
```json
{
  "name": "Nouvelle Partie",
  "game_mode": "classic",
  "max_players": 10,
  "settings": {
    "allow_spectators": true,
    "auto_start": false,
    "timer_enabled": true
  }
}
```

**Response (201):**
```json
{
  "id": "uuid-session",
  "name": "Nouvelle Partie",
  "status": "pending",
  "host_id": "uuid-user",
  "created_at": "2024-01-15T10:00:00Z"
}
```

#### Obtenir une session
```http
GET /sessions?id=eq.<uuid>
```

#### Mettre à jour une session
```http
PATCH /sessions?id=eq.<uuid>
```

**Body:**
```json
{
  "status": "active",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

#### Supprimer une session
```http
DELETE /sessions?id=eq.<uuid>
```

---

### Joueurs

#### Lister les joueurs d'une session
```http
GET /players?session_id=eq.<uuid>&select=*
```

**Response (200):**
```json
[
  {
    "id": "uuid-player",
    "session_id": "uuid-session",
    "user_id": "uuid-user",
    "username": "Joueur1",
    "role_id": "uuid-role",
    "team": "villagers",
    "is_alive": true,
    "position": { "x": 100, "y": 200 },
    "joined_at": "2024-01-15T10:05:00Z"
  }
]
```

#### Ajouter un joueur
```http
POST /players
```

**Body:**
```json
{
  "session_id": "uuid-session",
  "user_id": "uuid-user",
  "username": "Joueur1",
  "team": "villagers"
}
```

#### Mettre à jour un joueur
```http
PATCH /players?id=eq.<uuid>
```

**Body:**
```json
{
  "is_alive": false,
  "role_id": "uuid-new-role"
}
```

#### Supprimer un joueur
```http
DELETE /players?id=eq.<uuid>
```

---

### Rôles

#### Lister les rôles
```http
GET /roles?select=*
```

**Query Parameters:**
- `team`: Filtre par équipe (`villagers`, `werewolves`, `neutrals`)
- `min_players`: Nombre minimum de joueurs requis
- `max_players`: Nombre maximum de joueurs requis

**Response (200):**
```json
[
  {
    "id": "uuid-role",
    "name": "Loup-Garou",
    "team": "werewolves",
    "description": "Vous devez éliminer tous les villageois",
    "icon": "🐺",
    "abilities": ["night_kill", "pack_communication"],
    "min_players": 4,
    "max_players": 20,
    "priority": 1
  }
]
```

#### Créer un rôle personnalisé
```http
POST /roles
```

**Body:**
```json
{
  "name": "Rôle Personnalisé",
  "team": "neutrals",
  "description": "Description du rôle",
  "icon": "⭐",
  "abilities": ["special_ability"],
  "min_players": 5,
  "max_players": 15
}
```

---

### Tags

#### Lister les tags
```http
GET /tags?session_id=eq.<uuid>
```

**Response (200):**
```json
[
  {
    "id": "uuid-tag",
    "session_id": "uuid-session",
    "player_id": "uuid-player",
    "type": "protection",
    "name": "Protégé",
    "value": 1,
    "duration": 2,
    "created_at": "2024-01-15T11:00:00Z",
    "expires_at": "2024-01-15T13:00:00Z"
  }
]
```

#### Ajouter un tag
```http
POST /tags
```

**Body:**
```json
{
  "session_id": "uuid-session",
  "player_id": "uuid-player",
  "type": "protection",
  "name": "Protégé",
  "value": 1,
  "duration": 2
}
```

#### Supprimer un tag
```http
DELETE /tags?id=eq.<uuid>
```

---

### Actions

#### Lister les actions
```http
GET /actions?session_id=eq.<uuid>&order=timestamp.desc
```

**Response (200):**
```json
[
  {
    "id": "uuid-action",
    "session_id": "uuid-session",
    "actor_id": "uuid-player",
    "target_id": "uuid-player",
    "type": "night_kill",
    "phase": "night",
    "result": "success",
    "metadata": {
      "method": "vote",
      "votes_count": 5
    },
    "timestamp": "2024-01-15T12:00:00Z"
  }
]
```

#### Exécuter une action
```http
POST /actions
```

**Body:**
```json
{
  "session_id": "uuid-session",
  "actor_id": "uuid-player",
  "target_id": "uuid-player",
  "type": "heal",
  "phase": "night",
  "metadata": {
    "spell_level": 2
  }
}
```

---

### Phases de jeu

#### Obtenir la phase actuelle
```http
GET /phases?session_id=eq.<uuid>&order=started_at.desc&limit=1
```

**Response (200):**
```json
[
  {
    "id": "uuid-phase",
    "session_id": "uuid-session",
    "phase_type": "night",
    "phase_number": 3,
    "status": "active",
    "started_at": "2024-01-15T12:00:00Z",
    "ended_at": null,
    "duration_seconds": 300
  }
]
```

#### Changer de phase
```http
POST /phases
```

**Body:**
```json
{
  "session_id": "uuid-session",
  "phase_type": "day",
  "duration_seconds": 600
}
```

---

### Chat

#### Obtenir les messages
```http
GET /chat_messages?session_id=eq.<uuid>&order=created_at.asc
```

**Query Parameters:**
- `channel`: Type de canal (`global`, `team`, `private`)
- `since`: Messages depuis un timestamp

**Response (200):**
```json
[
  {
    "id": "uuid-message",
    "session_id": "uuid-session",
    "sender_id": "uuid-player",
    "channel": "global",
    "content": "Bonjour à tous!",
    "created_at": "2024-01-15T10:10:00Z",
    "edited_at": null
  }
]
```

#### Envoyer un message
```http
POST /chat_messages
```

**Body:**
```json
{
  "session_id": "uuid-session",
  "sender_id": "uuid-player",
  "channel": "global",
  "content": "Bonjour à tous!"
}
```

---

### Handouts

#### Lister les handouts
```http
GET /handouts?session_id=eq.<uuid>
```

**Response (200):**
```json
[
  {
    "id": "uuid-handout",
    "session_id": "uuid-session",
    "title": "Règles Spéciales",
    "content": "Contenu du handout...",
    "visible_to": ["all"],
    "created_at": "2024-01-15T10:00:00Z"
  }
]
```

#### Créer un handout
```http
POST /handouts
```

**Body:**
```json
{
  "session_id": "uuid-session",
  "title": "Règles Spéciales",
  "content": "Contenu du handout...",
  "visible_to": ["all"]
}
```

---

## Modèles de données

### Session
```typescript
interface Session {
  id: string;
  name: string;
  host_id: string;
  status: 'pending' | 'active' | 'paused' | 'completed';
  game_mode: 'classic' | 'custom' | 'tournament';
  max_players: number;
  settings: SessionSettings;
  created_at: string;
  updated_at: string;
}

interface SessionSettings {
  allow_spectators: boolean;
  auto_start: boolean;
  timer_enabled: boolean;
  night_duration: number;
  day_duration: number;
}
```

### Player
```typescript
interface Player {
  id: string;
  session_id: string;
  user_id: string;
  username: string;
  role_id: string | null;
  team: 'villagers' | 'werewolves' | 'neutrals' | 'spectator';
  is_alive: boolean;
  position: { x: number; y: number };
  metadata: PlayerMetadata;
  joined_at: string;
}

interface PlayerMetadata {
  votes_received: number;
  protections: number;
  last_action: string | null;
}
```

### Role
```typescript
interface Role {
  id: string;
  name: string;
  team: string;
  description: string;
  icon: string;
  abilities: string[];
  min_players: number;
  max_players: number;
  priority: number;
  is_custom: boolean;
}
```

### Action
```typescript
interface Action {
  id: string;
  session_id: string;
  actor_id: string;
  target_id: string | null;
  type: ActionType;
  phase: string;
  result: 'success' | 'failure' | 'pending';
  metadata: Record<string, any>;
  timestamp: string;
}

type ActionType = 
  | 'night_kill'
  | 'heal'
  | 'protect'
  | 'investigate'
  | 'vote'
  | 'skip';
```

---

## Exemples d'utilisation

### JavaScript/TypeScript avec fetch
```typescript
const SUPABASE_URL = 'https://votre-projet.supabase.co';
const SUPABASE_KEY = 'votre-anon-key';

// Initialiser la session
async function createSession(name: string, maxPlayers: number) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/sessions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'apikey': SUPABASE_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      name,
      max_players: maxPlayers,
      game_mode: 'classic'
    })
  });
  
  if (!response.ok) throw new Error('Échec de création');
  return await response.json();
}

// Rejoindre une session
async function joinPlayer(sessionId: string, userId: string, username: string) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/players`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'apikey': SUPABASE_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      session_id: sessionId,
      user_id: userId,
      username
    })
  });
  
  return await response.json();
}

// S'abonner aux mises à jour en temps réel
function subscribeToSession(sessionId: string, callback: Function) {
  const channel = supabase
    .channel(`session:${sessionId}`)
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'players' },
      (payload) => callback(payload)
    )
    .subscribe();
    
  return () => supabase.removeChannel(channel);
}
```

### cURL
```bash
# Créer une session
curl -X POST "https://votre-projet.supabase.co/rest/v1/sessions" \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "apikey: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"name":"Partie Test","max_players":8}'

# Lister les joueurs
curl -X GET "https://votre-projet.supabase.co/rest/v1/players?session_id=eq.UUID" \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "apikey: YOUR_KEY"
```

---

## Gestion des erreurs

### Codes HTTP standards

| Code | Signification | Description |
|------|--------------|-------------|
| 200 | OK | Requête réussie |
| 201 | Created | Ressource créée avec succès |
| 400 | Bad Request | Paramètres invalides |
| 401 | Unauthorized | Token manquant ou invalide |
| 403 | Forbidden | Permissions insuffisantes |
| 404 | Not Found | Ressource non trouvée |
| 409 | Conflict | Conflit (ex: joueur déjà présent) |
| 429 | Too Many Requests | Limite de taux dépassée |
| 500 | Internal Server Error | Erreur serveur |

### Format des erreurs
```json
{
  "error": {
    "code": "PGRST101",
    "message": "JWT expired",
    "details": "Token has expired at 2024-01-15T11:00:00Z",
    "hint": "Please refresh your token"
  }
}
```

### Codes d'erreur spécifiques

| Code | Signification |
|------|--------------|
| PGRST101 | JWT expiré ou invalide |
| PGRST102 | Violation de contrainte unique |
| PGRST103 | Violation de contrainte étrangère |
| PGRST204 | Ressource non trouvée |
| PGRST301 | Schéma non spécifié |

---

## Limites et quotas

### Rate Limiting
- **Authentification**: 10 requêtes/minute
- **API REST**: 100 requêtes/minute par utilisateur
- **WebSocket**: 50 connexions simultanées

### Quotas par plan

| Fonctionnalité | Gratuit | Pro | Enterprise |
|---------------|---------|-----|------------|
| Utilisateurs mensuels | 50,000 | Illimité | Illimité |
| Bande passante | 5 GB | 50 GB | Illimité |
| Stockage | 500 MB | 10 GB | Illimité |
| Durée de session | 2h | 8h | Illimité |

### Bonnes pratiques
1. Utilisez le filtrage côté serveur (`select`, `limit`, `offset`)
2. Implémentez la mise en cache côté client
3. Utilisez les subscriptions temps réel plutôt que le polling
4. Regroupez les requêtes quand possible
5. Gérez proprement les déconnexions WebSocket

---

## Webhooks

### Configuration
Les webhooks peuvent être configurés dans le dashboard Supabase pour notifier des événements externes.

### Événements disponibles
- `session.created`
- `session.started`
- `session.ended`
- `player.joined`
- `player.left`
- `player.died`
- `phase.changed`

### Payload exemple
```json
{
  "event": "player.died",
  "timestamp": "2024-01-15T12:30:00Z",
  "data": {
    "session_id": "uuid-session",
    "player_id": "uuid-player",
    "cause": "night_kill",
    "killer_id": "uuid-killer"
  }
}
```

---

## Support

Pour toute question ou problème avec l'API:
- 📧 Email: support@vttapp.com
- 💬 Discord: [lien vers le serveur]
- 📖 Documentation: https://docs.vttapp.com
- 🐛 Issues: https://github.com/votre-repo/vtt-app/issues

---

*Dernière mise à jour: Janvier 2024*
*Version de l'API: v1.0.0*
