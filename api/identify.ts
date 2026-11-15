import { DEFAULT_GEMINI_MODEL, identifyProduct } from '../server/identify';
import { checkRateLimit } from '../server/rateLimit';
import { clientIp } from '../server/supabaseAdmin';

/** Função serverless da Vercel: POST /api/identify */
export async function POST(request: Request): Promise<Response> {
  const limited = await checkRateLimit('identify', clientIp(request.headers.get('x-forwarded-for')), process.env);
  if (limited) return Response.json(limited.body, { status: limited.status });
  const body = await request.json().catch(() => null);
  const result = await identifyProduct(
    body,
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL,
  );
  return Response.json(result.body, { status: result.status });
}
