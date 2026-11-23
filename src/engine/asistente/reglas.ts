// Reglas del asistente: deducen lo técnico (modalidad, Incoterm, tipo de carga) a partir de respuestas simples.
// Funciones puras: los umbrales y mapeos salen de config/asistente.

import { INCOTERM_POR_ENTREGA, UMBRALES_MODALIDAD, VIA_POR_URGENCIA } from '../../config/asistente/asistente.config';
import type { LugarEntrega, Urgencia, ViaTransporte } from '../../config/asistente/asistente.config';
import type { ContenedorId, TipoCarga } from '../../config/asistente/cubicaje.config';
import type { DistanciaRuta, Incoterm, Modalidad, Parametros, TarifaTentativa } from '../types';
import type { ResultadoCubicajeCafe } from './cubicajeCafe';

/** true cuando los kilos caen en el rango intermedio y hay que preguntar la urgencia */
export const preguntaUrgencia = (kg: number | null): boolean => kg != null && kg > UMBRALES_MODALIDAD.courierMaxKg && kg < UMBRALES_MODALIDAD.maritimoMinKg;

/** Vía según los kilos: ≤ 50 kg courier, ≥ 500 kg marítimo; en medio decide la urgencia. null = falta la urgencia. */
export function viaPorKilos(kg: number | null, urgencia: Urgencia | '' = ''): ViaTransporte | null {
  if (kg == null || !(kg > 0)) return null;
  if (kg <= UMBRALES_MODALIDAD.courierMaxKg) return 'COURIER';
  if (kg >= UMBRALES_MODALIDAD.maritimoMinKg) return 'MARITIMO';
  return urgencia ? VIA_POR_URGENCIA[urgencia] : null;
}

export function incotermPara(entrega: LugarEntrega | '', via: ViaTransporte | null): Incoterm | null {
  if (!entrega) return null;
  const m = INCOTERM_POR_ENTREGA[entrega];
  return via === 'MARITIMO' || via == null ? m.maritimo : m.noMaritimo;
}

export const MODALIDAD_MOTOR: Record<TipoCarga, Modalidad> = {
  COURIER: 'COURIER',
  AEREO: 'AEREA',
  LCL: 'MARITIMA_LCL',
  FCL: 'MARITIMA_FCL',
};

/** Distancia entre zonas con la misma regla del motor de costos */
export function tarifaRuta(params: Parametros, paisOrigen: string, paisDestino: string): { distancia: DistanciaRuta; tarifa: TarifaTentativa } | null {
  const ft = params.fleteTentativo;
  if (!ft) return null;
  const zo = ft.zonas[paisOrigen];
  const zd = ft.zonas[paisDestino];
  if (!zo || !zd) return null;
  const distancia: DistanciaRuta = zo === zd ? 'CORTA' : ft.rutasMedias.some(([a, b]) => (a === zo && b === zd) || (a === zd && b === zo)) ? 'MEDIA' : 'LARGA';
  return { distancia, tarifa: ft.porDistancia[distancia] };
}

export function costoFclUsd(params: Parametros, paisOrigen: string, paisDestino: string): Partial<Record<ContenedorId, number>> {
  const r = tarifaRuta(params, paisOrigen, paisDestino);
  return r ? (r.tarifa.fcl as Partial<Record<ContenedorId, number>>) : {};
}

export interface ComparacionLclFcl {
  lclUsd: number;
  cobrableWm: number;
  fclUsd: number;
  contenedorId: ContenedorId;
  cantidad: number;
  conviene: 'LCL' | 'FCL';
}

/** Flete internacional tentativo de ambas opciones, para mostrar la comparación cerca del umbral */
export function compararLclFcl(res: ResultadoCubicajeCafe, resFcl: ResultadoCubicajeCafe, params: Parametros, paisOrigen: string, paisDestino: string): ComparacionLclFcl | null {
  const r = tarifaRuta(params, paisOrigen, paisDestino);
  const elegido = resFcl.fcl?.elegido;
  if (!r || !elegido) return null;
  const precio = r.tarifa.fcl[elegido.contenedorId];
  if (precio == null) return null;
  const lclUsd = Math.max(r.tarifa.lclMin, r.tarifa.lclWm * res.wm.cobrable);
  const fclUsd = precio * elegido.cantidad;
  return { lclUsd, cobrableWm: res.wm.cobrable, fclUsd, contenedorId: elegido.contenedorId, cantidad: elegido.cantidad, conviene: lclUsd <= fclUsd ? 'LCL' : 'FCL' };
}
