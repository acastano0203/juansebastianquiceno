// Orquesta el cálculo de una simulación (RN-SIM). Función pura: mismas entradas, parámetros y fecha → mismo resultado.
import { construirAlertas } from './alertas';
import { calcularCompletitud, calcularLineas, convertir, resumenTramos, subtotalesPorModulo, tarifasVigentes, tasasDe, cantidadDeCobro } from './costos';
import { basesCobro, calcularCubicaje, compararModalidades, distribuirCarga, evaluarEquipos, recomendarEquipo } from './cubicaje';
import { perspectivaDe } from './incoterms';
import { calcularRentabilidad } from './rentabilidad';
import type { BasesCobro, CalculoCubicaje, Escenario, EvaluacionEquipo, Modalidad, Parametros, ReferenciaCarga, ResultadoSimulacion, SeleccionEquipo, Simulacion } from './types';

function costosPorEquipo(sim: Simulacion, params: Parametros, hoy: string, cubicaje: CalculoCubicaje, bases: BasesCobro, evaluaciones: EvaluacionEquipo[]): Record<string, number> {
  const costos: Record<string, number> = {};
  for (const ev of evaluaciones.filter((e) => e.factible)) {
    const seleccion = { equipoId: ev.equipoId, cantidad: 1, recomendado: false };
    const ctx = { sim, params, hoy, modalidad: 'MARITIMA_FCL' as Modalidad, seleccion, cubicaje, bases };
    const tarifas = tarifasVigentes('C01', ctx, ev.equipoId);
    if (!tarifas.length) continue;
    const tasas = tasasDe(sim, params);
    costos[ev.equipoId] = Math.min(...tarifas.map((t) => convertir(t.valor * (cantidadDeCobro(t, ctx) ?? 1), t.moneda, sim.operacion.moneda, tasas)));
  }
  return costos;
}

// RN-CUB-12: con POR_EVALUAR, la modalidad que usa el costeo es el FCL recomendado cuando existe
function resolverModalidad(modalidad: Modalidad, referencias: ReferenciaCarga[], seleccion: SeleccionEquipo | null): Modalidad {
  if (modalidad !== 'POR_EVALUAR') return modalidad;
  if (referencias.some((r) => r.manejo?.refrigerado)) return 'AEREA';
  return seleccion ? 'MARITIMA_FCL' : 'MARITIMA_LCL';
}

// El formulario arranca en blanco. Mientras el usuario no elige, el cálculo en vivo usa estos
// supuestos neutros para no romperse; "Calcular" sigue exigiendo los mínimos de RN-SIM-04.
export function conDefectos(sim: Simulacion): Simulacion {
  const op = sim.operacion;
  const moneda = op.moneda || 'USD';
  return {
    ...sim,
    operacion: {
      ...op,
      tipo: op.tipo || 'EXPORTACION',
      modalidad: op.modalidad || 'POR_EVALUAR',
      incoterm: op.incoterm || 'FOB',
      moneda,
      tipoProducto: op.tipoProducto || 'GENERAL',
      necesidad: op.necesidad || 'CONOCER_COSTO',
    },
    productos: sim.productos.map((p) => ({ ...p, categoria: p.categoria || 'GENERAL', unidad: p.unidad || 'unidad', moneda: p.moneda || moneda, empaque: p.empaque || 'CAJA' })),
    referencias: sim.referencias.map((r) => ({ ...r, unidadMedida: r.unidadMedida || 'cm', rotacion: r.rotacion || 'SOLO_BASE' })),
  };
}

export function calcularSimulacion(entrada: Simulacion, params: Parametros, hoy: string): ResultadoSimulacion {
  const sim = conDefectos(entrada);
  const { operacion: op, referencias } = sim;
  const persp = perspectivaDe(op.tipo, params);
  const cubicaje = calcularCubicaje(referencias, params);
  const bases = basesCobro(cubicaje, params);
  const evaluaciones = evaluarEquipos(referencias, cubicaje, params);
  const costos = costosPorEquipo(sim, params, hoy, cubicaje, bases, evaluaciones);
  const recomendado = recomendarEquipo(evaluaciones, params, costos);

  const usaEquipo = ['MARITIMA_FCL', 'MULTIMODAL', 'POR_EVALUAR'].includes(op.modalidad);
  const elegido = usaEquipo && sim.equipoId && evaluaciones.some((e) => e.equipoId === sim.equipoId) ? { equipoId: sim.equipoId, cantidad: 1, recomendado: sim.equipoId === recomendado?.equipoId } : null;
  const modalidad = resolverModalidad(op.modalidad, referencias, elegido ?? recomendado);
  const seleccion = ['MARITIMA_FCL', 'MULTIMODAL'].includes(modalidad) ? (elegido ?? recomendado) : null;
  const evaluacion = seleccion ? (evaluaciones.find((e) => e.equipoId === seleccion.equipoId) ?? null) : null;

  // RN-CUB-14. Con varias unidades recomendadas la carga cabe; con una unidad elegida se listan los sobrantes.
  const noUbicados = evaluacion && seleccion?.cantidad === 1 ? evaluacion.noUbicados : [];
  const equipo = seleccion ? params.equipos.find((e) => e.id === seleccion.equipoId) : undefined;
  const bloques = equipo ? distribuirCarga(equipo, referencias, cubicaje) : [];

  const { lineas } = calcularLineas({ sim, params, hoy, persp, modalidad, seleccion, cubicaje, bases });
  const tasas = tasasDe(sim, params);
  const aUsd = (v: number) => convertir(v, op.moneda, 'USD', tasas);
  const alertas = construirAlertas({ sim, persp, params, modalidad, cubicaje, bases, seleccion, evaluacion, noUbicados, lineas, aUsd });
  const vigencias = lineas.filter((l) => l.suma && l.vigenteHasta).map((l) => l.vigenteHasta as string).sort();

  return {
    fecha: hoy,
    moneda: op.moneda,
    tasaReferencia: tasas.USD,
    fuenteTasa: sim.trmUsuario != null ? 'Ingresada por el usuario' : params.fx.fuente,
    modalidadEfectiva: modalidad,
    perspectiva: persp,
    cubicaje,
    bases,
    equipos: evaluaciones,
    seleccion,
    noUbicados,
    bloques,
    comparativo: compararModalidades(cubicaje, bases, evaluaciones, op.origen.pais, op.destino.pais, params),
    lineas,
    subtotales: subtotalesPorModulo(lineas),
    tramos: resumenTramos(lineas),
    rentabilidad: calcularRentabilidad(sim, lineas, cubicaje, bases, modalidad, persp, params),
    completitud: calcularCompletitud(lineas, sim),
    alertas,
    vigenciaMinima: vigencias[0] ?? null,
    versionParametros: params.version,
    versionAlgoritmo: params.algoritmo,
  };
}

// RN-SIM-07: un escenario cambia modalidad, Incoterm o equipo y conserva lo demás
export function aplicarEscenario(sim: Simulacion, esc: Pick<Escenario, 'modalidad' | 'incoterm' | 'equipoId'>): Simulacion {
  return { ...sim, equipoId: esc.equipoId, operacion: { ...sim.operacion, modalidad: esc.modalidad, incoterm: esc.incoterm } };
}

// RN-SIM-09
export const estaVencida = (vigenciaMinima: string | null, hoy: string): boolean => !!vigenciaMinima && hoy > vigenciaMinima;

export type FaltanteMinimo = 'COSTOS_ORIGEN' | 'TIPO' | 'ORIGEN' | 'DESTINO' | 'ORIGEN_IGUAL_DESTINO' | 'INCOTERM' | 'MONEDA' | 'PRODUCTO' | 'REFERENCIA';

// RN-SIM-04
export function faltantesParaCalcular(sim: Simulacion): FaltanteMinimo[] {
  const { operacion: op } = sim;
  const f: FaltanteMinimo[] = [];
  if (!op.tipo) f.push('TIPO');
  if (!op.origen.pais || !op.origen.ciudad.trim()) f.push('ORIGEN');
  if (!op.destino.pais || !op.destino.ciudad.trim()) f.push('DESTINO');
  if (op.origen.pais && op.origen.pais === op.destino.pais && op.origen.ciudad.trim() && op.origen.ciudad.trim().toLowerCase() === op.destino.ciudad.trim().toLowerCase()) f.push('ORIGEN_IGUAL_DESTINO');
  if (!op.incoterm) f.push('INCOTERM');
  if (!op.moneda) f.push('MONEDA');
  if (!sim.productos.some((p) => p.cantidad > 0 && p.valorUnitario > 0 && p.moneda)) f.push('PRODUCTO');
  if (!sim.referencias.some((r) => r.bultos >= 1 && r.largoMm > 0 && r.anchoMm > 0 && r.altoMm > 0 && r.pesoBrutoG > 0)) f.push('REFERENCIA');
  return f;
}

export type EtapaId = 'operacion' | 'producto' | 'cubicaje' | 'costos' | 'resultado' | 'reporte' | 'soporte';
export const ETAPAS: EtapaId[] = ['operacion', 'producto', 'cubicaje', 'costos', 'resultado', 'reporte', 'soporte'];

// Una etapa está completa cuando sus campos obligatorios tienen valor válido
export function etapasCompletas(sim: Simulacion, calculada: boolean): Record<EtapaId, boolean> {
  const op = sim.operacion;
  const operacion = !!(op.tipo && op.origen.pais && op.origen.ciudad.trim() && op.destino.pais && op.destino.ciudad.trim() && op.modalidad && op.incoterm && op.moneda && op.tipoProducto && op.necesidad);
  const producto = sim.productos.length > 0 && sim.productos.every((p) => p.nombre.trim().length >= 2 && p.categoria && p.paisOrigen && p.cantidad > 0 && p.valorUnitario > 0 && p.unidad && p.moneda && p.empaque);
  const cubicaje = sim.referencias.length > 0 && sim.referencias.every((r) => r.nombre.trim() && r.productoId && r.unidadMedida && r.rotacion && r.bultos >= 1 && r.largoMm > 0 && r.anchoMm > 0 && r.altoMm > 0 && r.pesoBrutoG > 0 && (r.pesoNetoG == null || r.pesoNetoG <= r.pesoBrutoG));
  // El reporte está disponible apenas hay un cálculo; el soporte cierra la experiencia y nunca queda marcado
  return { operacion, producto, cubicaje, costos: calculada, resultado: calculada, reporte: calculada, soporte: false };
}
