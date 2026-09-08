import React, { useState } from 'react';
import { Tv, Monitor, Terminal, Laptop, Copy, Check, Download, AlertCircle, ExternalLink } from 'lucide-react';

interface AutostartGuideProps {
  kioskUrl: string;
}

export const AutostartGuide: React.FC<AutostartGuideProps> = ({ kioskUrl }) => {
  const [activeTab, setActiveTab] = useState<'android' | 'apk' | 'rpi' | 'windows' | 'smarttv'>('android');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const downloadFile = (filename: string, content: string, type: string = 'text/plain') => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const rpiBashScript = `#!/bin/bash
# TV Kiosk Autostart Script para Raspberry Pi
# Deshabilitar salvapantallas y suspensión de energía
xset s noblank
xset s off
xset -dpms

# Ocultar cursor del mouse tras 2 segundos de inactividad
unclutter -idle 2 -root &

# Esperar 5 segundos a que la red esté disponible
sleep 5

# Limpiar posibles advertencias de cierre previo de Chromium
sed -i 's/"exited_cleanly":false/"exited_cleanly":true/' ~/.config/chromium/Default/Preferences
sed -i 's/"exit_type":"Crashed"/"exit_type":"Normal"/' ~/.config/chromium/Default/Preferences

# Iniciar Chromium en modo Kiosco Pantalla Completa
chromium-browser \\
  --noerrdialogs \\
  --disable-infobars \\
  --kiosk \\
  --check-for-update-interval=31536000 \\
  --disable-session-crashed-bubble \\
  --disable-features=TranslateUI \\
  --disable-pinch \\
  --overscroll-history-navigation=0 \\
  "${kioskUrl}"
`;

  const rpiDesktopFile = `[Desktop Entry]
Type=Application
Name=TV Kiosk
Comment=Arranque automático TV Kiosk
Exec=/home/pi/tv-kiosk.sh
Terminal=false
`;

  const windowsBatScript = `@echo off
:: TV Kiosk Autostart para Windows
:: Esperar 4 segundos a conexión de red
timeout /t 4 /nobreak >nul

:: Iniciar Chrome en Modo Kiosco Pantalla Completa
start "" chrome.exe --kiosk --disable-session-crashed-bubble --disable-infobars --noerrdialogs --incognito "${kioskUrl}"
`;

  const webManifestCode = `{
  "id": "/",
  "name": "TV Kiosk Display",
  "short_name": "TV Kiosk",
  "description": "Modo kiosco profesional para TV y pantallas con auto-recarga, pantalla siempre activa y arranque automático.",
  "start_url": "/",
  "scope": "/",
  "display": "fullscreen",
  "display_override": ["fullscreen", "standalone"],
  "orientation": "any",
  "background_color": "#090d16",
  "theme_color": "#090d16",
  "categories": ["utilities", "business", "productivity"],
  "icons": [
    { "src": "/pwa-192x192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
    { "src": "/pwa-512x512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
    { "src": "/pwa-maskable-512x512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}`;

  const androidManifestXml = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.tvkiosk.display">

    <!-- Permisos para TV Kiosk y arranque automático -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />

    <!-- Compatibilidad con Android TV (Leanback) sin pantalla táctil -->
    <uses-feature android:name="android.software.leanback" android:required="false" />
    <uses-feature android:name="android.hardware.touchscreen" android:required="false" />

    <application
        android:label="TV Kiosk Display"
        android:theme="@android:style/Theme.NoTitleBar.Fullscreen"
        android:hardwareAccelerated="true">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:launchMode="singleInstance">
            <!-- Launcher móvil / tablet -->
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
            <!-- Launcher oficial para Android TV / Google TV / Fire TV -->
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LEANBACK_LAUNCHER" />
            </intent-filter>
        </activity>

        <!-- Arranque automático al encender el televisor -->
        <receiver android:name=".BootReceiver" android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.BOOT_COMPLETED" />
            </intent-filter>
        </receiver>
    </application>
</manifest>`;

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-700/60 pb-3">
        <button
          onClick={() => setActiveTab('android')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition ${
            activeTab === 'android'
              ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Tv className="w-4 h-4" />
          <span>Android TV / Fire TV</span>
        </button>
        <button
          onClick={() => setActiveTab('apk')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition ${
            activeTab === 'apk'
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Download className="w-4 h-4" />
          <span>Manifiesto & Crear APK</span>
        </button>
        <button
          onClick={() => setActiveTab('rpi')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition ${
            activeTab === 'rpi'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>Raspberry Pi / Linux</span>
        </button>
        <button
          onClick={() => setActiveTab('windows')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition ${
            activeTab === 'windows'
              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Laptop className="w-4 h-4" />
          <span>Windows Mini PC</span>
        </button>
        <button
          onClick={() => setActiveTab('smarttv')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition ${
            activeTab === 'smarttv'
              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Monitor className="w-4 h-4" />
          <span>Smart TV (LG / Samsung)</span>
        </button>
      </div>

      {/* Tab 1: Android TV / Fire TV */}
      {activeTab === 'android' && (
        <div className="space-y-4 text-xs text-slate-300">
          <div className="p-3.5 rounded-lg bg-sky-950/40 border border-sky-800/40 text-sky-200">
            <p className="font-semibold text-sm mb-1 text-sky-300">
              Método Recomendado para Android TV / Fire TV Stick
            </p>
            <p className="leading-relaxed">
              En dispositivos Android TV o Fire TV Stick, el sistema operativo no tiene una carpeta de autostart por defecto, pero se automatiza en 2 minutos con la app gratuita oficial <strong>Launch on Boot</strong> o usando un navegador kiosco.
            </p>
          </div>

          <ol className="list-decimal list-inside space-y-2.5 leading-relaxed bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <li>
              <strong className="text-white">Instala la PWA o abre el navegador:</strong> Abre Chrome, Puffin TV o el navegador de Fire TV e ingresa a esta URL. Selecciona <em>"Añadir a pantalla de inicio"</em> (Instalar PWA).
            </li>
            <li>
              <strong className="text-white">Descarga la app "Launch on Boot":</strong> Disponible gratis en Google Play Store para Android TV, o mediante Aptoide TV / Downloader.
            </li>
            <li>
              <strong className="text-white">Configura el arranque automático:</strong> Abre <em>Launch on Boot</em>, activa el interruptor <em>"Enabled"</em> y selecciona tu navegador o la PWA <strong>"TV Kiosk"</strong> como la app a ejecutar al encender el televisor.
            </li>
            <li>
              <strong className="text-white">Ajuste de energía del TV:</strong> En los ajustes de tu TV Android (<em>Preferencias del dispositivo → Pantalla</em>), desactiva el modo de reposo automático (Suspender: Nunca) para que la pantalla se mantenga perpetuamente encendida.
            </li>
          </ol>

          <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700 flex items-center justify-between gap-2">
            <div className="truncate">
              <span className="text-slate-400 block text-[11px]">URL directa para configurar en el navegador del TV:</span>
              <span className="font-mono text-white text-xs select-all truncate">{kioskUrl}</span>
            </div>
            <button
              onClick={() => copyToClipboard(kioskUrl, 'android_url')}
              className="px-3 py-1.5 rounded-md bg-sky-600 hover:bg-sky-500 text-white font-medium flex items-center gap-1.5 shrink-0"
            >
              {copiedKey === 'android_url' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'android_url' ? 'Copiada' : 'Copiar URL'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab: Manifiesto & APK */}
      {activeTab === 'apk' && (
        <div className="space-y-4 text-xs text-slate-300">
          <div className="p-3.5 rounded-lg bg-amber-950/40 border border-amber-800/40 text-amber-200">
            <p className="font-semibold text-sm mb-1 text-amber-300 flex items-center gap-2">
              <Download className="w-4 h-4" />
              <span>Manifiesto Web (PWA) y AndroidManifest listos para generar APK</span>
            </p>
            <p className="leading-relaxed">
              Ya hemos creado y configurado en esta app los manifiestos requeridos para empaquetarla en un archivo <strong>.APK</strong> nativo para Android y televisores Android TV / Google TV.
            </p>
          </div>

          {/* Opción 1: Generador Online Automático PWABuilder */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white text-sm">¿PWABuilder dice "No Manifest Found"?</span>
              <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-400 text-[10px] font-medium border border-sky-500/30">
                Solución Rápida
              </span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-2 leading-relaxed">
              <p>
                <strong className="text-amber-300">¿Por qué sucede?</strong> Las URLs de Google AI Studio (<code className="text-sky-300">...run.app</code>) tienen un firewall que valida cookies del navegador humano (<code className="text-slate-400">cookie_check</code>). Los robots rastreadores de PWABuilder son bloqueados por Google y no pueden leer el archivo automáticamente.
              </p>
              <p>
                <strong className="text-emerald-400">Solución A en PWABuilder:</strong> En la pantalla de error de PWABuilder, haz clic en <strong className="text-white">"Enter manifest manually"</strong> o <strong className="text-white">"Upload manifest"</strong> y sube o pega el JSON que tienes abajo. Con eso te permitirá generar el APK sin problemas.
              </p>
              <p>
                <strong className="text-emerald-400">Solución B (Web2APK o AppsGeyser):</strong> Si solo quieres un archivo .APK para tu TV sin configurar manifiestos, usa herramientas gratuitas como <a href="https://appsgeyser.com/create-url-app/" target="_blank" rel="noreferrer" className="text-sky-400 underline font-semibold">AppsGeyser Web to APK</a> o <a href="https://web2apk.com" target="_blank" rel="noreferrer" className="text-sky-400 underline font-semibold">Web2APK</a>, pega la URL y descargas el APK en 30 segundos.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <a
                href={`https://www.pwabuilder.com?url=${encodeURIComponent(window?.location?.origin || '')}`}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center gap-2 transition shadow-lg shadow-amber-500/20"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Abrir PWABuilder</span>
              </a>
              <a
                href="/manifest.json"
                target="_blank"
                rel="noreferrer"
                className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition"
              >
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                <span>Ver /manifest.json en vivo</span>
              </a>
            </div>
          </div>

          {/* Manifiesto Web PWA */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white">1. Web App Manifest (<code className="text-amber-400">manifest.json</code>):</span>
              <div className="flex gap-2">
                <button
                  onClick={() => downloadFile('manifest.json', webManifestCode, 'application/json')}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar .json</span>
                </button>
                <button
                  onClick={() => copyToClipboard(webManifestCode, 'web_manifest')}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1"
                >
                  {copiedKey === 'web_manifest' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'web_manifest' ? 'Copiado' : 'Copiar'}</span>
                </button>
              </div>
            </div>
            <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-amber-300 overflow-x-auto max-h-40">
              {webManifestCode}
            </pre>
          </div>

          {/* AndroidManifest.xml */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white">2. Android Manifest (<code className="text-sky-400">AndroidManifest.xml</code> con soporte Android TV):</span>
              <div className="flex gap-2">
                <button
                  onClick={() => downloadFile('AndroidManifest.xml', androidManifestXml, 'application/xml')}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar .xml</span>
                </button>
                <button
                  onClick={() => copyToClipboard(androidManifestXml, 'android_manifest')}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1"
                >
                  {copiedKey === 'android_manifest' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'android_manifest' ? 'Copiado' : 'Copiar'}</span>
                </button>
              </div>
            </div>
            <p className="text-[11px] text-slate-400">
              Incluye la categoría <code className="text-sky-300">LEANBACK_LAUNCHER</code> para aparecer en la fila de apps de Android TV y el receptor <code className="text-sky-300">BOOT_COMPLETED</code> para arrancar solo.
            </p>
            <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-sky-300 overflow-x-auto max-h-40">
              {androidManifestXml}
            </pre>
          </div>
        </div>
      )}

      {/* Tab 2: Raspberry Pi / Linux */}
      {activeTab === 'rpi' && (
        <div className="space-y-4 text-xs text-slate-300">
          <div className="p-3.5 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-emerald-200">
            <p className="font-semibold text-sm mb-1 text-emerald-300">
              Modo Kiosco 100% Autónomo en Raspberry Pi OS
            </p>
            <p className="leading-relaxed">
              Ideal para pantallas conectadas por HDMI las 24 horas. Al encender la Raspberry Pi, cargará el entorno gráfico y lanzará Chromium directamente en pantalla completa sin barras, sin cursor y sin diálogos de error.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white">1. Script ejecutable (~/tv-kiosk.sh):</span>
              <div className="flex gap-2">
                <button
                  onClick={() => downloadFile('tv-kiosk.sh', rpiBashScript)}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar .sh</span>
                </button>
                <button
                  onClick={() => copyToClipboard(rpiBashScript, 'rpi_script')}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1"
                >
                  {copiedKey === 'rpi_script' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'rpi_script' ? 'Copiado' : 'Copiar'}</span>
                </button>
              </div>
            </div>
            <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-emerald-400 overflow-x-auto max-h-36">
              {rpiBashScript}
            </pre>
          </div>

          <div className="space-y-2">
            <span className="font-semibold text-white">2. Configurar autostart en el escritorio:</span>
            <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 space-y-2 font-mono text-[11px]">
              <p className="text-slate-400"># Dar permisos de ejecución al script:</p>
              <p className="text-white bg-slate-950 p-1.5 rounded">chmod +x ~/tv-kiosk.sh</p>
              <p className="text-slate-400"># Crear el archivo de autostart:</p>
              <p className="text-white bg-slate-950 p-1.5 rounded">mkdir -p ~/.config/autostart && nano ~/.config/autostart/kiosk.desktop</p>
              <div className="flex justify-between items-center pt-1">
                <span className="text-slate-400">Contenido para kiosk.desktop:</span>
                <button
                  onClick={() => copyToClipboard(rpiDesktopFile, 'rpi_desktop')}
                  className="text-xs text-sky-400 hover:underline flex items-center gap-1"
                >
                  {copiedKey === 'rpi_desktop' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>Copiar archivo desktop</span>
                </button>
              </div>
              <pre className="p-2 rounded bg-slate-950 text-slate-300 text-[10px]">{rpiDesktopFile}</pre>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Windows Mini PC */}
      {activeTab === 'windows' && (
        <div className="space-y-4 text-xs text-slate-300">
          <div className="p-3.5 rounded-lg bg-blue-950/40 border border-blue-800/40 text-blue-200">
            <p className="font-semibold text-sm mb-1 text-blue-300">
              Arranque en Mini PC o Stick TV con Windows 10/11
            </p>
            <p className="leading-relaxed">
              Al encender el PC o TV, Windows iniciará sesión automáticamente y ejecutará Chrome en modo kiosco sin mostrar barra de tareas ni bordes.
            </p>
          </div>

          <ol className="list-decimal list-inside space-y-2.5 leading-relaxed bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <li>
              <strong className="text-white">Abrir la carpeta de inicio:</strong> Presiona <kbd className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">Win + R</kbd>, escribe <code className="bg-slate-950 text-sky-400 px-1.5 py-0.5 rounded">shell:startup</code> y presiona Enter.
            </li>
            <li>
              <strong className="text-white">Colocar el script bat:</strong> Descarga el siguiente archivo <code className="text-white">tv-kiosk.bat</code> y cópialo dentro de esa carpeta.
            </li>
            <li>
              <strong className="text-white">Desactivar suspensión de pantalla:</strong> Ve a <em>Configuración de Windows → Sistema → Energía y suspensión</em> y ajusta "Apagar la pantalla" a <strong>Nunca</strong>.
            </li>
          </ol>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white">Contenido de tv-kiosk.bat:</span>
              <div className="flex gap-2">
                <button
                  onClick={() => downloadFile('tv-kiosk.bat', windowsBatScript)}
                  className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar tv-kiosk.bat</span>
                </button>
                <button
                  onClick={() => copyToClipboard(windowsBatScript, 'win_bat')}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1"
                >
                  {copiedKey === 'win_bat' ? <Check className="w-3.5 h-3.5 text-blue-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'win_bat' ? 'Copiado' : 'Copiar'}</span>
                </button>
              </div>
            </div>
            <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-blue-300 overflow-x-auto">
              {windowsBatScript}
            </pre>
          </div>
        </div>
      )}

      {/* Tab 4: Smart TV (LG webOS / Samsung Tizen) */}
      {activeTab === 'smarttv' && (
        <div className="space-y-4 text-xs text-slate-300">
          <div className="p-3.5 rounded-lg bg-purple-950/40 border border-purple-800/40 text-purple-200">
            <p className="font-semibold text-sm mb-1 text-purple-300">
              Navegador Integrado en Smart TV (LG webOS / Samsung Tizen)
            </p>
            <p className="leading-relaxed">
              Los televisores Smart TV modernos permiten fijar el navegador como página de inicio o recordar la última app abierta al encender.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-slate-900/70 p-3.5 rounded-xl border border-slate-800 space-y-2">
              <h4 className="font-semibold text-white text-sm flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-pink-500 inline-block" />
                LG Smart TV (webOS)
              </h4>
              <ul className="space-y-1.5 list-disc list-inside text-slate-300">
                <li>Abre la app <strong>Navegador Web</strong> e introduce la URL.</li>
                <li>Haz clic en el menú del navegador y selecciona <strong>"Página de inicio actual"</strong>.</li>
                <li>Activa en el navegador la opción de <strong>Pantalla completa</strong> (oculta pestañas).</li>
                <li>En <em>Ajustes de LG → General → Home Settings</em>, activa <strong>"Power On Screen: Last Input"</strong> para que al encender regrese directo a la pantalla activa.</li>
              </ul>
            </div>

            <div className="bg-slate-900/70 p-3.5 rounded-xl border border-slate-800 space-y-2">
              <h4 className="font-semibold text-white text-sm flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                Samsung Smart TV (Tizen)
              </h4>
              <ul className="space-y-1.5 list-disc list-inside text-slate-300">
                <li>Abre <strong>Internet Samsung</strong> e ingresa la URL.</li>
                <li>Guarda en Favoritos o configúralo como <em>"Abrir con la última página vista"</em>.</li>
                <li>Presiona el botón de pantalla completa en el navegador de Tizen.</li>
                <li>En <em>Ajustes → General → Funciones Inteligentes</em>, activa <strong>"Autorun Last App"</strong> (ejecutar automáticamente la última app al encender el televisor).</li>
              </ul>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-800/40 text-amber-300 flex items-start gap-2 text-[11px]">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              <strong>Consejo para Televisores Comerciales:</strong> Si tu TV es una pantalla comercial o de cartelería (LG SuperSign o Samsung MagicINFO), puedes activar el "Modo Kiosco / URL Launcher" desde el menú de Servicio o Ajustes Profesionales para bloquear cualquier menú o botón del control remoto.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
