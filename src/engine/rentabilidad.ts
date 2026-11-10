// RN-REN: indicadores de decisión a partir de los rubros.
import { convertir } from './costos';
import type { CalculoCubicaje, BasesCobro, LineaCosto, Modalidad, Parametros, Perspectiva, Rentabilidad, Simulacion } from './types';

// Peso neto: de las referencias si todas lo declaran; si no, de los productos vendidos por kg
export function pesoNetoKg(sim: Simulacion): number | null {
  const refs = sim.referencias;
  if (refs.length && refs.every((r) => r.pesoNetoG != null && r.pesoNetoG > 0)) {
    return refs.reduce((s, r) => s + ((r.pesoNetoG as number) * r.bultos) / 1000, 0);
  }
  const porKg = sim.productos.filter((p) => p.unidad === 'kg');
  return porKg.length && porKg.length === sim.productos.length ? porKg.reduce((s, p) => s + p.cantidad, 0) : null;
}

export function unidadesComerciales(sim: Simulacion): number | null {
  const unidades = new Set(sim.productos.map((p) => p.unidad));
  return unidades.size === 1 ? sim.productos.reduce((s, p) => s + p.cantidad, 0) : null;
}

// RN-PRO-03: valor comercial en la moneda de negociación
export function valorComercial(sim: Simulacion, tasas: Record<string, number>): number {
  return sim.productos.reduce((s, p) => s + convertir(p.cantidad * p.valorUnitario, p.moneda, sim.operacion.moneda, tasas), 0);
}

// RN-REN-06: divisor cero o ausente da "—", nunca 0
const dividir = (a: number, b: number | null): number | null => (b && b > 0 ? a / b : null);

export function calcularRentabilidad(sim: Simulacion, lineas: LineaCosto[], cubicaje: CalculoCubicaje, bases: BasesCobro, modalidad: Modalidad, persp: Perspectiva, params: Parametros): Rentabilidad {
  const total = lineas.filter((l) => l.suma).reduce((s, l) => s + (l.valor as number), 0);
  const faltantes = lineas.filter((l) => l.estado === 'PENDIENTE' && l.activo);
  const neto = pesoNetoKg(sim);
  const brutoKg = cubicaje.pesoCargaG / 1000;
  const m3 = modalidad === 'MARITIMA_LCL' ? bases.wmCarga : cubicaje.volumenCargaCm3 / 1e6;

  const m = sim.margenObjetivo;
  const mostrarPrecio = sim.operacion.necesidad === 'PRECIO_VENTA' || persp === 'V';
  const margenValido = m != null && m >= 0 && m < 1;
  const precioSugerido = mostrarPrecio && margenValido ? total / (1 - (m as number)) : null;

  return {
    total,
    parcial: faltantes.length > 0,
    faltantes,
    costoUnidad: dividir(total, unidadesComerciales(sim)),
    costoKgNeto: dividir(total, neto),
    costoKgBruto: dividir(total, brutoKg),
    costoLibra: dividir(total, neto == null ? null : neto * params.kgALibra),
    costoM3: dividir(total, m3),
    mostrarPrecio,
    precioSugerido,
    utilidad: precioSugerido == null ? null : precioSugerido - total,
    margen: margenValido ? m : null,
  };
}
