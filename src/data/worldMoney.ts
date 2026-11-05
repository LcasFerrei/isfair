import type { CoinMetal, Denomination } from '../types';

/*
 * Cédulas e moedas das séries em circulação de cada país (sem o real, o dólar e o euro, em money.ts).
 * Tamanhos em mm conforme os bancos centrais; cores = tom predominante da cédula.
 * label: retrato ou motivo da cédula (aparece como legenda na carteira).
 */

type NoteRow = [value: number, width: number, height: number, paper: string, ink: string, emoji: string, label?: string];
type CoinRow = [value: number, diameter: number, metal: CoinMetal, label?: string];

export interface MoneyTable {
  notes: Denomination[];
  coins: Denomination[];
}

function table(issuer: string, words: (value: number) => string, notes: NoteRow[], coins: CoinRow[]): MoneyTable {
  return {
    notes: notes.map(([value, w, h, paper, ink, emoji, label = '']) => ({
      value,
      kind: 'note',
      label,
      words: words(value),
      emoji,
      size: [w, h],
      paper,
      ink,
      issuer,
    })),
    coins: coins.map(([value, d, metal, label = '']) => ({
      value,
      kind: 'coin',
      label,
      words: words(value),
      size: [d, d],
      metal,
    })),
  };
}

const cents = (unit: string, cent: string) => (value: number) => (value < 1 ? cent : unit);

export const WORLD_MONEY = {
  GBP: table(
    'BANK OF ENGLAND',
    (v) => (v >= 1 ? (v === 1 ? 'ONE POUND' : 'POUNDS') : 'PENCE'),
    [
      [5, 125, 65, '#D8ECEA', '#2E7F7A', '🎩', 'Winston Churchill'],
      [10, 132, 69, '#F4E1CC', '#B8611E', '📚', 'Jane Austen'],
      [20, 139, 73, '#E6DDEC', '#68437F', '🎨', 'J. M. W. Turner'],
      [50, 146, 77, '#F2D9D9', '#A5333A', '💻', 'Alan Turing'],
    ],
    [
      [2, 28.4, 'bimetal'],
      [1, 23.43, 'bimetal'],
      [0.5, 27.3, 'silver'],
      [0.2, 21.4, 'silver'],
      [0.1, 24.5, 'silver'],
      [0.05, 18, 'silver'],
      [0.02, 25.9, 'copper'],
      [0.01, 20.3, 'copper'],
    ],
  ),
  // As moedas de peso quase não circulam: a carteira usa só as cédulas
  ARS: table(
    'BANCO CENTRAL DE LA REPÚBLICA ARGENTINA',
    () => 'PESOS',
    [
      [100, 155, 65, '#E7DDEB', '#6E4482', '🦌', 'Taruca'],
      [200, 155, 65, '#DCE6EE', '#3D6585', '🐋', 'Ballena franca austral'],
      [500, 155, 65, '#DDEAD9', '#3E7A45', '🐆', 'Yaguareté'],
      [1000, 155, 65, '#F1E1CC', '#A8611F', '🐦', 'Hornero'],
      [2000, 155, 65, '#F1DCDF', '#9E3B4F', '🩺', 'Ramón Carrillo · Cecilia Grierson'],
      [10000, 155, 65, '#DCE3F1', '#34508F', '🏛️', 'Manuel Belgrano'],
      [20000, 155, 65, '#EDE4D3', '#7A5C2E', '🏛️', 'Juan Bautista Alberdi'],
    ],
    [],
  ),
  CLP: table(
    'BANCO CENTRAL DE CHILE',
    () => 'PESOS',
    [
      [1000, 120, 70, '#DDE9E6', '#2D6E66', '🏔️', 'Ignacio Carrera Pinto'],
      [2000, 127, 70, '#E7DDEB', '#6A4380', '🌳', 'Manuel Rodríguez'],
      [5000, 134, 70, '#F1DCE0', '#A23A55', '🌺', 'Gabriela Mistral'],
      [10000, 141, 70, '#D9E3F1', '#2F5597', '🦅', 'Arturo Prat'],
      [20000, 148, 70, '#F3E2CC', '#B8691E', '🌵', 'Andrés Bello'],
    ],
    [
      [500, 26, 'bimetal'],
      [100, 23.5, 'bimetal'],
      [50, 25, 'gold'],
      [10, 21, 'gold'],
    ],
  ),
  UYU: table(
    'BANCO CENTRAL DEL URUGUAY',
    () => 'PESOS URUGUAYOS',
    [
      [20, 140, 70, '#DDE9E2', '#2F7255', '📜', 'Juan Zorrilla de San Martín'],
      [50, 140, 70, '#DDE3EF', '#3A5794', '📚', 'José Pedro Varela'],
      [100, 140, 70, '#F1DADD', '#A43846', '🎻', 'Eduardo Fabini'],
      [200, 140, 70, '#F0E3CF', '#A36A28', '🎨', 'Pedro Figari'],
      [500, 140, 70, '#E3E1EE', '#4E4A8A', '🏛️', 'Alfredo Vásquez Acevedo'],
      [1000, 140, 70, '#E9DDEB', '#7A4685', '📖', 'Juana de Ibarbourou'],
      [2000, 140, 70, '#F1E8CC', '#8C7322', '🌿', 'Dámaso Antonio Larrañaga'],
    ],
    [
      [50, 28, 'bimetal'],
      [10, 26.5, 'gold'],
      [5, 24.5, 'gold'],
      [2, 22.5, 'gold'],
      [1, 20.5, 'gold'],
    ],
  ),
  PYG: table(
    'BANCO CENTRAL DEL PARAGUAY',
    () => 'GUARANÍES',
    [
      [2000, 145, 70, '#F1DCE5', '#A13D6E', '📖', 'Adela y Celsa Speratti'],
      [5000, 150, 70, '#F3E0CC', '#B05F1F', '🏛️', 'Carlos Antonio López'],
      [10000, 155, 70, '#F0D9D9', '#9E3036', '🏛️', 'José Gaspar Rodríguez de Francia'],
      [20000, 155, 70, '#D9E3F1', '#2F5597', '👩', 'Mujer paraguaya'],
      [50000, 160, 70, '#E9E4D1', '#7A6A2A', '🎸', 'Agustín Pío Barrios'],
      [100000, 160, 70, '#DDEBDC', '#3B7A43', '⛪', 'San Roque González de Santa Cruz'],
    ],
    [
      [1000, 26, 'gold'],
      [500, 24, 'silver'],
      [100, 21, 'gold'],
      [50, 19, 'silver'],
    ],
  ),
  BOB: table(
    'BANCO CENTRAL DE BOLIVIA',
    cents('BOLIVIANOS', 'CENTAVOS'),
    [
      [10, 131, 69, '#D9E5F1', '#2E5C94', '🏔️'],
      [20, 135, 69, '#F3E2CC', '#B3651E', '🦜'],
      [50, 140, 69, '#E7DDEB', '#6C4383', '🌺'],
      [100, 147, 69, '#F1D9D9', '#A0333A', '🌵'],
      [200, 152, 69, '#ECE1D4', '#7A5530', '🦙'],
    ],
    [
      [5, 27, 'bimetal'],
      [2, 29, 'silver'],
      [1, 27, 'silver'],
      [0.5, 24, 'silver'],
      [0.2, 22, 'silver'],
      [0.1, 19, 'silver'],
    ],
  ),
  PEN: table(
    'BANCO CENTRAL DE RESERVA DEL PERÚ',
    cents('SOLES', 'CÉNTIMOS'),
    [
      [10, 140, 65, '#DDEBDC', '#3A7A44', '🎶'],
      [20, 145, 65, '#F3E2CC', '#B3651E', '📖'],
      [50, 150, 65, '#F1DCE3', '#A03E63', '🏺'],
      [100, 155, 65, '#D9E3F1', '#2F5597', '🚀'],
      [200, 160, 65, '#E9DDEB', '#76457F', '🎨'],
    ],
    [
      [5, 24.5, 'bimetal'],
      [2, 22.2, 'bimetal'],
      [1, 25.5, 'silver'],
      [0.5, 22, 'gold'],
      [0.2, 21, 'gold'],
      [0.1, 20.5, 'gold'],
    ],
  ),
  COP: table(
    'BANCO DE LA REPÚBLICA',
    () => 'PESOS',
    [
      [2000, 128, 66, '#DDE7EE', '#36687F', '🎨', 'Débora Arango'],
      [5000, 133, 66, '#ECE1D4', '#7A5530', '📜', 'José Asunción Silva'],
      [10000, 138, 66, '#F1DADA', '#A23A3A', '📷', 'Virginia Gutiérrez'],
      [20000, 143, 66, '#DDEBDC', '#3B7A43', '🏛️', 'Alfonso López Michelsen'],
      [50000, 148, 66, '#E9DDEB', '#76457F', '🦋', 'Gabriel García Márquez'],
      [100000, 153, 66, '#D9E3F1', '#2F5597', '🏛️', 'Carlos Lleras Restrepo'],
    ],
    [
      [1000, 26.7, 'bimetal'],
      [500, 23.7, 'bimetal'],
      [200, 24.4, 'silver'],
      [100, 20.3, 'gold'],
      [50, 17, 'silver'],
    ],
  ),
  CAD: table(
    'BANK OF CANADA · BANQUE DU CANADA',
    (v) => (v >= 1 ? 'DOLLARS' : 'CENTS'),
    [
      [5, 152.4, 69.85, '#D9E5F1', '#2E5C94', '🍁', 'Wilfrid Laurier'],
      [10, 152.4, 69.85, '#E7DDEB', '#6A4380', '⚖️', 'Viola Desmond'],
      [20, 152.4, 69.85, '#DDEBDC', '#3A7A44', '🍁', 'Elizabeth II'],
      [50, 152.4, 69.85, '#F1D9D9', '#A0333A', '🍁', 'W. L. Mackenzie King'],
      [100, 152.4, 69.85, '#EDE2D2', '#8A5A2B', '🍁', 'Robert Borden'],
    ],
    [
      [2, 28, 'bimetalInverse', 'Toonie'],
      [1, 26.5, 'gold', 'Loonie'],
      [0.25, 23.88, 'silver', 'Quarter'],
      [0.1, 18.03, 'silver', 'Dime'],
      [0.05, 21.2, 'silver', 'Nickel'],
    ],
  ),
  MXN: table(
    'BANCO DE MÉXICO',
    cents('PESOS', 'CENTAVOS'),
    [
      [20, 120, 65, '#DCEBE3', '#2C7A5C', '🐊', 'Cocodrilo'],
      [50, 127, 65, '#F1DCE8', '#A03C78', '🦎', 'Ajolote'],
      [100, 134, 65, '#F1D9D9', '#A0333A', '🦋', 'Mariposa monarca'],
      [200, 141, 65, '#DDEBDC', '#3A7A44', '🦅', 'Águila real'],
      [500, 148, 65, '#D9E3F1', '#2F5597', '🐋', 'Ballena gris'],
      [1000, 155, 65, '#E9DDEB', '#6E4482', '🐆', 'Jaguar'],
    ],
    [
      [20, 32, 'bimetal'],
      [10, 28, 'bimetal'],
      [5, 25.5, 'bimetal'],
      [2, 23, 'bimetal'],
      [1, 21, 'bimetal'],
      [0.5, 17, 'silver'],
    ],
  ),
  CHF: table(
    'SCHWEIZERISCHE NATIONALBANK',
    (v) => (v >= 1 ? 'FRANKEN' : 'RAPPEN'),
    [
      [10, 126, 70, '#F5E9C4', '#B08A12', '🕰️'],
      [20, 133, 70, '#F2D9D9', '#B0353D', '💡'],
      [50, 140, 70, '#DDEBD5', '#4C8A2F', '🪂'],
      [100, 147, 70, '#D9E3F1', '#2F5597', '💧'],
      [200, 154, 70, '#EEE0D2', '#8A4F23', '⚛️'],
      [1000, 161, 70, '#E7DDEB', '#6A4380', '🗣️'],
    ],
    [
      [5, 31.45, 'silver'],
      [2, 27.4, 'silver'],
      [1, 23.2, 'silver'],
      [0.5, 18.2, 'silver'],
      [0.2, 21.05, 'silver'],
      [0.1, 19.15, 'silver'],
      [0.05, 17.15, 'gold'],
    ],
  ),
  AUD: table(
    'RESERVE BANK OF AUSTRALIA',
    (v) => (v >= 1 ? 'DOLLARS' : 'CENTS'),
    [
      [5, 130, 65, '#ECDCEB', '#8A4486', '🦘'],
      [10, 137, 65, '#D9E7F3', '#2E6A9E', '📜', 'Banjo Paterson'],
      [20, 144, 65, '#F3D9D6', '#B0403A', '⛵', 'Mary Reibey'],
      [50, 151, 65, '#F5EBC4', '#A88512', '📖', 'David Unaipon'],
      [100, 158, 65, '#DDEBDC', '#3A7A44', '🎵', 'Nellie Melba'],
    ],
    [
      [2, 20.5, 'gold'],
      [1, 25, 'gold'],
      [0.5, 31.65, 'silver'],
      [0.2, 28.65, 'silver'],
      [0.1, 23.6, 'silver'],
      [0.05, 19.41, 'silver'],
    ],
  ),
  CNY: table(
    '中国人民银行',
    (v) => (v >= 1 ? 'YUAN 元' : 'JIAO 角'),
    [
      [1, 130, 63, '#E6E9D5', '#5E6B2C', '🏞️', '毛泽东 Mao Zedong'],
      [5, 135, 63, '#E7DDEB', '#6A4380', '⛰️', '毛泽东 Mao Zedong'],
      [10, 140, 70, '#D9E3F1', '#2F5597', '🏞️', '毛泽东 Mao Zedong'],
      [20, 145, 70, '#ECE1D4', '#7A5530', '⛰️', '毛泽东 Mao Zedong'],
      [50, 150, 70, '#DDEBDC', '#3A7A44', '🏯', '毛泽东 Mao Zedong'],
      [100, 155, 77, '#F2D6D6', '#B02A31', '🏛️', '毛泽东 Mao Zedong'],
    ],
    [
      [1, 22.25, 'silver'],
      [0.5, 20.5, 'gold'],
      [0.1, 19, 'silver'],
    ],
  ),
  JPY: table(
    '日本銀行 NIPPON GINKO',
    () => 'YEN 円',
    [
      [1000, 150, 76, '#D9E3F1', '#2F5597', '🌊', '北里柴三郎 Kitasato Shibasaburō'],
      [5000, 156, 76, '#E7DDEB', '#6A4380', '🌸', '津田梅子 Tsuda Umeko'],
      [10000, 160, 76, '#ECE1D4', '#7A5530', '🚉', '渋沢栄一 Shibusawa Eiichi'],
    ],
    [
      [500, 26.5, 'gold'],
      [100, 22.6, 'silver'],
      [50, 21, 'silver'],
      [10, 23.5, 'copper'],
      [5, 22, 'gold'],
      [1, 20, 'silver'],
    ],
  ),
  KRW: table(
    '한국은행 BANK OF KOREA',
    () => 'WON 원',
    [
      [1000, 136, 68, '#D9E3F1', '#2F5597', '🌸', '이황 Yi Hwang'],
      [5000, 142, 68, '#F3E0CC', '#B05F1F', '🍉', '이이 Yi I'],
      [10000, 148, 68, '#DDEBDC', '#3A7A44', '🔭', '세종대왕 Sejong'],
      [50000, 154, 68, '#F5EBC4', '#A88512', '🎋', '신사임당 Shin Saimdang'],
    ],
    [
      [500, 26.5, 'silver'],
      [100, 24, 'silver'],
      [50, 21.6, 'silver'],
      [10, 18, 'copper'],
    ],
  ),
  INR: table(
    'RESERVE BANK OF INDIA',
    () => 'RUPEES',
    [
      [10, 123, 63, '#EDE2D4', '#7E5428', '🛕', 'Mahatma Gandhi'],
      [20, 129, 63, '#EEF0CF', '#6E7A1E', '🏛️', 'Mahatma Gandhi'],
      [50, 135, 66, '#D6ECEF', '#21808C', '🛕', 'Mahatma Gandhi'],
      [100, 142, 66, '#E6E0EF', '#5E4C8A', '🏞️', 'Mahatma Gandhi'],
      [200, 146, 66, '#F6EBC4', '#A8801A', '🛕', 'Mahatma Gandhi'],
      [500, 150, 66, '#E3E3DF', '#5E615A', '🏰', 'Mahatma Gandhi'],
    ],
    [
      [20, 27, 'bimetal'],
      [10, 27, 'bimetal'],
      [5, 23, 'gold'],
      [2, 23, 'silver'],
      [1, 20, 'silver'],
    ],
  ),
  ILS: table(
    'בנק ישראל BANK OF ISRAEL',
    (v) => (v >= 1 ? 'SHEQALIM' : 'AGOROT'),
    [
      [20, 129, 71, '#F1D9D9', '#A0333A', '🌴', 'Rachel'],
      [50, 136, 71, '#DDEBDC', '#3A7A44', '🍋', 'Shaul Tchernichovsky'],
      [100, 143, 71, '#F3E2CC', '#B3651E', '🦌', 'Leah Goldberg'],
      [200, 150, 71, '#D9E3F1', '#2F5597', '🌹', 'Natan Alterman'],
    ],
    [
      [10, 23, 'bimetal'],
      [5, 24, 'silver'],
      [2, 21.6, 'silver'],
      [1, 18, 'silver'],
      [0.5, 26, 'gold'],
      [0.1, 22, 'gold'],
    ],
  ),
} satisfies Record<string, MoneyTable>;
