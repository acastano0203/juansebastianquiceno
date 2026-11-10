// Reglas fuera del caso café: unidades, rotación, Incoterms, seguro, tributos, estados y alertas.
import { describe, expect, it } from 'vitest';
import { casoCafe } from '../config/casoCafe';
import { PARAMS } from '../config/params';
import { calcularCubicaje, camposPorModalidad, evaluarEquipo, medidaExcedida, nivelesEfectivos, orientaciones, posicionesPiso, recomendarEquipo } from './cubicaje';
import { calcularCompletitud } from './costos';
import { origenPorCubrir } from './costos';
import { aplicarEscenario, calcularSimulacion, etapasCompletas, faltantesParaCalcular } from './simulacion';
import { pesoNetoKg } from './rentabilidad';
import { buscarTarifaTributaria, calcularSeguro, calcularTributos } from './tributos';
import { aMm, formatoDinero, formatoNumero, leerNumero, redondearHalfUp } from './unidades';
import type { Incoterm, Parametros, ReferenciaCarga, Simulacion } from './types';

const HOY = '2026-11-09';

function importacion(cambios: Partial<Simulacion['operacion']> = {}): Simulacion {
  const sim = casoCafe();
  sim.operacion = {
    ...sim.operacion,
    tipo: 'IMPORTACION',
    origen: { pais: 'CN', ciudad: 'Ningbo' },
    destino: { pais: 'CO', ciudad: 'Cartagena' },
    modalidad: 'MARITIMA_FCL',
    incoterm: 'FOB',
    tipoProducto: 'GENERAL',
    partida: '',
    necesidad: 'CONOCER_COSTO',
    ...cambios,
  };
  sim.productos = sim.productos.map((p) => ({ ...p, categoria: 'GENERAL', requisitos: [] }));
  sim.margenObjetivo = null;
  return sim;
}

const conFlete = (sim: Simulacion, flete = 2000): Simulacion => ({ ...sim, overrides: { ...sim.overrides, C01: { valor: flete }, C02: { valor: 0 }, C07: { valor: 0 } } });
const ref = (cambios: Partial<ReferenciaCarga> = {}): ReferenciaCarga => ({ ...casoCafe().referencias[0], ...cambios });
const linea = (r: ReturnType<typeof calcularSimulacion>, id: string) => r.lineas.find((l) => l.id === id)!;

describe('unidades y formato', () => {
  it('1 pulgada = 25,4 mm exactos', () => {
    expect(aMm(10, 'in')).toBe(254);
    expect(aMm(1.5, 'm')).toBe(1500);
  });
  it('HALF_UP solo al presentar', () => {
    expect(redondearHalfUp(1.005, 2)).toBe(1.01);
    expect(redondearHalfUp(2.5, 0)).toBe(3);
  });
  it('formato español e inglés; COP sin decimales', () => {
    expect(formatoNumero(52740, 2, 'es')).toBe('52.740,00');
    expect(formatoNumero(52740, 2, 'en')).toBe('52,740.00');
    expect(formatoDinero(1850000.4, 'COP')).toBe('COP 1.850.000');
  });
  it('lee números como los escribe el usuario', () => {
    expect(leerNumero('1.980,5', 'es')).toBe(1980.5);
    expect(leerNumero('1.980', 'es')).toBe(1980);
    expect(leerNumero('12,5', 'es')).toBe(12.5);
    expect(leerNumero('12.5', 'es')).toBe(12.5);
    expect(leerNumero('1,980.5', 'en')).toBe(1980.5);
    expect(leerNumero('abc', 'es')).toBeNull();
    expect(leerNumero('', 'es')).toBeNull();
  });
});

describe('cubicaje', () => {
  it('RN-CUB-02: orientaciones por tipo de rotación', () => {
    expect(orientaciones(ref({ rotacion: 'FIJA' }))).toHaveLength(1);
    const base = orientaciones(ref({ rotacion: 'SOLO_BASE' }));
    expect(base).toHaveLength(2);
    expect(base.every(([, , h]) => h === 450)).toBe(true);
    expect(orientaciones(ref({ rotacion: 'LIBRE' }))).toHaveLength(6);
  });
  it('RN-CUB-03: frágil y no apilable valen 1 nivel', () => {
    expect(nivelesEfectivos(ref({ manejo: { ...ref().manejo, fragil: true } }))).toBe(1);
    expect(nivelesEfectivos(ref({ apilable: false }))).toBe(1);
    expect(nivelesEfectivos(ref())).toBe(3);
  });
  it('apilable sin límite declarado se apila hasta el techo: 300 sacos de café caben en un solo 40\'', () => {
    expect(nivelesEfectivos(ref({ niveles: null }))).toBe(Infinity);
    const saco = ref({ id: 'saco', nombre: 'saco', bultos: 300, largoMm: 1000, anchoMm: 700, altoMm: 250, pesoBrutoG: 70_000, apilable: true, niveles: null, rotacion: 'SOLO_BASE', paletizar: false });
    const calc = calcularCubicaje([saco], PARAMS);
    const evs = PARAMS.equipos.filter((e) => e.habilitado).map((e) => evaluarEquipo(e, [saco], calc, PARAMS));
    expect(recomendarEquipo(evs, PARAMS)).toMatchObject({ equipoId: '40', cantidad: 1 });
    // Con 1 nivel la misma carga pedía 9 contenedores
    const unNivel = { ...saco, niveles: 1 };
    const calc1 = calcularCubicaje([unNivel], PARAMS);
    expect(recomendarEquipo(PARAMS.equipos.filter((e) => e.habilitado).map((e) => evaluarEquipo(e, [unNivel], calc1, PARAMS)), PARAMS)?.cantidad).toBe(9);
  });
  it('medidaExcedida nombra la medida que no cabe en ningún contenedor', () => {
    expect(medidaExcedida({ largoMm: 1000, anchoMm: 700, altoMm: 250, rotacion: 'SOLO_BASE' }, PARAMS.equipos)).toBeNull();
    // 110 pulgadas de alto = 2.794 mm: más que el contenedor más alto (40' HC, 2.690 mm)
    expect(medidaExcedida({ largoMm: 700, anchoMm: 250, altoMm: 2794, rotacion: 'SOLO_BASE' }, PARAMS.equipos)).toEqual({ medida: 'alto', valorMm: 2794, maximoMm: 2690 });
    // Escrito en m en vez de cm: 100 m de largo
    expect(medidaExcedida({ largoMm: 100_000, anchoMm: 700, altoMm: 250, rotacion: 'SOLO_BASE' }, PARAMS.equipos)).toMatchObject({ medida: 'largo', maximoMm: 12030 });
    // Girado en la base sí cabe; 3 x 3 m no cabe de ningún lado
    expect(medidaExcedida({ largoMm: 1000, anchoMm: 3000, altoMm: 250, rotacion: 'SOLO_BASE' }, PARAMS.equipos)).toBeNull();
    expect(medidaExcedida({ largoMm: 3000, anchoMm: 3000, altoMm: 250, rotacion: 'SOLO_BASE' }, PARAMS.equipos)).toMatchObject({ medida: 'ancho', maximoMm: 2350 });
  });
  it('RN-CUB-04: el peso máximo por pallet limita los bultos', () => {
    const p: Parametros = { ...PARAMS, pesoMaxCargaPalletG: 220_000 };
    const c = calcularCubicaje([ref()], p);
    expect(c.referencias[0].bultosPorPallet).toBe(10);
    expect(c.totalPallets).toBe(10);
  });
  it("RN-CUB-06: 40' con pallets de 120 × 100 tiene 20 posiciones", () => {
    expect(posicionesPiso(12030, 2350, 1200, 1000)).toBe(20);
  });
  it('RN-CUB-08 y 14: la carga que no cabe se lista como no ubicada, nunca se omite', () => {
    const grande = ref({ bultos: 400 });
    const calc = calcularCubicaje([grande], PARAMS);
    const veinte = PARAMS.equipos[0];
    const ev = evaluarEquipo(veinte, [grande], calc, PARAMS);
    expect(calc.totalPallets).toBe(23);
    expect(ev.factible).toBe(false);
    expect(ev.noUbicados[0]).toMatchObject({ motivo: 'ESPACIO' });
    const sobrantes = ev.noUbicados.reduce((s, n) => s + n.cantidad, 0);
    expect(sobrantes).toBe(400 - 9 * 18);
    expect(ev.cantidadRequerida).toBe(3);
  });
  it('RN-CUB-14: el equipo elegido a mano reporta sobrantes como alerta bloqueante', () => {
    const sim = casoCafe();
    sim.referencias = [ref({ bultos: 400 })];
    sim.equipoId = '20';
    const r = calcularSimulacion(sim, PARAMS, HOY);
    expect(r.noUbicados.length).toBeGreaterThan(0);
    expect(r.alertas[0].tipo).toBe('BLOQUEANTE');
  });
  it('RN-CUB-14: carga suelta no apilable se limita por el piso aunque sobre volumen', () => {
    const suelta = ref({ bultos: 100, largoMm: 500, anchoMm: 400, altoMm: 300, pesoBrutoG: 10_000, apilable: false, niveles: 1, paletizar: false });
    const calc = calcularCubicaje([suelta], PARAMS);
    const ev = evaluarEquipo(PARAMS.equipos[0], [suelta], calc, PARAMS);
    expect(calc.volumenCargaCm3).toBe(6_000_000);
    expect(ev.factible).toBe(false);
    // 20': 11 filas × 5 con base 50 × 40; girada 14 × 4 = 56 posiciones
    expect(ev.noUbicados[0]).toMatchObject({ cantidad: 100 - 56, motivo: 'ESPACIO' });
    expect(ev.cantidadRequerida).toBe(2);
    const sim = casoCafe();
    sim.operacion.modalidad = 'MARITIMA_FCL';
    sim.referencias = [suelta];
    const r = calcularSimulacion(sim, PARAMS, HOY);
    expect(r.seleccion?.equipoId).toBe('40');
    expect(r.bloques).toHaveLength(100);
    for (const b of r.bloques) expect(b.x + b.dx).toBeLessThanOrEqual(12030);
  });
  it('apilar 2 niveles hace factible la misma carga en el 20\'', () => {
    const suelta = ref({ bultos: 100, largoMm: 500, anchoMm: 400, altoMm: 300, pesoBrutoG: 10_000, apilable: true, niveles: 2, paletizar: false });
    const ev = evaluarEquipo(PARAMS.equipos[0], [suelta], calcularCubicaje([suelta], PARAMS), PARAMS);
    expect(ev.factible).toBe(true);
  });
  it('sin tarifas recomienda el de menor volumen; con costos, el más barato', () => {
    const calc = calcularCubicaje(casoCafe().referencias, PARAMS);
    const evs = PARAMS.equipos.filter((e) => e.habilitado).map((e) => evaluarEquipo(e, casoCafe().referencias, calc, PARAMS));
    expect(recomendarEquipo(evs, PARAMS)?.equipoId).toBe('20');
    expect(recomendarEquipo(evs, PARAMS, { '20': 3000, '40': 2500 })?.equipoId).toBe('40');
  });
  it('RN-CUB-09: refrigerada no cabe en equipos secos y genera alerta bloqueante', () => {
    const sim = casoCafe();
    sim.operacion.modalidad = 'MARITIMA_FCL';
    sim.referencias = sim.referencias.map((r) => ({ ...r, manejo: { ...r.manejo, refrigerado: true } }));
    const r = calcularSimulacion(sim, PARAMS, HOY);
    expect(r.equipos.every((e) => !e.factible)).toBe(true);
    expect(r.alertas[0]).toMatchObject({ id: 'refrigerada-sin-reefer', tipo: 'BLOQUEANTE' });
  });
  it('RN-CUB-09: peligrosa sin clase ONU genera alerta', () => {
    const sim = casoCafe();
    sim.referencias = sim.referencias.map((r) => ({ ...r, manejo: { ...r.manejo, peligroso: true } }));
    expect(calcularSimulacion(sim, PARAMS, HOY).alertas.some((a) => a.id === 'peligrosa-sin-onu')).toBe(true);
  });
  it('RN-CUB-10: la alerta LCL se activa solo si el umbral está definido', () => {
    const sim = casoCafe();
    expect(calcularSimulacion(sim, PARAMS, HOY).alertas.some((a) => a.id === 'umbral-lcl')).toBe(false);
    expect(calcularSimulacion(sim, { ...PARAMS, umbralLcl: 0.5 }, HOY).alertas.some((a) => a.id === 'umbral-lcl')).toBe(true);
  });
  it('RN-OPE-05: campos condicionados por modalidad', () => {
    expect(camposPorModalidad('AEREA')).toMatchObject({ equipo: false, pesoVolumetrico: true });
    expect(camposPorModalidad('COURIER').equipo).toBe(false);
    expect(camposPorModalidad('MARITIMA_FCL')).toMatchObject({ equipo: true, pesoVolumetrico: false });
    expect(camposPorModalidad('TERRESTRE').vehiculo).toBe(true);
  });
  it('courier usa el factor 5.000', () => {
    const r = calcularSimulacion(casoCafe(), PARAMS, HOY);
    expect(r.bases.courierVolumetricoKg).toBeCloseTo(9872640 / 5000, 6);
  });
  it('RN-CUB-12: terrestre solo con frontera común o tramo interno', () => {
    const sim = casoCafe();
    sim.operacion.destino = { pais: 'EC', ciudad: 'Quito' };
    expect(calcularSimulacion(sim, PARAMS, HOY).comparativo.some((o) => o.id === 'TERRESTRE')).toBe(true);
    sim.operacion.destino = { pais: 'CO', ciudad: 'Cartagena' };
    expect(calcularSimulacion(sim, PARAMS, HOY).comparativo.some((o) => o.id === 'TERRESTRE')).toBe(true);
  });
});

describe('Incoterms (RN-OPE) y seguro (RN-COS-05)', () => {
  it('la matriz cubre los 10 Incoterms de la tabla', () => {
    const m = PARAMS.matrizIncoterms;
    expect(Object.keys(m)).toHaveLength(10);
    expect(m.EXW.ORIGEN).toBe('C');
    expect(m.FCA.ORIGEN).toBe('V');
    expect(m.CFR.FLETE).toBe('V');
    expect(m.CFR.SEGURO).toBe('C');
    expect(m.DPU.DESTINO).toBe('V');
    expect(m.DAP.DESTINO).toBe('C');
    expect(m.DAP.ENTREGA).toBe('V');
    expect(m.DDP.ADUANA_IMPO).toBe('V');
  });

  it.each<Incoterm>(['CFR', 'CPT', 'DAP'])('RN-OPE-02: en %s el seguro es opcional, Estimado y desactivado para el vendedor', (incoterm) => {
    const sim = casoCafe();
    sim.operacion.incoterm = incoterm;
    const r = calcularSimulacion(sim, PARAMS, HOY);
    const seguro = linea(r, 'C06');
    expect(seguro).toMatchObject({ estado: 'ESTIMADO', activo: false, suma: false });
    expect(seguro.valor).toBeGreaterThan(0);
    sim.overrides = { C06: { activo: true } };
    expect(linea(calcularSimulacion(sim, PARAMS, HOY), 'C06').suma).toBe(true);
  });

  it('fórmula: prima = 1,1 × t × CIF, con CIF = (FOB + flete) ÷ (1 − 1,1 × t)', () => {
    const t = 0.004549;
    const { prima } = calcularSeguro(100000, t, 0);
    const cif = 100000 / (1 - 1.1 * t);
    expect(prima).toBeCloseTo(1.1 * t * cif, 8);
    expect(prima).toBeCloseTo(cif - 100000, 8);
  });
  it('la prima mínima aplica', () => {
    expect(calcularSeguro(1000, 0.004549, 190).prima).toBe(190);
  });
  it('EXW para el exportador: casi todo es de la contraparte', () => {
    const sim = casoCafe();
    sim.operacion.incoterm = 'EXW';
    const r = calcularSimulacion(sim, PARAMS, HOY);
    expect(r.subtotales).toMatchObject({ B: 0, C: 0, D: 0, E: 0 });
    expect(r.rentabilidad.total).toBe(52740 + 900);
  });
});

describe('importación a Colombia (RN-TRI y gastos semilla)', () => {
  it('sin flete conocido, base, tributos y gastos quedan Pendiente (RN-TRI-02)', () => {
    const r = calcularSimulacion(importacion(), PARAMS, HOY);
    // La ruta no tiene tarifa: el flete es una tentativa, que no cuenta como flete conocido
    expect(linea(r, 'C01')).toMatchObject({ estado: 'ESTIMADO', origen: 'TENTATIVA' });
    expect(linea(r, 'E01').estado).toBe('PENDIENTE');
    expect(linea(r, 'E03').estado).toBe('PENDIENTE');
    expect(linea(r, 'D01-INST').estado).toBe('PENDIENTE');
    expect(r.rentabilidad.parcial).toBe(true);
  });

  it('sin partida el arancel queda Pendiente, y con él el IVA (RN-OPE-07)', () => {
    const r = calcularSimulacion(conFlete(importacion()), PARAMS, HOY);
    expect(linea(r, 'E01').estado).toBe('VALIDACION');
    expect(linea(r, 'E02')).toMatchObject({ estado: 'PENDIENTE', valor: null });
    expect(linea(r, 'E03').estado).toBe('PENDIENTE');
  });

  it('base, arancel e IVA con tarifa escrita por el usuario', () => {
    const sim = conFlete(importacion());
    sim.arancelPct = 0.1;
    const r = calcularSimulacion(sim, PARAMS, HOY);
    const cif = 52740 + 2000 + linea(r, 'C06').valor!;
    expect(linea(r, 'C06').valor).toBeCloseTo((1.1 * 0.004549 * 54740) / (1 - 1.1 * 0.004549), 6);
    expect(linea(r, 'E01').valor).toBeCloseTo(cif, 6);
    expect(linea(r, 'E01').suma).toBe(false);
    expect(linea(r, 'E02')).toMatchObject({ estado: 'VALIDACION', origen: 'INGRESADO' });
    expect(linea(r, 'E02').valor).toBeCloseTo(cif * 0.1, 6);
    expect(linea(r, 'E03').valor).toBeCloseTo((cif + cif * 0.1) * 0.19, 6);
  });

  it('los gastos locales nunca entran en la base CIF', () => {
    const a = conFlete(importacion());
    const b = conFlete(importacion());
    b.overrides = { ...b.overrides, 'D04-BOD': { valor: 99999 } };
    expect(linea(calcularSimulacion(b, PARAMS, HOY), 'E01').valor).toBe(linea(calcularSimulacion(a, PARAMS, HOY), 'E01').valor);
  });

  it('gastos semilla: máx(mínimo, % × CIF) sobre el CIF', () => {
    const r = calcularSimulacion(conFlete(importacion()), PARAMS, HOY);
    const cif = linea(r, 'E01').valor!;
    expect(linea(r, 'D01-INST').valor).toBeCloseTo(Math.max(78.69, 0.001549 * cif), 6);
    expect(linea(r, 'D04-BOD').valor).toBeCloseTo(Math.max(402.9, 0.006449 * cif), 6);
    expect(linea(r, 'D11-FIN')).toMatchObject({ origen: 'POR_CONFIRMAR' });
    expect(linea(r, 'D11-FIN').valor).toBeCloseTo(0.004 * cif, 6);
  });

  it('comisión de aduanas con mínimo en COP e IVA sobre el servicio', () => {
    const r = calcularSimulacion(conFlete(importacion()), PARAMS, HOY);
    const minimoUsd = 1_850_000 / 3228.3;
    expect(linea(r, 'D06-COM').valor).toBeCloseTo(minimoUsd, 6);
    expect(linea(r, 'D06-COM-IVA').valor).toBeCloseTo(minimoUsd * 0.19, 6);
  });

  it('transporte local solo a Cartagena; otra ciudad queda Pendiente, con la póliza', () => {
    const cartagena = calcularSimulacion(conFlete(importacion()), PARAMS, HOY);
    expect(linea(cartagena, 'D07-CTG').estado).toBe('ESTIMADO');
    const bogota = calcularSimulacion(conFlete(importacion({ destino: { pais: 'CO', ciudad: 'Bogotá' } })), PARAMS, HOY);
    expect(bogota.lineas.some((l) => l.id === 'D07-CTG')).toBe(false);
    expect(linea(bogota, 'D07').estado).toBe('PENDIENTE');
    expect(linea(bogota, 'D07-POL').estado).toBe('ESTIMADO');
  });

  it('otro país de destino: tributos Pendiente (sección 8)', () => {
    const r = calcularSimulacion(conFlete(importacion({ destino: { pais: 'MX', ciudad: 'Veracruz' } })), PARAMS, HOY);
    expect(linea(r, 'E02').estado).toBe('PENDIENTE');
    expect(linea(r, 'D01').estado).toBe('PENDIENTE');
  });

  it('CIF para el importador: flete y seguro no aplican y la base es el valor de compra', () => {
    const r = calcularSimulacion(importacion({ incoterm: 'CIF' }), PARAMS, HOY);
    expect(linea(r, 'C01').estado).toBe('NO_APLICA');
    expect(linea(r, 'E01').valor).toBe(52740);
  });

  it('RN-TRI-03: tarifa exacta, única por partida o rango', () => {
    const tabla = [
      { subpartida: '0901210000', arancel: 0.1, iva: 0.19 },
      { subpartida: '0901220000', arancel: 0.15, iva: 0.05 },
      { subpartida: '8501100000', arancel: 0.05, iva: 0.19 },
    ];
    expect(buscarTarifaTributaria('0901.21.00.00', tabla).tipo).toBe('EXACTA');
    expect(buscarTarifaTributaria('850110', tabla).tipo).toBe('UNICA');
    expect(buscarTarifaTributaria('0901', tabla)).toMatchObject({ tipo: 'RANGO', minimo: 0.1, maximo: 0.15 });
    expect(buscarTarifaTributaria('1234', tabla).tipo).toBe('SIN_TARIFA');
    expect(buscarTarifaTributaria('', tabla).tipo).toBe('SIN_TARIFA');

    const p: Parametros = { ...PARAMS, reglasTributarias: tabla };
    const rango = calcularSimulacion(conFlete(importacion({ partida: '0901' })), p, HOY);
    expect(linea(rango, 'E02').estado).toBe('VALIDACION');
    expect(linea(rango, 'E02').valor).toBeNull();
    expect(linea(rango, 'E02').rango).toHaveLength(2);
    const exacta = calcularSimulacion(conFlete(importacion({ partida: '0901210000' })), p, HOY);
    expect(linea(exacta, 'E02').valor).toBeCloseTo(linea(exacta, 'E01').valor! * 0.1, 6);
  });

  it('IVA = (Base + Arancel + Otros) × tarifa', () => {
    expect(calcularTributos({ baseCop: 1000, arancelPct: 0.1, especificoCop: 5, otrosCop: 20, ivaPct: 0.19 })).toEqual({ arancelCop: 105, ivaCop: (1000 + 105 + 20) * 0.19 });
  });

  it('RN-TRI-07: otros tributos entran en la base del IVA', () => {
    const p: Parametros = { ...PARAMS, reglasTributarias: [{ subpartida: '0901210000', arancel: 0.1, iva: 0.19, otros: [{ nombre: 'Salvaguardia', tipo: 'PORCENTAJE', valor: 0.02 }] }] };
    const r = calcularSimulacion(conFlete(importacion({ partida: '0901210000' })), p, HOY);
    const cif = linea(r, 'E01').valor!;
    expect(linea(r, 'E04').valor).toBeCloseTo(cif * 0.02, 6);
    expect(linea(r, 'E03').valor).toBeCloseTo((cif + cif * 0.1 + cif * 0.02) * 0.19, 6);
  });

  it('la TRM del usuario cambia la conversión de la comisión mínima', () => {
    const sim = conFlete(importacion());
    sim.trmUsuario = 4000;
    expect(linea(calcularSimulacion(sim, PARAMS, HOY), 'D06-COM').valor).toBeCloseTo(1_850_000 / 4000, 6);
  });
});

describe('rubros editables y totales (RN-COS)', () => {
  it('RN-COS-03: sobrescribir conserva el estimado y cambia el origen', () => {
    const sim = casoCafe();
    sim.overrides = { C01: { valor: 2500 } };
    const r = calcularSimulacion(sim, PARAMS, HOY);
    expect(linea(r, 'C01')).toMatchObject({ valor: 2500, valorEstimado: 1900, origen: 'INGRESADO', estado: 'INCLUIDO', sobrescrito: true });
    expect(r.rentabilidad.total).toBe(58235 + 600);
  });
  it('marcar No aplica o validación desde el usuario', () => {
    const sim = casoCafe();
    sim.overrides = { C08: { noAplica: true }, B02: { validacion: true } };
    const r = calcularSimulacion(sim, PARAMS, HOY);
    expect(r.rentabilidad.parcial).toBe(false);
    expect(linea(r, 'B02')).toMatchObject({ estado: 'VALIDACION', suma: true });
  });
  it('RN-COS-07: contingencia sobre B a E, nunca sobre la mercancía', () => {
    const sim = casoCafe();
    sim.contingenciaPct = 0.1;
    expect(linea(calcularSimulacion(sim, PARAMS, HOY), 'F03').valor).toBeCloseTo((1850 + 2425 + 320) * 0.1, 6);
  });
  it('RN-REN-03: comisión sobre el valor de A', () => {
    const sim = casoCafe();
    sim.comisionPct = 0.02;
    expect(linea(calcularSimulacion(sim, PARAMS, HOY), 'F02').valor).toBeCloseTo(52740 * 0.02, 6);
  });
  it('RN-COS-01: rubros Otros del usuario', () => {
    const sim = casoCafe();
    sim.otros = [{ id: 'x1', modulo: 'B', nombre: 'Etiquetado', valor: 100 }, { id: 'x2', modulo: 'D', nombre: 'Sin valor', valor: null }];
    const r = calcularSimulacion(sim, PARAMS, HOY);
    expect(r.subtotales.B).toBe(1950);
    expect(linea(r, 'x2').estado).toBe('PENDIENTE');
    expect(r.rentabilidad.faltantes.map((l) => l.id)).toContain('x2');
  });
  it('RN-COS-09: completitud', () => {
    const r = calcularSimulacion(casoCafe(), PARAMS, HOY);
    const aplicables = r.lineas.filter((l) => l.estado !== 'NO_APLICA' && l.activo && !l.informativo);
    const conValor = aplicables.filter((l) => l.valor != null).length;
    expect(calcularCompletitud(r.lineas, casoCafe())).toBeCloseTo((conValor / (aplicables.length + 3)) * 100, 6);
    const completa = casoCafe();
    completa.operacion.partida = '0901210000';
    completa.operacion.fechaSalida = '2026-12-01';
    completa.productos = completa.productos.map((p) => ({ ...p, descripcion: 'Café' }));
    expect(calcularCompletitud(r.lineas, completa)).toBeCloseTo(((conValor + 3) / (aplicables.length + 3)) * 100, 6);
  });
  it('RN-COS-02: con varias tarifas usa la menor y lista la alternativa; respeta vigencia', () => {
    const p: Parametros = { ...PARAMS, tarifas: [...PARAMS.tarifas, { ...PARAMS.tarifas.find((t) => t.rubro === 'C01')!, id: 'alt', valor: 1500 }] };
    const r = calcularSimulacion(casoCafe(), p, HOY);
    expect(linea(r, 'C01')).toMatchObject({ valor: 1500, tarifaId: 'alt', alternativas: ['demo-c01'] });
    const fuera = casoCafe();
    fuera.operacion.fechaSalida = '2028-01-01';
    expect(linea(calcularSimulacion(fuera, PARAMS, HOY), 'C01').estado).toBe('PENDIENTE');
  });
  it('RN-COS-04: convierte a la moneda de la simulación y guarda el original', () => {
    const sim = casoCafe();
    sim.operacion.moneda = 'COP';
    const l = linea(calcularSimulacion(sim, PARAMS, HOY), 'C01');
    expect(l.valor).toBeCloseTo(1900 * 3228.3, 4);
    expect(l).toMatchObject({ valorOriginal: 1900, monedaOriginal: 'USD', tasa: 3228.3 });
  });
  it('RN-COS-06: tarifa por W/M, por kg y porcentual', () => {
    const base = { ...PARAMS.tarifas[0], rubro: 'C01', origen: { pais: 'CO' }, destino: { pais: 'US' }, equipoId: undefined };
    const lcl = casoCafe();
    lcl.operacion.modalidad = 'MARITIMA_LCL';
    const p1: Parametros = { ...PARAMS, tarifas: [{ ...base, id: 'wm', modalidades: ['MARITIMA_LCL'], unidad: 'POR_WM', valor: 100, minimo: 50 }] };
    expect(linea(calcularSimulacion(lcl, p1, HOY), 'C01').valor).toBeCloseTo(1500, 6);
    const aereo = casoCafe();
    aereo.operacion.modalidad = 'AEREA';
    const p2: Parametros = { ...PARAMS, tarifas: [{ ...base, id: 'kg', modalidades: ['AEREA'], unidad: 'POR_KG', valor: 2 }] };
    expect(linea(calcularSimulacion(aereo, p2, HOY), 'C01').valor).toBeCloseTo(3738 * 2, 6);
    const p3: Parametros = { ...PARAMS, tarifas: [{ ...base, id: 'pct', modalidades: ['AEREA'], unidad: 'PORCENTAJE', base: 'EXW', valor: 0.01 }] };
    expect(linea(calcularSimulacion(aereo, p3, HOY), 'C01').valor).toBeCloseTo(527.4, 6);
  });
});

describe('rentabilidad (RN-REN)', () => {
  it('RN-REN-05: precio solo si la necesidad o la operación lo piden', () => {
    const imp = importacion();
    imp.margenObjetivo = 0.2;
    expect(calcularSimulacion(imp, PARAMS, HOY).rentabilidad.precioSugerido).toBeNull();
    imp.operacion.necesidad = 'PRECIO_VENTA';
    expect(calcularSimulacion(imp, PARAMS, HOY).rentabilidad.precioSugerido).not.toBeNull();
  });
  it('RN-REN-04: margen fuera de 0 ≤ m < 1 no da precio', () => {
    const sim = casoCafe();
    sim.margenObjetivo = 1;
    expect(calcularSimulacion(sim, PARAMS, HOY).rentabilidad.precioSugerido).toBeNull();
  });
  it('RN-REN-06: divisor ausente da null, nunca 0', () => {
    const sim = casoCafe();
    sim.productos = [{ ...sim.productos[0], unidad: 'unidad' }, { ...sim.productos[1], unidad: 'caja' }];
    const r = calcularSimulacion(sim, PARAMS, HOY).rentabilidad;
    expect(r.costoKgNeto).toBeNull();
    expect(r.costoLibra).toBeNull();
    expect(r.costoUnidad).toBeNull();
  });
  it('costo por libra usa 2,20462 y el peso neto de referencias tiene prioridad', () => {
    const r = calcularSimulacion(casoCafe(), PARAMS, HOY).rentabilidad;
    expect(r.costoLibra).toBeCloseTo(58235 / (3420 * 2.20462), 6);
    const sim = casoCafe();
    sim.referencias = sim.referencias.map((x) => ({ ...x, pesoNetoG: 10_000 }));
    expect(pesoNetoKg(sim)).toBe(2190);
  });
});

describe('alertas regulatorias (RN-PRO)', () => {
  const todas = PARAMS.reglasAlerta;
  it('RN-PRO-04: ninguna alerta usa "debe", "no requiere" o "está exento" y todas siguen la plantilla', () => {
    const sim = casoCafe();
    sim.operacion.tipo = 'IMPORTACION';
    sim.operacion.destino = { pais: 'CO', ciudad: 'Cartagena' };
    sim.operacion.origen = { pais: 'US', ciudad: 'Miami' };
    sim.productos[0].categoria = 'COSMETICOS';
    sim.productos[0].requisitos = ['PELIGROSO', 'REFRIGERADO', 'ALTO_VALOR', 'ELECTRICO', 'MAQUINARIA'];
    const r = calcularSimulacion(sim, PARAMS, HOY);
    const regulatorias = r.alertas.filter((a) => a.tipo === 'REGULATORIA');
    expect(regulatorias.length).toBeGreaterThanOrEqual(6);
    for (const a of regulatorias) {
      expect(a.texto.es).toMatch(/podría requerir .*ante .*\. Requiere validación profesional\.$/);
      expect(a.texto.es).not.toMatch(/\bdebe\b|no requiere|está exento/i);
    }
    expect(todas.length).toBe(10);
  });
  it('RN-PRO-05: en importación crea E05; en exportación B09 y E09', () => {
    const sim = importacion({ destino: { pais: 'CO', ciudad: 'Cartagena' } });
    sim.productos[0].categoria = 'ELECTRICO';
    const r = calcularSimulacion(sim, PARAMS, HOY);
    expect(linea(r, 'E05').estado).toBe('VALIDACION');
    expect(r.lineas.some((l) => l.codigo === 'B09')).toBe(false);
    const expo = calcularSimulacion(casoCafe(), PARAMS, HOY);
    expect(linea(expo, 'B09').estado).toBe('VALIDACION');
    expect(linea(expo, 'E09').estado).toBe('VALIDACION');
  });
  it('sin regla regulatoria no se crean rubros de vistos buenos', () => {
    const sim = casoCafe();
    sim.operacion.tipoProducto = 'GENERAL';
    sim.productos = sim.productos.map((p) => ({ ...p, categoria: 'GENERAL', requisitos: [] }));
    const r = calcularSimulacion(sim, PARAMS, HOY);
    expect(r.lineas.some((l) => ['B09', 'E09'].includes(l.codigo))).toBe(false);
    expect(r.lineas.some((l) => l.codigo === 'C08')).toBe(false);
  });
});

describe('simulación (RN-SIM)', () => {
  it('RN-SIM-04: mínimos para calcular', () => {
    expect(faltantesParaCalcular(casoCafe())).toEqual([]);
    const v = casoCafe();
    v.operacion.origen = { pais: '', ciudad: '' };
    v.productos = [];
    v.referencias = [];
    expect(faltantesParaCalcular(v)).toEqual(['ORIGEN', 'PRODUCTO', 'REFERENCIA']);
    const igual = casoCafe();
    igual.operacion.destino = { ...igual.operacion.origen };
    expect(faltantesParaCalcular(igual)).toContain('ORIGEN_IGUAL_DESTINO');
  });

  it('costos de origen: el ejemplo queda cubierto y un pendiente en origen bloquea', () => {
    const r = calcularSimulacion(casoCafe(), PARAMS, '2026-11-10');
    expect(origenPorCubrir(r.lineas)).toEqual([]);
    const sinTarifa = casoCafe();
    sinTarifa.operacion.origen = { pais: 'CO', ciudad: 'Manizales', tipo: 'planta' };
    sinTarifa.operacion.destino = { pais: 'DE', ciudad: 'Hamburgo', tipo: 'bodega' };
    const r2 = calcularSimulacion(sinTarifa, PARAMS, '2026-11-10');
    const pend = origenPorCubrir(r2.lineas);
    expect(pend.length).toBeGreaterThan(0);
    // Marcar "No aplica" o escribir un valor cubre el rubro
    for (const l of pend) sinTarifa.overrides[l.id] = { noAplica: true };
    expect(origenPorCubrir(calcularSimulacion(sinTarifa, PARAMS, '2026-11-10').lineas)).toEqual([]);
    // Si el origen lo paga la contraparte (importación FOB), queda cubierto sin llenar nada
    const impo = casoCafe();
    impo.operacion.tipo = 'IMPORTACION';
    impo.operacion.incoterm = 'FOB';
    expect(origenPorCubrir(calcularSimulacion(impo, PARAMS, '2026-11-10').lineas)).toEqual([]);
  });

  it('transporte tentativo: ruta sin tarifas recibe flete con rango, y se reemplaza con la cotización', () => {
    const v = casoCafe();
    v.operacion.destino = { pais: 'DE', ciudad: 'Hamburgo', tipo: 'bodega' };
    v.operacion.lugarConvenido = 'Hamburgo';
    const r = calcularSimulacion(v, PARAMS, '2026-11-10');
    const flete = r.lineas.find((l) => l.codigo === 'C01')!;
    expect(flete).toMatchObject({ estado: 'ESTIMADO', origen: 'TENTATIVA' });
    expect(flete.tentativo).toMatchObject({ distancia: 'LARGA', unidad: 'EQUIPO' });
    expect(flete.rango![0]).toBeLessThan(flete.valor!);
    expect(flete.rango![1]).toBeGreaterThan(flete.valor!);
    expect(r.tramos.find((t) => t.tramo === 'INTERNACIONAL')).toMatchObject({ pendiente: false, tentativo: true });
    expect(r.alertas.some((a) => a.id === 'transporte-tentativo')).toBe(true);
    // Recargos = 15 % del flete tentativo
    expect(r.lineas.find((l) => l.codigo === 'C02')!.valor).toBeCloseTo(flete.valor! * 0.15, 6);
    // Con la cotización del usuario deja de ser tentativo
    v.overrides.C01 = { valor: 3000 };
    const r2 = calcularSimulacion(v, PARAMS, '2026-11-10');
    expect(r2.lineas.find((l) => l.codigo === 'C01')).toMatchObject({ origen: 'INGRESADO', valor: 3000 });
    expect(r2.lineas.find((l) => l.codigo === 'C02')!.valor).toBeCloseTo(450, 6);
  });

  it('formulario en blanco: el cálculo en vivo no falla y pide los mínimos', () => {
    const v = casoCafe();
    v.operacion = { ...v.operacion, tipo: '' as never, origen: { pais: '', ciudad: '', tipo: '' as never }, destino: { pais: '', ciudad: '', tipo: '' as never }, modalidad: '' as never, incoterm: '' as never, moneda: '' as never, tipoProducto: '' as never, necesidad: '' as never, valorEstimado: null };
    v.productos = v.productos.map((p) => ({ ...p, categoria: '' as never, unidad: '' as never, moneda: '' as never, empaque: '' as never }));
    v.referencias = v.referencias.map((r) => ({ ...r, unidadMedida: '' as never, rotacion: '' as never }));
    expect(() => calcularSimulacion(v, PARAMS, '2026-11-10')).not.toThrow();
    expect(faltantesParaCalcular(v)).toEqual(['TIPO', 'ORIGEN', 'DESTINO', 'INCOTERM', 'MONEDA', 'PRODUCTO']);
  });
  it('estado de las etapas', () => {
    expect(etapasCompletas(casoCafe(), false)).toMatchObject({ operacion: true, producto: true, cubicaje: true, costos: false });
    const s = casoCafe();
    s.referencias[0].pesoNetoG = 99_000;
    expect(etapasCompletas(s, true).cubicaje).toBe(false);
  });
  it('RN-SIM-07: un escenario cambia modalidad, Incoterm o equipo y conserva lo demás', () => {
    const base = casoCafe();
    const esc = aplicarEscenario(base, { modalidad: 'MARITIMA_FCL', incoterm: 'FOB', equipoId: '40' });
    expect(esc.operacion.incoterm).toBe('FOB');
    expect(esc.productos).toBe(base.productos);
    expect(base.operacion.incoterm).toBe('CIF');
    expect(calcularSimulacion(esc, PARAMS, HOY).seleccion?.equipoId).toBe('40');
  });
});
