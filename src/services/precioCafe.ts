// Servicios de precio para el liquidador. Aislados para poder cambiar la fuente sin tocar la interfaz.

import { FUENTE_TRM, PRECIO_C_MANUAL } from '../config/asistente/precio.config';
import { PARAMS } from '../config/params';

export interface PrecioCafe {
  /** Centavos de USD por libra */
  centavosLb: number;
  fecha: string;
  fuente: string;
  manual: boolean;
}

export interface Trm {
  copPorUsd: number;
  fecha: string;
  fuente: string;
  enVivo: boolean;
}

/**
 * Precio del contrato C de café arábica.
 * TODO: conectar una fuente con licencia comercial (ver config/asistente/precio.config.ts). Mientras tanto
 * devuelve el valor manual editable.
 */
export async function getCoffeePrice(): Promise<PrecioCafe> {
  return { ...PRECIO_C_MANUAL, manual: true };
}

export const trmSemilla = (): Trm => ({ copPorUsd: PARAMS.fx.copPorUnidad.USD, fecha: PARAMS.fx.fecha, fuente: PARAMS.fx.fuente, enVivo: false });

/** TRM vigente desde datos abiertos de Colombia; si falla, la tasa semilla de los parámetros */
export async function getTrm(fetcher: typeof fetch = fetch): Promise<Trm> {
  const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = ctrl ? setTimeout(() => ctrl.abort(), FUENTE_TRM.timeoutMs) : null;
  try {
    const res = await fetcher(FUENTE_TRM.url, { signal: ctrl?.signal });
    if (!res.ok) return trmSemilla();
    const [fila] = (await res.json()) as Array<{ valor: string; vigenciadesde: string }>;
    const valor = Number(fila?.valor);
    if (!(valor > 0)) return trmSemilla();
    return { copPorUsd: valor, fecha: String(fila.vigenciadesde).slice(0, 10), fuente: 'TRM · Superintendencia Financiera (datos.gov.co)', enVivo: true };
  } catch {
    return trmSemilla();
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/** Liquidador: (contrato C + diferencial) en centavos/lb → pesos por libra */
export const precioLibraCop = (centavosC: number, diferencialCentavos: number, copPorUsd: number): number => ((centavosC + diferencialCentavos) / 100) * copPorUsd;
