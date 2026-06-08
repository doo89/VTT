import React, { useEffect, useRef, useState } from 'react';
import * as Icons from 'lucide-react';

interface Die {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  vAngle: number;
  sides: number;
  value: number;
  radius: number;
  color: string;
  isSettled: boolean;
  pulseScale: number;
}

interface DiceRollerProps {
  dice: { sides: number; count: number }[];
  targetTotal?: number | null;
  onFinished: (total: number, results: { sides: number; value: number }[]) => void;
  onClose: () => void;
}

// Partition helper to divide a target sum among count dice
const partitionTotal = (total: number, count: number, sides: number): number[] => {
  if (count <= 1) return [Math.min(sides, Math.max(1, total))];
  const values: number[] = [];
  let remaining = total;
  for (let i = 0; i < count - 1; i++) {
    const min = Math.max(1, remaining - (count - 1 - i) * sides);
    const max = Math.min(sides, remaining - (count - 1 - i));
    const val = Math.floor(Math.random() * (max - min + 1)) + min;
    values.push(val);
    remaining -= val;
  }
  values.push(Math.min(sides, Math.max(1, remaining)));
  return values;
};

// Synthesize dice impact sound using Web Audio API
const playImpactSound = (intensity: number) => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const audioCtx = new AudioContextClass();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    // Sound signature mimicking dice impact
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150 + Math.random() * 120, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, audioCtx.currentTime + 0.06);

    const volume = Math.min(0.3, intensity * 0.05);
    gain.gain.setValueAtTime(volume, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.06);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.06);
  } catch (e) {
    console.error('Web Audio click synthesis failed', e);
  }
};

export const DiceRoller: React.FC<DiceRollerProps> = ({ dice, targetTotal, onFinished, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number | null>(null);
  const [total, setTotal] = useState<number | null>(null);
  const [resultsList, setResultsList] = useState<{ sides: number; value: number }[]>([]);
  const [isFinished, setIsFinished] = useState(false);

  // Initialize dice list
  const diceListRef = useRef<Die[]>([]);

  useEffect(() => {
    const list: Die[] = [];
    let idx = 0;
    
    // Choose high-contrast retro neon palettes matching werewolf style
    const colors = ['#f43f5e', '#3b82f6', '#10b981', '#f59e0b', '#a855f7', '#06b6d4'];

    const totalCount = dice.reduce((acc, g) => acc + g.count, 0);
    const averageSides = dice[0]?.sides || 20;
    const targetValues = (targetTotal !== undefined && targetTotal !== null)
      ? partitionTotal(targetTotal, totalCount, averageSides)
      : [];

    dice.forEach(group => {
      for (let i = 0; i < group.count; i++) {
        // Roll target value upfront or use the partition
        const currentIdx = idx;
        const finalValue = targetValues[currentIdx] !== undefined 
          ? targetValues[currentIdx] 
          : Math.floor(Math.random() * group.sides) + 1;
        
        list.push({
          id: `die-${idx++}`,
          x: 50 + Math.random() * 100,
          y: 50 + Math.random() * 100,
          // High starting velocities to bounce around
          vx: (Math.random() - 0.5) * 15 + (Math.random() > 0.5 ? 8 : -8),
          vy: -15 - Math.random() * 10,
          angle: Math.random() * Math.PI * 2,
          vAngle: (Math.random() - 0.5) * 0.4,
          sides: group.sides,
          value: finalValue,
          radius: 28,
          color: colors[idx % colors.length],
          isSettled: false,
          pulseScale: 1
        });
      }
    });

    diceListRef.current = list;

    // Start physics simulation loop
    let lastTime = performance.now();

    const updatePhysics = (time: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;

      // Clear canvas with premium semi-transparent dark trace effect
      ctx.fillStyle = 'rgba(10, 10, 10, 0.25)';
      ctx.fillRect(0, 0, width, height);

      const diceList = diceListRef.current;
      const gravity = 0.5;
      const friction = 0.985;
      const bounce = -0.65;

      let allSettled = true;

      // Update positions & draw
      diceList.forEach(die => {
        if (!die.isSettled) {
          // Physics
          die.vy += gravity;
          die.vx *= friction;
          die.vy *= friction;
          die.x += die.vx;
          die.y += die.vy;
          die.angle += die.vAngle;

          // Border collisions
          let hit = false;
          let hitVelocity = 0;

          if (die.x - die.radius < 0) {
            die.x = die.radius;
            hitVelocity = Math.abs(die.vx);
            die.vx *= bounce;
            die.vAngle = (Math.random() - 0.5) * 0.3;
            hit = true;
          } else if (die.x + die.radius > width) {
            die.x = width - die.radius;
            hitVelocity = Math.abs(die.vx);
            die.vx *= bounce;
            die.vAngle = (Math.random() - 0.5) * 0.3;
            hit = true;
          }

          if (die.y - die.radius < 0) {
            die.y = die.radius;
            hitVelocity = Math.abs(die.vy);
            die.vy *= bounce;
            die.vAngle = (Math.random() - 0.5) * 0.3;
            hit = true;
          } else if (die.y + die.radius > height) {
            die.y = height - die.radius;
            hitVelocity = Math.abs(die.vy);
            die.vy *= bounce;
            die.vAngle = (Math.random() - 0.5) * 0.3;
            hit = true;
          }

          // Trigger collision feedback
          if (hit && hitVelocity > 1.5) {
            playImpactSound(hitVelocity);
            if ('vibrate' in navigator) {
              navigator.vibrate(Math.min(20, Math.floor(hitVelocity * 2)));
            }
          }

          // Friction damping on rotation
          die.vAngle *= 0.97;

          // Settle down check
          const speed = Math.sqrt(die.vx * die.vx + die.vy * die.vy);
          if (speed < 0.25 && Math.abs(die.vy) < 0.3) {
            die.isSettled = true;
            die.vx = 0;
            die.vy = 0;
            die.vAngle = 0;
            // Align nicely when stopped
            die.angle = 0;
          } else {
            allSettled = false;
          }
        }

        // Draw Die Shadow
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 12;
        ctx.shadowOffsetX = 4;
        ctx.shadowOffsetY = 6;

        // Draw Die Shape
        ctx.translate(die.x, die.y);
        ctx.rotate(die.angle);
        ctx.scale(die.pulseScale, die.pulseScale);

        ctx.fillStyle = die.color;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;

        // Draw geometry based on sides
        ctx.beginPath();
        if (die.sides === 4) {
          // Triangle
          ctx.moveTo(0, -die.radius);
          ctx.lineTo(die.radius * 0.86, die.radius * 0.5);
          ctx.lineTo(-die.radius * 0.86, die.radius * 0.5);
          ctx.closePath();
        } else if (die.sides === 6) {
          // Cube / Square
          const size = die.radius * 1.5;
          ctx.roundRect(-size / 2, -size / 2, size, size, 12);
        } else if (die.sides === 8) {
          // Diamond / Octahedron
          ctx.moveTo(0, -die.radius);
          ctx.lineTo(die.radius * 0.8, 0);
          ctx.lineTo(0, die.radius);
          ctx.lineTo(-die.radius * 0.8, 0);
          ctx.closePath();
        } else if (die.sides === 12) {
          // Pentagon
          for (let s = 0; s < 5; s++) {
            const angle = (s * Math.PI * 2) / 5 - Math.PI / 2;
            const sx = Math.cos(angle) * die.radius;
            const sy = Math.sin(angle) * die.radius;
            if (s === 0) ctx.moveTo(sx, sy);
            else ctx.lineTo(sx, sy);
          }
          ctx.closePath();
        } else {
          // 20, 10 or 100 sides: Octagonal/Hexagonal outline
          for (let s = 0; s < 6; s++) {
            const angle = (s * Math.PI * 2) / 6;
            const sx = Math.cos(angle) * die.radius;
            const sy = Math.sin(angle) * die.radius;
            if (s === 0) ctx.moveTo(sx, sy);
            else ctx.lineTo(sx, sy);
          }
          ctx.closePath();
        }

        ctx.fill();
        ctx.stroke();

        // Inside lines for 3D look
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        if (die.sides === 20) {
          // Drawing icosahedron inner triangle structure
          for (let s = 0; s < 6; s++) {
            const angle = (s * Math.PI * 2) / 6;
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(angle) * die.radius, Math.sin(angle) * die.radius);
          }
        } else if (die.sides === 8) {
          ctx.moveTo(-die.radius * 0.8, 0);
          ctx.lineTo(die.radius * 0.8, 0);
          ctx.moveTo(0, -die.radius);
          ctx.lineTo(0, die.radius);
        }
        ctx.stroke();

        // Draw Value text
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.fillStyle = '#ffffff';
        ctx.font = `black ${die.radius * 0.8}px Outfit, Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Draw rolled number (add a rolling fake number if not settled yet)
        const displayVal = die.isSettled 
          ? die.value 
          : Math.floor(Math.random() * die.sides) + 1;
        ctx.fillText(displayVal.toString(), 0, 0);

        ctx.restore();
      });

      // Handle die-to-die collisions
      for (let i = 0; i < diceList.length; i++) {
        for (let j = i + 1; j < diceList.length; j++) {
          const d1 = diceList[i];
          const d2 = diceList[j];

          const dx = d2.x - d1.x;
          const dy = d2.y - d1.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const minDist = d1.radius + d2.radius;

          if (dist < minDist) {
            // Elastic collision response
            const overlap = minDist - dist;
            const nx = dx / dist;
            const ny = dy / dist;

            // Push apart
            d1.x -= nx * overlap * 0.5;
            d1.y -= ny * overlap * 0.5;
            d2.x += nx * overlap * 0.5;
            d2.y += ny * overlap * 0.5;

            // Velocities relative to normal
            const kx = d1.vx - d2.vx;
            const ky = d1.vy - d2.vy;
            const p = 2 * (nx * kx + ny * ky) / 2;

            d1.vx -= nx * p;
            d1.vy -= ny * p;
            d2.vx += nx * p;
            d2.vy += ny * p;

            // Trigger collision sounds/haptics
            const impulse = Math.abs(p);
            if (impulse > 1) {
              playImpactSound(impulse);
              if ('vibrate' in navigator) {
                navigator.vibrate(Math.min(15, Math.floor(impulse * 1.5)));
              }
            }
          }
        }
      }

      if (allSettled) {
        // Stop loops
        if (requestRef.current) {
          cancelAnimationFrame(requestRef.current);
          requestRef.current = null;
        }

        // Compute outputs
        const calculatedTotal = diceList.reduce((acc, d) => acc + d.value, 0);
        const detailedResults = diceList.map(d => ({ sides: d.sides, value: d.value }));
        
        setTotal(calculatedTotal);
        setResultsList(detailedResults);
        setIsFinished(true);

        // Highlight settled values by scaling up briefly
        let frame = 0;
        const pulseEffect = () => {
          frame++;
          diceList.forEach(d => {
            d.pulseScale = 1 + Math.sin(frame * 0.25) * 0.1 * (1 - frame / 20);
          });
          if (frame < 20) {
            // redraw pulse
            requestAnimationFrame(pulseEffect);
          } else {
            // Final callback delay to let the user admire their roll
            setTimeout(() => {
              onFinished(calculatedTotal, detailedResults);
            }, 1800);
          }
        };
        pulseEffect();

      } else {
        requestRef.current = requestAnimationFrame(updatePhysics);
      }
    };

    // Resize and launch canvas
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (canvas && container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    // Trigger initial burst
    requestRef.current = requestAnimationFrame(updatePhysics);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [dice, onFinished]);

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[9999] flex flex-col items-center justify-center p-4">
      <div 
        ref={containerRef}
        className="relative bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-lg shadow-[0_20px_50px_rgba(0,0,0,0.8)] flex flex-col aspect-square overflow-hidden"
      >
        {/* Canvas for physics roll */}
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

        {/* Floating Controls */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
          <div className="bg-zinc-900/95 border border-zinc-800/80 rounded-xl px-3 py-1.5 flex items-center gap-1.5 backdrop-blur-md">
            <Icons.Dices className="h-4.5 w-4.5 text-indigo-400 animate-bounce" />
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300">Physique Active (3D/2D)</span>
          </div>
          <button 
            onClick={onClose}
            className="pointer-events-auto p-2 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-white"
          >
            <Icons.X size={16} />
          </button>
        </div>

        {/* Results Overlay */}
        {isFinished && total !== null && (
          <div className="absolute bottom-6 inset-x-6 bg-zinc-900/95 border border-zinc-800 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 backdrop-blur-md animate-in fade-in slide-in-from-bottom-6 duration-500 shadow-2xl">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Total Obtenu</span>
            <div className="text-4xl font-black text-white tracking-tighter drop-shadow-sm flex items-center gap-1 animate-pulse">
              {total}
            </div>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {resultsList.map((res, i) => (
                <span key={i} className="text-[10px] bg-zinc-850 border border-zinc-750 px-2 py-0.5 rounded-lg text-zinc-300 font-bold">
                  d{res.sides} : <span className="text-indigo-400">{res.value}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
