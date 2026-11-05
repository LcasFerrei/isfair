import {
  BRAZIL_STATES,
  COUNTRY_PRICE_FACTORS,
  CURATED_CITIES,
  CURATED_RADIUS_KM,
  DEFAULT_BRAZIL_FACTOR,
  DEFAULT_COUNTRY_FACTOR,
  STATE_PRICE_FACTORS,
} from '../data/cities';
import { localCurrencyFor } from '../data/worldCurrencies';
import type { City } from '../types';

/** Um lugar vindo da busca ou do GPS, antes de virar uma City do app. */
export interface Place {
  name: string;
  /** Estado/província, por extenso */
  region: string;
  /** Sigla quando a API já devolve (ex.: "RJ") */
  regionCode?: string;
  country: string;
  countryCode: string;
  coords: [number, number];
}

function haversineKm([lat1, lng1]: [number, number], [lat2, lng2]: [number, number]) {
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const a =
    Math.sin(rad(lat2 - lat1) / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lng2 - lng1) / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function nearestCurated(coords: [number, number]) {
  return CURATED_CITIES.map((city) => ({ city, distanceKm: haversineKm(coords, city.coords) })).reduce((best, item) =>
    item.distanceKm < best.distanceKm ? item : best,
  );
}

const slug = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

/** Converte um lugar em City: usa os dados locais se estiver perto de uma cidade conhecida, senão estima. */
export function resolvePlace(place: Place): City {
  const near = nearestCurated(place.coords);
  if (near.distanceKm <= CURATED_RADIUS_KM) return near.city;

  const inBrazil = place.countryCode === 'BR';
  const uf = place.regionCode ?? BRAZIL_STATES[place.region];
  const priceFactor = inBrazil
    ? (uf && STATE_PRICE_FACTORS[uf]) || DEFAULT_BRAZIL_FACTOR
    : COUNTRY_PRICE_FACTORS[place.countryCode] ?? DEFAULT_COUNTRY_FACTOR;

  return {
    id: `geo:${place.countryCode}:${slug(place.region)}:${slug(place.name)}`,
    name: place.name,
    state: inBrazil ? uf ?? place.region : place.region,
    country: place.country,
    countryCode: place.countryCode,
    currency: localCurrencyFor(place.countryCode),
    // Área e dica de cidades estimadas são montadas na tradução (i18n: cityArea/cityTip)
    area: '',
    priceFactor,
    coords: place.coords,
    curated: false,
    tip: '',
  };
}

interface OpenMeteoResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  feature_code?: string;
  country_code?: string;
  country?: string;
  admin1?: string;
}

/** Busca cidades no mundo todo (Open-Meteo Geocoding: grátis, sem chave). */
export async function searchCities(query: string, language: string, signal?: AbortSignal): Promise<City[]> {
  const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
  url.search = new URLSearchParams({ name: query, count: '10', language, format: 'json' }).toString();
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error('Busca indisponível no momento.');
  const data = (await response.json()) as { results?: OpenMeteoResult[] };

  const seen = new Set<string>();
  return (data.results ?? [])
    .filter((r) => r.feature_code?.startsWith('PPL') && r.country_code)
    .map((r) =>
      resolvePlace({
        name: r.name,
        region: r.admin1 ?? '',
        country: r.country ?? r.country_code!,
        countryCode: r.country_code!,
        coords: [r.latitude, r.longitude],
      }),
    )
    .filter((city) => !seen.has(city.id) && seen.add(city.id));
}

/** Coordenada → lugar (BigDataCloud, endpoint gratuito para uso no navegador). */
async function reverseGeocode(coords: [number, number], language: string): Promise<Place> {
  const url = new URL('https://api.bigdatacloud.net/data/reverse-geocode-client');
  url.search = new URLSearchParams({
    latitude: String(coords[0]),
    longitude: String(coords[1]),
    localityLanguage: language,
  }).toString();
  const response = await fetch(url);
  if (!response.ok) throw new Error('reverse geocode falhou');
  const data = (await response.json()) as {
    locality?: string;
    city?: string;
    principalSubdivision?: string;
    principalSubdivisionCode?: string;
    countryName?: string;
    countryCode?: string;
  };
  const code = data.principalSubdivisionCode?.split('-')[1];
  return {
    name: data.locality || data.city || '—',
    region: data.principalSubdivision ?? '',
    regionCode: data.countryCode === 'BR' ? code : undefined,
    country: data.countryName ?? data.countryCode ?? '',
    countryCode: data.countryCode ?? '',
    coords,
  };
}

/** Erros de localização: a mensagem é a chave de tradução (geo.*). */
export type GeoErrorKey = 'geo.insecure' | 'geo.unsupported' | 'geo.denied' | 'geo.unavailable' | 'geo.timeout';

const GEO_ERRORS: Record<number, GeoErrorKey> = { 1: 'geo.denied', 2: 'geo.unavailable', 3: 'geo.timeout' };

function currentPosition(): Promise<[number, number]> {
  if (!window.isSecureContext) {
    return Promise.reject(new Error('geo.insecure' satisfies GeoErrorKey));
  }
  if (!('geolocation' in navigator)) {
    return Promise.reject(new Error('geo.unsupported' satisfies GeoErrorKey));
  }
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve([pos.coords.latitude, pos.coords.longitude]),
      (err) => reject(new Error(GEO_ERRORS[err.code] ?? 'geo.unavailable')),
      // Precisão de cidade basta: rede/Wi-Fi responde rápido e gasta menos bateria
      { enableHighAccuracy: false, timeout: 15_000, maximumAge: 10 * 60_000 },
    );
  });
}

/** Pede a posição ao navegador e devolve a cidade em que o turista está. Lança Error cuja mensagem é uma GeoErrorKey. */
export async function locateCity(language: string): Promise<City> {
  const coords = await currentPosition();
  try {
    return resolvePlace(await reverseGeocode(coords, language));
  } catch {
    // Sem internet para o nome da cidade: usa a cidade com dados locais mais próxima
    return nearestCurated(coords).city;
  }
}
