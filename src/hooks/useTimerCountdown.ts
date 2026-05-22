import { useEffect } from 'react';
import { useVttStore } from '../store';
import { playTimerEndSound } from '../lib/timer-sound';

export function useTimerCountdown() {
  const timer = useVttStore(s => s.timer);
  const setTimer = useVttStore(s => s.setTimer);
  const timerEndSoundUrl = useVttStore(s => s.displaySettings.timerEndSoundUrl);

  useEffect(() => {
    if (!timer.isRunning) return;

    const id = setInterval(() => {
      const { minutes, seconds, playSoundAtZero } = useVttStore.getState().timer;
      const soundUrl = useVttStore.getState().displaySettings.timerEndSoundUrl;
      let newS = seconds - 1;
      let newM = minutes;

      if (newS < 0) {
        if (newM === 0) {
          clearInterval(id);
          setTimer({ isRunning: false, seconds: 0 });
          if (playSoundAtZero) {
            playTimerEndSound(soundUrl);
          }
          return;
        }
        newM -= 1;
        newS = 59;
      }

      setTimer({ minutes: newM, seconds: newS });
    }, 1000);

    return () => clearInterval(id);
  }, [timer.isRunning, setTimer, timerEndSoundUrl]);

  return timer;
}
