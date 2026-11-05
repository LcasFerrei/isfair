import { formatMoney } from './format';

/** Frase para pedir desconto ao vendedor, no idioma falado na cidade (não no idioma do app). */
export interface NegotiationPhrase {
  text: string;
  /** Idioma da frase, para o leitor de tela pronunciar certo */
  lang: string;
}

type Builder = (n: number) => string;

const EURO: Record<string, [string, Builder]> = {
  PT: ['pt-PT', (n) => `Faz por ${n} euros?`],
  ES: ['es-ES', (n) => `¿Me lo deja en ${n} euros?`],
  FR: ['fr-FR', (n) => `Vous me le faites à ${n} euros ?`],
  BE: ['fr-BE', (n) => `Vous me le faites à ${n} euros ?`],
  LU: ['fr-LU', (n) => `Vous me le faites à ${n} euros ?`],
  IT: ['it-IT', (n) => `Me lo fa a ${n} euro?`],
  DE: ['de-DE', (n) => `Geht's für ${n} Euro?`],
  AT: ['de-AT', (n) => `Geht's für ${n} Euro?`],
  NL: ['nl-NL', (n) => `Kan het voor ${n} euro?`],
  GR: ['el-GR', (n) => `Μου το αφήνετε ${n} ευρώ;`],
};

const BY_COUNTRY: Record<string, [string, Builder]> = {
  BR: ['pt-BR', (n) => `Faz por ${n} reais?`],
  US: ['en-US', (n) => `Can you do it for ${n} dollars?`],
  GB: ['en-GB', (n) => `Can you do it for ${n} pounds?`],
  MX: ['es-MX', (n) => `¿Me lo deja en ${n} pesos?`],
  AR: ['es-AR', (n) => `¿Me lo dejás en ${n} pesos?`],
  CL: ['es-CL', (n) => `¿Me lo deja en ${n} pesos?`],
  CO: ['es-CO', (n) => `¿Me lo deja en ${n} pesos?`],
  UY: ['es-UY', (n) => `¿Me lo deja en ${n} pesos?`],
  PE: ['es-PE', (n) => `¿Me lo deja en ${n} soles?`],
  PY: ['es-PY', (n) => `¿Me lo deja en ${n} guaraníes?`],
  BO: ['es-BO', (n) => `¿Me lo deja en ${n} bolivianos?`],
  CA: ['en-CA', (n) => `Can you do it for ${n} dollars?`],
  AU: ['en-AU', (n) => `Can you do it for ${n} dollars?`],
  CH: ['de-CH', (n) => `Geht's für ${n} Franken?`],
  KR: ['ko-KR', (n) => `${n}원에 해 주실 수 있어요?`],
  IN: ['en-IN', (n) => `Can you do it for ${n} rupees?`],
  IL: ['he-IL', (n) => `אפשר ב-${n} שקל?`],
  JP: ['ja-JP', (n) => `${n}円になりませんか？`],
  CN: ['zh-CN', (n) => `${n}块可以吗？`],
  ...EURO,
};

export function negotiationPhrase(countryCode: string, amount: number, currency: string): NegotiationPhrase {
  const entry = BY_COUNTRY[countryCode];
  if (entry) return { lang: entry[0], text: `“${entry[1](amount)}”` };
  // Sem frase local: inglês, que o vendedor de área turística costuma entender
  return { lang: 'en', text: `“Can you do it for ${formatMoney(amount, currency)}?”` };
}
