/**
 * React.memo wrappers for common VTT components
 * These prevent unnecessary re-renders by doing shallow comparison of props
 */

import React from 'react';

/**
 * Memoized Player Card Component
 * Only re-renders when the specific player data changes
 */
export const PlayerCard = React.memo(function PlayerCard({
  player,
  role,
  team,
  isSelected,
  onClick,
  onEdit,
  children,
}: {
  player: any;
  role?: any;
  team?: any;
  isSelected: boolean;
  onClick: () => void;
  onEdit?: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={`player-card ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
});

/**
 * Memoized Role Card Component
 */
export const RoleCard = React.memo(function RoleCard({
  role,
  team,
  isSelected,
  onClick,
  onEdit,
  children,
}: {
  role: any;
  team?: any;
  isSelected: boolean;
  onClick: () => void;
  onEdit?: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={`role-card ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
});

/**
 * Memoized Tag Card Component
 */
export const TagCard = React.memo(function TagCard({
  tag,
  category,
  isSelected,
  onClick,
  onEdit,
  children,
}: {
  tag: any;
  category?: any;
  isSelected: boolean;
  onClick: () => void;
  onEdit?: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={`tag-card ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
});

/**
 * Memoized Log Item Component
 */
export const LogItem = React.memo(function LogItem({
  log,
}: {
  log: { id: string; timestamp: number; message: string; type: string };
}) {
  const time = new Date(log.timestamp).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div className={`log-item log-${log.type}`}>
      <span className="log-time">{time}</span>
      <span className="log-message">{log.message}</span>
    </div>
  );
});

/**
 * Memoized Sound Button Component
 */
export const SoundButtonCard = React.memo(function SoundButtonCard({
  button,
  onPlay,
  onEdit,
  children,
}: {
  button: { index: number; name: string; icon: string; color: string; isOneShot: boolean };
  onPlay: () => void;
  onEdit?: () => void;
  children?: React.ReactNode;
}) {
  return (
    <button
      className="sound-button"
      onClick={onPlay}
      style={{ backgroundColor: button.color }}
    >
      {children}
    </button>
  );
});

/**
 * Memoized Team Card Component
 */
export const TeamCard = React.memo(function TeamCard({
  team,
  playerCount,
  isSelected,
  onClick,
  onEdit,
  children,
}: {
  team: any;
  playerCount: number;
  isSelected: boolean;
  onClick: () => void;
  onEdit?: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={`team-card ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
});

/**
 * Memoized Action Card Component
 */
export const ActionCard = React.memo(function ActionCard({
  action,
  isEnabled,
  isSelected,
  onClick,
  onEdit,
  onExecute,
  children,
}: {
  action: { id: string; name: string; conditions?: any[]; effects?: any[] };
  isEnabled: boolean;
  isSelected: boolean;
  onClick: () => void;
  onEdit?: () => void;
  onExecute?: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={`action-card ${isSelected ? 'selected' : ''} ${!isEnabled ? 'disabled' : ''}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
});

/**
 * Memoized Handout Card Component
 */
export const HandoutCard = React.memo(function HandoutCard({
  handout,
  isOpen,
  onClick,
  onEdit,
  children,
}: {
  handout: { id: string; name: string; imageUrl: string; type: string };
  isOpen: boolean;
  onClick: () => void;
  onEdit?: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={`handout-card ${isOpen ? 'open' : ''}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
});

/**
 * Memoized Checklist Item Component
 */
export const ChecklistItemCard = React.memo(function ChecklistItemCard({
  item,
  onToggle,
  children,
}: {
  item: { id: string; type: string; content?: string; checked?: boolean };
  onToggle: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div className={`checklist-item ${item.checked ? 'checked' : ''}`}>
      {children}
    </div>
  );
});

/**
 * Memoized Marker Component
 */
export const MarkerComponent = React.memo(function MarkerComponent({
  marker,
  onClick,
  children,
}: {
  marker: { id: string; x: number; y: number; tag: any };
  onClick: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div
      className="marker"
      style={{ left: marker.x, top: marker.y }}
      onClick={onClick}
    >
      {children}
    </div>
  );
});

/**
 * Memoized Player Token on Canvas
 */
export const PlayerToken = React.memo(function PlayerToken({
  player,
  role,
  team,
  isSelected,
  onClick,
  onDrag,
  children,
}: {
  player: { id: string; x: number; y: number; name: string; color: string; size: number; isDead: boolean };
  role?: any;
  team?: any;
  isSelected: boolean;
  onClick: () => void;
  onDrag?: (x: number, y: number) => void;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={`player-token ${isSelected ? 'selected' : ''} ${player.isDead ? 'dead' : ''}`}
      style={{
        left: player.x,
        top: player.y,
        width: player.size,
        height: player.size,
        backgroundColor: player.color,
      }}
      onClick={onClick}
    >
      {children}
    </div>
  );
});
