import React, { useState } from 'react';
import {
  Settings,
  Tv,
  RefreshCw,
  ShieldCheck,
  Eye,
  Sliders,
  RotateCw,
  Maximize2,
  Check,
  ExternalLink,
  Copy,
  Zap,
  HelpCircle,
  X,
  Play,
  ArrowRight,
  Layers,
  Sparkles,
} from 'lucide-react';
import { KioskConfig, EmbedCheckResult } from '../types';
import { AutostartGuide } from './AutostartGuide';

interface KioskSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: KioskConfig;
  onSaveConfig: (newConfig: KioskConfig) => void;
  isWakeLockActive: boolean;
  onEnterKioskMode: () => void;
  onInstallPWA?: () => void;
  isPWAInstallable?: boolean;
}

export const KioskSettingsModal: React.FC<KioskSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  isWakeLockActive,
  onEnterKioskMode,
  onInstallPWA,
  isPWAInstallable,
}) => {
  const [activeTab, setActiveTab] = useState<'url' | 'reload' | 'display' | 'autostart'>('url');
  const [tempConfig, setTempConfig] = useState<KioskConfig>(config);
  const [checkingUrl, setCheckingUrl] = useState<boolean>(false);
  const [embedResult, setEmbedResult] = useState<EmbedCheckResult | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleCheckUrl = async () => {
    if (!tempConfig.url) return;
    setCheckingUrl(true);
    setEmbedResult(null);

    try {
      const res = await fetch(`/api/check-embed?url=${encodeURIComponent(tempConfig.url)}`);
      const data = await res.json();
      setEmbedResult(data);
      if (!data.canEmbedDirectly) {
        setTempConfig((prev) => ({ ...prev, mode: 'proxy' }));
      }
    } catch (err: any) {
      setEmbedResult({
        status: 0,
        canEmbedDirectly: false,
        error: 'No se pudo verificar la URL. Se recomienda modo Proxy.',
      });
      setTempConfig((prev) => ({ ...prev, mode: 'proxy' }));
    } finally {
      setCheckingUrl(false);
    }
  };

  const handleApplyPreset = (presetUrl: string, intervalSec: number = 120) => {
    setTempConfig((prev) => ({
      ...prev,
      url: presetUrl,
      refreshIntervalSeconds: intervalSec,
    }));
    setEmbedResult(null);
  };

  const handleSaveAndLaunch = () => {
    onSaveConfig(tempConfig);
    onEnterKioskMode();
  };

  // Generate clean shareable link with parameters
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const kioskDirectUrl = `${origin}?url=${encodeURIComponent(tempConfig.url)}&interval=${tempConfig.refreshIntervalSeconds}&mode=${tempConfig.mode}&zoom=${tempConfig.zoom}&rot=${tempConfig.rotation}&pad=${tempConfig.overscanMargin}&kiosk=true`;

  const copyDirectUrl = () => {
    navigator.clipboard.writeText(kioskDirectUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-4xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-700/70 rounded-2xl shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Tv className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
                Configuración del Kiosco para TV
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {isWakeLockActive ? 'Wake Lock Activo' : 'TV Screen Ready'}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Ajusta la página web, frecuencia de recarga, apariencia en el televisor y arranque automático.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Cerrar panel (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-900/50 px-6 gap-2">
          <button
            onClick={() => setActiveTab('url')}
            className={`py-3 px-3 text-xs md:text-sm font-semibold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'url'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>Página Web</span>
          </button>
          <button
            onClick={() => setActiveTab('reload')}
            className={`py-3 px-3 text-xs md:text-sm font-semibold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'reload'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            <span>Auto-Recarga</span>
          </button>
          <button
            onClick={() => setActiveTab('display')}
            className={`py-3 px-3 text-xs md:text-sm font-semibold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'display'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Ajustes de TV & Zoom</span>
          </button>
          <button
            onClick={() => setActiveTab('autostart')}
            className={`py-3 px-3 text-xs md:text-sm font-semibold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'autostart'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Arranque Automático TV</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          {/* TAB 1: URL & Website */}
          {activeTab === 'url' && (
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Dirección Web a Mostrar en el Televisor (URL)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={tempConfig.url}
                    onChange={(e) => {
                      setTempConfig({ ...tempConfig, url: e.target.value });
                      setEmbedResult(null);
                    }}
                    placeholder="https://tu-dashboard-o-web.com"
                    className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-sky-500 transition"
                  />
                  <button
                    onClick={handleCheckUrl}
                    disabled={checkingUrl || !tempConfig.url}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition border border-slate-700"
                  >
                    {checkingUrl ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-400" />
                    ) : (
                      <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                    )}
                    <span>{checkingUrl ? 'Comprobando...' : 'Comprobar Web'}</span>
                  </button>
                </div>
              </div>

              {/* Embed verification status badge */}
              {embedResult && (
                <div
                  className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
                    embedResult.canEmbedDirectly
                      ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300'
                      : 'bg-amber-950/30 border-amber-800/40 text-amber-300'
                  }`}
                >
                  <p className="font-semibold flex items-center gap-1.5">
                    {embedResult.canEmbedDirectly ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <ShieldCheck className="w-4 h-4 text-amber-400" />
                    )}
                    <span>
                      {embedResult.canEmbedDirectly
                        ? 'Esta web permite visualización directa'
                        : 'Esta web incluye restricciones de enmarcado (X-Frame-Options o CSP)'}
                    </span>
                  </p>
                  <p className="mt-1 text-slate-300 text-[11px]">
                    {embedResult.canEmbedDirectly
                      ? 'Puedes usar tanto el modo Directo como el Modo Proxy sin problemas.'
                      : 'Hemos configurado automáticamente el "Modo Proxy Anti-Bloqueo" para que se muestre en tu TV sin pantallas en blanco.'}
                  </p>
                </div>
              )}

              {/* Embed mode selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                <div
                  onClick={() => setTempConfig({ ...tempConfig, mode: 'proxy' })}
                  className={`p-4 rounded-xl border cursor-pointer transition ${
                    tempConfig.mode === 'proxy'
                      ? 'bg-sky-950/40 border-sky-500/60 ring-1 ring-sky-500/40'
                      : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-white text-xs flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-sky-400" />
                      Modo Smart Proxy Anti-Bloqueo
                    </span>
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300">
                      Recomendado
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Elimina bloqueos de seguridad tipo X-Frame-Options / CSP para permitir mostrar cualquier web en el kiosco.
                  </p>
                </div>

                <div
                  onClick={() => setTempConfig({ ...tempConfig, mode: 'direct' })}
                  className={`p-4 rounded-xl border cursor-pointer transition ${
                    tempConfig.mode === 'direct'
                      ? 'bg-sky-950/40 border-sky-500/60 ring-1 ring-sky-500/40'
                      : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-white text-xs flex items-center gap-1.5">
                      <ExternalLink className="w-4 h-4 text-slate-400" />
                      Modo Directo Nativo
                    </span>
                    <span className="text-[10px] text-slate-500">iFrame estándar</span>
                  </div>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Carga la web directamente. Ideal para paneles internos de red local (IP / LAN) o sitios sin restricciones de framing.
                  </p>
                </div>
              </div>

              {/* Quick Presets for instant testing */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Ejemplos listos para probar en TV:
                </span>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('https://es.wikipedia.org/wiki/Wikipedia:Portada', 120)}
                    className="p-2.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-left transition text-xs"
                  >
                    <span className="font-semibold text-white block">Wikipedia Hoy</span>
                    <span className="text-[10px] text-slate-400">Noticias y efemérides</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('https://wttr.in/?format=v2', 300)}
                    className="p-2.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-left transition text-xs"
                  >
                    <span className="font-semibold text-white block">Tiempo & Clima</span>
                    <span className="text-[10px] text-slate-400">Pronóstico meteorológico</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('https://time.is/es/', 60)}
                    className="p-2.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-left transition text-xs"
                  >
                    <span className="font-semibold text-white block">Reloj Mundial</span>
                    <span className="text-[10px] text-slate-400">Hora digital precisa</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('https://news.ycombinator.com', 180)}
                    className="p-2.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-left transition text-xs"
                  >
                    <span className="font-semibold text-white block">Hacker News</span>
                    <span className="text-[10px] text-slate-400">Titulares de tecnología</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Auto-Reload */}
          {activeTab === 'reload' && (
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Intervalo de Auto-Recarga
                </label>
                <p className="text-xs text-slate-400 mb-4">
                  El TV recargará la página automáticamente según este temporizador para mantener el contenido siempre fresco sin intervención humana.
                </p>

                {/* Preset intervals */}
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                  {[
                    { label: '30 seg', sec: 30 },
                    { label: '1 min', sec: 60 },
                    { label: '2 min', sec: 120 },
                    { label: '5 min', sec: 300 },
                    { label: '10 min', sec: 600 },
                    { label: '30 min', sec: 1800 },
                    { label: '1 hora', sec: 3600 },
                    { label: 'Desactivada', sec: 0 },
                  ].map((preset) => (
                    <button
                      key={preset.sec}
                      type="button"
                      onClick={() =>
                        setTempConfig({ ...tempConfig, refreshIntervalSeconds: preset.sec })
                      }
                      className={`p-3 rounded-xl border text-center transition text-xs font-medium ${
                        tempConfig.refreshIntervalSeconds === preset.sec
                          ? 'bg-sky-600 text-white border-sky-500 shadow-md font-bold'
                          : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Seconds Input */}
              <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-white block">
                    Tiempo Personalizado en Segundos
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Introduce un valor exacto (por ejemplo 45 para 45 segundos)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="86400"
                    value={tempConfig.refreshIntervalSeconds}
                    onChange={(e) =>
                      setTempConfig({
                        ...tempConfig,
                        refreshIntervalSeconds: Math.max(0, parseInt(e.target.value) || 0),
                      })
                    }
                    className="w-24 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm text-center font-mono focus:border-sky-500 focus:outline-none"
                  />
                  <span className="text-xs text-slate-400">seg</span>
                </div>
              </div>

              {/* Indicator toggles */}
              <div className="space-y-3 pt-2">
                <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/40 border border-slate-800 cursor-pointer hover:border-slate-700 transition">
                  <div>
                    <span className="text-xs font-semibold text-white block">
                      Barra de Progreso Discreta (Línea de 2px inferior)
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Muestra una línea sutil que avanza hasta la próxima recarga. Desactívala para modo 100% puro.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={tempConfig.showProgressBar}
                    onChange={(e) =>
                      setTempConfig({ ...tempConfig, showProgressBar: e.target.checked })
                    }
                    className="w-5 h-5 rounded accent-sky-500 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/40 border border-slate-800 cursor-pointer hover:border-slate-700 transition">
                  <div>
                    <span className="text-xs font-semibold text-white block">
                      Insignia de Estado al Recargar
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Breve animación de recarga que confirma que la página se actualizó correctamente.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={tempConfig.showReloadBadge}
                    onChange={(e) =>
                      setTempConfig({ ...tempConfig, showReloadBadge: e.target.checked })
                    }
                    className="w-5 h-5 rounded accent-sky-500 cursor-pointer"
                  />
                </label>
              </div>
            </div>
          )}

          {/* TAB 3: Display & TV Overscan */}
          {activeTab === 'display' && (
            <div className="space-y-6">
              {/* Zoom setting */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Escala / Zoom de Pantalla ({Math.round(tempConfig.zoom * 100)}%)
                  </label>
                  <span className="text-xs font-mono text-sky-400">x{tempConfig.zoom}</span>
                </div>
                <p className="text-xs text-slate-400 mb-3">
                  Ajusta el tamaño del contenido para pantallas 4K o televisores vistos a distancia en salas y salones.
                </p>
                <div className="flex items-center gap-2">
                  {[0.8, 0.9, 0.95, 1.0, 1.1, 1.25].map((z) => (
                    <button
                      key={z}
                      type="button"
                      onClick={() => setTempConfig({ ...tempConfig, zoom: z })}
                      className={`flex-1 py-2 rounded-lg border text-xs font-medium transition ${
                        tempConfig.zoom === z
                          ? 'bg-sky-600 text-white border-sky-500 font-bold'
                          : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      {Math.round(z * 100)}%
                    </button>
                  ))}
                </div>
              </div>

              {/* TV Overscan Margin */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Compensación de Overscan del Televisor ({tempConfig.overscanMargin}px)
                  </label>
                  <span className="text-xs font-mono text-sky-400">{tempConfig.overscanMargin}px</span>
                </div>
                <p className="text-xs text-slate-400 mb-3">
                  Muchos televisores recortan un 3-5% de los bordes físicos. Agrega un margen de seguridad si los bordes de la web se salen del marco.
                </p>
                <div className="flex items-center gap-2">
                  {[0, 12, 24, 36].map((pad) => (
                    <button
                      key={pad}
                      type="button"
                      onClick={() => setTempConfig({ ...tempConfig, overscanMargin: pad })}
                      className={`flex-1 py-2 rounded-lg border text-xs font-medium transition ${
                        tempConfig.overscanMargin === pad
                          ? 'bg-sky-600 text-white border-sky-500 font-bold'
                          : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      {pad === 0 ? 'Sin margen (0px)' : `${pad}px`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Screen Rotation */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Orientación de Pantalla (Cartelería Digital)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { deg: 0 as const, label: '0° (Horizontal)' },
                    { deg: 90 as const, label: '90° (Vertical Derecha)' },
                    { deg: 180 as const, label: '180° (Invertido)' },
                    { deg: 270 as const, label: '270° (Vertical Izquierda)' },
                  ].map((rot) => (
                    <button
                      key={rot.deg}
                      type="button"
                      onClick={() => setTempConfig({ ...tempConfig, rotation: rot.deg })}
                      className={`py-2 px-1 rounded-lg border text-xs text-center transition ${
                        tempConfig.rotation === rot.deg
                          ? 'bg-sky-600 text-white border-sky-500 font-bold'
                          : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      {rot.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cursor hide */}
              <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/40 border border-slate-800 cursor-pointer hover:border-slate-700 transition">
                <div>
                  <span className="text-xs font-semibold text-white block">
                    Ocultar Cursor del Ratón tras 2.5s de Inactividad
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Evita que la flecha del ratón permanezca visible sobre la pantalla del televisor.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={tempConfig.stealthCursor}
                  onChange={(e) =>
                    setTempConfig({ ...tempConfig, stealthCursor: e.target.checked })
                  }
                  className="w-5 h-5 rounded accent-sky-500 cursor-pointer"
                />
              </label>
            </div>
          )}

          {/* TAB 4: Autostart Guide */}
          {activeTab === 'autostart' && (
            <AutostartGuide kioskUrl={kioskDirectUrl} />
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950/80 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={copyDirectUrl}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition border border-slate-700"
              title="Copiar enlace con estos parámetros"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedLink ? '¡Enlace Copiado!' : 'Copiar URL Directa'}</span>
            </button>

            {isPWAInstallable && onInstallPWA && (
              <button
                onClick={onInstallPWA}
                className="px-3.5 py-2 rounded-xl bg-purple-600/80 hover:bg-purple-600 text-white text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Tv className="w-4 h-4" />
                <span>Instalar PWA en TV</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              Cerrar
            </button>
            <button
              onClick={handleSaveAndLaunch}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-sky-500/20 transition"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Guardar e Iniciar Modo Kiosco</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
