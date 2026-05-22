import React from 'react';

interface Props {
  minutes: number;
  seconds: number;
  isRunning: boolean;
  onMinutesChange: (m: number) => void;
  onSecondsChange: (s: number) => void;
  size?: 'default' | 'large';
}

export const TimerDisplay: React.FC<Props> = ({
  minutes, seconds, isRunning,
  onMinutesChange, onSecondsChange, size = 'default'
}) => {
  const textSize = size === 'large' ? 'text-4xl' : 'text-3xl';

  return (
    <div className={`flex items-center gap-1 ${textSize} font-mono font-bold bg-input px-3 py-2 rounded-md border border-border`}>
      <input
        type="number"
        min={0}
        max={99}
        value={String(minutes).padStart(2, '0')}
        onChange={(e) => onMinutesChange(Math.min(99, Math.max(0, parseInt(e.target.value) || 0)))}
        disabled={isRunning}
        className="w-16 bg-transparent text-center focus:outline-none focus:ring-0 disabled:opacity-50 disabled:cursor-not-allowed appearance-none"
        aria-label="Minutes"
        title="Minutes"
      />
      <span className="text-muted-foreground pb-1">:</span>
      <input
        type="number"
        min={0}
        max={59}
        value={String(seconds).padStart(2, '0')}
        onChange={(e) => onSecondsChange(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
        disabled={isRunning}
        className="w-16 bg-transparent text-center focus:outline-none focus:ring-0 disabled:opacity-50 disabled:cursor-not-allowed appearance-none"
        aria-label="Secondes"
        title="Secondes"
      />
    </div>
  );
};
