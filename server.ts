import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

// Enable CORS for external tools (PWABuilder, Bubblewrap, PWA audits)
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());

// API routes go here FIRST
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Explicit manifest serving with proper MIME type and CORS for PWA & APK generators
app.get(['/manifest.json', '/manifest.webmanifest'], (req, res) => {
  const manifestPath = path.join(process.cwd(), 'public', 'manifest.json');
  res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.sendFile(manifestPath);
});

// Check if a URL allows direct iframe embedding or requires proxy
app.get('/api/check-embed', async (req, res) => {
  const targetUrl = req.query.url as string;
  if (!targetUrl) {
    return res.status(400).json({ error: 'URL parameter is required' });
  }

  try {
    const parsed = new URL(targetUrl);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return res.status(400).json({ error: 'Protocol must be http or https' });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(parsed.href, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 TV-Kiosk/1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: controller.signal,
      redirect: 'follow',
    });
    clearTimeout(timeout);

    const xFrameOptions = response.headers.get('x-frame-options');
    const csp = response.headers.get('content-security-policy');
    
    let blocksFrame = false;
    if (xFrameOptions) {
      const xfo = xFrameOptions.toLowerCase();
      if (xfo.includes('deny') || xfo.includes('sameorigin')) {
        blocksFrame = true;
      }
    }
    if (csp && csp.toLowerCase().includes('frame-ancestors')) {
      blocksFrame = true;
    }

    return res.json({
      status: response.status,
      canEmbedDirectly: !blocksFrame,
      xFrameOptions: xFrameOptions || null,
      csp: csp ? (csp.length > 80 ? csp.substring(0, 80) + '...' : csp) : null,
      finalUrl: response.url,
    });
  } catch (err: any) {
    return res.json({
      status: 0,
      canEmbedDirectly: false,
      error: err.message || 'Could not verify URL',
      recommendedMode: 'proxy',
    });
  }
});

// Proxy route to bypass X-Frame-Options and CSP frame-ancestors
app.get('/api/proxy', async (req, res) => {
  const targetUrl = req.query.url as string;
  if (!targetUrl) {
    return res.status(400).send('Target URL parameter is required');
  }

  try {
    const parsed = new URL(targetUrl);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return res.status(400).send('Invalid protocol');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const response = await fetch(parsed.href, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
      },
      signal: controller.signal,
      redirect: 'follow',
    });
    clearTimeout(timeout);

    const contentType = response.headers.get('content-type') || 'text/html';

    // Remove security headers that prevent iframe display
    res.removeHeader('X-Frame-Options');
    res.removeHeader('Content-Security-Policy');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', contentType);

    if (contentType.includes('text/html')) {
      let html = await response.text();
      const finalOrigin = new URL(response.url).origin;
      const finalHref = response.url;

      // Inject <base> tag so relative paths (css, js, images) resolve correctly
      const baseTag = `<base href="${finalHref}">`;
      if (html.includes('<head>')) {
        html = html.replace('<head>', `<head>\n  ${baseTag}`);
      } else if (html.includes('<head ')) {
        html = html.replace(/<head[^>]*>/, `$& \n  ${baseTag}`);
      } else {
        html = `${baseTag}\n${html}`;
      }

      return res.send(html);
    } else {
      // Direct stream for non-HTML
      const buffer = await response.arrayBuffer();
      return res.send(Buffer.from(buffer));
    }
  } catch (err: any) {
    console.error('Proxy error:', err);
    res.status(502).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Error cargando página</title>
          <style>
            body { background: #0f172a; color: #f8fafc; font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; text-align: center; }
            .card { background: #1e293b; padding: 32px; border-radius: 16px; max-width: 500px; border: 1px solid #334155; }
            h2 { color: #f87171; margin-top: 0; }
            p { color: #94a3b8; font-size: 15px; line-height: 1.6; }
            code { background: #090d16; padding: 4px 8px; border-radius: 6px; color: #38bdf8; font-size: 13px; word-break: break-all; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>No se pudo cargar la URL en el Kiosco</h2>
            <p>La dirección especificada no respondió o bloqueó la conexión:</p>
            <p><code>${targetUrl}</code></p>
            <p style="font-size: 13px; color: #64748b;">${err.message || 'Verifica la conexión y la dirección web.'}</p>
          </div>
        </body>
      </html>
    `);
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TV Kiosk Server running on port ${PORT}`);
  });
}

startServer();
