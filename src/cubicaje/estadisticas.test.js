import { describe, expect, it } from 'vitest';
import { filtrar, kpis, paginas, porMes, ultimos } from './estadisticas.js';

const AHORA = new Date(2026, 9, 28);
const cub = (nombre, fecha, extra = {}) => ({
  nombre,
  createdAt: fecha.toISOString(),
  origen: 'admin',
  estado: 'listo',
  resultado: { metricas: { ocupacion: 80, pesoTotal: 1000 } },
  ...extra,
});

const lista = [
  cub('Miami', new Date(2026, 9, 27)),
  cub('Hamburgo', new Date(2026, 9, 2), { resultado: { metricas: { ocupacion: 90, pesoTotal: 500 } } }),
  cub('Borrador', new Date(2026, 8, 15), { estado: 'borrador', resultado: null }),
  cub('Diag', new Date(2026, 6, 1), { origen: 'diagnostico' }),
  cub('Viejo', new Date(2025, 8, 1)),
];

describe('estadísticas de cubicajes', () => {
  it('calcula los indicadores', () => {
    const k = kpis(lista, AHORA);
    expect(k.total).toBe(5);
    expect(k.delMes).toBe(2);
    expect(k.mesAnterior).toBe(1);
    expect(k.ocupacionPromedio).toBeCloseTo((80 + 90 + 80 + 80) / 4);
    // El de septiembre de 2025 queda fuera de los últimos 12 meses
    expect(k.pesoTotal12m).toBe(2500);
  });

  it('agrupa los últimos 12 meses terminando en el mes en curso', () => {
    const m = porMes(lista, AHORA);
    expect(m).toHaveLength(12);
    expect(m[11]).toMatchObject({ anio: 2026, mes: 9, cantidad: 2, ocupacion: 85 });
    expect(m[10]).toMatchObject({ mes: 8, cantidad: 1, ocupacion: null });
    expect(m[0]).toMatchObject({ anio: 2025, mes: 10 });
  });

  it('ordena los últimos', () => {
    expect(ultimos(lista, 2).map((c) => c.nombre)).toEqual(['Miami', 'Hamburgo']);
  });

  it('filtra por texto, fecha, origen y estado', () => {
    expect(filtrar(lista, { q: 'mia' }, AHORA).map((c) => c.nombre)).toEqual(['Miami']);
    expect(filtrar(lista, { fecha: 'mes' }, AHORA)).toHaveLength(2);
    expect(filtrar(lista, { fecha: '90' }, AHORA)).toHaveLength(3);
    expect(filtrar(lista, { fecha: '2025' }, AHORA).map((c) => c.nombre)).toEqual(['Viejo']);
    expect(filtrar(lista, { origen: 'diagnostico' }, AHORA).map((c) => c.nombre)).toEqual(['Diag']);
    expect(filtrar(lista, { estado: 'borrador' }, AHORA).map((c) => c.nombre)).toEqual(['Borrador']);
  });

  it('pagina con huecos', () => {
    expect(paginas(1, 1)).toEqual([1]);
    expect(paginas(5, 12)).toEqual([1, '…', 4, 5, 6, '…', 12]);
    expect(paginas(2, 4)).toEqual([1, 2, 3, 4]);
  });
});
