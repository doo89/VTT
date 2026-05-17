/**
 * Skeleton Loading Components
 * 
 * Placeholder UI shown while content is loading
 * Improves perceived performance during code splitting
 */

import React from 'react';

/**
 * Base skeleton pulse animation
 */
function SkeletonPulse({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-muted rounded ${className}`}
    />
  );
}

/**
 * Skeleton for card-like components
 */
export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`p-4 rounded-lg border bg-card ${className}`}>
      <div className="flex items-center gap-3">
        <SkeletonPulse className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <SkeletonPulse className="h-4 w-3/4" />
          <SkeletonPulse className="h-3 w-1/2" />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton for player list
 */
export function SkeletonPlayerList({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

/**
 * Skeleton for role list
 */
export function SkeletonRoleList({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-3 rounded-lg border bg-card">
          <div className="flex items-center gap-3">
            <SkeletonPulse className="h-8 w-8 rounded" />
            <div className="flex-1 space-y-2">
              <SkeletonPulse className="h-4 w-2/3" />
              <SkeletonPulse className="h-3 w-1/3" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton for tag list
 */
export function SkeletonTagList({ count = 8 }: { count?: number }) {
  return (
    <div className="flex flex-wrap gap-2">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonPulse key={i} className="h-8 w-24 rounded-full" />
      ))}
    </div>
  );
}

/**
 * Skeleton for action list
 */
export function SkeletonActionList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-4 rounded-lg border bg-card">
          <SkeletonPulse className="h-5 w-1/3 mb-2" />
          <SkeletonPulse className="h-3 w-2/3" />
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton for soundboard
 */
export function SkeletonSoundboard({ cols = 4, rows = 3 }: { cols?: number; rows?: number }) {
  const count = cols * rows;
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonPulse key={i} className="h-20 rounded-lg" />
      ))}
    </div>
  );
}

/**
 * Skeleton for game view (GM main screen)
 */
export function SkeletonGMView() {
  return (
    <div className="h-screen w-screen flex overflow-hidden bg-background">
      {/* Left Panel */}
      <div className="w-80 border-r bg-card p-4 space-y-4">
        <SkeletonPulse className="h-8 w-3/4" />
        <SkeletonPulse className="h-10 w-full" />
        <SkeletonPlayerList count={4} />
      </div>

      {/* Canvas */}
      <div className="flex-1 bg-muted/50 flex items-center justify-center">
        <SkeletonPulse className="h-96 w-96 rounded-lg" />
      </div>

      {/* Right Panel */}
      <div className="w-80 border-l bg-card p-4 space-y-4">
        <SkeletonPulse className="h-8 w-1/2" />
        <SkeletonSoundboard cols={3} rows={2} />
        <SkeletonPulse className="h-32 w-full" />
      </div>
    </div>
  );
}

/**
 * Skeleton for player view (smartphone)
 */
export function SkeletonPlayerView() {
  return (
    <div className="h-screen w-screen flex flex-col bg-background">
      {/* Header */}
      <div className="p-4 border-b">
        <SkeletonPulse className="h-6 w-1/2" />
      </div>

      {/* Content */}
      <div className="flex-1 p-4 space-y-4">
        <SkeletonPulse className="h-40 w-full rounded-lg" />
        <SkeletonPulse className="h-20 w-full rounded-lg" />
        <SkeletonPulse className="h-20 w-full rounded-lg" />
      </div>

      {/* Bottom Nav */}
      <div className="p-4 border-t flex justify-around">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonPulse key={i} className="h-8 w-8 rounded-full" />
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton for settings modal
 */
export function SkeletonSettings() {
  return (
    <div className="p-6 space-y-4">
      <SkeletonPulse className="h-8 w-1/3" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <SkeletonPulse className="h-4 w-1/3" />
            <SkeletonPulse className="h-8 w-24 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
