// Métricas del tablero de cubicajes. Puro: recibe la lista y la fecha de referencia.

const mesKey = (d) => d.getFullYear() * 12 + d.getMonth();

// Ocupación de un cubicaje calculado (null si es borrador)
export function ocupacionDe(c) {
  return c.resultado?.metricas ? c.resultado.metricas.ocupacion : null;
}

function promedio(xs) {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
}

export function kpis(lista, ahora = new Date()) {
  const k = mesKey(ahora);
  const hace12 = k - 11;
  const fechas = lista.map((c) => new Date(c.createdAt));
  const ocup = lista.map(ocupacionDe).filter((o) => o != null);
  return {
    total: lista.length,
    delMes: fechas.filter((d) => mesKey(d) === k).length,
    mesAnterior: fechas.filter((d) => mesKey(d) === k - 1).length,
    ocupacionPromedio: promedio(ocup),
    pesoTotal12m: lista.reduce((s, c, i) => (mesKey(fechas[i]) >= hace12 ? s + (c.resultado?.metricas.pesoTotal || 0) : s), 0),
    desde: fechas.length ? new Date(Math.min(...fechas)) : null,
  };
}

// Últimos 12 meses (el último es el mes en curso): cantidad creada y ocupación promedio
export function porMes(lista, ahora = new Date()) {
  const k = mesKey(ahora);
  const meses = Array.from({ length: 12 }, (_, i) => {
    const key = k - 11 + i;
    return { anio: Math.floor(key / 12), mes: key % 12, cantidad: 0, ocupaciones: [] };
  });
  for (const c of lista) {
    const i = mesKey(new Date(c.createdAt)) - (k - 11);
    if (i < 0 || i > 11) continue;
    meses[i].cantidad++;
    const o = ocupacionDe(c);
    if (o != null) meses[i].ocupaciones.push(o);
  }
  return meses.map(({ ocupaciones, ...m }) => ({ ...m, ocupacion: promedio(ocupaciones) }));
}

export function ultimos(lista, n = 5) {
  return [...lista].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, n);
}

/**
 * Filtros del listado. f = { q, fecha: 'todas'|'mes'|'90'|'<año>', origen: 'todos'|..., estado: 'todos'|... }
 */
export function filtrar(lista, f, ahora = new Date()) {
  const q = (f.q || '').trim().toLowerCase();
  const k = mesKey(ahora);
  const lim90 = ahora.getTime() - 90 * 24 * 3600 * 1000;
  return lista.filter((c) => {
    if (q && !c.nombre.toLowerCase().includes(q)) return false;
    if (f.origen && f.origen !== 'todos' && c.origen !== f.origen) return false;
    if (f.estado && f.estado !== 'todos' && c.estado !== f.estado) return false;
    const d = new Date(c.createdAt);
    if (f.fecha === 'mes' && mesKey(d) !== k) return false;
    if (f.fecha === '90' && d.getTime() < lim90) return false;
    if (/^\d{4}$/.test(f.fecha || '') && d.getFullYear() !== Number(f.fecha)) return false;
    return true;
  });
}

// Números de página con huecos: [1, '…', 4, 5, 6, '…', 12]
export function paginas(actual, total) {
  const nums = [];
  for (let i = 1; i <= total; i++) if (i === 1 || i === total || Math.abs(i - actual) <= 1) nums.push(i);
  const out = [];
  nums.forEach((n, i) => {
    if (i > 0 && n - nums[i - 1] > 1) out.push('…');
    out.push(n);
  });
  return out;
}
