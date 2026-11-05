import type { CurrencyCode } from '../types';

export type Lang = 'pt-BR' | 'en' | 'es' | 'fr' | 'it' | 'ar' | 'zh' | 'ja';

export type ProductId =
  | 'coco' | 'caipirinha' | 'queijo' | 'canga' | 'milho' | 'acai' | 'cerveja' | 'picole' | 'biscoito'
  | 'pulseira' | 'oculos' | 'chapeu' | 'protetor' | 'cadeira' | 'chinelo' | 'agua' | 'refrigerante' | 'caldo'
  | 'pastel' | 'tapioca' | 'acaraje' | 'espetinho' | 'castanha' | 'ima' | 'camiseta';

export type CuratedCityId =
  | 'rio' | 'saopaulo' | 'salvador' | 'fortaleza' | 'florianopolis' | 'recife' | 'natal' | 'maceio' | 'joaopessoa'
  | 'portodegalinhas' | 'jericoacoara' | 'portoseguro' | 'buzios' | 'arraialdocabo' | 'paraty' | 'ilhabela'
  | 'fozdoiguacu' | 'gramado' | 'belohorizonte' | 'brasilia' | 'curitiba' | 'portoalegre' | 'manaus' | 'belem'
  | 'noronha' | 'bonito' | 'lencois';

export type NoteValue = 2 | 5 | 10 | 20 | 50 | 100 | 200;

export interface ProductText {
  name: string;
  short: string;
  unit: string;
  /** Mesma quantidade e ordem das dicas do produto em mockData */
  tips: string[];
}

/** Conteúdo (não interface) traduzido por idioma */
export interface Content {
  products: Record<ProductId, ProductText>;
  cityTips: Record<CuratedCityId, string>;
  currencies: Record<CurrencyCode, string>;
  animals: Record<NoteValue, string>;
}
