import type { City, Consultation } from '../types';

type CuratedInput = Pick<City, 'id' | 'name' | 'state' | 'area' | 'priceFactor' | 'tip' | 'coords'>;

const curated = (c: CuratedInput): City => ({ ...c, country: 'Brasil', countryCode: 'BR', currency: 'BRL', curated: true });

/**
 * Cidades com faixas de preço e dicas próprias. `priceFactor` é relativo ao Rio de Janeiro (1).
 * Qualquer lugar a até CURATED_RADIUS_KM do centro de uma delas usa os dados dela.
 */
export const CURATED_CITIES: City[] = [
  curated({
    id: 'rio',
    name: 'Rio de Janeiro',
    state: 'RJ',
    area: 'Copacabana & Ipanema',
    priceFactor: 1,
    coords: [-22.9068, -43.1729],
    tip: 'Em Copacabana, as barracas numeradas na areia costumam ter cardápio com preço fixo — peça para ver antes de pedir.',
  }),
  curated({
    id: 'saopaulo',
    name: 'São Paulo',
    state: 'SP',
    area: 'Av. Paulista & Feira da Liberdade',
    priceFactor: 0.95,
    coords: [-23.5505, -46.6333],
    tip: 'Aos domingos a Av. Paulista fecha para carros e vira feira a céu aberto: compare 2 ou 3 barracas antes de comprar.',
  }),
  curated({
    id: 'salvador',
    name: 'Salvador',
    state: 'BA',
    area: 'Porto da Barra & Pelourinho',
    priceFactor: 0.85,
    coords: [-12.9777, -38.5016],
    tip: 'No Pelourinho, fitinhas do Bonfim oferecidas "de presente" costumam vir com pedido de pagamento depois. Recuse com educação se não quiser.',
  }),
  curated({
    id: 'fortaleza',
    name: 'Fortaleza',
    state: 'CE',
    area: 'Praia do Futuro & Beira-Mar',
    priceFactor: 0.8,
    coords: [-3.7319, -38.5267],
    tip: 'Na Praia do Futuro, algumas barracas grandes cobram consumação mínima. Pergunte antes de sentar.',
  }),
  curated({
    id: 'florianopolis',
    name: 'Florianópolis',
    state: 'SC',
    area: 'Jurerê, Lagoa & Centro',
    priceFactor: 1,
    coords: [-27.5954, -48.548],
    tip: 'Em Jurerê Internacional os preços são bem mais altos que no resto da ilha. Na Lagoa e no Centro a diferença é grande.',
  }),
  curated({
    id: 'recife',
    name: 'Recife',
    state: 'PE',
    area: 'Boa Viagem & Recife Antigo',
    priceFactor: 0.85,
    coords: [-8.0476, -34.877],
    tip: 'Em Boa Viagem, ambulantes vendem caldinho e queijo coalho com preço parecido entre si; desconfie se um cobrar muito acima.',
  }),
  curated({
    id: 'natal',
    name: 'Natal',
    state: 'RN',
    area: 'Ponta Negra & Via Costeira',
    priceFactor: 0.85,
    coords: [-5.7945, -35.211],
    tip: 'Em Ponta Negra, passeios de buggy e dromedário são vendidos na areia: combine o valor total e o roteiro antes de sair.',
  }),
  curated({
    id: 'maceio',
    name: 'Maceió',
    state: 'AL',
    area: 'Pajuçara & Ponta Verde',
    priceFactor: 0.85,
    coords: [-9.6658, -35.7353],
    tip: 'Os passeios de jangada para as piscinas naturais da Pajuçara têm tabela de preço — peça para ver na barraca oficial.',
  }),
  curated({
    id: 'joaopessoa',
    name: 'João Pessoa',
    state: 'PB',
    area: 'Tambaú & Cabo Branco',
    priceFactor: 0.8,
    coords: [-7.1195, -34.845],
    tip: 'A orla de Tambaú costuma ser mais barata que outras capitais do Nordeste; use isso como argumento ao negociar.',
  }),
  curated({
    id: 'portodegalinhas',
    name: 'Porto de Galinhas',
    state: 'PE',
    area: 'Vila & piscinas naturais',
    priceFactor: 1,
    coords: [-8.503, -35.005],
    tip: 'O passeio de jangada até as piscinas naturais tem preço tabelado pela associação local. Não pague a intermediários na areia.',
  }),
  curated({
    id: 'jericoacoara',
    name: 'Jericoacoara',
    state: 'CE',
    area: 'Vila & Duna do Pôr do Sol',
    priceFactor: 1.1,
    coords: [-2.793, -40.513],
    tip: 'Na vila quase tudo é mais caro por causa do acesso difícil. Dinheiro vivo ajuda: alguns lugares não aceitam cartão.',
  }),
  curated({
    id: 'portoseguro',
    name: 'Porto Seguro',
    state: 'BA',
    area: 'Passarela do Álcool & Taperapuã',
    priceFactor: 0.9,
    coords: [-16.4435, -39.0643],
    tip: 'Nas barracas grandes de Taperapuã, confira se há taxa de serviço ou de entrada antes de consumir.',
  }),
  curated({
    id: 'buzios',
    name: 'Búzios',
    state: 'RJ',
    area: 'Rua das Pedras & Geribá',
    priceFactor: 1.15,
    coords: [-22.7469, -41.8817],
    tip: 'Na Rua das Pedras os preços são de área nobre. Nas praias mais afastadas, como Geribá, ambulantes cobram menos.',
  }),
  curated({
    id: 'arraialdocabo',
    name: 'Arraial do Cabo',
    state: 'RJ',
    area: 'Praia dos Anjos & Prainhas',
    priceFactor: 1,
    coords: [-22.966, -42.027],
    tip: 'Os passeios de barco são vendidos no cais com muita concorrência: compare preços e o que está incluído.',
  }),
  curated({
    id: 'paraty',
    name: 'Paraty',
    state: 'RJ',
    area: 'Centro Histórico',
    priceFactor: 1.05,
    coords: [-23.2178, -44.7131],
    tip: 'No Centro Histórico, os carrinhos de doce e cachaça têm preço mais alto que nas ruas fora da área tombada.',
  }),
  curated({
    id: 'ilhabela',
    name: 'Ilhabela',
    state: 'SP',
    area: 'Vila & praias do sul',
    priceFactor: 1.1,
    coords: [-23.778, -45.358],
    tip: 'Leve repelente: os borrachudos são famosos e o repelente vendido nas praias custa bem mais caro.',
  }),
  curated({
    id: 'fozdoiguacu',
    name: 'Foz do Iguaçu',
    state: 'PR',
    area: 'Centro & Cataratas',
    priceFactor: 0.9,
    coords: [-25.5163, -54.5854],
    tip: 'Dentro do parque das Cataratas, comida e bebida custam bem mais. Vale levar água e lanche.',
  }),
  curated({
    id: 'gramado',
    name: 'Gramado',
    state: 'RS',
    area: 'Av. Borges de Medeiros & Lago Negro',
    priceFactor: 1.15,
    coords: [-29.379, -50.874],
    tip: 'Chocolates e fondue na avenida principal custam mais. Lojas de fábrica nas ruas paralelas costumam ser mais baratas.',
  }),
  curated({
    id: 'belohorizonte',
    name: 'Belo Horizonte',
    state: 'MG',
    area: 'Mercado Central & Savassi',
    priceFactor: 0.85,
    coords: [-19.9167, -43.9345],
    tip: 'No Mercado Central, queijos e cachaças variam bastante de banca para banca. Peça para provar e compare.',
  }),
  curated({
    id: 'brasilia',
    name: 'Brasília',
    state: 'DF',
    area: 'Torre de TV & Asa Sul',
    priceFactor: 0.95,
    coords: [-15.7939, -47.8828],
    tip: 'A Feira da Torre de TV funciona principalmente nos fins de semana e tem artesanato de todo o país; negocie em compras maiores.',
  }),
  curated({
    id: 'curitiba',
    name: 'Curitiba',
    state: 'PR',
    area: 'Largo da Ordem & Centro',
    priceFactor: 0.9,
    coords: [-25.4284, -49.2733],
    tip: 'A Feira do Largo da Ordem, aos domingos, é ótima para artesanato; os preços caem no fim da tarde.',
  }),
  curated({
    id: 'portoalegre',
    name: 'Porto Alegre',
    state: 'RS',
    area: 'Mercado Público & Redenção',
    priceFactor: 0.9,
    coords: [-30.0346, -51.2177],
    tip: 'No Brique da Redenção, aos domingos, artesãos aceitam negociar em compras de mais de uma peça.',
  }),
  curated({
    id: 'manaus',
    name: 'Manaus',
    state: 'AM',
    area: 'Centro & Ponta Negra',
    priceFactor: 0.9,
    coords: [-3.119, -60.0217],
    tip: 'Passeios no rio são vendidos por muitos intermediários no porto. Prefira agências registradas e confira o que está incluso.',
  }),
  curated({
    id: 'belem',
    name: 'Belém',
    state: 'PA',
    area: 'Ver-o-Peso & Estação das Docas',
    priceFactor: 0.8,
    coords: [-1.4558, -48.4902],
    tip: 'No Ver-o-Peso, açaí e frutas regionais são mais baratos cedo de manhã. Confira o peso e o preço por quilo.',
  }),
  curated({
    id: 'noronha',
    name: 'Fernando de Noronha',
    state: 'PE',
    area: 'Vila dos Remédios & praias',
    priceFactor: 1.6,
    coords: [-3.854, -32.424],
    tip: 'Na ilha quase tudo vem do continente, então os preços são altos por natureza. Compare, mas espere pagar mais.',
  }),
  curated({
    id: 'bonito',
    name: 'Bonito',
    state: 'MS',
    area: 'Centro & passeios',
    priceFactor: 1.05,
    coords: [-21.129, -56.488],
    tip: 'Os passeios têm preço tabelado e são vendidos por voucher único. Desconfie de ofertas muito abaixo da tabela.',
  }),
  curated({
    id: 'lencois',
    name: 'Lençóis (Chapada Diamantina)',
    state: 'BA',
    area: 'Centro & trilhas',
    priceFactor: 0.9,
    coords: [-12.563, -41.389],
    tip: 'Guias locais credenciados têm diária de referência; combine o valor por grupo, não por pessoa.',
  }),
];

/** Até essa distância do centro, um lugar usa os dados da cidade com dados locais. */
export const CURATED_RADIUS_KM = 30;

export const DEFAULT_CITY = CURATED_CITIES[0];

export const getCity = (id: string): City => CURATED_CITIES.find((c) => c.id === id) ?? DEFAULT_CITY;

/** Cidade de uma consulta; consultas antigas guardavam só o id. */
export const cityOf = (c: Consultation): City => c.city ?? getCity(c.cityId);

/** Nome do estado (como as APIs de mapa devolvem) → sigla. */
export const BRAZIL_STATES: Record<string, string> = {
  Acre: 'AC',
  Alagoas: 'AL',
  Amapá: 'AP',
  Amazonas: 'AM',
  Bahia: 'BA',
  Ceará: 'CE',
  'Distrito Federal': 'DF',
  'Espírito Santo': 'ES',
  Goiás: 'GO',
  Maranhão: 'MA',
  'Mato Grosso': 'MT',
  'Mato Grosso do Sul': 'MS',
  'Minas Gerais': 'MG',
  Pará: 'PA',
  Paraíba: 'PB',
  Paraná: 'PR',
  Pernambuco: 'PE',
  Piauí: 'PI',
  'Rio de Janeiro': 'RJ',
  'Rio Grande do Norte': 'RN',
  'Rio Grande do Sul': 'RS',
  Rondônia: 'RO',
  Roraima: 'RR',
  'Santa Catarina': 'SC',
  'São Paulo': 'SP',
  Sergipe: 'SE',
  Tocantins: 'TO',
};

/** Estimativa do nível de preço de rua por estado, relativa ao Rio (1). */
export const STATE_PRICE_FACTORS: Record<string, number> = {
  AC: 0.8, AL: 0.85, AP: 0.8, AM: 0.85, BA: 0.85, CE: 0.8, DF: 0.95, ES: 0.85, GO: 0.8,
  MA: 0.75, MT: 0.85, MS: 0.85, MG: 0.8, PA: 0.8, PB: 0.8, PR: 0.85, PE: 0.85, PI: 0.75,
  RJ: 0.95, RN: 0.85, RS: 0.85, RO: 0.8, RR: 0.8, SC: 0.95, SP: 0.9, SE: 0.8, TO: 0.75,
};
export const DEFAULT_BRAZIL_FACTOR = 0.85;

/**
 * Estimativa grosseira do nível de preços de cada país em relação ao Brasil, para converter as
 * faixas brasileiras em reais. Serve só de referência inicial até haver relatos locais.
 */
export const COUNTRY_PRICE_FACTORS: Record<string, number> = {
  AR: 1, BO: 0.7, CL: 1.2, CO: 0.9, EC: 0.9, PE: 0.9, PY: 0.8, UY: 1.6, VE: 0.8,
  MX: 1.1, CR: 1.3, CU: 0.9, DO: 1, PA: 1.2, US: 2.8, CA: 2.5,
  PT: 1.4, ES: 1.6, FR: 2.2, IT: 2, DE: 2.1, NL: 2.3, BE: 2.2, GB: 2.5, IE: 2.5, CH: 3.5,
  AT: 2.1, GR: 1.6, HR: 1.6, TR: 1, PL: 1.2, CZ: 1.4, SE: 2.3, NO: 2.8, DK: 2.6,
  JP: 1.8, KR: 1.8, CN: 1.2, TH: 0.8, VN: 0.6, ID: 0.7, IN: 0.5, AE: 2.2, IL: 2.5,
  ZA: 0.9, MA: 0.8, EG: 0.6, AU: 2.6, NZ: 2.4,
};
export const DEFAULT_COUNTRY_FACTOR = 1.5;
