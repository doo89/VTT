import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calculateTagEffect(currentValue: number, tagValue: string | number | null): number {
  if (tagValue === null || tagValue === undefined || tagValue === '') return currentValue;
  
  const strVal = String(tagValue).trim();
  if (strVal.startsWith('+')) {
    return currentValue + (parseFloat(strVal.substring(1)) || 0);
  } else if (strVal.startsWith('-')) {
    return currentValue - (parseFloat(strVal.substring(1)) || 0);
  } else {
    // Brute value (no sign) = absolute value
    const parsed = parseFloat(strVal);
    return isNaN(parsed) ? currentValue : parsed;
  }
}

export function getEffectiveStats(player: any, role: any) {
  let lives = player.lives ?? role?.lives ?? 0;
  let points = player.points ?? 0;
  let votes = player.votes ?? 0;
  let uses = 0;
  
  // Sequential application: Role tags then Player tags
  role?.tags?.forEach((t: any) => {
    lives = calculateTagEffect(lives, t.lives);
    points = calculateTagEffect(points, t.points);
    votes = calculateTagEffect(votes, t.votes);
    uses = calculateTagEffect(uses, t.uses);
  });
  
  player.tags?.forEach((t: any) => {
    lives = calculateTagEffect(lives, t.lives);
    points = calculateTagEffect(points, t.points);
    votes = calculateTagEffect(votes, t.votes);
    uses = calculateTagEffect(uses, t.uses);
  });
  
  return { lives, points, votes, uses };
}
