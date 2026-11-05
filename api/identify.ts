import { DEFAULT_GEMINI_MODEL, identifyProduct } from '../server/identify';

/** Função serverless da Vercel: POST /api/identify */
export async function POST(request: Request): Promise<Response> {
  const body = await request.json().catch(() => null);
  const result = await identifyProduct(
    body,
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL,
  );
  return Response.json(result.body, { status: result.status });
}
