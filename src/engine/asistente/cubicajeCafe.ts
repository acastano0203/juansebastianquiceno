// Cubicaje del asistente de café: funciones puras (sin React ni DOM). Todo en mm y kg.
// Ejes de la escena: x = largo (desde la pared del fondo hacia la puerta), y = alto, z = ancho.
// Las medidas, umbrales y límites salen de config/asistente/cubicaje.config.ts.

import {
  ALTURA_MAX_PALLET_MM,
  CONTENEDOR_LCL,
  CONTENEDORES,
  DENSIDAD_GRANEL_KG_M3,
  EMPAQUES,
  FACTOR_VOLUMETRICO,
  GRANEL_ALTERNATIVO,
  GRANEL_MINIMO_KG,
  KG_POR_M3_WM,
  LIMITE_OPERATIVO_KG,
  PALLET_SUGERIDO,
  PALLETS,
  TOLERANCIA_CENTRO_GRAVEDAD,
  UMBRAL_LCL,
} from '../../config/asistente/cubicaje.config';
import type { Contenedor, ContenedorId, Empaque, EmpaqueId, Pallet, PalletId, TipoCarga } from '../../config/asistente/cubicaje.config';
import { PAISES_UE } from '../../config/asistente/asistente.config';
import type { ViaTransporte } from '../../config/asistente/asistente.config';

const EPS = 1e-9;

export type RespuestaPallet = PalletId | 'NO' | 'NO_SE' | '';

export interface EntradaCubicaje {
  kg: number;
  empaque: EmpaqueId;
  pallet: RespuestaPallet;
  via: ViaTransporte;
  /** El usuario cambió el tipo de carga sugerido */
  tipoCargaManual?: TipoCarga | null;
  /** El usuario eligió otro contenedor */
  contenedorManual?: ContenedorId | null;
  paisOrigen: string;
  paisDestino: string;
  /** USD por contenedor según tipo, para elegir el más económico */
  costoFclUsd?: Partial<Record<ContenedorId, number>>;
}

export type Forma = 'saco' | 'caja' | 'pallet' | 'granel' | 'otro';

export interface Pieza {
  x: number;
  y: number;
  z: number;
  dx: number;
  dy: number;
  dz: number;
  forma: Forma;
  /** Número de unidad (1…n) o de pallet */
  n: number;
  pesoKg: number;
  /** Paso de la animación de carga en el que aparece */
  orden: number;
}

export interface PlanPallet {
  palletId: PalletId;
  unidadesPorCapa: number;
  capas: number;
  unidadesPorPallet: number;
  /** Orientación de la unidad sobre el pallet: medida a lo largo y a lo ancho del pallet */
  largoUnidadMm: number;
  anchoUnidadMm: number;
}

export interface PalletArmado {
  unidades: number;
  capas: number;
  altoMm: number;
  pesoKg: number;
}

export interface CobroWm {
  pesoT: number;
  volumenM3: number;
  cobrable: number;
  manda: 'PESO' | 'VOLUMEN';
}

export interface CobroVolumetrico {
  realKg: number;
  volumetricoKg: number;
  cobrableKg: number;
  factor: number;
  manda: 'PESO' | 'VOLUMEN';
}

export interface OpcionContenedor {
  contenedorId: ContenedorId;
  /** Unidades (o pallets) que caben por geometría */
  capacidadGeometrica: number;
  /** Unidades (o pallets) que permite el peso operativo */
  capacidadPeso: number;
  capacidad: number;
  cantidad: number | null;
  limiteKg: number;
  costoUsd: number | null;
}

export interface Indicadores {
  unidades: number;
  pallets: number;
  pesoKg: number;
  volumenM3: number;
  capacidadM3: number | null;
  limiteKg: number | null;
  ocupacionVolumen: number | null;
  ocupacionPeso: number | null;
  espacioLibreM3: number | null;
  manda: 'PESO' | 'VOLUMEN' | null;
}

export interface CentroGravedad {
  x: number;
  y: number;
  z: number;
  /** Desviación respecto al centro, como fracción del largo y del ancho */
  desvioX: number;
  desvioZ: number;
}

export type CodigoAlerta = 'SOBREPESO' | 'ALTURA' | 'CENTRO_GRAVEDAD' | 'NIMF15' | 'KRAFT' | 'GRANEL_AJUSTADO' | 'NO_CABE';

export interface Escena {
  id: string;
  tipo: 'FCL' | 'LCL' | 'SUELTA';
  contenedor: { id: ContenedorId; largoMm: number; anchoMm: number; altoMm: number } | null;
  piezas: Pieza[];
  /** LCL: carga de otros exportadores en el contenedor compartido */
  otros: Pieza[];
  pasos: number;
  indicadores: Indicadores;
  centroGravedad: CentroGravedad | null;
  alertas: CodigoAlerta[];
}

export interface ResultadoCubicajeCafe {
  empaque: EmpaqueId;
  granelAjustado: boolean;
  tipoCarga: TipoCarga;
  tipoCargaSugerido: TipoCarga;
  palletId: PalletId | null;
  palletSugerido: boolean;
  unidades: number;
  pesoMercanciaKg: number;
  pesoBrutoKg: number;
  volumenM3: number;
  plan: PlanPallet | null;
  pallets: PalletArmado[];
  alturaMaxPalletMm: number | null;
  wm: CobroWm;
  aereo: CobroVolumetrico;
  courier: CobroVolumetrico;
  /** Contenedor completo: opciones evaluadas y la elegida */
  fcl: { opciones: OpcionContenedor[]; elegido: { contenedorId: ContenedorId; cantidad: number } | null } | null;
  /** Cerca del umbral LCL/FCL: conviene comparar ambos */
  cercaUmbral: boolean;
  escenas: Escena[];
  alertas: CodigoAlerta[];
}

// ---------- Reglas básicas ----------

export const unidadesNecesarias = (kg: number, e: Empaque): number => (kg > 0 && e.pesoKg > 0 ? Math.ceil(kg / e.pesoKg - EPS) : 0);

export const volumenUnidadM3 = (e: Empaque): number => (e.largoMm * e.anchoMm * e.altoMm) / 1e9;

/** LCL: se cobra el mayor entre toneladas y m³ (1 m³ = 1.000 kg) */
export function cobroWm(pesoKg: number, volumenM3: number): CobroWm {
  const pesoT = pesoKg / KG_POR_M3_WM;
  return { pesoT, volumenM3, cobrable: Math.max(pesoT, volumenM3), manda: pesoT > volumenM3 ? 'PESO' : 'VOLUMEN' };
}

/** Aéreo y courier: se cobra el mayor entre el peso real y el volumétrico (L×A×H en cm / factor) */
export function cobroVolumetrico(piezasCm3: number, pesoRealKg: number, factor: number): CobroVolumetrico {
  const volumetricoKg = piezasCm3 / factor;
  return { realKg: pesoRealKg, volumetricoKg, cobrableKg: Math.max(pesoRealKg, volumetricoKg), factor, manda: volumetricoKg > pesoRealKg ? 'VOLUMEN' : 'PESO' };
}

/** Menor entre el payload del contenedor y los límites de carretera del origen y del destino */
export function limitePesoKg(c: Contenedor, paisOrigen: string, paisDestino: string): number {
  const limites = [c.payloadKg, LIMITE_OPERATIVO_KG[paisOrigen]?.[c.id], LIMITE_OPERATIVO_KG[paisDestino]?.[c.id]].filter((v): v is number => v != null);
  return Math.min(...limites);
}

/** Marítimo: por encima del umbral de volumen o de peso conviene el contenedor completo */
export const superaUmbralLcl = (volumenM3: number, pesoKg: number): boolean => volumenM3 >= UMBRAL_LCL.volumenM3 || pesoKg >= UMBRAL_LCL.pesoKg;

export function cercaDelUmbral(volumenM3: number, pesoKg: number): boolean {
  const r = Math.max(volumenM3 / UMBRAL_LCL.volumenM3, pesoKg / UMBRAL_LCL.pesoKg);
  return r >= UMBRAL_LCL.zonaComparacion && r < 1 / UMBRAL_LCL.zonaComparacion;
}

// ---------- Pallets ----------

export function planPallet(e: Empaque, p: Pallet, alturaMaxMm: number): PlanPallet | null {
  const capasPorAltura = Math.min(Math.floor((alturaMaxMm - p.altoMm) / e.altoMm), e.apiladoMax);
  const porPeso = Math.floor(p.cargaMaxKg / e.pesoKg);
  let mejor: PlanPallet | null = null;
  for (const [l, a] of [[e.largoMm, e.anchoMm], [e.anchoMm, e.largoMm]]) {
    const porCapa = Math.floor(p.largoMm / l) * Math.floor(p.anchoMm / a);
    if (porCapa < 1 || capasPorAltura < 1) continue;
    const total = Math.min(porCapa * capasPorAltura, porPeso);
    if (total < 1) continue;
    if (!mejor || total > mejor.unidadesPorPallet) {
      mejor = { palletId: p.id, unidadesPorCapa: porCapa, capas: Math.ceil(total / porCapa), unidadesPorPallet: total, largoUnidadMm: l, anchoUnidadMm: a };
    }
  }
  return mejor;
}

/** Arma los pallets en orden: todos llenos menos el último */
export function armarPallets(unidades: number, plan: PlanPallet, e: Empaque, p: Pallet): PalletArmado[] {
  const out: PalletArmado[] = [];
  for (let resto = unidades; resto > 0; resto -= plan.unidadesPorPallet) {
    const u = Math.min(resto, plan.unidadesPorPallet);
    const capas = Math.ceil(u / plan.unidadesPorCapa);
    out.push({ unidades: u, capas, altoMm: p.altoMm + capas * e.altoMm, pesoKg: u * e.pesoKg + p.pesoKg });
  }
  return out;
}

// ---------- Piso del contenedor ----------

export interface Celda {
  x: number;
  z: number;
  dx: number;
  dz: number;
}

/** Posiciones en el piso: bloque principal más la franja sobrante del largo con la orientación girada */
export function rejillaPiso(largo: number, ancho: number, l: number, a: number): Celda[] {
  const armar = (pl: number, pa: number): Celda[] => {
    const celdas: Celda[] = [];
    const nx = Math.floor(largo / pl);
    const nz = Math.floor(ancho / pa);
    for (let i = 0; i < nx; i++) for (let k = 0; k < nz; k++) celdas.push({ x: i * pl, z: k * pa, dx: pl, dz: pa });
    const x0 = nx * pl;
    const nx2 = Math.floor((largo - x0) / pa);
    const nz2 = Math.floor(ancho / pl);
    for (let i = 0; i < nx2; i++) for (let k = 0; k < nz2; k++) celdas.push({ x: x0 + i * pa, z: k * pl, dx: pa, dz: pl });
    return celdas;
  };
  const a1 = armar(l, a);
  const a2 = armar(a, l);
  return a2.length > a1.length ? a2 : a1;
}

const capasSueltas = (e: Empaque, altoMm: number): number => Math.max(0, Math.min(Math.floor(altoMm / e.altoMm), e.apiladoMax));

/** Unidades (o pallets) que caben en el contenedor por geometría */
export function capacidadGeometrica(c: Contenedor, e: Empaque, plan: PlanPallet | null, alturaPalletMm: number | null): number {
  if (e.forma === 'granel') return Math.floor(c.volumenM3 * DENSIDAD_GRANEL_KG_M3);
  if (plan) {
    const p = PALLETS[plan.palletId];
    if (alturaPalletMm != null && alturaPalletMm > c.altoMm) return 0;
    return rejillaPiso(c.largoMm, c.anchoMm, p.largoMm, p.anchoMm).length;
  }
  return rejillaPiso(c.largoMm, c.anchoMm, e.largoMm, e.anchoMm).length * capasSueltas(e, c.altoMm);
}

// ---------- Acomodo para la vista 3D ----------

/** Unidades sobre un pallet ubicado en una celda del piso. El pallet puede ir girado. */
function piezasDePallet(celda: Celda, y0: number, pa: PalletArmado, plan: PlanPallet, e: Empaque, p: Pallet, orden: number, n0: number): Pieza[] {
  const piezas: Pieza[] = [{ x: celda.x, y: y0, z: celda.z, dx: celda.dx, dy: p.altoMm, dz: celda.dz, forma: 'pallet', n: orden + 1, pesoKg: p.pesoKg, orden }];
  const girado = Math.abs(celda.dx - p.largoMm) > 1;
  const [ul, ua] = girado ? [plan.anchoUnidadMm, plan.largoUnidadMm] : [plan.largoUnidadMm, plan.anchoUnidadMm];
  const nx = Math.max(1, Math.floor(celda.dx / ul));
  const nz = Math.max(1, Math.floor(celda.dz / ua));
  const ox = celda.x + (celda.dx - nx * ul) / 2;
  const oz = celda.z + (celda.dz - nz * ua) / 2;
  for (let i = 0; i < pa.unidades; i++) {
    const capa = Math.floor(i / plan.unidadesPorCapa);
    const r = i % plan.unidadesPorCapa;
    piezas.push({
      x: ox + Math.floor(r / nz) * ul,
      y: y0 + p.altoMm + capa * e.altoMm,
      z: oz + (r % nz) * ua,
      dx: ul,
      dy: e.altoMm,
      dz: ua,
      forma: e.forma === 'caja' ? 'caja' : 'saco',
      n: n0 + i + 1,
      pesoKg: e.pesoKg,
      orden,
    });
  }
  return piezas;
}

/**
 * Bultos sueltos repartidos en todo el piso (misma altura en cada columna) para que el peso quede
 * distribuido. Se cargan de adentro hacia la puerta: primero x, luego la capa y luego el ancho.
 */
export function acomodarSueltos(c: Pick<Contenedor, 'largoMm' | 'anchoMm' | 'altoMm'>, e: Empaque, unidades: number, n0 = 0): Pieza[] {
  const celdas = rejillaPiso(c.largoMm, c.anchoMm, e.largoMm, e.anchoMm);
  const capasMax = capasSueltas(e, c.altoMm);
  if (!celdas.length || !capasMax) return [];
  const n = Math.min(unidades, celdas.length * capasMax);
  const base = Math.floor(n / celdas.length);
  const extra = n % celdas.length;
  const piezas: Pieza[] = [];
  celdas.forEach((cel, i) => {
    const alto = base + (i < extra ? 1 : 0);
    for (let k = 0; k < alto; k++) {
      piezas.push({ x: cel.x, y: k * e.altoMm, z: cel.z, dx: cel.dx, dy: e.altoMm, dz: cel.dz, forma: e.forma === 'caja' ? 'caja' : 'saco', n: 0, pesoKg: e.pesoKg, orden: 0 });
    }
  });
  piezas.sort((a, b) => a.x - b.x || a.y - b.y || a.z - b.z);
  piezas.forEach((p, i) => {
    p.n = n0 + i + 1;
    p.orden = i;
  });
  return piezas;
}

/** Pallets desde el fondo hacia la puerta */
export function acomodarPallets(c: Pick<Contenedor, 'largoMm' | 'anchoMm'>, pallets: PalletArmado[], plan: PlanPallet, e: Empaque, n0 = 0): Pieza[] {
  const p = PALLETS[plan.palletId];
  const celdas = rejillaPiso(c.largoMm, c.anchoMm, p.largoMm, p.anchoMm);
  const piezas: Pieza[] = [];
  let n = n0;
  pallets.slice(0, celdas.length).forEach((pa, i) => {
    piezas.push(...piezasDePallet(celdas[i], 0, pa, plan, e, p, i, n));
    n += pa.unidades;
  });
  return piezas;
}

export function acomodarGranel(c: Contenedor, kg: number): Pieza[] {
  const vol = kg / DENSIDAD_GRANEL_KG_M3;
  const alto = Math.min(c.altoMm, (vol * 1e9) / (c.largoMm * c.anchoMm));
  return [{ x: 0, y: 0, z: 0, dx: c.largoMm, dy: alto, dz: c.anchoMm, forma: 'granel', n: 1, pesoKg: kg, orden: 0 }];
}

export function centroGravedad(piezas: Pieza[], largo: number, ancho: number): CentroGravedad | null {
  const total = piezas.reduce((s, p) => s + p.pesoKg, 0);
  if (!(total > 0)) return null;
  const m = (f: (p: Pieza) => number) => piezas.reduce((s, p) => s + p.pesoKg * f(p), 0) / total;
  const x = m((p) => p.x + p.dx / 2);
  const y = m((p) => p.y + p.dy / 2);
  const z = m((p) => p.z + p.dz / 2);
  return { x, y, z, desvioX: (x - largo / 2) / largo, desvioZ: (z - ancho / 2) / ancho };
}

// ---------- Escenas auxiliares (LCL y sin contenedor) ----------

/** Generador determinista: la "carga de otros" no cambia entre renders */
function aleatorio(semilla: number): () => number {
  let s = semilla >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

/** LCL: la carga del usuario junto a la puerta del contenedor compartido; el resto es carga de otros */
export function escenaLcl(piezasUsuario: Pieza[], c: Contenedor): { piezas: Pieza[]; otros: Pieza[] } {
  // Las piezas llegan acomodadas desde el fondo: se reflejan para que queden contra la puerta
  const piezas = piezasUsuario.map((p) => ({ ...p, x: c.largoMm - p.x - p.dx }));
  const fondoUsuario = piezas.length ? Math.min(...piezas.map((p) => p.x)) : c.largoMm;
  const otros: Pieza[] = [];
  const rnd = aleatorio(Math.round(fondoUsuario));
  const hueco = 150;
  const libre = fondoUsuario - hueco;
  const celdas = rejillaPiso(Math.max(0, libre * 0.85), c.anchoMm, 1200, 1000);
  celdas.forEach((cel, i) => {
    const alto = Math.round(900 + rnd() * 1300);
    otros.push({ x: cel.x, y: 0, z: cel.z, dx: cel.dx - 40, dy: Math.min(alto, c.altoMm - 100), dz: cel.dz - 40, forma: 'otro', n: i + 1, pesoKg: 0, orden: 0 });
  });
  return { piezas, otros };
}

/** Aéreo y courier: la carga lista para despacho, en el piso y sin contenedor */
export function escenaSuelta(e: Empaque, unidades: number, pallets: PalletArmado[], plan: PlanPallet | null): Pieza[] {
  if (plan && pallets.length) {
    const p = PALLETS[plan.palletId];
    const cols = Math.ceil(Math.sqrt(pallets.length));
    const sep = 200;
    const out: Pieza[] = [];
    let n = 0;
    pallets.forEach((pa, i) => {
      const celda = { x: (i % cols) * (p.largoMm + sep), z: Math.floor(i / cols) * (p.anchoMm + sep), dx: p.largoMm, dz: p.anchoMm };
      out.push(...piezasDePallet(celda, 0, pa, plan, e, p, i, n));
      n += pa.unidades;
    });
    return out;
  }
  const capas = Math.max(1, Math.min(e.apiladoMax, Math.round(Math.cbrt(unidades))));
  const porCapa = Math.ceil(unidades / capas);
  const cols = Math.ceil(Math.sqrt(porCapa));
  const filas = Math.ceil(porCapa / cols);
  return acomodarSueltos({ largoMm: cols * e.largoMm, anchoMm: filas * e.anchoMm, altoMm: capas * e.altoMm }, { ...e, apiladoMax: capas }, unidades);
}

// ---------- Cálculo principal ----------

function resolverPallet(respuesta: RespuestaPallet, tipo: TipoCarga, e: Empaque): { palletId: PalletId | null; sugerido: boolean } {
  if (e.forma === 'granel') return { palletId: null, sugerido: false };
  if (respuesta === 'AMERICANO' || respuesta === 'EUROPEO') return { palletId: respuesta, sugerido: false };
  if (respuesta === 'NO_SE' || respuesta === '') return { palletId: PALLET_SUGERIDO[tipo], sugerido: true };
  return { palletId: null, sugerido: false };
}

interface Carga {
  palletId: PalletId | null;
  sugerido: boolean;
  plan: PlanPallet | null;
  pallets: PalletArmado[];
  pesoBrutoKg: number;
  volumenM3: number;
  piezasCm3: number;
}

function armarCarga(e: Empaque, unidades: number, kgGranel: number, respuesta: RespuestaPallet, tipo: TipoCarga): Carga {
  if (e.forma === 'granel') {
    const vol = kgGranel / DENSIDAD_GRANEL_KG_M3;
    return { palletId: null, sugerido: false, plan: null, pallets: [], pesoBrutoKg: kgGranel, volumenM3: vol, piezasCm3: vol * 1e6 };
  }
  const { palletId, sugerido } = resolverPallet(respuesta, tipo, e);
  const p = palletId ? PALLETS[palletId] : null;
  const plan = p ? planPallet(e, p, ALTURA_MAX_PALLET_MM[tipo]) : null;
  if (p && plan) {
    const pallets = armarPallets(unidades, plan, e, p);
    const volumenM3 = pallets.reduce((s, x) => s + (p.largoMm * p.anchoMm * x.altoMm) / 1e9, 0);
    return { palletId, sugerido, plan, pallets, pesoBrutoKg: pallets.reduce((s, x) => s + x.pesoKg, 0), volumenM3, piezasCm3: volumenM3 * 1e6 };
  }
  const volumenM3 = unidades * volumenUnidadM3(e);
  return { palletId: null, sugerido: false, plan: null, pallets: [], pesoBrutoKg: unidades * e.pesoKg, volumenM3, piezasCm3: volumenM3 * 1e6 };
}

function opcionesFcl(e: Empaque, carga: Carga, unidades: number, kg: number, entrada: EntradaCubicaje): OpcionContenedor[] {
  const altoPallet = carga.pallets.length ? Math.max(...carga.pallets.map((x) => x.altoMm)) : null;
  return CONTENEDORES.map((c) => {
    const limiteKg = limitePesoKg(c, entrada.paisOrigen, entrada.paisDestino);
    const geo = capacidadGeometrica(c, e, carga.plan, altoPallet);
    let porPeso: number;
    let necesarias: number;
    if (e.forma === 'granel') {
      porPeso = Math.floor(limiteKg);
      necesarias = kg;
    } else if (carga.plan) {
      const pesoPallet = Math.max(...carga.pallets.map((x) => x.pesoKg));
      porPeso = Math.floor(limiteKg / pesoPallet);
      necesarias = carga.pallets.length;
    } else {
      porPeso = Math.floor(limiteKg / e.pesoKg);
      necesarias = unidades;
    }
    const capacidad = Math.min(geo, porPeso);
    const costo = entrada.costoFclUsd?.[c.id];
    const cantidad = capacidad > 0 ? Math.max(1, Math.ceil(necesarias / capacidad - EPS)) : null;
    return { contenedorId: c.id, capacidadGeometrica: geo, capacidadPeso: porPeso, capacidad, cantidad, limiteKg, costoUsd: cantidad != null && costo != null ? costo * cantidad : null };
  });
}

/** El más económico que alcance; sin costos, el de menor volumen total. */
export function elegirContenedor(opciones: OpcionContenedor[]): OpcionContenedor | null {
  const vol = (o: OpcionContenedor) => (CONTENEDORES.find((c) => c.id === o.contenedorId) as Contenedor).volumenM3 * (o.cantidad ?? Infinity);
  const validas = opciones.filter((o) => o.cantidad != null);
  if (!validas.length) return null;
  return [...validas].sort((a, b) => (a.costoUsd ?? Infinity) - (b.costoUsd ?? Infinity) || vol(a) - vol(b))[0];
}

// volumenM3: volumen de la carga lista (huella del pallet × alto de la carga, o bultos sueltos)
function indicadoresDe(piezas: Pieza[], c: Contenedor | null, limiteKg: number | null, unidades: number, pallets: number, volumenM3: number): Indicadores {
  const pesoKg = piezas.reduce((s, p) => s + p.pesoKg, 0);
  const capacidadM3 = c ? c.volumenM3 : null;
  const ocupacionVolumen = capacidadM3 ? volumenM3 / capacidadM3 : null;
  const ocupacionPeso = limiteKg ? pesoKg / limiteKg : null;
  return {
    unidades,
    pallets,
    pesoKg,
    volumenM3,
    capacidadM3,
    limiteKg,
    ocupacionVolumen,
    ocupacionPeso,
    espacioLibreM3: capacidadM3 != null ? Math.max(0, capacidadM3 - volumenM3) : null,
    manda: ocupacionVolumen != null && ocupacionPeso != null ? (ocupacionPeso >= ocupacionVolumen ? 'PESO' : 'VOLUMEN') : null,
  };
}

const pasosDe = (piezas: Pieza[]): number => (piezas.length ? Math.max(...piezas.map((p) => p.orden)) + 1 : 0);

function alertasEscena(piezas: Pieza[], c: Contenedor, ind: Indicadores, cg: CentroGravedad | null, alturaMax: number | null): CodigoAlerta[] {
  const a: CodigoAlerta[] = [];
  if (ind.limiteKg != null && ind.pesoKg > ind.limiteKg + EPS) a.push('SOBREPESO');
  const tope = Math.min(c.altoMm, alturaMax ?? Infinity);
  if (piezas.some((p) => p.y + p.dy > tope + 1)) a.push('ALTURA');
  if (cg && (Math.abs(cg.desvioX) > TOLERANCIA_CENTRO_GRAVEDAD || Math.abs(cg.desvioZ) > TOLERANCIA_CENTRO_GRAVEDAD)) a.push('CENTRO_GRAVEDAD');
  return a;
}

/** Reparte n elementos en k grupos lo más parejo posible */
export const repartir = (n: number, k: number): number[] => Array.from({ length: k }, (_, i) => Math.floor(n / k) + (i < n % k ? 1 : 0));

export function calcularCubicajeCafe(entrada: EntradaCubicaje): ResultadoCubicajeCafe {
  const kg = Math.max(0, entrada.kg || 0);
  // El granel solo tiene sentido en contenedor completo
  const puedeGranel = entrada.via === 'MARITIMO' && kg >= GRANEL_MINIMO_KG && (!entrada.tipoCargaManual || entrada.tipoCargaManual === 'FCL');
  const granelAjustado = entrada.empaque === 'GRANEL' && !puedeGranel;
  const empaqueId: EmpaqueId = granelAjustado ? GRANEL_ALTERNATIVO : entrada.empaque;
  const e = EMPAQUES[empaqueId];
  const esGranel = e.forma === 'granel';
  const unidades = esGranel ? 0 : unidadesNecesarias(kg, e);

  // Tipo de carga sugerido: courier y aéreo salen de la vía; en marítimo decide el umbral LCL/FCL
  let sugerido: TipoCarga;
  if (entrada.via === 'COURIER') sugerido = 'COURIER';
  else if (entrada.via === 'AEREO') sugerido = 'AEREO';
  else if (esGranel) sugerido = 'FCL';
  else {
    const comoLcl = armarCarga(e, unidades, kg, entrada.pallet, 'LCL');
    sugerido = superaUmbralLcl(comoLcl.volumenM3, comoLcl.pesoBrutoKg) ? 'FCL' : 'LCL';
  }
  const tipo: TipoCarga = esGranel ? 'FCL' : (entrada.tipoCargaManual ?? sugerido);
  const carga = armarCarga(e, unidades, kg, entrada.pallet, tipo);
  const wm = cobroWm(carga.pesoBrutoKg, carga.volumenM3);
  const aereo = cobroVolumetrico(carga.piezasCm3, carga.pesoBrutoKg, FACTOR_VOLUMETRICO.AEREO);
  const courier = cobroVolumetrico(carga.piezasCm3, carga.pesoBrutoKg, FACTOR_VOLUMETRICO.COURIER);
  const alturaMaxPalletMm = carga.pallets.length ? Math.max(...carga.pallets.map((x) => x.altoMm)) : null;

  const alertas = new Set<CodigoAlerta>();
  if (granelAjustado) alertas.add('GRANEL_AJUSTADO');

  const escenas: Escena[] = [];
  let fcl: ResultadoCubicajeCafe['fcl'] = null;

  if (kg > 0 && tipo === 'FCL') {
    const opciones = opcionesFcl(e, carga, unidades, kg, entrada);
    const manual = entrada.contenedorManual ? opciones.find((o) => o.contenedorId === entrada.contenedorManual && o.cantidad != null) : null;
    const elegida = manual ?? elegirContenedor(opciones);
    fcl = { opciones, elegido: elegida ? { contenedorId: elegida.contenedorId, cantidad: elegida.cantidad as number } : null };
    if (!elegida) alertas.add('NO_CABE');
    else {
      const c = CONTENEDORES.find((x) => x.id === elegida.contenedorId) as Contenedor;
      const k = elegida.cantidad as number;
      const cont = { id: c.id, largoMm: c.largoMm, anchoMm: c.anchoMm, altoMm: c.altoMm };
      let n0 = 0;
      const grupos = esGranel ? repartir(Math.round(kg), k) : carga.plan ? repartir(carga.pallets.length, k) : repartir(unidades, k);
      let palletIdx = 0;
      grupos.forEach((g, i) => {
        let piezas: Pieza[];
        let u = 0;
        let np = 0;
        let vol: number;
        if (esGranel) {
          piezas = acomodarGranel(c, g);
          vol = g / DENSIDAD_GRANEL_KG_M3;
        } else if (carga.plan) {
          const ps = carga.pallets.slice(palletIdx, palletIdx + g);
          const p = PALLETS[carga.plan.palletId];
          palletIdx += g;
          piezas = acomodarPallets(c, ps, carga.plan, e, n0);
          u = ps.reduce((s, x) => s + x.unidades, 0);
          np = ps.length;
          vol = ps.reduce((s, x) => s + (p.largoMm * p.anchoMm * x.altoMm) / 1e9, 0);
        } else {
          piezas = acomodarSueltos(c, e, g, n0);
          u = g;
          vol = g * volumenUnidadM3(e);
        }
        n0 += u;
        const ind = indicadoresDe(piezas, c, elegida.limiteKg, u, np, vol);
        const cg = centroGravedad(piezas, c.largoMm, c.anchoMm);
        const al = alertasEscena(piezas, c, ind, cg, carga.plan ? ALTURA_MAX_PALLET_MM.FCL : null);
        al.forEach((x) => alertas.add(x));
        escenas.push({ id: `fcl-${i + 1}`, tipo: 'FCL', contenedor: cont, piezas, otros: [], pasos: pasosDe(piezas), indicadores: ind, centroGravedad: cg, alertas: al });
      });
      alertas.add('KRAFT');
    }
  } else if (kg > 0 && tipo === 'LCL') {
    const c = CONTENEDORES.find((x) => x.id === CONTENEDOR_LCL) as Contenedor;
    // Sueltos en LCL: se agrupan contra la puerta en lugar de repartirse por todo el piso
    const propias = carga.plan ? acomodarPallets(c, carga.pallets, carga.plan, e) : escenaSuelta(e, unidades, [], null);
    const { piezas, otros } = escenaLcl(propias, c);
    const ind = indicadoresDe(piezas, null, null, unidades, carga.pallets.length, carga.volumenM3);
    escenas.push({ id: 'lcl', tipo: 'LCL', contenedor: { id: c.id, largoMm: c.largoMm, anchoMm: c.anchoMm, altoMm: c.altoMm }, piezas, otros, pasos: pasosDe(piezas), indicadores: ind, centroGravedad: null, alertas: [] });
  } else if (kg > 0) {
    const piezas = escenaSuelta(e, unidades, carga.pallets, carga.plan);
    const ind = indicadoresDe(piezas, null, null, unidades, carga.pallets.length, carga.volumenM3);
    escenas.push({ id: 'suelta', tipo: 'SUELTA', contenedor: null, piezas, otros: [], pasos: pasosDe(piezas), indicadores: ind, centroGravedad: null, alertas: [] });
  }

  if (carga.palletId && PAISES_UE.includes(entrada.paisDestino)) alertas.add('NIMF15');

  return {
    empaque: empaqueId,
    granelAjustado,
    tipoCarga: tipo,
    tipoCargaSugerido: sugerido,
    palletId: carga.palletId,
    palletSugerido: carga.sugerido && !!carga.palletId,
    unidades,
    pesoMercanciaKg: esGranel ? kg : unidades * e.pesoKg,
    pesoBrutoKg: carga.pesoBrutoKg,
    volumenM3: carga.volumenM3,
    plan: carga.plan,
    pallets: carga.pallets,
    alturaMaxPalletMm,
    wm,
    aereo,
    courier,
    fcl,
    cercaUmbral: entrada.via === 'MARITIMO' && !esGranel && cercaDelUmbral(carga.volumenM3, carga.pesoBrutoKg),
    escenas,
    alertas: [...alertas],
  };
}
