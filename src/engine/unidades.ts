// Conversión de unidades y formato. Se usa solo en los bordes: la interfaz y los textos de alerta.

export type UnidadLongitud = 'cm' | 'm' | 'in';
export type Idioma = 'es' | 'en';

const MM_POR_UNIDAD: Record<UnidadLongitud, number> = { cm: 10, m: 1000, in: 25.4 };

export const aMm = (valor: number, unidad: UnidadLongitud): number => Math.round(valor * MM_POR_UNIDAD[unidad]);
export const desdeMm = (mm: number, unidad: UnidadLongitud): number => mm / MM_POR_UNIDAD[unidad];
export const kgAG = (kg: number): number => Math.round(kg * 1000);
export const gAKg = (g: number): number => g / 1000;
export const cm3AM3 = (cm3: number): number => cm3 / 1_000_000;

// Redondeo HALF_UP solo al presentar. toPrecision(15) limpia el ruido binario (1.005 → 1.01).
export function redondearHalfUp(valor: number, decimales: number): number {
  const factor = 10 ** decimales;
  const limpio = Number((Math.abs(valor) * factor).toPrecision(15));
  return (Math.sign(valor) * Math.floor(limpio + 0.5)) / factor;
}

export function formatoNumero(valor: number, decimales: number, idioma: Idioma = 'es'): string {
  return new Intl.NumberFormat(idioma === 'en' ? 'en-US' : 'es-CO', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  }).format(redondearHalfUp(valor, decimales));
}

export const decimalesMoneda = (moneda: string): number => (moneda === 'COP' ? 0 : 2);

export function formatoDinero(valor: number, moneda: string, idioma: Idioma = 'es'): string {
  return `${moneda} ${formatoNumero(valor, decimalesMoneda(moneda), idioma)}`;
}

export const formatoM3 = (cm3: number, idioma: Idioma = 'es'): string => `${formatoNumero(cm3AM3(cm3), 2, idioma)} m³`;
export const formatoKg = (g: number, idioma: Idioma = 'es'): string => `${formatoNumero(gAKg(g), 2, idioma)} kg`;
export const formatoPct = (fraccion: number, idioma: Idioma = 'es'): string => `${formatoNumero(fraccion * 100, 1, idioma)} %`;

// Lee lo que escribe el usuario. En español el punto separa miles y la coma los decimales,
// pero "12.5" se acepta como decimal: solo es de miles si le siguen exactamente tres dígitos.
export function leerNumero(texto: string, idioma: Idioma = 'es'): number | null {
  const s = texto.trim().replace(/\s/g, '');
  if (!s) return null;
  let normal: string;
  if (idioma === 'en') {
    normal = s.replace(/,/g, '');
  } else if (s.includes(',')) {
    normal = s.replace(/\./g, '').replace(',', '.');
  } else {
    normal = /^-?\d{1,3}(\.\d{3})+$/.test(s) ? s.replace(/\./g, '') : s;
  }
  const n = Number(normal);
  return Number.isFinite(n) ? n : null;
}

export function normalizarTexto(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();
}
