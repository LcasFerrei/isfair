import { submitReport } from '../server/reports';
import { clientIp } from '../server/supabaseAdmin';

/** Função serverless da Vercel: POST /api/report */
export async function POST(request: Request): Promise<Response> {
  const body = await request.json().catch(() => null);
  const result = await submitReport(body, clientIp(request.headers.get('x-forwarded-for')), process.env);
  return Response.json(result.body, { status: result.status });
}
