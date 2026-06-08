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
  const maxLives = role?.lives ?? 0;
  let lives = player.lives ?? role?.lives ?? 0;
  let points = player.points ?? 0;
  let votes = player.votes ?? 0;
  let uses = 0;
  
  const debug = role?.name === 'Loup-Garou' || role?.name === 'Loups-Garous';

  if (debug) {
    console.log(`[DEBUG-STATS] Calcul pour ${player.name} (${role?.name}):`, {
      initialLives: lives,
      playerLives: player.lives,
      roleLives: role?.lives
    });
  }

  // Sequential application: Role tags then Player tags
  role?.tags?.forEach((t: any) => {
    const oldLives = lives;
    lives = calculateTagEffect(lives, t.lives);
    points = calculateTagEffect(points, t.points);
    votes = calculateTagEffect(votes, t.votes);
    uses = calculateTagEffect(uses, t.uses);

    if (debug && oldLives !== lives) {
      console.log(`[DEBUG-STATS] Tag de Rôle "${t.name}" a modifié les vies: ${oldLives} -> ${lives} (valeur tag: ${t.lives})`);
    }
  });
  
  player.tags?.forEach((t: any) => {
    const oldLives = lives;
    lives = calculateTagEffect(lives, t.lives);
    points = calculateTagEffect(points, t.points);
    votes = calculateTagEffect(votes, t.votes);
    uses = calculateTagEffect(uses, t.uses);

    if (debug && oldLives !== lives) {
      console.log(`[DEBUG-STATS] Tag de Joueur "${t.name}" a modifié les vies: ${oldLives} -> ${lives} (valeur tag: ${t.lives})`);
    }
  });
  
  return { lives, maxLives, points, votes, uses };
}

export const renderMarkdown = (text: string): string => {
  if (!text) return '';
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Bold (**text** or __text__)
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');

  // Italic (*text* or _text_)
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/_(.*?)_/g, '<em>$1</em>');

  // Split lines by newlines
  const lines = html.split(/\r?\n/);
  let inList = false;
  let result = '';

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const content = trimmed.substring(2);
      if (!inList) {
        inList = true;
        result += '<ul class="list-disc pl-5 my-1">';
      }
      result += `<li>${content}</li>`;
    } else {
      if (inList) {
        inList = false;
        result += '</ul>';
      }
      if (index > 0) {
        result += '<br/>';
      }
      result += line;
    }
  });

  if (inList) {
    result += '</ul>';
  }

  return result;
};
