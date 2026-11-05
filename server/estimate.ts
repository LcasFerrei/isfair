import { GoogleGenAI } from '@google/genai';
import type { CityContext, EstimateRequest, PriceEstimate } from '../src/types';

/** Idioma dos textos devolvidos ao turista */
export const LANGUAGE_NAMES: Record<string, string> = {
  pt: 'português do Brasil',
  en: 'inglês',
  es: 'espanhol',
  fr: 'francês',
  it: 'italiano',
  ar: 'árabe',
  zh: 'chinês simplificado',
  ja: 'japonês',
};

export const languageName = (language: string | undefined) => LANGUAGE_NAMES[language ?? ''] ?? LANGUAGE_NAMES.pt;

const describeCity = (city: CityContext) => [city.name, city.state, city.country].filter(Boolean).join(', ');

/** Instruções de estimativa, compartilhadas pela foto (identify) e pelo texto (estimate). */
export const estimateInstructions = (itemRef: string, city: CityContext, language: string | undefined) => `
Estime o preço de rua, na moeda local ${city.currency}, de ${itemRef} vendido no comércio informal (ambulantes, barracas, feirinhas, quiosques) em ${describeCity(city)}, nos dias de hoje.
- "estFairMin" e "estFairMax": faixa que um morador local normalmente paga.
- "estTouristMax": o máximo aceitável em ponto turístico; acima disso é preço abusivo para turista.
- "estUnit": a unidade a que o preço se refere (ex.: "1 lata 350 ml", "1 pacote", "1 unidade"), em ${languageName(language)}.
- Todos os valores devem estar em ${city.currency}, a moeda usada no local (não converta para outra moeda).
- Seja realista e conservador. Em "estConfidence", de 0 a 1, diga o quanto confia na estimativa.
- "estExplanation": uma frase curta em ${languageName(language)} explicando a estimativa.
- "estTip": uma dica prática curta em ${languageName(language)} para não pagar a mais por esse item.
Se não for possível estimar, use 0 nos valores.`;

export const ESTIMATE_SCHEMA_PROPERTIES = {
  estFairMin: { type: 'number', description: 'Mínimo da faixa justa, na moeda local' },
  estFairMax: { type: 'number', description: 'Máximo da faixa justa, na moeda local' },
  estTouristMax: { type: 'number', description: 'Máximo aceitável em área turística, na moeda local' },
  estUnit: { type: 'string', description: 'Unidade do preço' },
  estConfidence: { type: 'number', description: 'Confiança de 0 a 1' },
  estExplanation: { type: 'string', description: 'Explicação curta da estimativa' },
  estTip: { type: 'string', description: 'Dica prática de negociação' },
} as const;

export const ESTIMATE_REQUIRED = Object.keys(ESTIMATE_SCHEMA_PROPERTIES);

const round2 = (n: number) => Math.round(n * 100) / 100;
const text = (value: unknown, max = 240) => (typeof value === 'string' ? value.trim().slice(0, max) : '');

/** Valida os números da IA; descarta faixas impossíveis em vez de mostrar algo errado. */
export function parseEstimate(raw: Record<string, unknown>): PriceEstimate | null {
  const fairMin = Number(raw.estFairMin);
  const fairMax = Number(raw.estFairMax);
  const touristMax = Number(raw.estTouristMax);
  const valid = fairMin > 0 && fairMax >= fairMin && touristMax > fairMax && touristMax < 100_000;
  if (!valid) return null;
  return {
    range: { fairMin: round2(fairMin), fairMax: round2(fairMax), touristMax: round2(touristMax) },
    unit: text(raw.estUnit, 60),
    confidence: Math.min(1, Math.max(0, Number(raw.estConfidence) || 0)),
    explanation: text(raw.estExplanation),
    tip: text(raw.estTip),
  };
}

/** Valida a cidade vinda do app (inclui a moeda local, código ISO de 3 letras). */
export function parseCityContext(city: unknown): CityContext | undefined {
  if (!city || typeof city !== 'object') return undefined;
  const c = city as Partial<CityContext>;
  if (typeof c.name !== 'string') return undefined;
  return {
    name: c.name.slice(0, 80),
    state: String(c.state ?? '').slice(0, 80),
    country: String(c.country ?? '').slice(0, 80),
    currency: typeof c.currency === 'string' && /^[A-Z]{3}$/.test(c.currency) ? c.currency : 'BRL',
  };
}

export interface EstimateResult {
  status: number;
  body: PriceEstimate | { code: 'unavailable' | 'badRequest' | 'rateLimit' | 'failed'; error: string };
}

function parseRequest(body: unknown): EstimateRequest | null {
  if (!body || typeof body !== 'object') return null;
  const { item, city, language } = body as Partial<EstimateRequest>;
  if (typeof item !== 'string' || !item.trim() || item.length > 120) return null;
  const cityContext = parseCityContext(city);
  if (!cityContext) return null;
  return {
    item: item.trim(),
    city: cityContext,
    language: typeof language === 'string' && language in LANGUAGE_NAMES ? language : 'pt',
  };
}

/** Estimativa só por texto (exemplos do "Teste rápido" ou item já identificado). */
export async function estimatePrice(
  body: unknown,
  apiKey: string | undefined,
  models: string[],
  timeoutMs: number,
): Promise<EstimateResult> {
  if (!apiKey) return { status: 503, body: { code: 'unavailable', error: 'GEMINI_API_KEY não configurada.' } };
  const request = parseRequest(body);
  if (!request) return { status: 400, body: { code: 'badRequest', error: 'Pedido inválido.' } };

  const client = new GoogleGenAI({ apiKey });
  const prompt = `Você ajuda turistas a não pagar a mais no comércio de rua.${estimateInstructions(`"${request.item}"`, request.city, request.language)}`;
  let lastError: unknown;

  for (const model of [...new Set(models)]) {
    try {
      const interaction = await client.interactions.create(
        {
          model,
          input: prompt,
          response_format: {
            type: 'text',
            mime_type: 'application/json',
            schema: { type: 'object', properties: ESTIMATE_SCHEMA_PROPERTIES, required: ESTIMATE_REQUIRED },
          },
        },
        { timeout: timeoutMs, maxRetries: 0 },
      );
      const estimate = parseEstimate(JSON.parse(interaction.output_text ?? '{}') as Record<string, unknown>);
      if (!estimate) return { status: 422, body: { code: 'failed', error: 'A IA não conseguiu estimar.' } };
      return { status: 200, body: estimate };
    } catch (error) {
      lastError = error;
      const status = (error as { status?: number }).status;
      if (status !== undefined && status < 500 && status !== 429) break;
      console.warn(`[estimate] ${model} falhou (${status ?? 'timeout/rede'}): ${String((error as Error).message).slice(0, 200)}`);
    }
  }

  if ((lastError as { status?: number }).status === 429) {
    return { status: 429, body: { code: 'rateLimit', error: 'Limite gratuito do Gemini atingido.' } };
  }
  return { status: 502, body: { code: 'failed', error: 'Gemini falhou.' } };
}
