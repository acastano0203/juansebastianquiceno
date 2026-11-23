import { describe, expect, it } from 'vitest';
import { CONTENEDORES, EMPAQUES, PALLETS } from '../../config/asistente/cubicaje.config';
import {
  acomodarSueltos,
  armarPallets,
  calcularCubicajeCafe,
  capacidadGeometrica,
  cobroVolumetrico,
  cobroWm,
  elegirContenedor,
  limitePesoKg,
  planPallet,
  rejillaPiso,
  repartir,
  unidadesNecesarias,
} from './cubicajeCafe';
import type { EntradaCubicaje } from './cubicajeCafe';

const c20 = CONTENEDORES[0];
const base: EntradaCubicaje = { kg: 0, empaque: 'SACO_70', pallet: 'NO', via: 'MARITIMO', paisOrigen: 'CO', paisDestino: 'US' };

describe('reglas de cobro', () => {
  it('W/M cobra el mayor entre toneladas y m³ y dice cuál mandó', () => {
    expect(cobroWm(1310, 2.844)).toEqual({ pesoT: 1.31, volumenM3: 2.844, cobrable: 2.844, manda: 'VOLUMEN' });
    expect(cobroWm(4000, 2)).toMatchObject({ cobrable: 4, manda: 'PESO' });
  });

  it('aéreo divide entre 6000 y courier entre 5000; se cobra el mayor', () => {
    // 60 × 50 × 40 cm = 120.000 cm³
    expect(cobroVolumetrico(120_000, 10, 6000)).toMatchObject({ volumetricoKg: 20, cobrableKg: 20, manda: 'VOLUMEN' });
    expect(cobroVolumetrico(120_000, 30, 5000)).toMatchObject({ volumetricoKg: 24, cobrableKg: 30, manda: 'PESO' });
  });

  it('el límite de peso es el menor entre el payload y el límite operativo del país', () => {
    expect(limitePesoKg(c20, 'CO', 'US')).toBe(19_500);
    expect(limitePesoKg(c20, 'US', 'MX')).toBe(28_000);
  });

  it('redondea las unidades hacia arriba', () => {
    expect(unidadesNecesarias(1200, EMPAQUES.SACO_70)).toBe(18);
    expect(unidadesNecesarias(48, EMPAQUES.CAJA_24)).toBe(2);
  });
});

describe('pallets', () => {
  it('saco de 70 kg sobre pallet americano: 2 por capa, 6 capas hasta 1,60 m', () => {
    expect(planPallet(EMPAQUES.SACO_70, PALLETS.AMERICANO, 1600)).toMatchObject({ unidadesPorCapa: 2, capas: 6, unidadesPorPallet: 12 });
  });

  it('el último pallet queda más bajo', () => {
    const plan = planPallet(EMPAQUES.SACO_70, PALLETS.AMERICANO, 1600)!;
    expect(armarPallets(18, plan, EMPAQUES.SACO_70, PALLETS.AMERICANO)).toEqual([
      { unidades: 12, capas: 6, altoMm: 1530, pesoKg: 865 },
      { unidades: 6, capas: 3, altoMm: 840, pesoKg: 445 },
    ]);
  });

  it('respeta la carga máxima del pallet', () => {
    const plan = planPallet(EMPAQUES.CAJA_24, { ...PALLETS.AMERICANO, cargaMaxKg: 200 }, 2200)!;
    expect(plan.unidadesPorPallet).toBe(8);
  });
});

describe('piso y acomodo', () => {
  it("un 20' acomoda 280 sacos de 70 kg sueltos (7 × 4 × 10)", () => {
    expect(rejillaPiso(c20.largoMm, c20.anchoMm, 800, 580)).toHaveLength(28);
    expect(capacidadGeometrica(c20, EMPAQUES.SACO_70, null, null)).toBe(280);
  });

  it("el pallet americano usa 9 posiciones en un 20' (8 + 1 girado en la franja)", () => {
    const plan = planPallet(EMPAQUES.SACO_70, PALLETS.AMERICANO, 2200)!;
    expect(capacidadGeometrica(c20, EMPAQUES.SACO_70, plan, 1530)).toBe(9);
  });

  it('reparte los sueltos en todo el piso y carga de adentro hacia la puerta', () => {
    const piezas = acomodarSueltos(c20, EMPAQUES.SACO_70, 56);
    expect(piezas).toHaveLength(56);
    expect(Math.max(...piezas.map((p) => p.y))).toBe(230); // dos capas, no una columna alta al fondo
    const xs = piezas.map((p) => p.x);
    expect(xs).toEqual([...xs].sort((a, b) => a - b));
    expect(piezas.every((p) => p.x + p.dx <= c20.largoMm && p.z + p.dz <= c20.anchoMm)).toBe(true);
  });

  it('reparte parejo entre contenedores', () => {
    expect(repartir(10, 3)).toEqual([4, 3, 3]);
  });
});

describe("caso de aceptación FCL: 275 sacos de 70 kg en un 20'", () => {
  const r = calcularCubicajeCafe({ ...base, kg: 19_250 });
  const esc = r.escenas[0];

  it("va en contenedor completo, un solo 20'", () => {
    expect(r.tipoCarga).toBe('FCL');
    expect(r.unidades).toBe(275);
    expect(r.fcl?.elegido).toEqual({ contenedorId: '20', cantidad: 1 });
  });

  it('queda casi al 100 % del peso operativo y manda el peso', () => {
    expect(esc.indicadores.ocupacionPeso).toBeGreaterThan(0.98);
    expect(esc.indicadores.ocupacionPeso).toBeLessThanOrEqual(1);
    expect(esc.indicadores.manda).toBe('PESO');
    expect(esc.indicadores.ocupacionVolumen).toBeLessThan(esc.indicadores.ocupacionPeso!);
  });

  it('dibuja los 275 sacos con el peso bien distribuido y recomienda papel kraft', () => {
    expect(esc.piezas).toHaveLength(275);
    expect(esc.alertas).toEqual([]);
    expect(Math.abs(esc.centroGravedad!.desvioX)).toBeLessThan(0.1);
    expect(r.alertas).toContain('KRAFT');
  });

  it('pide varios contenedores cuando no cabe en uno', () => {
    const grande = calcularCubicajeCafe({ ...base, kg: 50_000, costoFclUsd: { '20': 2000, '40': 2900, '40HC': 3000 } });
    expect(grande.fcl?.elegido).toEqual({ contenedorId: '40', cantidad: 2 });
    expect(grande.escenas).toHaveLength(2);
    expect(grande.escenas.reduce((s, e) => s + e.indicadores.unidades, 0)).toBe(715);
  });

  it('elige el más económico que alcance', () => {
    const opciones = [
      { contenedorId: '20' as const, capacidadGeometrica: 1, capacidadPeso: 1, capacidad: 1, cantidad: 2, limiteKg: 1, costoUsd: 4000 },
      { contenedorId: '40' as const, capacidadGeometrica: 1, capacidadPeso: 1, capacidad: 1, cantidad: 1, limiteKg: 1, costoUsd: 2900 },
    ];
    expect(elegirContenedor(opciones)?.contenedorId).toBe('40');
  });
});

describe('caso de aceptación LCL: 1.200 kg en sacos de 70 kg sobre pallet americano a España', () => {
  const r = calcularCubicajeCafe({ ...base, kg: 1200, pallet: 'AMERICANO', paisDestino: 'ES' });

  it('va consolidado en 2 pallets con 2,84 m³ cobrables', () => {
    expect(r.tipoCarga).toBe('LCL');
    expect(r.unidades).toBe(18);
    expect(r.pallets).toHaveLength(2);
    expect(r.wm.cobrable).toBeCloseTo(2.844, 3);
    expect(r.wm.manda).toBe('VOLUMEN');
  });

  it('avisa del sello NIMF-15 y dibuja la carga de otros en gris', () => {
    expect(r.alertas).toContain('NIMF15');
    expect(r.escenas[0].tipo).toBe('LCL');
    expect(r.escenas[0].otros.length).toBeGreaterThan(0);
    // la carga del usuario queda contra la puerta
    const c = r.escenas[0].contenedor!;
    expect(Math.max(...r.escenas[0].piezas.map((p) => p.x + p.dx))).toBeCloseTo(c.largoMm, 0);
  });
});

describe('tipo de carga', () => {
  it('pasa a FCL por encima del umbral de volumen o peso', () => {
    expect(calcularCubicajeCafe({ ...base, kg: 9000, pallet: 'AMERICANO' }).tipoCarga).toBe('FCL');
    expect(calcularCubicajeCafe({ ...base, kg: 3000, pallet: 'NO' }).tipoCarga).toBe('LCL');
  });

  it('el usuario puede cambiar el tipo sugerido', () => {
    const r = calcularCubicajeCafe({ ...base, kg: 3000, tipoCargaManual: 'FCL' });
    expect(r.tipoCargaSugerido).toBe('LCL');
    expect(r.tipoCarga).toBe('FCL');
  });

  it('"No sé" sugiere pallet en LCL y sacos sueltos en FCL', () => {
    expect(calcularCubicajeCafe({ ...base, kg: 1200, pallet: 'NO_SE' })).toMatchObject({ palletId: 'AMERICANO', palletSugerido: true });
    expect(calcularCubicajeCafe({ ...base, kg: 19_250, pallet: 'NO_SE' }).palletId).toBeNull();
  });

  it('marca la zona cercana al umbral para comparar LCL y FCL', () => {
    expect(calcularCubicajeCafe({ ...base, kg: 6000, pallet: 'NO' }).cercaUmbral).toBe(true);
    expect(calcularCubicajeCafe({ ...base, kg: 1200, pallet: 'NO' }).cercaUmbral).toBe(false);
  });

  it('aéreo cobra el peso volumétrico de los pallets', () => {
    const r = calcularCubicajeCafe({ ...base, via: 'AEREO', kg: 300, pallet: 'AMERICANO' });
    expect(r.tipoCarga).toBe('AEREO');
    expect(r.escenas[0].tipo).toBe('SUELTA');
    expect(r.aereo.volumetricoKg).toBeCloseTo((r.volumenM3 * 1e6) / 6000, 6);
  });

  it('el granel por debajo del mínimo se calcula en sacos y avisa', () => {
    const r = calcularCubicajeCafe({ ...base, kg: 2000, empaque: 'GRANEL' });
    expect(r).toMatchObject({ empaque: 'SACO_70', granelAjustado: true });
    expect(r.alertas).toContain('GRANEL_AJUSTADO');
    expect(calcularCubicajeCafe({ ...base, kg: 20_000, empaque: 'GRANEL' })).toMatchObject({ empaque: 'GRANEL', tipoCarga: 'FCL' });
  });
});
