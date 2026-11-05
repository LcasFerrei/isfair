import { estimatePrice } from '../server/estimate';
import { DEFAULT_GEMINI_MODEL, FALLBACK_GEMINI_MODEL, REQUEST_TIMEOUT_MS } from '../server/identify';

/** Função serverless da Vercel: POST /api/estimate */
export async function POST(request: Request): Promise<Response> {
  const body = await request.json().catch(() => null);
  const result = await estimatePrice(
    body,
    process.env.GEMINI_API_KEY,
    [process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL, FALLBACK_GEMINI_MODEL],
    REQUEST_TIMEOUT_MS,
  );
  return Response.json(result.body, { status: result.status });
}
