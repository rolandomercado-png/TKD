import React, { useState, useEffect } from 'react';
import { KioskConfig } from './types';
import { useWakeLock } from './hooks/useWakeLock';
import { useKioskAutoReload } from './hooks/useKioskAutoReload';
import { usePWAInstall } from './hooks/usePWAInstall';
import { KioskViewer } from './components/KioskViewer';
import { KioskSettingsModal } from './components/KioskSettingsModal';

const STORAGE_KEY = 'tv_kiosk_config_v1';

const DEFAULT_CONFIG: KioskConfig = {
  url: 'https://es.wikipedia.org/wiki/Wikipedia:Portada',
  refreshIntervalSeconds: 120, // 2 minutes
  mode: 'proxy',
  zoom: 1.0,
  rotation: 0,
  overscanMargin: 0,
  showProgressBar: true,
  showReloadBadge: true,
  autoFullscreen: false,
  stealthCursor: true,
};

export default function App() {
  const [config, setConfig] = useState<KioskConfig>(() => {
    // Check URL parameters first
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlParam = params.get('url');
      const intervalParam = params.get('interval');
      const modeParam = params.get('mode') as 'proxy' | 'direct' | null;
      const zoomParam = params.get('zoom');
      const rotParam = params.get('rot');
      const padParam = params.get('pad');

      if (urlParam) {
        return {
          ...DEFAULT_CONFIG,
          url: urlParam,
          refreshIntervalSeconds: intervalParam !== null ? parseInt(intervalParam, 10) : 120,
          mode: modeParam === 'direct' ? 'direct' : 'proxy',
          zoom: zoomParam ? parseFloat(zoomParam) : 1.0,
          rotation: rotParam ? (parseInt(rotParam, 10) as any) : 0,
          overscanMargin: padParam ? parseInt(padParam, 10) : 0,
        };
      }

      // Check localStorage
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
        }
      } catch {
        // ignore parse error
      }
    }
    return DEFAULT_CONFIG;
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('kiosk') === 'true') {
        return false;
      }
      // If user hasn't visited before or no custom URL saved, show settings modal
      const hasSaved = localStorage.getItem(STORAGE_KEY);
      return !hasSaved;
    }
    return false;
  });

  const [showHintToast, setShowHintToast] = useState<boolean>(false);

  // Wake Lock Engine (keeps TV screen on)
  const { isActive: isWakeLockActive, requestWakeLock } = useWakeLock(true);

  // PWA Install Hook
  const { isInstallable, install: installPWA } = usePWAInstall();

  // Auto-Reload Engine
  const {
    countdown,
    isReloading,
    cacheBuster,
    triggerReload,
  } = useKioskAutoReload({
    intervalSeconds: config.refreshIntervalSeconds,
    isPaused: isSettingsOpen,
  });

  // Persist config in localStorage
  const handleSaveConfig = (newConfig: KioskConfig) => {
    setConfig(newConfig);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
    } catch {
      // storage quota or error
    }
  };

  const handleEnterKioskMode = () => {
    setIsSettingsOpen(false);
    requestWakeLock();

    // Show temporary hint to let the user know how to exit/reopen
    setShowHintToast(true);
    setTimeout(() => {
      setShowHintToast(false);
    }, 4000);

    // Request fullscreen if supported and user interacted
    try {
      if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {
          // user interaction restriction
        });
      }
    } catch {
      // ignore
    }
  };

  return (
    <div className="relative w-full h-full min-h-screen bg-black overflow-hidden font-sans">
      {/* Kiosk Fullscreen Viewer */}
      <KioskViewer
        config={config}
        onOpenSettings={() => setIsSettingsOpen(true)}
        countdown={countdown}
        isReloading={isReloading}
        cacheBuster={cacheBuster}
        onTriggerReload={triggerReload}
        isWakeLockActive={isWakeLockActive}
      />

      {/* Temporary Toast when entering Kiosk mode */}
      {showHintToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 text-slate-200 border border-slate-700/80 px-4 py-2.5 rounded-xl shadow-2xl backdrop-blur-md text-xs font-medium flex items-center gap-2 animate-bounce">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>
            <strong>Modo Kiosco Activo:</strong> Presiona <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-white font-mono">Esc</kbd> o haz 3 clics para reabrir ajustes.
          </span>
        </div>
      )}

      {/* Settings / Configuration Modal */}
      <KioskSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={config}
        onSaveConfig={handleSaveConfig}
        isWakeLockActive={isWakeLockActive}
        onEnterKioskMode={handleEnterKioskMode}
        onInstallPWA={installPWA}
        isPWAInstallable={isInstallable}
      />
    </div>
  );
}
