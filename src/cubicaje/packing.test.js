import { describe, expect, it } from 'vitest';
import { cubicar } from './packing.js';
import { CONTENEDORES, APOYO_MINIMO } from './config.js';
import { validarCubicaje, validarProducto } from './validate.js';

const C20 = CONTENEDORES['20'];
const EPS = 1e-6;

function prod(id, largo, ancho, alto, peso, cantidad, extra = {}) {
  return { id, nombre: id, largo, ancho, alto, peso, cantidad, ...extra };
}

function solapa(a0, a1, b0, b1) {
  return a0 < b1 - EPS && b0 < a1 - EPS;
}

// Revisa que el resultado sea físicamente posible (junta los errores y los compara una sola vez)
function invariantes(cont, productos, r) {
  const byId = Object.fromEntries(productos.map((p) => [p.id, p]));
  const cs = r.colocadas;
  const errores = [];
  cs.forEach((c, i) => {
    if (c.x < -EPS || c.y < -EPS || c.z < -EPS || c.x + c.dx > cont.largo + EPS || c.y + c.dy > cont.alto + EPS || c.z + c.dz > cont.ancho + EPS) errores.push(`caja ${i} fuera del contenedor`);
    const p = byId[c.productoId];
    if ([c.dx, c.dy, c.dz].sort((a, b) => a - b).join() !== [p.largo, p.ancho, p.alto].sort((a, b) => a - b).join()) errores.push(`caja ${i} con medidas cambiadas`);
  });
  for (let i = 0; i < cs.length; i++) {
    const a = cs[i];
    let apoyo = 0;
    for (let j = 0; j < cs.length; j++) {
      if (i === j) continue;
      const b = cs[j];
      if (j > i && solapa(a.x, a.x + a.dx, b.x, b.x + b.dx) && solapa(a.y, a.y + a.dy, b.y, b.y + b.dy) && solapa(a.z, a.z + a.dz, b.z, b.z + b.dz)) {
        errores.push(`cajas ${i} y ${j} se solapan`);
      }
      if (Math.abs(b.y + b.dy - a.y) < EPS) {
        const ox = Math.max(0, Math.min(a.x + a.dx, b.x + b.dx) - Math.max(a.x, b.x));
        const oz = Math.max(0, Math.min(a.z + a.dz, b.z + b.dz) - Math.max(a.z, b.z));
        if (ox * oz > EPS) {
          apoyo += ox * oz;
          if (byId[a.productoId].peso > byId[b.productoId].peso) errores.push(`caja ${i} más pesada que la ${j} que la sostiene`);
        }
      }
    }
    if (a.y > EPS && apoyo < APOYO_MINIMO * a.dx * a.dz - EPS) errores.push(`caja ${i} sin apoyo suficiente`);
  }
  expect(errores.slice(0, 10)).toEqual([]);
  const total = productos.reduce((s, p) => s + p.cantidad, 0);
  const fuera = r.noColocadas.reduce((s, n) => s + n.cantidad, 0);
  expect(cs.length + fuera).toBe(total);
  expect(r.metricas.cajasColocadas).toBe(cs.length);
}

describe('cubicar', () => {
  it('todo cabe: coloca todas las cajas y calcula volumen y peso', () => {
    const productos = [prod('a', 100, 100, 100, 50, 10), prod('b', 60, 40, 50, 20, 8)];
    const r = cubicar(C20, productos);
    invariantes(C20, productos, r);
    expect(r.noColocadas).toEqual([]);
    expect(r.colocadas).toHaveLength(18);
    const vol = 10 * 1 + 8 * 0.6 * 0.4 * 0.5;
    expect(r.metricas.volumenUsado).toBeCloseTo(vol, 6);
    expect(r.metricas.volumenContenedor).toBeCloseTo((589 * 235 * 239) / 1e6, 6);
    expect(r.metricas.ocupacion).toBeCloseTo((vol / r.metricas.volumenContenedor) * 100, 6);
    expect(r.metricas.pesoTotal).toBe(10 * 50 + 8 * 20);
  });

  it('sobra carga por espacio: informa cuántas cajas y de qué producto quedaron por fuera', () => {
    // Cubos de 200 cm: en un 20' caben 2 (589 de largo, 235 de ancho, 239 de alto)
    const productos = [prod('cubo', 200, 200, 200, 100, 5)];
    const r = cubicar(C20, productos);
    invariantes(C20, productos, r);
    expect(r.colocadas).toHaveLength(2);
    expect(r.noColocadas).toEqual([{ productoId: 'cubo', nombre: 'cubo', cantidad: 3, motivo: 'espacio' }]);
  });

  it('sobra carga por peso: no supera la carga máxima del contenedor', () => {
    const productos = [prod('pesada', 50, 50, 50, 1000, 30)];
    const r = cubicar(C20, productos);
    invariantes(C20, productos, r);
    expect(r.colocadas).toHaveLength(28);
    expect(r.metricas.pesoTotal).toBeLessThanOrEqual(C20.cargaMax);
    expect(r.noColocadas).toEqual([{ productoId: 'pesada', nombre: 'pesada', cantidad: 2, motivo: 'carga_maxima' }]);
  });

  it('rotación bloqueada: una caja más alta que el contenedor solo entra acostada', () => {
    const libre = [prod('poste', 100, 100, 300, 30, 2)];
    const r1 = cubicar(C20, libre);
    invariantes(C20, libre, r1);
    expect(r1.colocadas).toHaveLength(2);

    const soloX = [prod('poste', 100, 100, 300, 30, 2, { limitaRotX: true })];
    const r2 = cubicar(C20, soloX);
    invariantes(C20, soloX, r2);
    expect(r2.colocadas).toHaveLength(2);
    for (const c of r2.colocadas) expect(c.orientacion[1]).not.toBe('w');

    const bloqueada = [prod('poste', 100, 100, 300, 30, 2, { limitaRotX: true, limitaRotZ: true })];
    const r3 = cubicar(C20, bloqueada);
    expect(r3.colocadas).toHaveLength(0);
    expect(r3.noColocadas).toEqual([{ productoId: 'poste', nombre: 'poste', cantidad: 2, motivo: 'espacio' }]);
  });

  it('rotación bloqueada: la caja conserva su altura original', () => {
    const productos = [prod('plana', 120, 80, 30, 10, 40, { limitaRotX: true, limitaRotZ: true })];
    const r = cubicar(C20, productos);
    invariantes(C20, productos, r);
    for (const c of r.colocadas) expect(c.dy).toBe(30);
  });

  it('límite de peso apilado: si la cara superior no soporta peso, no se apila nada encima', () => {
    // En el piso de un 20' caben 5 × 2 cubos de 100 cm
    const productos = [prod('fragil', 100, 100, 100, 40, 15, { limitePeso: { activo: true, superior: 0, frontal: 0 } })];
    const r = cubicar(C20, productos);
    invariantes(C20, productos, r);
    expect(r.colocadas).toHaveLength(10);
    for (const c of r.colocadas) expect(c.y).toBe(0);
    expect(r.noColocadas).toEqual([{ productoId: 'fragil', nombre: 'fragil', cantidad: 5, motivo: 'peso_apilado' }]);
  });

  it('límite de peso apilado: respeta los kg que soporta cada caja', () => {
    // Cubos de 50 cm y 50 kg: cabrían 4 niveles, pero la de abajo soporta 100 kg → máximo 3 niveles
    const productos = [prod('caja', 50, 50, 50, 50, 200, { limitaRotX: true, limitaRotZ: true, limitePeso: { activo: true, superior: 100 } })];
    const r = cubicar(C20, productos);
    invariantes(C20, productos, r);
    const niveles = Math.max(...r.colocadas.map((c) => Math.round(c.y / 50))) + 1;
    expect(niveles).toBe(3);
    for (const a of r.colocadas) {
      const encima = r.colocadas.filter((b) => b.y > a.y + EPS && Math.abs(b.x - a.x) < EPS && Math.abs(b.z - a.z) < EPS);
      expect(encima.length * 50).toBeLessThanOrEqual(100);
    }
    expect(r.noColocadas[0].motivo).toBe('peso_apilado');
  });

  it('las cajas más pesadas quedan abajo', () => {
    const productos = [prod('liviana', 60, 60, 60, 5, 60), prod('pesada', 60, 60, 60, 80, 60), prod('media', 60, 60, 60, 30, 60)];
    const r = cubicar(C20, productos);
    invariantes(C20, productos, r);
    const yProm = (id) => {
      const cs = r.colocadas.filter((c) => c.productoId === id);
      return cs.reduce((s, c) => s + c.y, 0) / cs.length;
    };
    expect(yProm('pesada')).toBeLessThanOrEqual(yProm('media'));
  });

  it('3.000 cajas en menos de 2 segundos', () => {
    const C40 = CONTENEDORES['40HC'];
    const productos = [
      prod('a', 40, 30, 30, 8, 1500),
      prod('b', 35, 35, 20, 5, 1000, { limitePeso: { activo: true, superior: 60 } }),
      prod('c', 120, 80, 60, 45, 500, { limitaRotX: true }),
    ];
    const t0 = performance.now();
    const r = cubicar(C40, productos);
    const ms = performance.now() - t0;
    expect(ms).toBeLessThan(2000);
    invariantes(C40, productos, r);
  }, 30000);
});

describe('validar', () => {
  it('exige obligatorios y números mayores que cero', () => {
    const r = validarProducto({ nombre: ' ', largo: '0', ancho: '-2', alto: 'x', peso: '', cantidad: 1.5 });
    expect(r.ok).toBe(false);
    expect(r.errores).toEqual({ nombre: 'requerido', largo: 'positivo', ancho: 'positivo', alto: 'requerido', peso: 'requerido', cantidad: 'entero' });
  });

  it('acepta coma decimal y normaliza', () => {
    const r = validarProducto({ nombre: 'Café', largo: '60,5', ancho: 40, alto: 30, peso: '12,3', cantidad: '4', color: 'rojo' });
    expect(r.ok).toBe(true);
    expect(r.valor).toMatchObject({ largo: 60.5, peso: 12.3, cantidad: 4, color: '#DDBD62', tipoPaquete: 'box' });
  });

  it('rechaza tipos de paquete no habilitados', () => {
    expect(validarProducto({ nombre: 'x', largo: 1, ancho: 1, alto: 1, peso: 1, tipoPaquete: 'barrel' }).errores.tipoPaquete).toBe('tipo');
  });

  it('aplica los límites de productos y cajas', () => {
    const lim = { productos: 2, cajas: 10, dimension: 1500, peso: 30000 };
    const p = { nombre: 'x', largo: 1, ancho: 1, alto: 1, peso: 1, cantidad: 6 };
    const r = validarCubicaje({ nombre: 'n', tipoContenedor: '20', productos: [p, p, p] }, lim);
    expect(r.errores).toEqual(expect.arrayContaining([{ campo: 'productos', codigo: 'maximo' }, { campo: 'cajas', codigo: 'maximo' }]));
    expect(validarCubicaje({ nombre: 'n', tipoContenedor: '45', productos: [p] }, lim).errores).toContainEqual({ campo: 'tipoContenedor', codigo: 'tipo' });
  });
});
