// RN-OPE: lee la matriz de Incoterms de los parámetros. Aquí no hay ningún Incoterm escrito a mano.
import type { Incoterm, Modalidad, Parametros, Perspectiva, Tramo, TipoOperacion } from './types';

export const perspectivaDe = (tipo: TipoOperacion, params: Parametros): Perspectiva => params.perspectivas[tipo];

export function pagadorDe(tramo: Tramo | null, incoterm: Incoterm, params: Parametros): Perspectiva | null {
  return tramo ? (params.matrizIncoterms[incoterm]?.[tramo] ?? null) : null;
}

const MODOS_MARITIMOS: Modalidad[] = ['MARITIMA_FCL', 'MARITIMA_LCL', 'POR_EVALUAR'];

// RN-OPE-03: advierte y sugiere, no bloquea
export function advertenciaIncoterm(incoterm: Incoterm, modalidad: Modalidad, params: Parametros): boolean {
  return !!params.matrizIncoterms[incoterm]?.soloMaritimo && !MODOS_MARITIMOS.includes(modalidad);
}
