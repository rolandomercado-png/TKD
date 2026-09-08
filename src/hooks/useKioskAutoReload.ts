import { useState, useEffect, useCallback, useRef } from 'react';

interface UseKioskAutoReloadProps {
  intervalSeconds: number;
  isPaused: boolean;
  onReload?: () => void;
}

export function useKioskAutoReload({
  intervalSeconds,
  isPaused,
  onReload,
}: UseKioskAutoReloadProps) {
  const [countdown, setCountdown] = useState<number>(intervalSeconds);
  const [reloadCount, setReloadCount] = useState<number>(0);
  const [lastReloadTime, setLastReloadTime] = useState<Date>(new Date());
  const [isReloading, setIsReloading] = useState<boolean>(false);
  const [cacheBuster, setCacheBuster] = useState<number>(Date.now());

  const onReloadRef = useRef(onReload);
  onReloadRef.current = onReload;

  const triggerReload = useCallback(() => {
    setIsReloading(true);
    setCacheBuster(Date.now());
    setReloadCount((c) => c + 1);
    setLastReloadTime(new Date());
    setCountdown(intervalSeconds);

    if (onReloadRef.current) {
      onReloadRef.current();
    }

    // Brief flag to animate subtle reload indicator
    const timer = setTimeout(() => {
      setIsReloading(false);
    }, 1200);

    return () => clearTimeout(timer);
  }, [intervalSeconds]);

  // Reset countdown when interval changes
  useEffect(() => {
    setCountdown(intervalSeconds);
  }, [intervalSeconds]);

  // Countdown timer loop
  useEffect(() => {
    if (intervalSeconds <= 0 || isPaused) return;

    const timer = window.setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          triggerReload();
          return intervalSeconds;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [intervalSeconds, isPaused, triggerReload]);

  return {
    countdown,
    reloadCount,
    lastReloadTime,
    isReloading,
    cacheBuster,
    triggerReload,
  };
}
