// Caso de aceptación de la sección 16 de las reglas: café Pereira → Miami.
// Lo usan la prueba de regresión y el botón "Cargar ejemplo" del simulador.

import type { ReferenciaCarga, Simulacion } from '../engine/types';

const pallet = { largoMm: 1200, anchoMm: 1000, altoMm: 150, pesoG: 25_000, alturaMaxMm: 1600 };
const manejo = { fragil: false, peligroso: false, claseOnu: '', refrigerado: false, tempMin: null, tempMax: null };

const ref = (id: string, nombre: string, productoId: string, bultos: number, l: number, a: number, h: number, kg: number, niveles: number): ReferenciaCarga => ({
  id,
  nombre,
  productoId,
  empaque: 'CAJA',
  bultos,
  unidadesPorBulto: null,
  largoMm: l * 10,
  anchoMm: a * 10,
  altoMm: h * 10,
  unidadMedida: 'cm',
  pesoNetoG: null,
  pesoBrutoG: kg * 1000,
  apilable: true,
  niveles,
  rotacion: 'SOLO_BASE',
  manejo,
  paletizar: true,
  pallet,
});

export function casoCafe(): Simulacion {
  return {
    operacion: {
      tipo: 'EXPORTACION',
      origen: { pais: 'CO', ciudad: 'Pereira', tipo: 'planta' },
      destino: { pais: 'US', ciudad: 'Miami', tipo: 'bodega' },
      modalidad: 'POR_EVALUAR',
      incoterm: 'CIF',
      lugarConvenido: 'Miami',
      moneda: 'USD',
      valorEstimado: 52740,
      fechaSalida: null,
      tipoProducto: 'ALIMENTOS',
      partida: '',
      necesidad: 'PRECIO_VENTA',
    },
    productos: [
      { id: 'grano', nombre: 'Café tostado en grano', descripcion: '', categoria: 'ALIMENTOS', marca: '', paisOrigen: 'CO', uso: '', cantidad: 1980, unidad: 'kg', valorUnitario: 15, moneda: 'USD', empaque: 'CAJA', requisitos: ['ALIMENTOS'], certificaciones: '' },
      { id: 'molido', nombre: 'Café molido 250 g', descripcion: '', categoria: 'ALIMENTOS', marca: '', paisOrigen: 'CO', uso: '', cantidad: 1440, unidad: 'kg', valorUnitario: 16, moneda: 'USD', empaque: 'CAJA', requisitos: ['ALIMENTOS'], certificaciones: '' },
    ],
    referencias: [
      ref('r1', 'Café grano · caja máster', 'grano', 99, 32, 44, 45, 22, 3),
      ref('r2', 'Café molido · caja', 'molido', 120, 40, 30, 25, 13, 5),
    ],
    equipoId: null,
    overrides: {},
    otros: [],
    rubrosActivados: [],
    arancelPct: null,
    trmUsuario: null,
    comisionPct: null,
    contingenciaPct: null,
    margenObjetivo: 0.18,
  };
}
