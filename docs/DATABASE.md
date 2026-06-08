# 🗄️ Schéma de Base de Données Supabase

Ce document décrit le schéma de base de données requis pour l'application VTT.

## Tables Principales

### `sessions`

Stocke les sessions de jeu actives.

```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  gm_id UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'waiting', -- waiting, playing, finished
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  settings JSONB DEFAULT '{}'::jsonb,
  current_phase TEXT DEFAULT 'day',
  day_count INTEGER DEFAULT 1
);
```

**Champs :**
- `id` : Identifiant unique de la session
- `name` : Nom de la partie
- `gm_id` : Référence au Maître du Jeu
- `status` : État de la session
- `settings` : Configuration JSON (nombre de joueurs, rôles activés, etc.)
- `current_phase` : Phase actuelle (day, night, voting, etc.)
- `day_count` : Nombre de jours écoulés

### `players`

Informations sur les joueurs connectés.

```sql
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  role_id UUID REFERENCES roles(id),
  is_alive BOOLEAN DEFAULT true,
  is_connected BOOLEAN DEFAULT false,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,
  UNIQUE(session_id, user_id)
);
```

**Champs :**
- `session_id` : Session associée
- `user_id` : Utilisateur Supabase (optionnel pour les joueurs anonymes)
- `name` : Nom affiché du joueur
- `role_id` : Rôle actuel du joueur
- `is_alive` : Le joueur est-il en vie ?
- `is_connected` : Statut de connexion en temps réel
- `metadata` : Données additionnelles (tags, votes, etc.)

### `roles`

Définition des rôles disponibles.

```sql
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  team TEXT NOT NULL, -- village, werewolf, neutral, etc.
  min_players INTEGER DEFAULT 0,
  max_players INTEGER DEFAULT 999,
  count_in_game INTEGER DEFAULT 1,
  abilities JSONB DEFAULT '[]'::jsonb,
  icon_url TEXT,
  color_hex TEXT DEFAULT '#ffffff',
  is_custom BOOLEAN DEFAULT false,
  card_style JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Champs :**
- `team` : Équipe du rôle (village, werewolf, neutral, etc.)
- `min_players` / `max_players` : Nombre de joueurs requis
- `count_in_game` : Nombre d'exemplaires dans la partie
- `abilities` : Liste des capacités JSON
- `icon_url` : URL de l'icône du rôle
- `color_hex` : Couleur associée
- `is_custom` : Rôle personnalisé par un utilisateur
- `card_style` : Style WYSIWYG de la carte de rôle (couleur, bordure, gradient, polices...)

### `tags`

Tags personnalisables pour les joueurs.

```sql
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  color_hex TEXT DEFAULT '#cccccc',
  icon TEXT,
  effect_type TEXT, -- buff, debuff, info, custom
  effect_data JSONB DEFAULT '{}'::jsonb,
  is_public BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `player_tags`

Association entre joueurs et tags.

```sql
CREATE TABLE player_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  assigned_by UUID,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  data JSONB DEFAULT '{}'::jsonb,
  UNIQUE(player_id, tag_id)
);
```

### `actions`

Actions automatisées configurables.

```sql
CREATE TABLE actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  trigger_type TEXT NOT NULL, -- timer, phase_change, manual, event
  trigger_data JSONB DEFAULT '{}'::jsonb,
  conditions JSONB DEFAULT '[]'::jsonb,
  effects JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  execution_count INTEGER DEFAULT 0,
  last_executed TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Structure trigger_data :**
```json
{
  "phase": "night",
  "timer_seconds": 60,
  "event_name": "player_death"
}
```

**Structure conditions :**
```json
[
  {
    "type": "role_exists",
    "role": "werewolf"
  },
  {
    "type": "min_alive",
    "count": 3,
    "team": "village"
  }
]
```

**Structure effects :**
```json
[
  {
    "type": "show_message",
    "text": "Les loups-garous se réveillent",
    "target": "all"
  },
  {
    "type": "play_sound",
    "sound_id": "wolf_howl"
  },
  {
    "type": "update_phase",
    "phase": "night_werewolves"
  }
]
```

### `game_events`

Historique des événements de la partie.

```sql
CREATE TABLE game_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}'::jsonb,
  actor_id UUID REFERENCES players(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Types d'événements :**
- `role_assigned` : Attribution de rôle
- `player_eliminated` : Élimination d'un joueur
- `action_triggered` : Déclenchement d'action
- `phase_changed` : Changement de phase
- `vote_cast` : Vote effectué
- `tag_assigned` : Tag attribué

### `audio_files`

Fichiers audio uploadés pour la soundboard.

```sql
CREATE TABLE audio_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  duration_seconds INTEGER,
  category TEXT DEFAULT 'misc',
  uploaded_by UUID REFERENCES auth.users(id),
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Index

```sql
-- Index pour les performances
CREATE INDEX idx_players_session ON players(session_id);
CREATE INDEX idx_players_role ON players(role_id);
CREATE INDEX idx_actions_session ON actions(session_id);
CREATE INDEX idx_events_session ON game_events(session_id);
CREATE INDEX idx_events_type ON game_events(event_type);

-- Index composites
CREATE INDEX idx_players_session_alive ON players(session_id, is_alive);
CREATE INDEX idx_actions_active ON actions(session_id, is_active);
```

## Row Level Security (RLS)

### Politiques de sécurité

```sql
-- Sessions : seuls les participants peuvent voir
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view sessions"
  ON sessions FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM players WHERE session_id = sessions.id
    )
    OR gm_id = auth.uid()
  );

-- Players : visibilité limitée
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players can see session members"
  ON players FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM players p2 
      WHERE p2.session_id = players.session_id 
      AND p2.user_id = auth.uid()
    )
  );

-- Roles : lecture publique, écriture restreinte
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read roles"
  ON roles FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create custom roles"
  ON roles FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Actions : seul le GM peut modifier
ALTER TABLE actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "GM can manage actions"
  ON actions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM sessions 
      WHERE sessions.id = actions.session_id 
      AND sessions.gm_id = auth.uid()
    )
  );
```

## Functions & Triggers

### Mise à jour automatique de `updated_at`

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_actions_updated_at
  BEFORE UPDATE ON actions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Compteur de joueurs vivants

```sql
CREATE OR REPLACE FUNCTION get_alive_count(p_session_id UUID, p_team TEXT DEFAULT NULL)
RETURNS INTEGER AS $$
DECLARE
  count INTEGER;
BEGIN
  IF p_team IS NULL THEN
    SELECT COUNT(*) INTO count
    FROM players
    WHERE session_id = p_session_id AND is_alive = true;
  ELSE
    SELECT COUNT(*) INTO count
    FROM players p
    JOIN roles r ON p.role_id = r.id
    WHERE p.session_id = p_session_id 
      AND p.is_alive = true 
      AND r.team = p_team;
  END IF;
  
  RETURN count;
END;
$$ LANGUAGE plpgsql;
```

## Seeds (Données de démo)

```sql
-- Rôles de base Loup-Garou
INSERT INTO roles (name, description, team, count_in_game, abilities) VALUES
('Villageois', 'Aucun pouvoir spécial.', 'village', 999, '[]'),
('Loup-Garou', 'Se réveille la nuit et choisit une victime.', 'werewolf', 3, '[{"type": "night_kill", "target": "any"}]'),
('Voyante', 'Peut voir le rôle d''un joueur chaque nuit.', 'village', 1, '[{"type": "night_see", "target": "any"}]'),
('Chasseur', 'En mourant, peut éliminer un autre joueur.', 'village', 1, '[{"type": "death_kill", "target": "any"}]'),
('Sorcière', 'Possède une potion de vie et une potion de mort.', 'village', 1, '[{"type": "potion_heal"}, {"type": "potion_kill"}]');
```

## Migrations

Pour gérer les évolutions du schéma, utilisez les migrations Supabase ou des outils comme [dbmate](https://github.com/amacneil/dbmate).

Exemple de migration :

```sql
-- migration_001_add_vote_tracking.sql
ALTER TABLE players ADD COLUMN vote_target UUID REFERENCES players(id);
ALTER TABLE players ADD COLUMN has_voted BOOLEAN DEFAULT false;

CREATE INDEX idx_players_vote ON players(session_id, has_voted);
```

## Notes Importantes

1. **Backup** : Configurez des backups automatiques quotidiens sur Supabase
2. **Vacuum** : Planifiez des VACUUM réguliers sur les tables d'événements
3. **Archivage** : Archivez les sessions terminées après 30 jours
4. **Limites** : Respectez les limites du plan Supabase (500MB gratuit)

---

*Document maintenu à jour avec la version 0.709 de l'application.*
