// Cubicaje analítico (RN-CUB). El motor no conoce precios: el módulo de costos consume su salida.
import type {
  BasesCobro,
  BloqueCarga,
  CalculoCubicaje,
  CalculoReferencia,
  Equipo,
  EvaluacionEquipo,
  GrupoPallet,
  Modalidad,
  NoUbicado,
  OpcionComparativo,
  Parametros,
  ReferenciaCarga,
  SeleccionEquipo,
} from './types';

const EPS = 1e-9;
type Medidas = [number, number, number];

// RN-CUB-02. Con SOLO_BASE el alto no cambia; con LIBRE las seis; con FIJA solo la declarada.
export function orientaciones(ref: Pick<ReferenciaCarga, 'largoMm' | 'anchoMm' | 'altoMm' | 'rotacion'>): Medidas[] {
  const { largoMm: l, anchoMm: a, altoMm: h, rotacion } = ref;
  if (rotacion === 'FIJA') return [[l, a, h]];
  if (rotacion === 'SOLO_BASE') return [[l, a, h], [a, l, h]];
  return [[l, a, h], [a, l, h], [l, h, a], [h, l, a], [a, h, l], [h, a, l]];
}

// RN-CUB-03: frágil o no apilable equivalen a 1 nivel. Apilable sin límite declarado: lo limita la altura.
export function nivelesEfectivos(ref: Pick<ReferenciaCarga, 'apilable' | 'niveles' | 'manejo'>): number {
  if (ref.manejo?.fragil || !ref.apilable) return 1;
  if (ref.niveles == null) return Infinity;
  return Math.max(1, ref.niveles || 1);
}

export interface MedidaExcedida {
  medida: 'largo' | 'ancho' | 'alto';
  valorMm: number;
  maximoMm: number;
}

/**
 * Si el bulto no cabe en ningún equipo habilitado en ninguna orientación permitida, dice qué medida
 * lo impide frente al equipo más grande. Sirve para avisar en el formulario (casi siempre es la unidad).
 */
export function medidaExcedida(ref: Pick<ReferenciaCarga, 'largoMm' | 'anchoMm' | 'altoMm' | 'rotacion'>, equipos: Equipo[]): MedidaExcedida | null {
  const habilitados = equipos.filter((e) => e.habilitado && e.largoMm > 0);
  if (!habilitados.length || !(ref.largoMm > 0 && ref.anchoMm > 0 && ref.altoMm > 0)) return null;
  if (habilitados.some((e) => orientaciones(ref).some(([l, a, h]) => l <= e.largoMm && a <= e.anchoMm && h <= e.altoMm))) return null;
  const maxL = Math.max(...habilitados.map((e) => e.largoMm));
  const maxA = Math.max(...habilitados.map((e) => e.anchoMm));
  const maxH = Math.max(...habilitados.map((e) => e.altoMm));
  const medidas = { largo: ref.largoMm, ancho: ref.anchoMm, alto: ref.altoMm };
  if (ref.rotacion !== 'LIBRE' && ref.altoMm > maxH) return { medida: 'alto', valorMm: ref.altoMm, maximoMm: maxH };
  // La medida más larga va contra el largo del equipo; la segunda, contra el ancho (o el alto si gira libre)
  const orden = (Object.keys(medidas) as Array<keyof typeof medidas>).filter((k) => ref.rotacion === 'LIBRE' || k !== 'alto').sort((x, y) => medidas[y] - medidas[x]);
  if (medidas[orden[0]] > maxL) return { medida: orden[0], valorMm: medidas[orden[0]], maximoMm: maxL };
  const segundo = ref.rotacion === 'LIBRE' ? Math.max(maxA, maxH) : maxA;
  return { medida: orden[1], valorMm: medidas[orden[1]], maximoMm: segundo };
}

interface PlanPallet {
  bultosPorCapa: number;
  capas: number;
  bultosPorPallet: number;
  altoBulto: number;
}

export function planPallet(ref: ReferenciaCarga, pesoMaxCargaG: number): PlanPallet | null {
  const p = ref.pallet;
  const util = p.alturaMaxMm - p.altoMm;
  const niveles = nivelesEfectivos(ref);
  const porPeso = Math.floor(pesoMaxCargaG / ref.pesoBrutoG);
  let mejor: PlanPallet | null = null;
  for (const [l, a, h] of orientaciones(ref)) {
    const porCapa = Math.floor(p.largoMm / l) * Math.floor(p.anchoMm / a);
    const capas = Math.min(Math.floor(util / h), niveles);
    if (porCapa < 1 || capas < 1) continue;
    const total = Math.min(porCapa * capas, porPeso);
    if (total < 1) continue;
    if (!mejor || total > mejor.bultosPorPallet) {
      mejor = { bultosPorCapa: porCapa, capas, bultosPorPallet: total, altoBulto: h };
    }
  }
  return mejor;
}

function calcularReferencia(ref: ReferenciaCarga, params: Parametros): CalculoReferencia {
  const volumenBultoMm3 = ref.largoMm * ref.anchoMm * ref.altoMm;
  const volumenSueltoMm3 = volumenBultoMm3 * ref.bultos;
  const pesoBrutoG = ref.pesoBrutoG * ref.bultos;
  const base: CalculoReferencia = {
    referenciaId: ref.id,
    nombre: ref.nombre,
    paletizada: false,
    volumenBultoMm3,
    volumenSueltoMm3,
    pesoBrutoG,
    bultosPorCapa: 0,
    capasPorPallet: 0,
    bultosPorPallet: 0,
    pallets: [],
    numPallets: 0,
    bultosEnPallet: 0,
    volumenCargaMm3: volumenSueltoMm3,
    pesoCargaG: pesoBrutoG,
    sinPallet: 0,
  };
  if (!ref.paletizar) return base;

  const plan = planPallet(ref, params.pesoMaxCargaPalletG);
  if (!plan) return { ...base, paletizada: true, sinPallet: ref.bultos, volumenCargaMm3: 0, pesoCargaG: 0 };

  // Cada pallet se llena en orden; el último suele ser más bajo (RN-CUB-05)
  const grupo = (cantidad: number, bultos: number): GrupoPallet => {
    const capas = Math.ceil(bultos / plan.bultosPorCapa);
    return {
      cantidad,
      bultos,
      capas,
      alturaMm: capas * plan.altoBulto + ref.pallet.altoMm,
      pesoG: bultos * ref.pesoBrutoG + ref.pallet.pesoG,
    };
  };
  const llenos = Math.floor(ref.bultos / plan.bultosPorPallet);
  const resto = ref.bultos % plan.bultosPorPallet;
  const pallets: GrupoPallet[] = [];
  if (llenos > 0) pallets.push(grupo(llenos, plan.bultosPorPallet));
  if (resto > 0) pallets.push(grupo(1, resto));

  const areaPallet = ref.pallet.largoMm * ref.pallet.anchoMm;
  return {
    ...base,
    paletizada: true,
    bultosPorCapa: plan.bultosPorCapa,
    capasPorPallet: plan.capas,
    bultosPorPallet: plan.bultosPorPallet,
    pallets,
    numPallets: llenos + (resto > 0 ? 1 : 0),
    bultosEnPallet: ref.bultos,
    volumenCargaMm3: pallets.reduce((s, g) => s + g.cantidad * areaPallet * g.alturaMm, 0),
    pesoCargaG: pallets.reduce((s, g) => s + g.cantidad * g.pesoG, 0),
  };
}

export function calcularCubicaje(referencias: ReferenciaCarga[], params: Parametros): CalculoCubicaje {
  const validas = referencias.filter((r) => r.bultos > 0 && r.largoMm > 0 && r.anchoMm > 0 && r.altoMm > 0 && r.pesoBrutoG > 0);
  const calc = validas.map((r) => calcularReferencia(r, params));
  const suma = (f: (c: CalculoReferencia) => number) => calc.reduce((s, c) => s + f(c), 0);
  return {
    referencias: calc,
    volumenSueltoCm3: Math.round(suma((c) => c.volumenSueltoMm3) / 1000),
    volumenCargaCm3: Math.round(suma((c) => c.volumenCargaMm3) / 1000),
    pesoBrutoG: suma((c) => c.pesoBrutoG),
    pesoCargaG: suma((c) => c.pesoCargaG),
    totalPallets: suma((c) => c.numPallets),
    totalBultos: validas.reduce((s, r) => s + r.bultos, 0),
    hayPaletizacion: calc.some((c) => c.paletizada && c.numPallets > 0),
  };
}

// Volumen y peso cobrables siempre desde mm y g, nunca desde valores redondeados
export function basesCobro(calc: CalculoCubicaje, params: Parametros): BasesCobro {
  const pesoKg = calc.pesoBrutoG / 1000;
  const aereoVolumetricoKg = calc.volumenSueltoCm3 / params.factorAereoCm3Kg;
  const courierVolumetricoKg = calc.volumenSueltoCm3 / params.factorCourierCm3Kg;
  return {
    aereoVolumetricoKg,
    aereoCobrableKg: Math.max(pesoKg, aereoVolumetricoKg),
    courierVolumetricoKg,
    courierCobrableKg: Math.max(pesoKg, courierVolumetricoKg),
    wmSuelto: Math.max(calc.volumenSueltoCm3 / 1e6, calc.pesoBrutoG / 1e6),
    wmCarga: Math.max(calc.volumenCargaCm3 / 1e6, calc.pesoCargaG / 1e6),
  };
}

// RN-CUB-06: bloque principal más la franja sobrante del largo con la orientación girada
export function posicionesPiso(largo: number, ancho: number, lp: number, ap: number): number {
  const conFranja = (l: number, a: number): number => {
    const filas = Math.floor(largo / l);
    const bloque = filas * Math.floor(ancho / a);
    const sobrante = largo - filas * l;
    return bloque + Math.floor(sobrante / a) * Math.floor(ancho / l);
  };
  return Math.max(conFranja(lp, ap), conFranja(ap, lp));
}

const cabeBulto = (ref: ReferenciaCarga, e: Equipo): boolean =>
  orientaciones(ref).some(([l, a, h]) => l <= e.largoMm && a <= e.anchoMm && h <= e.altoMm);

// La orientación permitida que acomoda más bultos sueltos en el equipo, y cuántos
function mejorOrientacionSuelta(ref: ReferenciaCarga, e: Equipo): { medidas: Medidas; capacidad: number } {
  let mejor: { medidas: Medidas; capacidad: number } = { medidas: orientaciones(ref)[0], capacidad: 0 };
  for (const m of orientaciones(ref)) {
    const [l, a, h] = m;
    const capacidad = Math.floor(e.largoMm / l) * Math.floor(e.anchoMm / a) * Math.min(Math.floor(e.altoMm / h), nivelesEfectivos(ref));
    if (capacidad > mejor.capacidad) mejor = { medidas: m, capacidad };
  }
  return mejor;
}

const capacidadSuelta = (ref: ReferenciaCarga, e: Equipo): number => mejorOrientacionSuelta(ref, e).capacidad;

export function evaluarEquipo(equipo: Equipo, referencias: ReferenciaCarga[], calc: CalculoCubicaje, params: Parametros): EvaluacionEquipo {
  const refs = new Map(referencias.map((r) => [r.id, r]));
  const volumenUtilMm3 = equipo.volumenCm3 * 1000 * params.factorEstiba;
  let espacioLibre = 1;
  let pesoLibre = equipo.cargaMaxG;
  let fraccionTotal = 0;
  let posicionesRef = 0;
  let imposible = false;
  const noUbicados: NoUbicado[] = [];

  const anotar = (c: CalculoReferencia, cantidad: number, motivo: NoUbicado['motivo']) => {
    if (cantidad > 0) noUbicados.push({ referenciaId: c.referenciaId, nombre: c.nombre, cantidad, motivo });
  };

  for (const c of calc.referencias) {
    const ref = refs.get(c.referenciaId) as ReferenciaCarga;
    if (ref.manejo?.refrigerado && !equipo.reefer) {
      imposible = true;
      anotar(c, ref.bultos, 'REEFER');
      continue;
    }
    if (!cabeBulto(ref, equipo)) {
      imposible = true;
      anotar(c, ref.bultos, 'DIMENSION');
      continue;
    }
    if (c.sinPallet > 0) {
      imposible = true;
      anotar(c, c.sinPallet, 'PALLET');
      continue;
    }
    if (c.paletizada) {
      const pos = posicionesPiso(equipo.largoMm, equipo.anchoMm, ref.pallet.largoMm, ref.pallet.anchoMm);
      const altoExcede = c.pallets.some((g) => g.alturaMm > equipo.altoMm);
      if (pos < 1 || altoExcede) {
        imposible = true;
        anotar(c, ref.bultos, 'DIMENSION');
        continue;
      }
      posicionesRef = posicionesRef || pos;
      fraccionTotal += c.numPallets / pos;
      for (const g of c.pallets) {
        const porEspacio = Math.floor((espacioLibre + EPS) * pos);
        const porPeso = Math.floor(pesoLibre / g.pesoG);
        const entran = Math.min(g.cantidad, porEspacio, porPeso);
        espacioLibre -= entran / pos;
        pesoLibre -= entran * g.pesoG;
        const faltan = g.cantidad - entran;
        if (faltan > 0) anotar(c, faltan * g.bultos, porEspacio <= porPeso ? 'ESPACIO' : 'PESO');
      }
    } else {
      // RN-CUB-08 pide volumen; RN-CUB-14 exige no omitir bultos que no caben, así que también cuenta
      // cuántos admite la geometría: con 1 nivel, el piso limita aunque sobre volumen.
      const fraccionBulto = Math.max(c.volumenBultoMm3 / volumenUtilMm3, 1 / capacidadSuelta(ref, equipo));
      fraccionTotal += ref.bultos * fraccionBulto;
      const porEspacio = Math.floor((espacioLibre + EPS) / fraccionBulto);
      const porPeso = Math.floor(pesoLibre / ref.pesoBrutoG);
      const entran = Math.min(ref.bultos, porEspacio, porPeso);
      espacioLibre -= entran * fraccionBulto;
      pesoLibre -= entran * ref.pesoBrutoG;
      anotar(c, ref.bultos - entran, porEspacio <= porPeso ? 'ESPACIO' : 'PESO');
    }
  }

  const cantidadRequerida = imposible || calc.referencias.length === 0
    ? null
    : Math.max(1, Math.ceil(fraccionTotal - EPS), Math.ceil(calc.pesoCargaG / equipo.cargaMaxG - EPS));

  return {
    equipoId: equipo.id,
    factible: !imposible && calc.referencias.length > 0 && noUbicados.length === 0,
    posicionesPiso: posicionesRef,
    posicionesUsadas: calc.totalPallets,
    ocupacionVolumen: calc.volumenCargaCm3 / equipo.volumenCm3,
    ocupacionPeso: calc.pesoCargaG / equipo.cargaMaxG,
    cantidadRequerida,
    noUbicados,
  };
}

export function evaluarEquipos(referencias: ReferenciaCarga[], calc: CalculoCubicaje, params: Parametros): EvaluacionEquipo[] {
  return params.equipos.filter((e) => e.habilitado).map((e) => evaluarEquipo(e, referencias, calc, params));
}

// RN-CUB-10: el factible de menor costo si hay tarifas; si no, el de menor volumen interno.
// Si ninguno es factible con una unidad, el que necesite menos unidades.
export function recomendarEquipo(evaluaciones: EvaluacionEquipo[], params: Parametros, costos: Record<string, number> = {}): SeleccionEquipo | null {
  const volumen = (id: string) => params.equipos.find((e) => e.id === id)?.volumenCm3 ?? Infinity;
  const factibles = evaluaciones.filter((e) => e.factible);
  if (factibles.length) {
    const conCosto = factibles.filter((e) => costos[e.equipoId] != null);
    const lista = conCosto.length
      ? [...conCosto].sort((a, b) => costos[a.equipoId] - costos[b.equipoId] || volumen(a.equipoId) - volumen(b.equipoId))
      : [...factibles].sort((a, b) => volumen(a.equipoId) - volumen(b.equipoId));
    return { equipoId: lista[0].equipoId, cantidad: 1, recomendado: true };
  }
  const varios = evaluaciones
    .filter((e) => e.cantidadRequerida != null)
    .sort((a, b) => (a.cantidadRequerida as number) - (b.cantidadRequerida as number) || volumen(a.equipoId) - volumen(b.equipoId));
  return varios.length ? { equipoId: varios[0].equipoId, cantidad: varios[0].cantidadRequerida as number, recomendado: true } : null;
}

// RN-CUB-12
export function compartenFrontera(a: string, b: string, params: Parametros): boolean {
  if (a && a === b) return true;
  return params.fronterasTerrestres.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
}

export function compararModalidades(calc: CalculoCubicaje, bases: BasesCobro, evaluaciones: EvaluacionEquipo[], paisOrigen: string, paisDestino: string, params: Parametros): OpcionComparativo[] {
  const opciones: OpcionComparativo[] = [{ id: 'LCL_SUELTO', base: bases.wmSuelto, unidad: 'WM' }];
  if (calc.hayPaletizacion) opciones.push({ id: 'LCL_PALETIZADO', base: bases.wmCarga, unidad: 'WM' });
  const fcl = recomendarEquipo(evaluaciones, params);
  if (fcl) {
    const ev = evaluaciones.find((e) => e.equipoId === fcl.equipoId);
    opciones.push({ id: 'FCL', base: fcl.cantidad, unidad: 'EQUIPO', equipoId: fcl.equipoId, ocupacion: ev?.ocupacionVolumen });
  }
  opciones.push({ id: 'AEREO', base: bases.aereoCobrableKg, unidad: 'KG' });
  if (compartenFrontera(paisOrigen, paisDestino, params)) opciones.push({ id: 'TERRESTRE', base: null, unidad: null });
  return opciones;
}

// RN-OPE-05: campos según modalidad
export function camposPorModalidad(modalidad: Modalidad): { equipo: boolean; pesoVolumetrico: boolean; wm: boolean; vehiculo: boolean } {
  return {
    equipo: ['MARITIMA_FCL', 'MULTIMODAL', 'POR_EVALUAR'].includes(modalidad),
    pesoVolumetrico: ['AEREA', 'COURIER', 'POR_EVALUAR'].includes(modalidad),
    wm: ['MARITIMA_LCL', 'POR_EVALUAR'].includes(modalidad),
    vehiculo: modalidad === 'TERRESTRE',
  };
}

// Distribución conceptual para la vista de carga (RN-CUB-13). El optimizador 3D la reemplaza en fase 3.
export function distribuirCarga(equipo: Equipo, referencias: ReferenciaCarga[], calc: CalculoCubicaje, maxBloques = 600): BloqueCarga[] {
  const refs = new Map(referencias.map((r) => [r.id, r]));
  const bloques: BloqueCarga[] = [];
  let x0 = 0;
  let orden = 0;

  for (const c of calc.referencias) {
    const ref = refs.get(c.referenciaId) as ReferenciaCarga;
    if (c.paletizada && c.numPallets > 0) {
      const { largoMm: lp, anchoMm: ap } = ref.pallet;
      const alturas = c.pallets.flatMap((g) => Array.from({ length: Math.min(g.cantidad, maxBloques) }, () => g.alturaMm));
      // Orientación que da más posiciones en lo que queda del equipo
      const largoLibre = equipo.largoMm - x0;
      const directa = Math.floor(largoLibre / lp) * Math.floor(equipo.anchoMm / ap);
      const girada = Math.floor(largoLibre / ap) * Math.floor(equipo.anchoMm / lp);
      const [dl, da] = directa >= girada ? [lp, ap] : [ap, lp];
      const porFila = Math.max(1, Math.floor(equipo.anchoMm / da));
      const filas = Math.floor(largoLibre / dl);
      let i = 0;
      for (; i < alturas.length && i < filas * porFila; i++) {
        bloques.push({ referenciaId: c.referenciaId, x: x0 + Math.floor(i / porFila) * dl, y: 0, z: (i % porFila) * da, dx: dl, dy: alturas[i], dz: da, orden: orden++ });
      }
      x0 += Math.ceil(i / porFila) * dl;
      // Franja sobrante con la orientación girada
      const porFilaGirada = Math.floor(equipo.anchoMm / dl);
      for (let j = 0; i < alturas.length && porFilaGirada > 0 && x0 + da <= equipo.largoMm; j++, i++) {
        bloques.push({ referenciaId: c.referenciaId, x: x0, y: 0, z: (j % porFilaGirada) * dl, dx: da, dy: alturas[i], dz: dl, orden: orden++ });
        if ((j + 1) % porFilaGirada === 0) x0 += da;
      }
      if (i > 0 && bloques.length && bloques[bloques.length - 1].dx === da && bloques[bloques.length - 1].x === x0) x0 += da;
    } else if (!c.paletizada) {
      const [l, a, h] = mejorOrientacionSuelta(ref, equipo).medidas;
      const porFila = Math.max(1, Math.floor(equipo.anchoMm / a));
      const porCol = Math.max(1, Math.min(Math.floor(equipo.altoMm / h), nivelesEfectivos(ref)));
      const cant = Math.min(ref.bultos, maxBloques);
      for (let i = 0; i < cant; i++) {
        const capa = Math.floor(i / (porFila * porCol));
        const x = x0 + capa * l;
        if (x + l > equipo.largoMm) break;
        const r = i % (porFila * porCol);
        bloques.push({ referenciaId: c.referenciaId, x, y: Math.floor(r / porFila) * h, z: (r % porFila) * a, dx: l, dy: h, dz: a, orden: orden++ });
      }
      x0 += Math.ceil(cant / (porFila * porCol)) * l;
    }
  }
  return bloques;
}
