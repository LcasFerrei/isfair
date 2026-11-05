/** Moeda local de cada país (ISO 3166-1 → ISO 4217). Países fora da lista usam o dólar como referência. */
const EURO_COUNTRIES = [
  'AT', 'BE', 'CY', 'DE', 'EE', 'ES', 'FI', 'FR', 'GR', 'HR', 'IE', 'IT', 'LT', 'LU', 'LV', 'MT', 'NL', 'PT', 'SI', 'SK',
  // Usam o euro sem fazer parte da zona do euro
  'AD', 'MC', 'SM', 'VA', 'ME', 'XK',
];

const COUNTRY_CURRENCY: Record<string, string> = {
  ...Object.fromEntries(EURO_COUNTRIES.map((c) => [c, 'EUR'])),
  US: 'USD', PR: 'USD', EC: 'USD', SV: 'USD', PA: 'USD', TL: 'USD',
  BR: 'BRL', AR: 'ARS', CL: 'CLP', UY: 'UYU', PY: 'PYG', BO: 'BOB', PE: 'PEN', CO: 'COP', VE: 'VES',
  MX: 'MXN', CA: 'CAD', CR: 'CRC', DO: 'DOP', CU: 'CUP', GT: 'GTQ', JM: 'JMD',
  GB: 'GBP', CH: 'CHF', LI: 'CHF', NO: 'NOK', SE: 'SEK', DK: 'DKK', IS: 'ISK', PL: 'PLN', CZ: 'CZK', HU: 'HUF',
  RO: 'RON', BG: 'BGN', TR: 'TRY', RU: 'RUB', UA: 'UAH',
  JP: 'JPY', CN: 'CNY', HK: 'HKD', TW: 'TWD', KR: 'KRW', IN: 'INR', TH: 'THB', VN: 'VND', ID: 'IDR', MY: 'MYR',
  SG: 'SGD', PH: 'PHP',
  AE: 'AED', SA: 'SAR', QA: 'QAR', IL: 'ILS', JO: 'JOD', EG: 'EGP', MA: 'MAD', TN: 'TND', ZA: 'ZAR', KE: 'KES',
  AU: 'AUD', NZ: 'NZD',
};

export const FALLBACK_LOCAL_CURRENCY = 'USD';

export const localCurrencyFor = (countryCode: string) => COUNTRY_CURRENCY[countryCode] ?? FALLBACK_LOCAL_CURRENCY;
