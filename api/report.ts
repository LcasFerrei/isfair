import { submitReport } from '../server/reports.js';
import { clientIp } from '../server/supabaseAdmin.js';

/** Função serverless da Vercel: POST /api/report */
export async function POST(request: Request): Promise<Response> {
  const body = await request.json().catch(() => null);
  const result = await submitReport(body, clientIp(request.headers.get('x-forwarded-for')), process.env);
  return Response.json(result.body, { status: result.status });
}
