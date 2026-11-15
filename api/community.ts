import { communityStats } from '../server/reports';

/** Função serverless da Vercel: POST /api/community */
export async function POST(request: Request): Promise<Response> {
  const body = await request.json().catch(() => null);
  const result = await communityStats(body, process.env);
  return Response.json(result.body, { status: result.status });
}
