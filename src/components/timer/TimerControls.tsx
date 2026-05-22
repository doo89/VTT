import React from 'react';

interface Props {
  isRunning: boolean;
  playSoundAtZero: boolean;
  onToggle: () => void;
  onReset: () => void;
  onSoundChange: (v: boolean) => void;
}

export const TimerControls: React.FC<Props> = ({
  isRunning, playSoundAtZero, onToggle, onReset, onSoundChange
}) => {
  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <label className="flex items-center gap-2 text-xs text-muted-foreground w-full cursor-pointer justify-center">
        <input
          type="checkbox"
          checked={playSoundAtZero}
          onChange={(e) => onSoundChange(e.target.checked)}
          className="rounded border-border w-3.5 h-3.5"
        />
        Jouer un son à la fin
      </label>

      <div className="flex gap-2 w-full">
        <button
          onClick={onToggle}
          className={`flex-[2] py-2 rounded text-sm font-medium text-white shadow-sm transition-colors ${
            isRunning ? 'bg-orange-500 hover:bg-orange-600' : 'bg-green-500 hover:bg-green-600'
          }`}
        >
          {isRunning ? 'Pause' : 'Démarrer'}
        </button>
        <button
          onClick={onReset}
          className="flex-1 bg-destructive text-destructive-foreground py-2 rounded text-sm shadow-sm hover:bg-destructive/90 transition-colors"
        >
          Reset
        </button>
      </div>
    </div>
  );
};
