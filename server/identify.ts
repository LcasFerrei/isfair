import { GoogleGenAI } from '@google/genai';
import { PRODUCTS } from '../src/data/mockData';
import type { IdentifyErrorCode, IdentifyRequest, IdentifyResponse } from '../src/types';
import {
  ESTIMATE_REQUIRED,
  ESTIMATE_SCHEMA_PROPERTIES,
  LANGUAGE_NAMES,
  estimateInstructions,
  languageName,
  parseCityContext,
  parseEstimate,
} from './estimate';
import { findPackagedProductImage } from './productImage';

export const DEFAULT_GEMINI_MODEL = 'gemini-3.5-flash-lite';
/** Usado quando o modelo principal está sobrecarregado (503) ou demora demais */
export const FALLBACK_GEMINI_MODEL = 'gemini-3.6-flash';
/** Por tentativa; o SDK, por padrão, repete pedidos com 503 por minutos */
export const REQUEST_TIMEOUT_MS = 20_000;

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
/** ~3 MB de imagem em base64; o app reduz a foto antes de enviar */
const MAX_IMAGE_BASE64_LENGTH = 4_000_000;
const UNKNOWN = 'unknown';

const catalog = PRODUCTS.map((p) => `- ${p.id}: ${p.name} (${p.nameEn})`).join('\n');

const buildPrompt = (request: IdentifyRequest) => `Você ajuda turistas no comércio de rua do Brasil (praias, feirinhas, ambulantes).
Identifique o produto principal da foto e escolha o id correspondente no catálogo abaixo.
Se nenhum item do catálogo corresponder com segurança, use "${UNKNOWN}".

Catálogo:
${catalog}

Em "itemName", escreva o nome específico do que aparece, como está escrito na embalagem quando houver (marca e variedade, ex.: "Club Social Integral", "Guaraná Antarctica"); para itens sem marca, o nome comum em português (ex.: "Água de coco"). Preencha mesmo quando productId for "unknown".
Em "packaged", use true só se for um produto industrializado embalado com marca visível.

Se houver um preço visível para esse produto (etiqueta, placa, cardápio, lousa), informe em "price" o valor na moeda local (${request.city?.currency ?? 'BRL'}) como número (ex.: 12.5); se não houver, use 0.

Em "description", descreva em ${languageName(request.language)}, em até 12 palavras, o que aparece na foto.
${request.city ? estimateInstructions('exatamente o item da foto (o mesmo de "itemName")', request.city, request.language) : ''}`;

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    productId: {
      type: 'string',
      enum: [...PRODUCTS.map((p) => p.id), UNKNOWN],
      description: 'id do produto do catálogo, ou "unknown"',
    },
    confidence: { type: 'number', description: 'Confiança de 0 a 1' },
    price: { type: 'number', description: 'Preço visível na foto, na moeda local, ou 0 se não houver' },
    itemName: { type: 'string', description: 'Nome específico do item (marca e variedade, se houver)' },
    packaged: { type: 'boolean', description: 'Produto industrializado embalado com marca visível' },
    description: { type: 'string', description: 'O que aparece na foto, no idioma pedido' },
    ...ESTIMATE_SCHEMA_PROPERTIES,
  },
  required: ['productId', 'confidence', 'price', 'itemName', 'packaged', 'description', ...ESTIMATE_REQUIRED],
};

export interface IdentifyResult {
  status: number;
  /** code é traduzido no app (identify.<code>); error é só para logs */
  body: IdentifyResponse | { code: IdentifyErrorCode; error: string };
}

function parseRequest(body: unknown): IdentifyRequest | null {
  if (!body || typeof body !== 'object') return null;
  const { image, mimeType, language, city } = body as Partial<IdentifyRequest>;
  if (typeof image !== 'string' || typeof mimeType !== 'string') return null;
  if (!ALLOWED_MIME_TYPES.includes(mimeType) || image.length === 0 || image.length > MAX_IMAGE_BASE64_LENGTH) {
    return null;
  }
  const validCity = parseCityContext(city);
  return { image, mimeType, language: typeof language === 'string' && language in LANGUAGE_NAMES ? language : 'pt', city: validCity };
}

/** Lógica compartilhada pela função da Vercel (api/identify.ts) e pelo servidor de dev do Vite. */
export async function identifyProduct(body: unknown, apiKey: string | undefined, model: string): Promise<IdentifyResult> {
  if (!apiKey) {
    return { status: 503, body: { code: 'unavailable', error: 'GEMINI_API_KEY não configurada.' } };
  }
  const request = parseRequest(body);
  if (!request) {
    return { status: 400, body: { code: 'badImage', error: 'Foto inválida ou maior que 3 MB.' } };
  }

  const client = new GoogleGenAI({ apiKey });
  const models = [...new Set([model, FALLBACK_GEMINI_MODEL])];
  let lastError: unknown;

  for (const candidate of models) {
    try {
      const interaction = await client.interactions.create(
        {
          model: candidate,
          input: [
            { type: 'image', data: request.image, mime_type: request.mimeType },
            { type: 'text', text: buildPrompt(request) },
          ],
          response_format: { type: 'text', mime_type: 'application/json', schema: RESPONSE_SCHEMA },
        },
        { timeout: REQUEST_TIMEOUT_MS, maxRetries: 0 },
      );
      return await toResult(interaction.output_text);
    } catch (error) {
      lastError = error;
      const status = (error as { status?: number }).status;
      // 400/401/403 não melhoram trocando de modelo
      if (status !== undefined && status < 500 && status !== 429) break;
      const detail = String((error as Error).message ?? error).slice(0, 300);
      console.warn(`[identify] ${candidate} falhou (${status ?? 'timeout/rede'}): ${detail}`);
    }
  }

  const status = (lastError as { status?: number }).status;
  if (status === 429) {
    return { status: 429, body: { code: 'rateLimit', error: 'Limite gratuito do Gemini atingido.' } };
  }
  console.error('[identify] Gemini falhou:', lastError);
  return { status: 502, body: { code: 'failed', error: 'Gemini falhou.' } };
}

async function toResult(outputText: string | undefined): Promise<IdentifyResult> {
  try {
    const raw = JSON.parse(outputText ?? '{}') as Record<string, unknown>;
    const parsed = raw as Partial<{
      productId: string;
      confidence: number;
      price: number;
      itemName: string;
      packaged: boolean;
      description: string;
    }>;
    const known = PRODUCTS.some((p) => p.id === parsed.productId);
    const itemName = typeof parsed.itemName === 'string' && parsed.itemName.trim() ? parsed.itemName.trim().slice(0, 80) : null;
    // Foto da internet só para produtos de marca: para itens genéricos as buscas trazem imagens erradas
    const itemImage = itemName && parsed.packaged === true ? await findPackagedProductImage(itemName) : null;
    return {
      status: 200,
      body: {
        productId: known ? parsed.productId! : null,
        confidence: Math.min(1, Math.max(0, Number(parsed.confidence) || 0)),
        // Preço lido só vale para um produto reconhecido e dentro de uma faixa plausível de rua
        priceSeen: known && Number(parsed.price) > 0 && Number(parsed.price) < 10_000 ? Math.round(Number(parsed.price) * 100) / 100 : null,
        itemName,
        itemImage,
        estimate: parseEstimate(raw),
        description: typeof parsed.description === 'string' ? parsed.description : '',
      },
    };
  } catch {
    console.error('[identify] resposta do Gemini não é JSON válido:', outputText);
    return { status: 502, body: { code: 'failed', error: 'Resposta inválida do Gemini.' } };
  }
}
