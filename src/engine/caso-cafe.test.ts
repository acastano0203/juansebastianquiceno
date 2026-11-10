// Prueba de regresión obligatoria (reglas de negocio, sección 16): café Pereira → Miami.
import { describe, expect, it } from 'vitest';
import { casoCafe } from '../config/casoCafe';
import { PARAMS } from '../config/params';
import { calcularSimulacion, estaVencida } from './simulacion';
import { posicionesPiso } from './cubicaje';
import { formatoDinero, formatoM3, formatoNumero, formatoPct } from './unidades';
import type { Simulacion } from './types';

const HOY = '2026-11-09';
const correr = (sim: Simulacion = casoCafe(), hoy = HOY) => calcularSimulacion(sim, PARAMS, hoy);

describe('caso café · cubicaje', () => {
  const r = correr();
  const [ref1, ref2] = r.cubicaje.referencias;
  const veinte = r.equipos.find((e) => e.equipoId === '20')!;

  it('volumen suelto 6,27 + 3,60 = 9,87 m³', () => {
    expect(ref1.volumenSueltoMm3 / 1e9).toBeCloseTo(6.27264, 5);
    expect(ref2.volumenSueltoMm3 / 1e9).toBeCloseTo(3.6, 5);
    expect(formatoM3(r.cubicaje.volumenSueltoCm3)).toBe('9,87 m³');
  });

  it('peso bruto de bultos 3.738 kg', () => {
    expect(r.cubicaje.pesoBrutoG).toBe(3_738_000);
  });

  it('referencia 1: 6 por capa × 3 capas → 6 pallets (cinco de 150 cm y uno de 105 cm)', () => {
    expect(ref1.bultosPorCapa).toBe(6);
    expect(ref1.capasPorPallet).toBe(3);
    expect(ref1.numPallets).toBe(6);
    expect(ref1.pallets.map((g) => [g.cantidad, g.alturaMm])).toEqual([[5, 1500], [1, 1050]]);
  });

  it('referencia 2: 9 por capa × 5 capas → 3 pallets (140, 140 y 115 cm)', () => {
    expect(ref2.bultosPorCapa).toBe(9);
    expect(ref2.capasPorPallet).toBe(5);
    expect(ref2.numPallets).toBe(3);
    expect(ref2.pallets.map((g) => [g.cantidad, g.alturaMm])).toEqual([[2, 1400], [1, 1150]]);
  });

  it('9 pallets, paletizado 10,26 + 4,74 = 15,00 m³ (no 17,3 del deck)', () => {
    expect(r.cubicaje.totalPallets).toBe(9);
    expect(ref1.volumenCargaMm3 / 1e9).toBeCloseTo(10.26, 6);
    expect(ref2.volumenCargaMm3 / 1e9).toBeCloseTo(4.74, 6);
    expect(r.cubicaje.volumenCargaCm3).toBe(15_000_000);
    expect(formatoM3(r.cubicaje.volumenCargaCm3)).toBe('15,00 m³');
  });

  it('peso bruto paletizado 3.963 kg', () => {
    expect(r.cubicaje.pesoCargaG).toBe(3_963_000);
  });

  it('base LCL 9,87 suelto y 15,00 paletizado', () => {
    expect(r.bases.wmSuelto).toBeCloseTo(9.87264, 5);
    expect(r.bases.wmCarga).toBe(15);
  });

  it('aéreo: volumétrico 1.645,44 kg, cobrable 3.738,00 kg', () => {
    expect(formatoNumero(r.bases.aereoVolumetricoKg, 2)).toBe('1.645,44');
    expect(formatoNumero(r.bases.aereoCobrableKg, 2)).toBe('3.738,00');
  });

  it("9 posiciones de piso en el 20' (8 + 1 girado), factible", () => {
    expect(posicionesPiso(5890, 2350, 1200, 1000)).toBe(9);
    expect(veinte.posicionesPiso).toBe(9);
    expect(veinte.factible).toBe(true);
  });

  it("ocupación del 20': 45,3 % por volumen (no 52 % del deck) y 14,1 % por peso", () => {
    expect(formatoPct(veinte.ocupacionVolumen)).toBe('45,3 %');
    expect(formatoPct(veinte.ocupacionPeso)).toBe('14,1 %');
  });

  it("equipo recomendado: 20' estándar, también sin tarifas", () => {
    expect(r.seleccion).toMatchObject({ equipoId: '20', cantidad: 1 });
    const sinTarifas = calcularSimulacion(casoCafe(), { ...PARAMS, tarifas: [] }, HOY);
    expect(sinTarifas.seleccion?.equipoId).toBe('20');
    expect(r.modalidadEfectiva).toBe('MARITIMA_FCL');
  });

  it('alerta de paletización (+52 %) y comparativo POR_EVALUAR sin terrestre', () => {
    expect(r.alertas.find((a) => a.id === 'paletizacion-lcl')?.texto.es).toBe('La paletización eleva la base LCL; compare contra FCL (+52 %).');
    expect(r.comparativo.map((o) => o.id)).toEqual(['LCL_SUELTO', 'LCL_PALETIZADO', 'FCL', 'AEREO']);
  });

  it('los 9 pallets se distribuyen dentro del contenedor sin salirse', () => {
    expect(r.bloques).toHaveLength(9);
    for (const b of r.bloques) {
      expect(b.x + b.dx).toBeLessThanOrEqual(5890);
      expect(b.z + b.dz).toBeLessThanOrEqual(2350);
      expect(b.dy).toBeLessThanOrEqual(2390);
    }
    for (let i = 0; i < r.bloques.length; i++) {
      for (let j = i + 1; j < r.bloques.length; j++) {
        const [a, b] = [r.bloques[i], r.bloques[j]];
        const solapan = a.x < b.x + b.dx && b.x < a.x + a.dx && a.z < b.z + b.dz && b.z < a.z + a.dz;
        expect(solapan).toBe(false);
      }
    }
  });
});

describe('caso café · costos', () => {
  const r = correr();
  const linea = (codigo: string) => r.lineas.find((l) => l.codigo === codigo)!;

  it('subtotales por módulo de la sección 16', () => {
    expect(r.subtotales).toEqual({ A: 52740, B: 1850, C: 2425, D: 0, E: 320, F: 900 });
  });

  it('total USD 58.235,00 rotulado parcial solo por la fumigación', () => {
    expect(r.rentabilidad.total).toBe(58235);
    expect(formatoDinero(r.rentabilidad.total, 'USD')).toBe('USD 58.235,00');
    expect(r.rentabilidad.parcial).toBe(true);
    expect(r.rentabilidad.faltantes.map((l) => l.codigo)).toEqual(['C08']);
  });

  it('estados y origen del dato esperados', () => {
    expect(linea('A01')).toMatchObject({ estado: 'INCLUIDO', origen: 'INGRESADO' });
    expect(linea('C01')).toMatchObject({ estado: 'ESTIMADO', origen: 'TARIFA', valor: 1900 });
    expect(linea('C06')).toMatchObject({ estado: 'ESTIMADO', origen: 'ESTIMACION', valor: 175 });
    expect(linea('C08')).toMatchObject({ estado: 'PENDIENTE', origen: 'POR_CONFIRMAR', valor: null });
    expect(linea('E09')).toMatchObject({ estado: 'VALIDACION', valor: 320 });
    expect(linea('B09')).toMatchObject({ estado: 'VALIDACION', valor: null });
    expect(linea('D01').estado).toBe('NO_APLICA');
    expect(linea('D07').estado).toBe('NO_APLICA');
    expect(linea('E02').estado).toBe('NO_APLICA');
  });

  it('USD 17,03 por kg neto, parcial', () => {
    expect(formatoNumero(r.rentabilidad.costoKgNeto!, 2)).toBe('17,03');
    expect(r.rentabilidad.parcial).toBe(true);
  });

  it('precio CIF sugerido USD 71.018,29 con m = 18 %, utilidad 12.783,29', () => {
    expect(r.rentabilidad.mostrarPrecio).toBe(true);
    expect(formatoDinero(r.rentabilidad.precioSugerido!, 'USD')).toBe('USD 71.018,29');
    expect(formatoDinero(r.rentabilidad.utilidad!, 'USD')).toBe('USD 12.783,29');
  });

  it('tramos del resultado: destino y entrega no aplican con CIF', () => {
    const tramos = Object.fromEntries(r.tramos.map((t) => [t.tramo, t]));
    expect(tramos.ORIGEN).toMatchObject({ valor: 1850, aplica: true });
    expect(tramos.INTERNACIONAL).toMatchObject({ valor: 2425, pendiente: true });
    expect(tramos.DESTINO.aplica).toBe(false);
    expect(tramos.ENTREGA.aplica).toBe(false);
    expect(tramos.TRIBUTOS.valor).toBe(320);
  });

  it('prioridad de alertas: regulatoria, costo y luego datos (RN-RES-02)', () => {
    expect(r.alertas.slice(0, 3).map((a) => a.tipo)).toEqual(['REGULATORIA', 'COSTO', 'DATOS']);
    expect(r.alertas[0].id).toBe('regulatoria-alimentos-export-us');
  });
});

describe('caso café · criterios adicionales', () => {
  it('al cambiar a FOB el total baja exactamente 2.425,00 y todo el módulo C pasa a No aplica', () => {
    const sim = casoCafe();
    sim.operacion.incoterm = 'FOB';
    const fob = correr(sim);
    expect(correr().rentabilidad.total - fob.rentabilidad.total).toBe(2425);
    expect(fob.rentabilidad.total).toBe(55810);
    for (const l of fob.lineas.filter((x) => x.modulo === 'C')) expect(l.estado).toBe('NO_APLICA');
    expect(fob.rentabilidad.parcial).toBe(false);
  });

  it('al cambiar a aérea con CIF aparece la advertencia RN-OPE-03', () => {
    const sim = casoCafe();
    sim.operacion.modalidad = 'AEREA';
    const texto = correr(sim).alertas.find((a) => a.id === 'incoterm-modalidad')?.texto.es;
    expect(texto).toContain('FCA, CPT o CIP');
    expect(correr().alertas.some((a) => a.id === 'incoterm-modalidad')).toBe(false);
  });

  it('al vencer la tarifa de flete, la simulación queda vencida (RN-SIM-09)', () => {
    const r = correr();
    expect(r.vigenciaMinima).toBe('2027-06-30');
    expect(estaVencida(r.vigenciaMinima, HOY)).toBe(false);
    expect(estaVencida(r.vigenciaMinima, '2027-07-01')).toBe(true);
    // Y un cálculo nuevo con fecha posterior ya no encuentra tarifa
    expect(correr(casoCafe(), '2027-07-01').lineas.find((l) => l.codigo === 'C01')?.estado).toBe('PENDIENTE');
  });

  it('recalcular con las mismas entradas y parámetros da el mismo resultado (RN-SIM-05)', () => {
    expect(correr()).toEqual(correr());
  });
});
