import type { IncomingMessage, ServerResponse } from 'node:http';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { estimatePrice } from './server/estimate';
import { DEFAULT_GEMINI_MODEL, FALLBACK_GEMINI_MODEL, REQUEST_TIMEOUT_MS, identifyProduct } from './server/identify';

type Handler = (body: unknown) => Promise<{ status: number; body: unknown }>;

/** Lê o JSON do corpo, chama o handler e devolve a resposta (mesmo contrato das funções da Vercel). */
function jsonRoute(handler: Handler) {
  return (req: IncomingMessage, res: ServerResponse) => {
    if (req.method !== 'POST') {
      res.statusCode = 405;
      res.end();
      return;
    }
    let raw = '';
    req.on('data', (chunk) => (raw += chunk));
    req.on('end', async () => {
      let body: unknown = null;
      try {
        body = JSON.parse(raw);
      } catch {
        // corpo inválido: o handler responde 400
      }
      const result = await handler(body);
      res.statusCode = result.status;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(result.body));
    });
  };
}

/**
 * Gera o ads.txt exigido pelo AdSense a partir do ID de publicador (ca-pub-123 → pub-123).
 * Sem VITE_ADSENSE_CLIENT, não gera nada.
 */
function adsTxt(env: Record<string, string>): Plugin {
  const client = env.VITE_ADSENSE_CLIENT;
  return {
    name: 'isfair-ads-txt',
    apply: 'build',
    // Meta tag que o AdSense pede para confirmar que o site é seu (Sites → Adicionar site → Snippet de meta tag)
    transformIndexHtml() {
      if (!client) return;
      return [{ tag: 'meta', attrs: { name: 'google-adsense-account', content: client }, injectTo: 'head' }];
    },
    generateBundle() {
      if (!client) return;
      const publisher = client.replace(/^ca-/, '');
      this.emitFile({
        type: 'asset',
        fileName: 'ads.txt',
        source: `google.com, ${publisher}, DIRECT, f08c47fec0942fa0\n`,
      });
    },
  };
}

/** Atende /api/* no `npm run dev`, igual às funções da Vercel em produção. */
function apiDevServer(env: Record<string, string>): Plugin {
  const model = env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
  return {
    name: 'isfair-api-dev',
    configureServer(server) {
      server.middlewares.use('/api/identify', jsonRoute((body) => identifyProduct(body, env.GEMINI_API_KEY, model)));
      server.middlewares.use(
        '/api/estimate',
        jsonRoute((body) => estimatePrice(body, env.GEMINI_API_KEY, [model, FALLBACK_GEMINI_MODEL], REQUEST_TIMEOUT_MS)),
      );
    },
  };
}

export default defineConfig(({ mode }) => {
  // Lê .env / .env.local sem expor as variáveis ao navegador (sem prefixo VITE_).
  const env = loadEnv(mode, process.cwd(), '');
  return {
    // `npm run dev:phone` liga HTTPS: pelo IP da rede o celular só libera localização em HTTPS.
    // No computador (localhost) o navegador já libera em HTTP, sem aviso de certificado.
    plugins: [react(), ...(mode === 'phone' ? [basicSsl()] : []), apiDevServer(env), adsTxt(env)],
    server: { host: true, port: 5173 },
  };
});
