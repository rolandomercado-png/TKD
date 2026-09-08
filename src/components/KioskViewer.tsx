import React, { useState, useEffect, useRef } from 'react';
import { Settings, RefreshCw, Maximize2, AlertCircle, WifiOff } from 'lucide-react';
import { KioskConfig } from '../types';

interface KioskViewerProps {
  config: KioskConfig;
  onOpenSettings: () => void;
  countdown: number;
  isReloading: boolean;
  cacheBuster: number;
  onTriggerReload: () => void;
  isWakeLockActive: boolean;
}

export const KioskViewer: React.FC<KioskViewerProps> = ({
  config,
  onOpenSettings,
  countdown,
  isReloading,
  cacheBuster,
  onTriggerReload,
  isWakeLockActive,
}) => {
  const [cursorVisible, setCursorVisible] = useState(true);
  const [showCornerTrigger, setShowCornerTrigger] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  const inactivityTimerRef = useRef<number | null>(null);
  const clickCountRef = useRef<number>(0);
  const clickTimerRef = useRef<number | null>(null);

  // Determine iframe source
  const iframeSrc = React.useMemo(() => {
    if (!config.url) return '';
    if (config.mode === 'proxy') {
      return `/api/proxy?url=${encodeURIComponent(config.url)}&_cb=${cacheBuster}`;
    }
    const separator = config.url.includes('?') ? '&' : '?';
    return `${config.url}${separator}_kiosk_cb=${cacheBuster}`;
  }, [config.url, config.mode, cacheBuster]);

  // Online / offline listeners
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Cursor auto-hide on inactivity
  useEffect(() => {
    if (!config.stealthCursor) {
      setCursorVisible(true);
      return;
    }

    const resetInactivityTimer = () => {
      setCursorVisible(true);
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      inactivityTimerRef.current = window.setTimeout(() => {
        setCursorVisible(false);
      }, 2500);
    };

    window.addEventListener('mousemove', resetInactivityTimer);
    window.addEventListener('mousedown', resetInactivityTimer);
    window.addEventListener('touchstart', resetInactivityTimer);

    // Initial countdown
    resetInactivityTimer();

    return () => {
      window.removeEventListener('mousemove', resetInactivityTimer);
      window.removeEventListener('mousedown', resetInactivityTimer);
      window.removeEventListener('touchstart', resetInactivityTimer);
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [config.stealthCursor]);

  // Keyboard shortcut listener to open settings or trigger reload
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape, 'k', 'c', or 's' opens settings
      if (e.key === 'Escape' || e.key === 'k' || e.key === 'c' || e.key === 's') {
        onOpenSettings();
      }
      // 'r' or F5 triggers manual reload
      if (e.key === 'r') {
        onTriggerReload();
      }
      // 'f' toggles native browser fullscreen
      if (e.key === 'f') {
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpenSettings, onTriggerReload]);

  // Triple click/tap detection to open settings (ideal for touch TVs or remote control clicks)
  const handleTripleClickDetection = () => {
    clickCountRef.current += 1;
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
    }

    if (clickCountRef.current >= 3) {
      clickCountRef.current = 0;
      onOpenSettings();
      return;
    }

    clickTimerRef.current = window.setTimeout(() => {
      clickCountRef.current = 0;
    }, 600);
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // Fullscreen not supported or allowed in current context
    }
  };

  // Calculate reload progress (0 to 100%)
  const progressPercent =
    config.refreshIntervalSeconds > 0
      ? Math.max(0, Math.min(100, ((config.refreshIntervalSeconds - countdown) / config.refreshIntervalSeconds) * 100))
      : 0;

  // Frame container transformation styles for TV Zoom, Rotation, and Overscan
  const containerStyle: React.CSSProperties = {
    padding: `${config.overscanMargin}px`,
    cursor: cursorVisible ? 'default' : 'none',
  };

  const frameTransformStyle: React.CSSProperties = {
    transform: `rotate(${config.rotation}deg) scale(${config.zoom})`,
    transformOrigin: 'center center',
  };

  return (
    <div
      onClick={handleTripleClickDetection}
      style={containerStyle}
      className="relative w-screen h-screen bg-black overflow-hidden select-none m-0 p-0 flex items-center justify-center"
    >
      {/* Invisible Beacon element for fallback TV wake lock */}
      <div
        id="tv-keep-alive-beacon"
        className="fixed top-0 left-0 w-1 h-1 pointer-events-none opacity-[0.001]"
        aria-hidden="true"
      />

      {/* Main Web Content Frame */}
      {config.url ? (
        <div className="w-full h-full relative overflow-hidden" style={frameTransformStyle}>
          <iframe
            key={`kiosk-frame-${cacheBuster}`}
            src={iframeSrc}
            title="TV Kiosk Frame"
            className="w-full h-full border-none m-0 p-0 block bg-slate-950"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            onLoad={() => {
              setIframeLoaded(true);
              setIframeError(false);
            }}
            onError={() => {
              setIframeError(true);
            }}
          />
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center text-center p-8 max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 mb-4">
            <Settings className="w-8 h-8 animate-pulse" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Modo Kiosco Listo</h2>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">
            No has especificado ninguna URL. Pulsa el botón para configurar la página web que se mostrará en el televisor.
          </p>
          <button
            onClick={onOpenSettings}
            className="px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm shadow-lg shadow-sky-600/30 transition flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            <span>Configurar Pantalla Web</span>
          </button>
        </div>
      )}

      {/* Offline Notice banner */}
      {!isOnline && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-40 bg-red-950/90 border border-red-800 text-red-200 px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2 shadow-xl backdrop-blur-sm">
          <WifiOff className="w-3.5 h-3.5 text-red-400 animate-pulse" />
          <span>Sin Conexión a Internet — Mostrando contenido disponible</span>
        </div>
      )}

      {/* Subtle reload animation badge at top-center */}
      {config.showReloadBadge && isReloading && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-40 bg-slate-900/90 border border-sky-500/50 text-sky-400 px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-2 shadow-2xl backdrop-blur-md animate-fade-in">
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-400" />
          <span>Actualizando página...</span>
        </div>
      )}

      {/* Stealth Countdown Progress Bar at Bottom of Screen (2px thin line) */}
      {config.showProgressBar && config.refreshIntervalSeconds > 0 && (
        <div
          className="fixed bottom-0 left-0 w-full h-[3px] bg-black/40 z-30 pointer-events-none"
          title={`Próxima recarga en ${countdown}s`}
        >
          <div
            className="h-full bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 transition-all duration-1000 ease-linear"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}

      {/* Discreet Hotspot in Top-Right corner to reveal Settings button */}
      <div
        className="fixed top-0 right-0 w-16 h-16 z-50 flex items-start justify-end p-2 group"
        onMouseEnter={() => setShowCornerTrigger(true)}
        onMouseLeave={() => setShowCornerTrigger(false)}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenSettings();
          }}
          className={`p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700/60 shadow-xl backdrop-blur-md transition-all duration-300 ${
            showCornerTrigger || cursorVisible
              ? 'opacity-30 hover:opacity-100'
              : 'opacity-0 pointer-events-none'
          }`}
          title="Abrir Configuración (o presiona tecla 'Esc')"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
