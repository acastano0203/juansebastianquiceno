// Acomodo de cajas en un contenedor: heurística de puntos extremos (first-fit).
// Módulo puro: sin React ni DOM; lo usan el navegador y la función del servidor.
//
// Ejes: x = largo del contenedor (desde la pared del fondo hacia la puerta),
//       y = alto (desde el piso), z = ancho. Todo en cm y kg.
//
// Producto de entrada:
//   { id, nombre, largo, ancho, alto, peso, cantidad,
//     limitaRotX, limitaRotZ,                       // true = no se puede voltear sobre ese eje
//     limitePeso: { activo, superior, frontal } }   // kg que soporta encima según la cara que queda arriba
//
// La rotación sobre el eje vertical siempre está permitida (la caja sigue de pie).
// Voltear sobre X deja el ancho como alto; voltear sobre Z deja el largo como alto.

import { APOYO_MINIMO, getContenedor } from './config.js';

const EPS = 1e-6;

// Cada orientación dice qué dimensión de la caja queda en x, y, z
const ORIENTACIONES = [
  { id: 'lhw', ejes: ['largo', 'alto', 'ancho'] },
  { id: 'whl', ejes: ['ancho', 'alto', 'largo'] },
  { id: 'lwh', ejes: ['largo', 'ancho', 'alto'] },
  { id: 'hwl', ejes: ['alto', 'ancho', 'largo'] },
  { id: 'hlw', ejes: ['alto', 'largo', 'ancho'] },
  { id: 'wlh', ejes: ['ancho', 'largo', 'alto'] },
];

export function orientacionesPermitidas(p) {
  return ORIENTACIONES.filter(({ ejes }) => {
    if (ejes[1] === 'ancho') return !p.limitaRotX;
    if (ejes[1] === 'largo') return !p.limitaRotZ;
    return true;
  });
}

// Kg que soporta encima la caja según qué dimensión quedó vertical
export function capacidadEncima(p, vertical) {
  const lp = p.limitePeso;
  if (!lp || !lp.activo) return Infinity;
  const sup = lp.superior > 0 || lp.superior === 0 ? Number(lp.superior) : Infinity;
  const fro = lp.frontal > 0 || lp.frontal === 0 ? Number(lp.frontal) : Infinity;
  if (vertical === 'alto') return sup;
  if (vertical === 'largo') return fro;
  return Math.min(sup, fro);
}

function solapa(a0, a1, b0, b1) {
  return a0 < b1 - EPS && b0 < a1 - EPS;
}

function overlapLen(a0, a1, b0, b1) {
  return Math.max(0, Math.min(a1, b1) - Math.max(a0, b0));
}

// Índice espacial simple: cubetas a lo largo de x
class Indice {
  constructor(largo, paso = 60) {
    this.paso = paso;
    this.cubetas = Array.from({ length: Math.ceil(largo / paso) + 1 }, () => []);
  }
  rango(x0, x1) {
    const a = Math.max(0, Math.floor(x0 / this.paso));
    const b = Math.min(this.cubetas.length - 1, Math.floor((x1 - EPS) / this.paso));
    return [a, b];
  }
  agregar(i, c) {
    const [a, b] = this.rango(c.x, c.x + c.dx);
    for (let k = a; k <= b; k++) this.cubetas[k].push(i);
  }
  cerca(x0, x1, fn) {
    const [a, b] = this.rango(x0, x1);
    const vistos = a === b ? null : new Set();
    for (let k = a; k <= b; k++) {
      for (const i of this.cubetas[k]) {
        if (vistos) {
          if (vistos.has(i)) continue;
          vistos.add(i);
        }
        if (fn(i) === false) return;
      }
    }
  }
}

function cmpPunto(a, b) {
  return a.x - b.x || a.y - b.y || a.z - b.z;
}

/**
 * @param {{largo:number, ancho:number, alto:number, cargaMax:number}} contenedor
 * @param {Array} productos
 * @returns {{ colocadas, noColocadas, metricas }}
 */
export function cubicar(contenedor, productos) {
  const L = contenedor.largo;
  const H = contenedor.alto;
  const W = contenedor.ancho;
  const cargaMax = contenedor.cargaMax ?? Infinity;

  // Una entrada por caja; más pesadas primero (quedan abajo), luego las más voluminosas
  const items = [];
  productos.forEach((p, pi) => {
    for (let k = 0; k < p.cantidad; k++) items.push({ p, pi });
  });
  items.sort((a, b) => b.p.peso - a.p.peso || b.p.largo * b.p.ancho * b.p.alto - a.p.largo * a.p.ancho * a.p.alto || a.pi - b.pi);

  const cajas = []; // { pi, x, y, z, dx, dy, dz, o, peso, cap, carga, apoyos: [[j, fraccion]] }
  const indice = new Indice(L);
  let puntos = [{ x: 0, y: 0, z: 0, fallas: new Set(), pend: new Map() }];
  // Versión de cada nivel (altura donde termina alguna caja): cambia cuando aparece una caja nueva
  // con la cara superior a esa altura, que es lo único que puede dar apoyo o repartir distinto el peso
  const niveles = new Map();
  const nivel = (y) => niveles.get(+y.toFixed(4)) || 0;
  const clavesPuntos = new Set(['0,0,0']);
  let pesoTotal = 0;
  const fallidos = new Map(); // pi -> { cantidad, motivo }

  const choca = (x, y, z, dx, dy, dz) => {
    let hit = false;
    indice.cerca(x, x + dx, (i) => {
      const c = cajas[i];
      if (solapa(x, x + dx, c.x, c.x + c.dx) && solapa(y, y + dy, c.y, c.y + c.dy) && solapa(z, z + dz, c.z, c.z + c.dz)) {
        hit = true;
        return false;
      }
    });
    return hit;
  };

  // Cajas sobre las que se apoyaría la base; null si el apoyo es insuficiente
  const apoyos = (x, y, z, dx, dz) => {
    if (y < EPS) return [];
    const res = [];
    let area = 0;
    indice.cerca(x, x + dx, (i) => {
      const c = cajas[i];
      if (Math.abs(c.y + c.dy - y) > EPS) return;
      const a = overlapLen(x, x + dx, c.x, c.x + c.dx) * overlapLen(z, z + dz, c.z, c.z + c.dz);
      if (a > EPS) {
        res.push([i, a]);
        area += a;
      }
    });
    if (area < APOYO_MINIMO * dx * dz - EPS) return null;
    return res.map(([i, a]) => [i, a / area]);
  };

  // Reparte el peso hacia abajo por la cadena de apoyos. Una caja siempre se apoya en cajas
  // colocadas antes (índice menor), así que se procesan de mayor a menor índice: cuando se
  // reparte la carga de una caja, ya recibió todo lo que le llega desde arriba.
  const repartir = (lista, kg) => {
    const acum = new Map();
    const pendientes = [];
    for (const [j, f] of lista) {
      if (!acum.has(j)) pendientes.push(j);
      acum.set(j, (acum.get(j) || 0) + kg * f);
    }
    while (pendientes.length) {
      let m = 0;
      for (let k = 1; k < pendientes.length; k++) if (pendientes[k] > pendientes[m]) m = k;
      const j = pendientes[m];
      pendientes[m] = pendientes[pendientes.length - 1];
      pendientes.pop();
      const recibido = acum.get(j);
      for (const [s, f] of cajas[j].apoyos) {
        if (!acum.has(s)) pendientes.push(s);
        acum.set(s, (acum.get(s) || 0) + recibido * f);
      }
    }
    return acum;
  };

  const agregarPunto = (x, y, z) => {
    if (x >= L - EPS || y >= H - EPS || z >= W - EPS) return;
    const k = `${+x.toFixed(4)},${+y.toFixed(4)},${+z.toFixed(4)}`;
    if (clavesPuntos.has(k)) return;
    clavesPuntos.add(k);
    const pt = { x, y, z, fallas: new Set(), pend: new Map() };
    let lo = 0;
    let hi = puntos.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (cmpPunto(puntos[mid], pt) < 0) lo = mid + 1;
      else hi = mid;
    }
    puntos.splice(lo, 0, pt);
  };

  // Proyecciones del punto hacia el piso, el fondo y la pared lateral
  const bajarY = (x, y, z) => {
    let top = 0;
    indice.cerca(x, x + EPS * 2, (i) => {
      const c = cajas[i];
      if (x >= c.x - EPS && x < c.x + c.dx - EPS && z >= c.z - EPS && z < c.z + c.dz - EPS && c.y + c.dy <= y + EPS) top = Math.max(top, c.y + c.dy);
    });
    return top;
  };
  const atrasX = (x, y, z) => {
    let fin = 0;
    for (const c of cajas) {
      if (y >= c.y - EPS && y < c.y + c.dy - EPS && z >= c.z - EPS && z < c.z + c.dz - EPS && c.x + c.dx <= x + EPS) fin = Math.max(fin, c.x + c.dx);
    }
    return fin;
  };
  const atrasZ = (x, y, z) => {
    let fin = 0;
    indice.cerca(x, x + EPS * 2, (i) => {
      const c = cajas[i];
      if (x >= c.x - EPS && x < c.x + c.dx - EPS && y >= c.y - EPS && y < c.y + c.dy - EPS && c.z + c.dz <= z + EPS) fin = Math.max(fin, c.z + c.dz);
    });
    return fin;
  };

  for (let n = 0; n < items.length; n++) {
    const { p, pi } = items[n];

    // Si una caja de este producto no cupo, las idénticas que siguen tampoco caben
    if (fallidos.has(pi)) {
      fallidos.get(pi).cantidad++;
      continue;
    }

    if (pesoTotal + p.peso > cargaMax + EPS) {
      fallidos.set(pi, { cantidad: 1, motivo: 'carga_maxima' });
      continue;
    }

    // De pie primero; dentro de cada grupo, la que ocupa menos largo del contenedor
    const ors = orientacionesPermitidas(p)
      .map((o) => {
        const d = o.ejes.map((e) => p[e]);
        return { o, d, vertical: o.ejes[1], key: o.id + ':' + d.join(',') };
      })
      .sort((a, b) => (a.vertical === 'alto' ? 0 : 1) - (b.vertical === 'alto' ? 0 : 1) || a.d[0] - b.d[0]);

    let elegido = null;
    let bloqueoPeso = false;
    for (const pt of puntos) {
      for (const or of ors) {
        const [dx, dy, dz] = or.d;
        const key = or.key;
        if (pt.fallas.has(key)) continue;
        if (pt.x + dx > L + EPS || pt.y + dy > H + EPS || pt.z + dz > W + EPS || choca(pt.x, pt.y, pt.z, dx, dy, dz)) {
          // El espacio ocupado solo crece: este punto no vuelve a servir para estas medidas
          pt.fallas.add(key);
          continue;
        }
        // Fallas por apoyo o por peso: siguen valiendo mientras el nivel no cambie
        const previa = pt.pend.get(key);
        if (previa && previa.v === nivel(pt.y) && (previa.peso < 0 || p.peso >= previa.peso)) {
          if (previa.peso >= 0) bloqueoPeso = true;
          continue;
        }
        const ap = apoyos(pt.x, pt.y, pt.z, dx, dz);
        if (!ap) {
          pt.pend.set(key, { v: nivel(pt.y), peso: -1 });
          continue;
        }
        const delta = repartir(ap, p.peso);
        let ok = true;
        for (const [j, kg] of delta) {
          if (cajas[j].carga + kg > cajas[j].cap + EPS) {
            ok = false;
            break;
          }
        }
        if (!ok) {
          bloqueoPeso = true;
          pt.pend.set(key, { v: nivel(pt.y), peso: p.peso });
          continue;
        }
        elegido = { pt, or, ap, delta };
        break;
      }
      if (elegido) break;
    }

    if (!elegido) {
      fallidos.set(pi, { cantidad: 1, motivo: bloqueoPeso ? 'peso_apilado' : 'espacio' });
      continue;
    }

    const { pt, or, ap, delta } = elegido;
    const [dx, dy, dz] = or.d;
    const caja = { pi, x: pt.x, y: pt.y, z: pt.z, dx, dy, dz, o: or.o.id, peso: p.peso, cap: capacidadEncima(p, or.vertical), carga: 0, apoyos: ap };
    const idx = cajas.length;
    cajas.push(caja);
    const topKey = +(caja.y + dy).toFixed(4);
    niveles.set(topKey, (niveles.get(topKey) || 0) + 1);
    indice.agregar(idx, caja);
    for (const [j, kg] of delta) cajas[j].carga += kg;
    pesoTotal += p.peso;

    // Quita los puntos que quedaron dentro de la caja y agrega los nuevos
    puntos = puntos.filter(
      (q) => !(q.x >= caja.x - EPS && q.x < caja.x + dx - EPS && q.y >= caja.y - EPS && q.y < caja.y + dy - EPS && q.z >= caja.z - EPS && q.z < caja.z + dz - EPS),
    );
    const { x, y, z } = caja;
    agregarPunto(x + dx, y, z);
    agregarPunto(x, y + dy, z);
    agregarPunto(x, y, z + dz);
    agregarPunto(x + dx, bajarY(x + dx, y, z), z);
    agregarPunto(x + dx, y, atrasZ(x + dx, y, z));
    agregarPunto(atrasX(x, y + dy, z), y + dy, z);
    agregarPunto(x, y + dy, atrasZ(x, y + dy, z));
    agregarPunto(atrasX(x, y, z + dz), y, z + dz);
    agregarPunto(x, bajarY(x, y, z + dz), z + dz);
  }

  const volCont = L * W * H;
  const volUsado = cajas.reduce((s, c) => s + c.dx * c.dy * c.dz, 0);
  const totalCajas = items.length;

  return {
    colocadas: cajas.map((c) => ({
      productoId: productos[c.pi].id,
      x: c.x,
      y: c.y,
      z: c.z,
      dx: c.dx,
      dy: c.dy,
      dz: c.dz,
      orientacion: c.o,
    })),
    noColocadas: [...fallidos].map(([pi, f]) => ({
      productoId: productos[pi].id,
      nombre: productos[pi].nombre,
      cantidad: f.cantidad,
      motivo: f.motivo,
    })),
    metricas: {
      volumenContenedor: volCont / 1e6,
      volumenUsado: volUsado / 1e6,
      ocupacion: volCont ? (volUsado / volCont) * 100 : 0,
      pesoTotal,
      cargaMax: Number.isFinite(cargaMax) ? cargaMax : null,
      ocupacionPeso: Number.isFinite(cargaMax) && cargaMax ? (pesoTotal / cargaMax) * 100 : null,
      cajasTotales: totalCajas,
      cajasColocadas: cajas.length,
    },
  };
}

// Resultado listo para guardar: incluye una copia del contenedor usado, para que un cubicaje
// guardado no cambie si después se ajustan las medidas en la configuración
export function calcularCubicaje(tipoContenedor, productos) {
  const contenedor = getContenedor(tipoContenedor);
  if (!contenedor) throw new Error('Tipo de contenedor desconocido: ' + tipoContenedor);
  return { contenedor: { ...contenedor }, ...cubicar(contenedor, productos), calculadoEn: new Date().toISOString() };
}
