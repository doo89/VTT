import { ChevronDown, ChevronRight, CheckCircle2, Tag as TagIcon, icons } from 'lucide-react';
import React from 'react';
import { useVttStore } from '../../../store';
import type { Player, Marker, TagInstance } from '../../../types';

interface TagFieldControlsProps {
  tag: TagInstance;
  entity: Player | Marker;
  entityType: 'player' | 'marker';
  size?: 'sm' | 'md';
}

const SIZE_CONFIG = {
  sm: {
    button: 'w-5 h-5',
    text: 'text-xs',
    valueWidth: 'w-5',
    votesWidth: 'w-12',
    gap: 'gap-1',
    label: 'text-xs',
    pipSize: 'w-1.5 h-1.5',
    pipGap: 'gap-0.5',
  },
  md: {
    button: 'w-6 h-6',
    text: 'text-xs',
    valueWidth: 'w-6',
    votesWidth: 'w-14',
    gap: 'gap-1',
    label: 'text-xs',
    pipSize: 'w-2 h-2',
    pipGap: 'gap-1',
  },
};

const getStatusColor = (value: number, field: 'uses' | 'lives' | 'votes' | 'points'): string => {
  if (field === 'votes') {
    if (value === -1) return 'bg-blue-400';
    if (value <= 0) return 'bg-red-400';
    if (value <= 2) return 'bg-amber-400';
    return 'bg-green-400';
  }
  if (value <= 0) return 'bg-red-400';
  if (value <= 2) return 'bg-amber-400';
  return 'bg-green-400';
};

const renderPips = (value: number, field: 'uses' | 'lives' | 'votes' | 'points', pipSize: string, pipGap: string) => {
  if (field === 'votes' && value === -1) return null;
  if (value <= 0) return null;

  const pipCount = Math.min(value, 5);
  const color = getStatusColor(value, field);

  return (
    <div className={`flex ${pipGap} ml-1`}>
      {Array.from({ length: pipCount }).map((_, i) => (
        <div key={i} className={`${pipSize} rounded-full ${color}`} />
      ))}
      {value > 5 && (
        <span className="text-[8px] text-muted-foreground ml-0.5">+{value - 5}</span>
      )}
    </div>
  );
};

export const TagFieldControls: React.FC<TagFieldControlsProps> = ({
  tag,
  entity,
  entityType,
  size = 'md',
}) => {
  const { updatePlayer, updateMarker, deleteMarker } = useVttStore();
  const config = SIZE_CONFIG[size];

  const handleModify = (field: 'uses' | 'lives' | 'votes' | 'points', amount: number) => {
    const currentValue = tag[field];
    let newValue = (currentValue !== null ? Number(currentValue) : 0) + amount;

    if (field === 'uses') newValue = Math.max(0, newValue);

    if (entityType === 'player') {
      const player = entity as Player;
      let updatedTags = player.tags.map(t =>
        t.instanceId === tag.instanceId ? { ...t, [field]: newValue } : t
      );

      if (field === 'uses' && newValue === 0 && tag.autoDeleteOnZeroUses) {
        const tagsToRemove = new Set([tag.instanceId]);
        updatedTags.forEach(t => {
          if (t.parentTagInstanceId === tag.instanceId) {
            tagsToRemove.add(t.instanceId);
          }
        });
        updatedTags = updatedTags.filter(t => !tagsToRemove.has(t.instanceId));
      }

      updatePlayer(player.id, { tags: updatedTags });
    } else {
      const marker = entity as Marker;

      if (field === 'uses' && newValue === 0 && tag.autoDeleteOnZeroUses) {
        deleteMarker(marker.id);
        return;
      }

      updateMarker(marker.id, {
        tag: { ...marker.tag, [field]: newValue }
      });
    }
  };

  const renderField = (
    field: 'uses' | 'lives' | 'votes' | 'points',
    label: string,
    value: string | number | null,
    hideButtonsWhenNegativeOne: boolean = false
  ) => {
    if (value === null) return null;

    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    const isUnlimited = field === 'votes' && numValue === -1;
    const showButtons = !hideButtonsWhenNegativeOne || numValue !== -1;
    const statusColor = isUnlimited ? 'bg-blue-400' : getStatusColor(numValue, field);

    return (
      <div className="flex items-center justify-between pl-2">
        <div className="flex items-center gap-1.5">
          <span className={`${config.label} text-muted-foreground`}>{label}</span>
          <div className={`${config.pipSize} rounded-full ${statusColor}`} />
          {renderPips(numValue, field, config.pipSize, config.pipGap)}
        </div>
        <div className={`flex items-center ${config.gap}`}>
          {showButtons && (
            <button
              onClick={() => handleModify(field, -1)}
              className={`${config.button} flex items-center justify-center bg-accent rounded ${config.text} hover:bg-accent/80`}
              aria-label={`Diminuer ${label}`}
            >
              -
            </button>
          )}
          <span className={`${config.text} ${isUnlimited ? config.votesWidth : config.valueWidth} text-center`}>
            {isUnlimited ? 'Illimité' : numValue}
          </span>
          {showButtons && (
            <button
              onClick={() => handleModify(field, 1)}
              className={`${config.button} flex items-center justify-center bg-accent rounded ${config.text} hover:bg-accent/80`}
              aria-label={`Augmenter ${label}`}
            >
              +
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-1">
      {renderField('uses', 'Utilisations', tag.uses)}
      {renderField('lives', 'Vies', tag.lives)}
      {renderField('votes', 'Votes', tag.votes, true)}
      {renderField('points', 'Points', tag.points)}
    </div>
  );
};

interface TagSectionProps {
  tag: TagInstance;
  entity: Player | Marker;
  entityType: 'player' | 'marker';
  size?: 'sm' | 'md';
}

export const TagSection: React.FC<TagSectionProps> = ({ tag, entity, entityType, size = 'md' }) => {
  const [isExpanded, setIsExpanded] = React.useState(size === 'md');

  const TagIconComponent = tag.icon && icons[tag.icon as keyof typeof icons]
    ? icons[tag.icon as keyof typeof icons]
    : TagIcon;

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`flex items-center gap-1 ${size === 'sm' ? 'text-[10px]' : 'text-xs'} text-muted-foreground hover:text-foreground transition-colors w-max`}
        aria-label={`Tags ${tag.name}`}
        title={tag.description || undefined}
      >
        {isExpanded ? <ChevronDown size={size === 'sm' ? 10 : 12} /> : <ChevronRight size={size === 'sm' ? 10 : 12} />}
        <TagIconComponent size={size === 'sm' ? 10 : 12} className="shrink-0" style={{ color: tag.color }} />
        <span className="truncate max-w-[120px]">{tag.name}</span>
      </button>

      {isExpanded && (
        <div className={`pl-${size === 'sm' ? '4' : '7'} pr-2 bg-background/30 rounded p-1`}>
          <TagFieldControls tag={tag} entity={entity} entityType={entityType} size={size} />
        </div>
      )}
    </div>
  );
};

interface CallOrderCardProps {
  item: { type: 'player' | 'marker', entity: Player | Marker, order: number, reason: string };
  roles: Array<{ id: string; name: string; color?: string }>;
  isTreated: boolean;
  isFocusMode: boolean;
  onToggleTreated: (entityId: string) => void;
  getEntityId: (entity: Player | Marker, type: 'player' | 'marker') => string;
  getVisibleTags: (entity: Player | Marker) => TagInstance[];
}

export const CallOrderCard: React.FC<CallOrderCardProps> = ({
  item,
  roles,
  isTreated,
  isFocusMode,
  onToggleTreated,
  getEntityId,
  getVisibleTags,
}) => {
  const { teams } = useVttStore();
  const visibleTags = getVisibleTags(item.entity);
  const player = item.type === 'player' ? (item.entity as Player) : null;
  const role = player ? roles.find(r => r.id === player.roleId) : null;
  const team = player ? teams.find(t => t.id === player.teamId) : null;
  const borderColor = team?.color ?? role?.color ?? undefined;
  const entityId = getEntityId(item.entity, item.type);

  return (
    <div
      className={`flex flex-col gap-2 p-3 rounded-md border transition-all ${
        isTreated
          ? 'bg-muted/20 border-border/30 opacity-60'
          : isFocusMode
            ? 'ring-2 ring-blue-500/50 shadow-lg shadow-blue-500/10 border-primary/30 bg-primary/5'
            : 'border-primary/30 bg-primary/5'
      }`}
      style={{ borderLeftWidth: '4px', borderLeftColor: isTreated ? 'transparent' : (borderColor ?? 'transparent') }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggleTreated(entityId)}
            className={`flex items-center justify-center w-6 h-6 rounded-full border-2 transition-all shrink-0 ${
              isTreated
                ? 'bg-green-500/20 border-green-500 text-green-500'
                : 'border-muted-foreground/30 hover:border-primary text-transparent hover:text-muted-foreground'
            }`}
            aria-label={isTreated ? 'Marquer comme non traité' : 'Marquer comme traité'}
          >
            <CheckCircle2 size={14} />
          </button>
          <span className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold shrink-0 ${
            isTreated ? 'bg-muted text-muted-foreground' : 'bg-primary text-primary-foreground'
          }`}>
            {item.order}
          </span>
          {player && (
            <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: player.color, opacity: isTreated ? 0.4 : 1 }} />
          )}
          <span className={`font-medium text-sm ${isTreated ? 'line-through text-muted-foreground' : ''}`}>
            {item.type === 'player' 
              ? `${(item.entity as Player).name} (${role?.name || 'Sans rôle'})` 
              : `Marqueur: ${(item.entity as Marker).tag.name}`}
          </span>
          {team && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full border shrink-0" style={{ borderColor: team.color, color: team.color, opacity: isTreated ? 0.4 : 1 }}>
              {team.name}
            </span>
          )}
        </div>
        <span className="text-[10px] text-muted-foreground bg-accent px-1.5 py-0.5 rounded shrink-0">
          {item.reason}
        </span>
      </div>

      {item.type === 'player' && visibleTags.length > 0 && (
        <div className="flex flex-col gap-1 mt-1">
          {visibleTags.map((tag: TagInstance) => (
            <TagSection
              key={tag.instanceId}
              tag={tag}
              entity={item.entity}
              entityType="player"
              size="md"
            />
          ))}
        </div>
      )}

      {item.type === 'marker' && (
        <div className="pl-7 pr-2">
          <TagFieldControls
            tag={(item.entity as Marker).tag}
            entity={item.entity}
            entityType="marker"
            size="md"
          />
        </div>
      )}
    </div>
  );
};
