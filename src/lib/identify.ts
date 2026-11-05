import type { CityContext, IdentifyErrorCode, IdentifyResponse } from '../types';

const MAX_SIDE_PX = 1024;
const JPEG_QUALITY = 0.8;

/** Reduz a foto (celulares geram 5–12 MB) para economizar banda e tokens. */
async function compressImage(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE_PX / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL('image/jpeg', JPEG_QUALITY).split(',')[1];
}

/** Código de erro traduzível (identify.<code>) */
export type IdentifyFailure = IdentifyErrorCode | 'offline';

/**
 * Envia a foto para o backend, que consulta o Gemini. `language` é o idioma da descrição.
 * Em caso de falha, lança Error cuja mensagem é um IdentifyFailure.
 */
export async function identifyPhoto(file: File, language: string, city: CityContext): Promise<IdentifyResponse> {
  const image = await compressImage(file);
  let response: Response;
  try {
    response = await fetch('/api/identify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image, mimeType: 'image/jpeg', language, city }),
    });
  } catch {
    throw new Error('offline' satisfies IdentifyFailure);
  }
  const data = (await response.json().catch(() => null)) as (IdentifyResponse & { code?: IdentifyErrorCode }) | null;
  if (!response.ok || !data) throw new Error(data?.code ?? ('failed' satisfies IdentifyFailure));
  return data;
}
