import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * A simple one-shot countdown, in seconds. Used by PracticeExercise's
 * 60-second "just notice" timer — the user cannot click through it early.
 */
export function useCountdown(totalSeconds) {
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    return () => clearInterval(intervalRef.current);
  }, []);

  const start = useCallback(() => {
    setIsRunning(true);
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const isComplete = secondsLeft <= 0;

  return { secondsLeft, isRunning, isComplete, start };
}
