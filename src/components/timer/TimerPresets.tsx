import React from 'react';

const PRESETS = [
  { label: '+30s', seconds: 30 },
  { label: '+1min', seconds: 60 },
  { label: '+2min', seconds: 120 },
  { label: '5min', seconds: 300 },
  { label: '10min', seconds: 600 },
];

interface Props {
  minutes: number;
  seconds: number;
  isRunning: boolean;
  onSet: (m: number, s: number) => void;
}

export const TimerPresets: React.FC<Props> = ({ minutes, seconds, isRunning, onSet }) => {
  if (isRunning) return null;

  return (
    <div className="flex flex-wrap gap-1.5 w-full justify-center mt-1">
      {PRESETS.map(p => {
        const isActive = minutes * 60 + seconds === p.seconds;
        return (
          <button
            key={p.seconds}
            onClick={() => {
              const m = Math.floor(p.seconds / 60);
              const s = p.seconds % 60;
              onSet(m, s);
            }}
            className={`px-2 py-1 text-[10px] font-bold rounded border transition-colors ${
              isActive
                ? 'bg-primary/10 text-primary border-primary/30'
                : 'bg-muted/50 text-muted-foreground border-border hover:bg-accent hover:text-foreground'
            }`}
          >
            {p.label}
          </button>
        );
      })}
    </div>
  );
};
