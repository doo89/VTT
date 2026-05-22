import { useCallback } from 'react';
import { useVttStore } from '../store';

export type MassImportMode = 'circle' | 'grid' | 'semicircle' | 'ellipse' | 'random' | 'teams' | 'cross' | 'spiral' | 'doubleCircle' | 'zigzag';

export interface MassImportConfig {
  mode: MassImportMode;
  count: number;
  cols: number;
  rows: number;
  radius: number;
  spiralTurns: number;
  zigzagAmp: number;
}

export interface PositionResult {
  x: number;
  y: number;
  teamId?: string | null;
}

interface PositionStrategy {
  generate(count: number, config: MassImportConfig, roomWidth: number, roomHeight: number, teams: Array<{ id: string; color: string }>): PositionResult[];
}

const circleStrategy: PositionStrategy = {
  generate: (count, config, roomWidth, roomHeight) => {
    const R = Math.min(roomWidth, roomHeight) * config.radius;
    return Array.from({ length: count }, (_, i) => {
      const angle = (i * 2 * Math.PI) / count;
      return { x: R * Math.cos(angle), y: R * Math.sin(angle) };
    });
  },
};

const gridStrategy: PositionStrategy = {
  generate: (count, config) => {
    const spacing = 100;
    const totalWidth = (config.cols - 1) * spacing;
    const totalHeight = (config.rows - 1) * spacing;
    const startX = -totalWidth / 2;
    const startY = -totalHeight / 2;
    return Array.from({ length: count }, (_, i) => ({
      x: startX + (i % config.cols) * spacing,
      y: startY + Math.floor(i / config.cols) * spacing,
    }));
  },
};

const semicircleStrategy: PositionStrategy = {
  generate: (count, config, roomWidth, roomHeight) => {
    const R = Math.min(roomWidth, roomHeight) * config.radius;
    return Array.from({ length: count }, (_, i) => {
      const angle = (i * Math.PI) / (count - 1 || 1);
      return { x: R * Math.cos(angle), y: R * Math.sin(angle) * 0.6 };
    });
  },
};

const ellipseStrategy: PositionStrategy = {
  generate: (count, config, roomWidth, roomHeight) => {
    const Rx = Math.max(roomWidth, roomHeight) * config.radius * 0.5;
    const Ry = Math.min(roomWidth, roomHeight) * config.radius * 0.5;
    return Array.from({ length: count }, (_, i) => {
      const angle = (i * 2 * Math.PI) / count;
      return { x: Rx * Math.cos(angle), y: Ry * Math.sin(angle) };
    });
  },
};

const randomStrategy: PositionStrategy = {
  generate: (count, config, roomWidth, roomHeight) => {
    const margin = 80;
    return Array.from({ length: count }, () => ({
      x: (Math.random() - 0.5) * (roomWidth - margin * 2),
      y: (Math.random() - 0.5) * (roomHeight - margin * 2),
    }));
  },
};

const teamsStrategy: PositionStrategy = {
  generate: (count, config, _roomWidth, _roomHeight, teams) => {
    const positions: PositionResult[] = [];
    const teamSpacing = 200;
    const playerSpacing = 80;
    let idx = 0;

    if (teams.length === 0) {
      return Array.from({ length: count }, () => ({
        x: (Math.random() - 0.5) * 200,
        y: (Math.random() - 0.5) * 200,
      }));
    }

    teams.forEach((team, ti) => {
      const teamCount = Math.max(1, Math.floor(count / teams.length));
      const teamCx = (ti - (teams.length - 1) / 2) * teamSpacing;
      for (let i = 0; i < teamCount && idx < count; i++, idx++) {
        const angle = (i * 2 * Math.PI) / teamCount;
        positions.push({
          x: teamCx + playerSpacing * Math.cos(angle),
          y: playerSpacing * Math.sin(angle),
          teamId: team.id,
        });
      }
    });

    while (idx < count) {
      positions.push({ x: (Math.random() - 0.5) * 200, y: (Math.random() - 0.5) * 200 });
      idx++;
    }

    return positions;
  },
};

const crossStrategy: PositionStrategy = {
  generate: (count, config, roomWidth, roomHeight) => {
    const R = Math.min(roomWidth, roomHeight) * config.radius;
    const perArm = Math.ceil(count / 4);
    const armSpacing = R / (perArm || 1);
    const angles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
    const positions: PositionResult[] = [];
    let idx = 0;

    angles.forEach((angle) => {
      for (let i = 1; i <= perArm && idx < count; i++, idx++) {
        positions.push({
          x: armSpacing * i * Math.cos(angle),
          y: armSpacing * i * Math.sin(angle),
        });
      }
    });

    return positions;
  },
};

const spiralStrategy: PositionStrategy = {
  generate: (count, config, roomWidth, roomHeight) => {
    const R = Math.min(roomWidth, roomHeight) * config.radius;
    const totalAngle = config.spiralTurns * 2 * Math.PI;
    return Array.from({ length: count }, (_, i) => {
      const t = count > 1 ? i / (count - 1) : 0;
      const angle = t * totalAngle;
      const radius = R * t;
      return { x: radius * Math.cos(angle), y: radius * Math.sin(angle) };
    });
  },
};

const doubleCircleStrategy: PositionStrategy = {
  generate: (count, config, roomWidth, roomHeight) => {
    const R = Math.min(roomWidth, roomHeight) * config.radius;
    const innerCount = Math.floor(count / 2);
    const outerCount = count - innerCount;
    const innerR = R * 0.5;
    const positions: PositionResult[] = [];

    for (let i = 0; i < innerCount; i++) {
      const angle = (i * 2 * Math.PI) / innerCount;
      positions.push({ x: innerR * Math.cos(angle), y: innerR * Math.sin(angle) });
    }
    for (let i = 0; i < outerCount; i++) {
      const angle = (i * 2 * Math.PI) / outerCount;
      positions.push({ x: R * Math.cos(angle), y: R * Math.sin(angle) });
    }

    return positions;
  },
};

const zigzagStrategy: PositionStrategy = {
  generate: (count, config) => {
    const spacing = 100;
    const cols = Math.ceil(Math.sqrt(count * 2));
    const startX = -((cols - 1) * spacing) / 2;
    return Array.from({ length: count }, (_, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const yOffset = row % 2 === 0 ? config.zigzagAmp : -config.zigzagAmp;
      return { x: startX + col * spacing, y: row * spacing * 0.8 + yOffset };
    });
  },
};

const STRATEGIES: Record<MassImportMode, PositionStrategy> = {
  circle: circleStrategy,
  grid: gridStrategy,
  semicircle: semicircleStrategy,
  ellipse: ellipseStrategy,
  random: randomStrategy,
  teams: teamsStrategy,
  cross: crossStrategy,
  spiral: spiralStrategy,
  doubleCircle: doubleCircleStrategy,
  zigzag: zigzagStrategy,
};

const getRandomColor = () => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

export function useMassImport() {
  const { teams, room, addPlayerTemplate, addPlayer } = useVttStore();

  const calculatePositions = useCallback(
    (count: number, config: MassImportConfig): PositionResult[] => {
      const strategy = STRATEGIES[config.mode];
      if (!strategy) return [];
      return strategy.generate(count, config, room.width, room.height, teams);
    },
    [room.width, room.height, teams]
  );

  const executeMassImport = useCallback(
    (names: string[], config: MassImportConfig) => {
      const positions = calculatePositions(names.length, config);

      names.forEach((name, i) => {
        const pos = positions[i];
        const finalName = name.trim() || `Joueur ${i + 1}`;
        const team = pos?.teamId ? teams.find(t => t.id === pos.teamId) : null;
        const color = team?.color ?? getRandomColor();
        const teamId = pos?.teamId ?? null;

        addPlayerTemplate({ name: finalName, color, roleId: null, teamId, size: 40 });
        addPlayer({ name: finalName, color, roleId: null, teamId, size: 40, x: pos?.x ?? 0, y: pos?.y ?? 0, isDead: false, tags: [] });
      });
    },
    [teams, calculatePositions, addPlayerTemplate, addPlayer]
  );

  const calculatePreviewPositions = useCallback(
    (count: number, config: MassImportConfig): { x: number; y: number; name: string }[] => {
      const positions = calculatePositions(count, config);
      return positions.map((pos, i) => ({
        x: pos.x,
        y: pos.y,
        name: `Joueur ${i + 1}`,
      }));
    },
    [calculatePositions]
  );

  return {
    calculatePositions,
    executeMassImport,
    calculatePreviewPositions,
  };
}
