import React, { useMemo } from 'react';
import type { TagFormData, TagFormUpdate, ValidationError } from '../../types/tag-form';
import { validateTagForm, type NumericField } from '../../types/tag-form';

interface Props {
  data: TagFormData;
  onUpdate: (updates: TagFormUpdate) => void;
  roles: { id: string; name: string }[];
  teams: { id: string; name: string }[];
}

const FIELDS: { key: NumericField; label: string; placeholder: string; center?: boolean }[] = [
  { key: 'callOrderDay', label: 'Appel Jour', placeholder: 'ex: 5 ou +2', center: true },
  { key: 'callOrderNight', label: 'Appel Nuit', placeholder: 'ex: 5 ou +2', center: true },
  { key: 'lives', label: 'Ajout Vie', placeholder: 'ex: 1 ou +1' },
  { key: 'votes', label: 'Votes', placeholder: 'ex: 10 ou -2' },
  { key: 'points', label: 'Points', placeholder: 'ex: 100 ou +50' },
  { key: 'uses', label: 'Uses', placeholder: 'ex: 3' },
];

function ErrorMsg({ error }: { error?: ValidationError }) {
  if (!error) return null;
  return <p className="text-[10px] text-destructive mt-0.5">{error.message}</p>;
}

export const TagFieldsTab: React.FC<Props> = React.memo(({ data, onUpdate, roles, teams }) => {
  const errors = useMemo(() => validateTagForm(data), [data]);
  const getError = (field: string) => errors.find(e => e.field === field);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        {FIELDS.slice(0, 2).map(f => {
          const err = getError(f.key);
          return (
            <div className="flex flex-col gap-1" key={f.key}>
              <label className="text-sm font-medium" title={f.label} htmlFor={`tag-${f.key}-${data.id}`}>{f.label}</label>
              <input
                id={`tag-${f.key}-${data.id}`}
                type="text"
                value={data[f.key] ?? ''}
                onChange={(e) => onUpdate({ [f.key]: e.target.value })}
                className={`bg-input border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring min-h-[44px] ${f.center ? 'text-center' : ''} ${err ? 'border-destructive focus:ring-destructive' : 'border-border'}`}
                placeholder={f.placeholder}
              />
              <ErrorMsg error={err} />
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {FIELDS.slice(2).map(f => {
          const err = getError(f.key);
          return (
            <div className="flex flex-col gap-1" key={f.key}>
              <label className="text-sm font-medium text-muted-foreground" htmlFor={`tag-${f.key}-${data.id}`}>{f.label}</label>
              <input
                id={`tag-${f.key}-${data.id}`}
                type="text"
                value={data[f.key] ?? ''}
                onChange={(e) => onUpdate({ [f.key]: e.target.value })}
                className={`bg-input border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring ${err ? 'border-destructive focus:ring-destructive' : 'border-border'}`}
                placeholder={f.placeholder}
              />
              <ErrorMsg error={err} />
              {f.key === 'uses' && (
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer mt-2">
                  <input
                    type="checkbox"
                    checked={data.autoDeleteOnZeroUses || false}
                    onChange={(e) => onUpdate({ autoDeleteOnZeroUses: e.target.checked })}
                    className="rounded border-border w-3.5 h-3.5"
                  />
                  Suppr. auto à 0
                </label>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex gap-4 mb-2">
        <div className="flex flex-col gap-1 flex-1">
          <label className="text-xs font-medium text-muted-foreground" htmlFor={`tag-seen-role-${data.id}`}>Vu comme rôle (info-bulle)</label>
          <select
            id={`tag-seen-role-${data.id}`}
            value={data.seenAsRoleId || ''}
            onChange={(e) => onUpdate({ seenAsRoleId: e.target.value || null })}
            className="bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring min-h-[44px]"
          >
            <option value="">-- Aucun --</option>
            {roles.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1 flex-1">
          <label className="text-xs font-medium text-muted-foreground" htmlFor={`tag-seen-team-${data.id}`}>Vu dans équipe (info-bulle)</label>
          <select
            id={`tag-seen-team-${data.id}`}
            value={data.seenInTeamId || ''}
            onChange={(e) => onUpdate({ seenInTeamId: e.target.value || null })}
            className="bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring min-h-[44px]"
          >
            <option value="">-- Identique à réelle --</option>
            {teams.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1 mt-2">
        <label className="text-sm font-medium text-muted-foreground" htmlFor={`tag-description-${data.id}`}>Texte libre</label>
        <textarea
          id={`tag-description-${data.id}`}
          value={data.description || ''}
          onChange={(e) => onUpdate({ description: e.target.value })}
          className="bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring min-h-[100px] resize-y"
          placeholder="Saisissez un texte libre ici..."
        />
      </div>
    </div>
  );
});
