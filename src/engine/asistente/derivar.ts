// Convierte las respuestas del asistente en la Simulacion que ya entiende el motor de costos.
// El usuario nunca escribe modalidad, Incoterm ni partida: se deducen aquí.

import { COSTOS_LOCALES_TENTATIVOS, PAIS_ORIGEN, PRECIO } from '../../config/asistente/asistente.config';
import type { LugarEntrega, LugarRecogida, Urgencia, ViaTransporte } from '../../config/asistente/asistente.config';
import { ALTURA_MAX_PALLET_MM, CONTENEDORES, EMPAQUES, FACTOR_VOLUMETRICO, PALLETS } from '../../config/asistente/cubicaje.config';
import type { ContenedorId, EmpaqueId, TipoCarga } from '../../config/asistente/cubicaje.config';
import { partidaPorCodigo } from '../../config/asistente/partidas';
import { PRECIO_C_MANUAL } from '../../config/asistente/precio.config';
import type { Equipo, Incoterm, Necesidad, Parametros, ReferenciaCarga, Simulacion } from '../types';
import { calcularCubicajeCafe } from './cubicajeCafe';
import type { RespuestaPallet, ResultadoCubicajeCafe } from './cubicajeCafe';
import { compararLclFcl, costoFclUsd, incotermPara, MODALIDAD_MOTOR, preguntaUrgencia, viaPorKilos } from './reglas';
import type { ComparacionLclFcl } from './reglas';

export type NecesidadAsistente = 'COSTOS' | 'CUBICAJE' | 'AMBOS';
export type FormaEnvio = 'SACO' | 'CAJA' | 'GRANEL';

export interface Respuestas {
  destino: { pais: string; ciudad: string };
  necesidad: NecesidadAsistente | '';
  kilos: number | null;
  urgencia: Urgencia | '';
  /** El usuario cambió la vía sugerida */
  viaManual: ViaTransporte | null;
  recogida: { lugar: LugarRecogida | ''; ciudad: string };
  entrega: LugarEntrega | '';
  partida: string;
  empaque: FormaEnvio | '';
  saco: '70' | '35';
  pallet: RespuestaPallet;
  tipoCargaManual: TipoCarga | null;
  contenedorManual: ContenedorId | null;
  moneda: 'USD' | 'EUR' | '';
  /** Pesos colombianos por libra */
  precioLibraCop: number | null;
  liquidador: { centavosC: number | null; diferencial: number | null };
  /** TRM del día (COP por USD) traída del servicio; null = tasa semilla */
  trm: { valor: number; fecha: string; fuente: string } | null;
}

export function respuestasVacias(): Respuestas {
  return {
    destino: { pais: '', ciudad: '' },
    necesidad: '',
    kilos: null,
    urgencia: '',
    viaManual: null,
    recogida: { lugar: '', ciudad: '' },
    entrega: '',
    partida: '',
    empaque: '',
    saco: '70',
    pallet: '',
    tipoCargaManual: null,
    contenedorManual: null,
    moneda: '',
    precioLibraCop: null,
    liquidador: { centavosC: null, diferencial: null },
    trm: null,
  };
}

export const empaqueDe = (r: Pick<Respuestas, 'empaque' | 'saco'>): EmpaqueId | null =>
  r.empaque === 'SACO' ? (r.saco === '35' ? 'SACO_35' : 'SACO_70') : r.empaque === 'CAJA' ? 'CAJA_24' : r.empaque === 'GRANEL' ? 'GRANEL' : null;

const NECESIDAD_MOTOR: Record<NecesidadAsistente, Necesidad> = { COSTOS: 'CONOCER_COSTO', CUBICAJE: 'CALCULAR_CARGA', AMBOS: 'EXPORTAR' };

/** Parámetros del motor ajustados al asistente: contenedores, pallets y factores salen de la configuración del cubicaje */
export function parametrosAsistente(base: Parametros, tipo: TipoCarga | null, trm: Respuestas['trm'] = null): Parametros {
  const equipos: Equipo[] = CONTENEDORES.map((c) => ({
    id: c.id,
    nombre: c.nombre,
    modalidad: 'MARITIMA_FCL',
    largoMm: c.largoMm,
    anchoMm: c.anchoMm,
    altoMm: c.altoMm,
    volumenCm3: Math.round(c.volumenM3 * 1e6),
    cargaMaxG: c.payloadKg * 1000,
    reefer: false,
    habilitado: true,
  }));
  return {
    ...base,
    equipos,
    pesoMaxCargaPalletG: PALLETS.AMERICANO.cargaMaxKg * 1000,
    factorAereoCm3Kg: FACTOR_VOLUMETRICO.AEREO,
    factorCourierCm3Kg: FACTOR_VOLUMETRICO.COURIER,
    pesoVolumetricoSobreCarga: true,
    // TRM del día (datos abiertos) con su fuente y fecha; sin ella queda la tasa semilla
    fx: trm ? { ...base.fx, copPorUnidad: { ...base.fx.copPorUnidad, USD: trm.valor }, fecha: trm.fecha, fuente: trm.fuente } : base.fx,
    fleteTentativo: base.fleteTentativo && { ...base.fleteTentativo, locales: tipo ? COSTOS_LOCALES_TENTATIVOS[tipo] : undefined },
  };
}

export interface Asistente {
  via: ViaTransporte | null;
  faltaUrgencia: boolean;
  incoterm: Incoterm | null;
  cubicaje: ResultadoCubicajeCafe | null;
  /** Comparación LCL vs FCL cuando la carga está cerca del umbral */
  comparacion: ComparacionLclFcl | null;
  /** Precio por libra que usa el cálculo y de dónde sale */
  precioLibraCop: number | null;
  precioEsReferencia: boolean;
  trmCopPorUsd: number;
  sim: Simulacion;
  params: Parametros;
}

export const centavosC = (r: Respuestas): number => r.liquidador.centavosC ?? PRECIO_C_MANUAL.centavosLb;
export const diferencial = (r: Respuestas): number => r.liquidador.diferencial ?? PRECIO.diferencialCentavosLb;

/** Referencia del liquidador en pesos por libra: (contrato C + diferencial) × TRM */
export const precioReferenciaCop = (r: Respuestas, trm: number): number => ((centavosC(r) + diferencial(r)) / 100) * trm;

function referenciaCarga(res: ResultadoCubicajeCafe, tipo: TipoCarga): ReferenciaCarga[] {
  const e = EMPAQUES[res.empaque];
  const manejo = { fragil: false, peligroso: false, claseOnu: '', refrigerado: false, tempMin: null, tempMax: null };
  if (e.forma === 'granel') {
    // A granel: cada contenedor lleva un bloque (liner); el motor solo necesita peso y volumen
    return res.escenas.map((esc, i) => {
      const b = esc.piezas[0];
      return {
        id: `granel-${i + 1}`, nombre: 'Café a granel', productoId: 'cafe', empaque: 'BIG_BAG', bultos: 1, unidadesPorBulto: null,
        largoMm: Math.round(b.dx), anchoMm: Math.round(b.dz), altoMm: Math.max(1, Math.round(b.dy)), unidadMedida: 'cm',
        pesoNetoG: Math.round(b.pesoKg * 1000), pesoBrutoG: Math.round(b.pesoKg * 1000), apilable: false, niveles: 1, rotacion: 'FIJA', manejo, paletizar: false,
        pallet: { largoMm: 1200, anchoMm: 1000, altoMm: 150, pesoG: 25_000, alturaMaxMm: 1600 },
      };
    });
  }
  const p = res.palletId ? PALLETS[res.palletId] : PALLETS.AMERICANO;
  return [{
    id: 'carga',
    nombre: e.forma === 'caja' ? `Caja ${e.pesoKg} kg` : `Saco ${e.pesoKg} kg`,
    productoId: 'cafe',
    empaque: e.forma === 'caja' ? 'CAJA' : 'SACO',
    bultos: res.unidades,
    unidadesPorBulto: null,
    largoMm: e.largoMm,
    anchoMm: e.anchoMm,
    altoMm: e.altoMm,
    unidadMedida: 'cm',
    pesoNetoG: e.pesoKg * 1000,
    pesoBrutoG: e.pesoKg * 1000,
    apilable: true,
    niveles: e.apiladoMax,
    rotacion: 'SOLO_BASE',
    manejo,
    paletizar: !!res.palletId,
    pallet: { largoMm: p.largoMm, anchoMm: p.anchoMm, altoMm: p.altoMm, pesoG: p.pesoKg * 1000, alturaMaxMm: ALTURA_MAX_PALLET_MM[tipo] },
  }];
}

const nombrePais = (pais: string, lang: 'es' | 'en'): string => {
  try {
    return new Intl.DisplayNames([lang], { type: 'region' }).of(pais) ?? pais;
  } catch {
    return pais;
  }
};

/** Todo lo que se deduce de las respuestas. Función pura: mismas respuestas → mismo resultado. */
export function resolverAsistente(r: Respuestas, base: Parametros, lang: 'es' | 'en' = 'es'): Asistente {
  const via = r.viaManual ?? viaPorKilos(r.kilos, r.urgencia);
  const faltaUrgencia = !r.viaManual && preguntaUrgencia(r.kilos) && !r.urgencia;
  const incoterm = incotermPara(r.entrega, via);
  const empaque = empaqueDe(r);
  const pais = r.destino.pais;
  const paramsBase = parametrosAsistente(base, null);
  const costoFcl = costoFclUsd(paramsBase, PAIS_ORIGEN, pais);

  let cubicaje: ResultadoCubicajeCafe | null = null;
  let comparacion: ComparacionLclFcl | null = null;
  if (via && empaque && r.kilos && r.kilos > 0) {
    const entrada = { kg: r.kilos, empaque, pallet: r.pallet, via, tipoCargaManual: r.tipoCargaManual, contenedorManual: r.contenedorManual, paisOrigen: PAIS_ORIGEN, paisDestino: pais, costoFclUsd: costoFcl };
    cubicaje = calcularCubicajeCafe(entrada);
    if (cubicaje.cercaUmbral && (cubicaje.tipoCarga === 'LCL' || cubicaje.tipoCarga === 'FCL')) {
      const lcl = cubicaje.tipoCarga === 'LCL' ? cubicaje : calcularCubicajeCafe({ ...entrada, tipoCargaManual: 'LCL', contenedorManual: null });
      const fcl = cubicaje.tipoCarga === 'FCL' ? cubicaje : calcularCubicajeCafe({ ...entrada, tipoCargaManual: 'FCL', contenedorManual: null });
      comparacion = compararLclFcl(lcl, fcl, paramsBase, PAIS_ORIGEN, pais);
    }
  }

  const tipo = cubicaje?.tipoCarga ?? null;
  const params = parametrosAsistente(base, tipo, r.trm);
  const trm = r.trm?.valor ?? base.fx.copPorUnidad.USD;
  const precioEsReferencia = r.precioLibraCop == null;
  const precioLibraCop = r.precioLibraCop ?? (r.kilos ? precioReferenciaCop(r, trm) : null);
  const partida = partidaPorCodigo(r.partida);
  const moneda = r.moneda || 'USD';
  const kgMercancia = r.kilos ?? 0;
  const ciudadDestino = r.destino.ciudad.trim() || (pais ? nombrePais(pais, lang) : '');

  const sim: Simulacion = {
    operacion: {
      tipo: 'EXPORTACION',
      origen: { pais: PAIS_ORIGEN, ciudad: r.recogida.ciudad.trim() || nombrePais(PAIS_ORIGEN, lang), tipo: r.recogida.lugar ? r.recogida.lugar.toLowerCase() : 'planta' },
      destino: { pais, ciudad: ciudadDestino, tipo: r.entrega === 'COMPRADOR' ? 'bodega' : 'puerto' },
      modalidad: tipo ? MODALIDAD_MOTOR[tipo] : 'POR_EVALUAR',
      incoterm: incoterm ?? ('' as Incoterm),
      lugarConvenido: ciudadDestino,
      moneda,
      valorEstimado: null,
      fechaSalida: null,
      tipoProducto: 'ALIMENTOS',
      partida: partida ? partida.codigo.replace(/\./g, '') : '',
      necesidad: r.necesidad ? NECESIDAD_MOTOR[r.necesidad] : 'EXPORTAR',
    },
    productos: partida
      ? [{
          id: 'cafe',
          nombre: partida.nombre[lang],
          descripcion: '',
          categoria: partida.categorias[0],
          marca: '',
          paisOrigen: PAIS_ORIGEN,
          uso: '',
          cantidad: kgMercancia,
          unidad: 'kg',
          valorUnitario: precioLibraCop != null ? precioLibraCop * base.kgALibra : 0,
          moneda: 'COP',
          empaque: r.empaque === 'CAJA' ? 'CAJA' : r.empaque === 'GRANEL' ? 'BIG_BAG' : 'SACO',
          requisitos: partida.categorias.includes('ALIMENTOS') ? ['ALIMENTOS'] : [],
          certificaciones: '',
        }]
      : [],
    referencias: cubicaje && tipo ? referenciaCarga(cubicaje, tipo) : [],
    equipoId: cubicaje?.fcl?.elegido?.contenedorId ?? null,
    equipoCantidad: cubicaje?.fcl?.elegido?.cantidad ?? 1,
    overrides: {},
    otros: [],
    rubrosActivados: [],
    arancelPct: null,
    trmUsuario: null,
    comisionPct: null,
    contingenciaPct: null,
    margenObjetivo: PRECIO.margenObjetivo,
  };

  return { via, faltaUrgencia, incoterm, cubicaje, comparacion, precioLibraCop, precioEsReferencia, trmCopPorUsd: trm, sim, params };
}
