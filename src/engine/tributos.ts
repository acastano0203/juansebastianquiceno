// RN-TRI: estimación de tributos de importación a Colombia. Nunca es una liquidación oficial.
import type { ReglaTributaria } from './types';

export type ResultadoTarifa =
  | { tipo: 'EXACTA' | 'UNICA'; regla: ReglaTributaria }
  | { tipo: 'RANGO'; minimo: number; maximo: number; ivaMinimo: number; ivaMaximo: number }
  | { tipo: 'SIN_TARIFA' };

// RN-TRI-03: subpartida de 10 dígitos exacta; con 4 a 8, la tarifa si es única o el rango si hay varias
export function buscarTarifaTributaria(partida: string, tabla: ReglaTributaria[]): ResultadoTarifa {
  const limpia = partida.replace(/\D/g, '');
  if (limpia.length < 4) return { tipo: 'SIN_TARIFA' };
  const exacta = tabla.find((r) => r.subpartida === limpia);
  if (exacta) return { tipo: 'EXACTA', regla: exacta };
  const coincidencias = tabla.filter((r) => r.subpartida.startsWith(limpia));
  if (!coincidencias.length) return { tipo: 'SIN_TARIFA' };
  const aranceles = coincidencias.map((r) => r.arancel);
  const ivas = coincidencias.map((r) => r.iva);
  const unica = new Set(aranceles).size === 1 && new Set(ivas).size === 1;
  if (unica) return { tipo: 'UNICA', regla: coincidencias[0] };
  return { tipo: 'RANGO', minimo: Math.min(...aranceles), maximo: Math.max(...aranceles), ivaMinimo: Math.min(...ivas), ivaMaximo: Math.max(...ivas) };
}

export interface EntradaTributos {
  baseCop: number;
  arancelPct: number;
  especificoCop?: number;
  otrosCop?: number;
  ivaPct: number;
}

// Arancel = Base × tarifa (+ específico). IVA = (Base + Arancel + Otros) × tarifa.
export function calcularTributos({ baseCop, arancelPct, especificoCop = 0, otrosCop = 0, ivaPct }: EntradaTributos): { arancelCop: number; ivaCop: number } {
  const arancelCop = baseCop * arancelPct + especificoCop;
  return { arancelCop, ivaCop: (baseCop + arancelCop + otrosCop) * ivaPct };
}

// RN-COS-05. CIF = (FOB + flete) ÷ (1 − 1,1 × t); prima = 1,1 × t × CIF, con prima mínima.
export function calcularSeguro(fobMasFlete: number, tasa: number, primaMinima: number): { prima: number; cif: number } {
  const cifPrevio = fobMasFlete / (1 - 1.1 * tasa);
  const prima = Math.max(1.1 * tasa * cifPrevio, primaMinima);
  return { prima, cif: fobMasFlete + prima };
}
