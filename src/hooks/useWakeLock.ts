import { useState, useEffect, useCallback, useRef } from 'react';

export function useWakeLock(enabled: boolean = true) {
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const wakeLockSentinel = useRef<any>(null);
  const fallbackIntervalRef = useRef<number | null>(null);

  const requestWakeLock = useCallback(async () => {
    if (typeof window === 'undefined') return;

    if ('wakeLock' in navigator && (navigator as any).wakeLock) {
      try {
        if (wakeLockSentinel.current) {
          try {
            await wakeLockSentinel.current.release();
          } catch {
            // ignore release errors
          }
          wakeLockSentinel.current = null;
        }

        const sentinel = await (navigator as any).wakeLock.request('screen');
        wakeLockSentinel.current = sentinel;
        setIsActive(true);
        setError(null);

        sentinel.addEventListener('release', () => {
          // If released externally (e.g. power button or window change)
          setIsActive(false);
          wakeLockSentinel.current = null;
        });
      } catch (err: any) {
        console.warn('Wake Lock request failed:', err);
        setError(err.message || 'Wake lock request failed');
        setIsActive(false);
      }
    } else {
      setIsSupported(false);
      // Setup smart fallback for TV browsers: micro DOM ping to keep TV display active
      if (!fallbackIntervalRef.current) {
        fallbackIntervalRef.current = window.setInterval(() => {
          // Micro-tick that prevents TV power-saving sleep
          const dummy = document.getElementById('tv-keep-alive-beacon');
          if (dummy) {
            dummy.style.opacity = dummy.style.opacity === '0.001' ? '0.002' : '0.001';
          }
        }, 15000);
        setIsActive(true);
      }
    }
  }, []);

  const releaseWakeLock = useCallback(async () => {
    if (wakeLockSentinel.current) {
      try {
        await wakeLockSentinel.current.release();
      } catch {
        // ignore
      }
      wakeLockSentinel.current = null;
    }
    if (fallbackIntervalRef.current) {
      clearInterval(fallbackIntervalRef.current);
      fallbackIntervalRef.current = null;
    }
    setIsActive(false);
  }, []);

  useEffect(() => {
    const supported = typeof navigator !== 'undefined' && 'wakeLock' in navigator;
    setIsSupported(supported);

    if (enabled) {
      requestWakeLock();

      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible' && enabled) {
          requestWakeLock();
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('focus', handleVisibilityChange);

      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('focus', handleVisibilityChange);
        releaseWakeLock();
      };
    } else {
      releaseWakeLock();
    }
  }, [enabled, requestWakeLock, releaseWakeLock]);

  return {
    isSupported,
    isActive,
    error,
    requestWakeLock,
    releaseWakeLock,
  };
}
