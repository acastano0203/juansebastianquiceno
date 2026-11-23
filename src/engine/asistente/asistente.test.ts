import { describe, expect, it } from 'vitest';
import { ejemploMadrid } from '../../config/asistente/ejemplo';
import { PAISES_DESTINO } from '../../config/asistente/asistente.config';
import { PARAMS } from '../../config/params';
import { origenPorCubrir } from '../costos';
import { calcularSimulacion, faltantesParaCalcular } from '../simulacion';
import { resolverAsistente, respuestasVacias } from './derivar';
import { incotermPara, preguntaUrgencia, viaPorKilos } from './reglas';

describe('modalidad según los kilos', () => {
  it('≤ 50 kg courier, ≥ 500 kg marítimo y en medio pregunta la urgencia', () => {
    expect(viaPorKilos(50)).toBe('COURIER');
    expect(viaPorKilos(500)).toBe('MARITIMO');
    expect(viaPorKilos(200)).toBeNull();
    expect(preguntaUrgencia(200)).toBe(true);
    expect(preguntaUrgencia(50)).toBe(false);
    expect(viaPorKilos(200, 'URGENTE')).toBe('AEREO');
    expect(viaPorKilos(200, 'ESPERAR')).toBe('MARITIMO');
  });
});

describe('entrega → Incoterm', () => {
  it('puerto de destino es CIF por mar (CIP por aire); oficinas del comprador es DAP', () => {
    expect(incotermPara('PUERTO', 'MARITIMO')).toBe('CIF');
    expect(incotermPara('PUERTO', 'AEREO')).toBe('CIP');
    expect(incotermPara('COMPRADOR', 'MARITIMO')).toBe('DAP');
    expect(incotermPara('', 'MARITIMO')).toBeNull();
  });
});

describe('ejemplo Madrid (LCL, CIF, USD)', () => {
  const a = resolverAsistente(ejemploMadrid(), PARAMS);

  it('deduce todo lo técnico sin preguntarlo', () => {
    expect(a.via).toBe('MARITIMO');
    expect(a.incoterm).toBe('CIF');
    expect(a.sim.operacion).toMatchObject({ modalidad: 'MARITIMA_LCL', incoterm: 'CIF', partida: '0901119000', moneda: 'USD', destino: { pais: 'ES', ciudad: 'Madrid' } });
    expect(a.precioEsReferencia).toBe(true);
  });

  it('se puede calcular sin costos pendientes y cobra los m³ del W/M', () => {
    expect(faltantesParaCalcular(a.sim)).toEqual([]);
    const r = calcularSimulacion(a.sim, a.params, '2026-11-23');
    expect(origenPorCubrir(r.lineas)).toEqual([]);
    expect(r.modalidadEfectiva).toBe('MARITIMA_LCL');
    expect(r.cubicaje.totalPallets).toBe(2);
    expect(r.bases.wmCarga).toBeCloseTo(a.cubicaje!.wm.cobrable, 6);
    expect(r.rentabilidad.parcial).toBe(false);
  });
});

describe('FCL derivado', () => {
  it('fija el contenedor y la cantidad elegidos por el cubicaje', () => {
    const r = { ...ejemploMadrid(), destino: { pais: 'US', ciudad: 'Miami' }, kilos: 50_000, pallet: 'NO' as const };
    const a = resolverAsistente(r, PARAMS);
    expect(a.sim.equipoId).toBe('40');
    expect(a.sim.equipoCantidad).toBe(2);
    const res = calcularSimulacion(a.sim, a.params, '2026-11-23');
    expect(res.seleccion).toMatchObject({ equipoId: '40', cantidad: 2 });
  });

  it('entrega en oficinas del comprador (DAP) también queda sin pendientes', () => {
    const a = resolverAsistente({ ...ejemploMadrid(), entrega: 'COMPRADOR' }, PARAMS);
    expect(a.incoterm).toBe('DAP');
    const res = calcularSimulacion(a.sim, a.params, '2026-11-23');
    expect(res.rentabilidad.parcial).toBe(false);
  });

  it('la TRM del día entra con su fuente, no como tasa escrita por el usuario', () => {
    const trm = { valor: 3461.92, fecha: '2026-11-21', fuente: 'TRM · datos.gov.co' };
    const a = resolverAsistente({ ...ejemploMadrid(), trm }, PARAMS);
    const res = calcularSimulacion(a.sim, a.params, '2026-11-23');
    expect(res.tasaReferencia).toBe(3461.92);
    expect(res.fuenteTasa).toBe('TRM · datos.gov.co');
  });

  it('todo país de destino tiene costos tentativos (si no, "Ver mi resultado" queda bloqueado)', () => {
    const sinZona = PAISES_DESTINO.filter((p) => !PARAMS.fleteTentativo?.zonas[p]);
    expect(sinZona).toEqual([]);
    for (const pais of PAISES_DESTINO) {
      const a = resolverAsistente({ ...ejemploMadrid(), destino: { pais, ciudad: '' } }, PARAMS);
      expect(origenPorCubrir(calcularSimulacion(a.sim, a.params, '2026-11-23').lineas), pais).toEqual([]);
    }
  });

  it('sin respuestas no hay cubicaje ni modalidad', () => {
    const a = resolverAsistente(respuestasVacias(), PARAMS);
    expect(a.cubicaje).toBeNull();
    expect(a.sim.operacion.modalidad).toBe('POR_EVALUAR');
  });
});
