import { readFileSync } from 'node:fs';
import { GoogleGenAI } from '@google/genai';
const key = readFileSync('.env.local', 'utf8').match(/GEMINI_API_KEY=(.*)/)![1].trim();
const client = new GoogleGenAI({ apiKey: key });
const t = Date.now();
try {
  const r = await client.interactions.create({ model: 'gemini-3.8-flash', input: 'Responda só: ok' });
  console.log('OK em', Date.now() - t, 'ms:', r.output_text);
} catch (e: any) {
  console.log('ERRO em', Date.now() - t, 'ms:', e?.status, e?.message?.slice(0, 500));
}
