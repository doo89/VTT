import React from 'react';

interface LifeProgressBarProps {
  current: number;
  max: number;
  size?: 'sm' | 'md';
}

export const LifeProgressBar: React.FC<LifeProgressBarProps> = ({ current, max, size = 'md' }) => {
  const percentage = max > 0 ? Math.min(100, Math.max(0, (current / max) * 100)) : 0;
  const height = size === 'sm' ? 'h-1' : 'h-1.5';

  return (
    <div className={`w-full bg-muted/60 rounded-full ${height} overflow-hidden`}>
      <div
        className={`${height} rounded-full transition-all duration-500 ${
          percentage > 50 ? 'bg-red-500' : percentage > 25 ? 'bg-orange-500' : 'bg-red-700'
        }`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};
