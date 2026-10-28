// Acceso a datos de cubicajes. Con VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY usa Supabase;
// sin ellas guarda en localStorage (igual que los prospectos), para que el proyecto corra sin backend.
//
// Modelo en la app:
//   { id, nombre, tipoContenedor, origen: 'admin'|'diagnostico'|'landing', prospectoId, contacto: { nombre, whatsapp, correo } | null,
//     estado: 'borrador'|'listo'|'excede',
//     productos: [{ id, nombre, tipoPaquete, largo, ancho, alto, peso, cantidad, color,
//                   limitaRotX, limitaRotZ, limitePeso: { activo, superior, frontal } }],
//     resultado: { contenedor, colocadas, noColocadas, metricas } | null, createdAt, updatedAt }

const URL = import.meta.env.VITE_SUPABASE_URL;
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const usaSupabase = !!(URL && ANON);

export function estadoDe(resultado) {
  if (!resultado) return 'borrador';
  return resultado.noColocadas?.length ? 'excede' : 'listo';
}

export function totalCajas(c) {
  return c.productos.reduce((s, p) => s + (Number(p.cantidad) || 0), 0);
}

function nuevoId() {
  return globalThis.crypto?.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function completar(c) {
  const now = new Date().toISOString();
  return {
    origen: 'admin',
    prospectoId: null,
    ...c,
    id: c.id || nuevoId(),
    estado: estadoDe(c.resultado),
    createdAt: c.createdAt || now,
    updatedAt: now,
  };
}

// ── localStorage ──────────────────────────────────────────────────────────

const KEY = 'jsq.cubicajes.v2';

// La v1 tenía datos de prueba: se descartan al cambiar de versión
try {
  localStorage.removeItem('jsq.cubicajes.v1');
} catch {
  // sin almacenamiento
}

function leer() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || [];
  } catch {
    return [];
  }
}

function escribir(lista) {
  try {
    localStorage.setItem(KEY, JSON.stringify(lista));
  } catch {
    // sin persistencia
  }
}

const local = {
  async listar() {
    return leer().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  async obtener(id) {
    return leer().find((c) => c.id === id) || null;
  },
  async porProspecto(prospectoId) {
    return leer().filter((c) => c.prospectoId === prospectoId);
  },
  async guardar(c) {
    const lista = leer();
    const guardado = completar(c);
    const i = lista.findIndex((x) => x.id === guardado.id);
    if (i >= 0) lista[i] = guardado;
    else lista.unshift(guardado);
    escribir(lista);
    return guardado;
  },
  async eliminar(id) {
    escribir(leer().filter((c) => c.id !== id));
  },
  async eliminarTodos() {
    escribir([]);
  },
  // Cubicaje del cliente desde la landing: en local se guarda igual que en el panel
  async crearPublico(c) {
    return this.guardar({ ...c, origen: 'landing' });
  },
  // Reemplaza todo (datos de ejemplo)
  async reemplazar(lista) {
    escribir(lista);
  },
  suscribir(fn) {
    const onStorage = (e) => {
      if (e.key === KEY) fn();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  },
};

// ── Supabase ──────────────────────────────────────────────────────────────

let clientePromise;
function cliente() {
  clientePromise ||= import('@supabase/supabase-js').then(({ createClient }) => createClient(URL, ANON));
  return clientePromise;
}

const COLUMNAS = '*, cubicaje_productos(*)';

function productoDeFila(f) {
  return {
    id: f.id,
    nombre: f.nombre,
    tipoPaquete: f.tipo_paquete,
    largo: Number(f.largo),
    ancho: Number(f.ancho),
    alto: Number(f.alto),
    peso: Number(f.peso),
    cantidad: f.cantidad,
    color: f.color,
    limitaRotX: f.limita_rot_x,
    limitaRotZ: f.limita_rot_z,
    limitePeso: {
      activo: f.limite_peso_activo,
      superior: f.carga_superior == null ? null : Number(f.carga_superior),
      frontal: f.carga_frontal == null ? null : Number(f.carga_frontal),
    },
  };
}

function productoAFila(p, cubicajeId, orden) {
  return {
    cubicaje_id: cubicajeId,
    orden,
    nombre: p.nombre,
    tipo_paquete: p.tipoPaquete || 'box',
    largo: p.largo,
    ancho: p.ancho,
    alto: p.alto,
    peso: p.peso,
    cantidad: p.cantidad,
    color: p.color,
    limita_rot_x: !!p.limitaRotX,
    limita_rot_z: !!p.limitaRotZ,
    limite_peso_activo: !!p.limitePeso?.activo,
    carga_superior: p.limitePeso?.superior ?? null,
    carga_frontal: p.limitePeso?.frontal ?? null,
  };
}

function deFila(f) {
  return {
    id: f.id,
    nombre: f.nombre,
    tipoContenedor: f.tipo_contenedor,
    origen: f.origen,
    prospectoId: f.prospecto_id,
    contacto: f.contacto,
    estado: f.estado,
    resultado: f.resultado,
    productos: (f.cubicaje_productos || []).sort((a, b) => a.orden - b.orden).map(productoDeFila),
    createdAt: f.created_at,
    updatedAt: f.updated_at,
  };
}

function aFila(c) {
  const m = c.resultado?.metricas;
  return {
    id: c.id,
    nombre: c.nombre,
    tipo_contenedor: c.tipoContenedor,
    origen: c.origen,
    prospecto_id: c.prospectoId,
    contacto: c.contacto || null,
    estado: c.estado,
    resultado: c.resultado,
    ocupacion: m ? Math.round(m.ocupacion * 100) / 100 : null,
    peso_total: m ? m.pesoTotal : null,
    cajas_total: totalCajas(c),
    created_at: c.createdAt,
  };
}

async function ok(promesa) {
  const { data, error } = await promesa;
  if (error) throw error;
  return data;
}

const remoto = {
  async listar() {
    const sb = await cliente();
    return (await ok(sb.from('cubicajes').select(COLUMNAS).order('created_at', { ascending: false }))).map(deFila);
  },
  async obtener(id) {
    const sb = await cliente();
    const f = await ok(sb.from('cubicajes').select(COLUMNAS).eq('id', id).maybeSingle());
    return f ? deFila(f) : null;
  },
  async porProspecto(prospectoId) {
    const sb = await cliente();
    return (await ok(sb.from('cubicajes').select(COLUMNAS).eq('prospecto_id', prospectoId))).map(deFila);
  },
  async guardar(c) {
    const sb = await cliente();
    const g = completar(c);
    await ok(sb.from('cubicajes').upsert(aFila(g)));
    await ok(sb.from('cubicaje_productos').delete().eq('cubicaje_id', g.id));
    if (g.productos.length) await ok(sb.from('cubicaje_productos').insert(g.productos.map((p, i) => productoAFila(p, g.id, i))));
    return g;
  },
  async eliminar(id) {
    const sb = await cliente();
    await ok(sb.from('cubicajes').delete().eq('id', id));
  },
  // El público no escribe en las tablas: la Edge Function valida, limita, recalcula y guarda
  async crearPublico(c) {
    const res = await fetch(`${URL}/functions/v1/cubicaje-publico`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: ANON, Authorization: `Bearer ${ANON}` },
      body: JSON.stringify({ nombre: c.nombre, tipoContenedor: c.tipoContenedor, productos: c.productos, contacto: c.contacto, prospectoId: c.prospectoId }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw Object.assign(new Error(data.error || 'error'), { status: res.status });
    return data;
  },
  async eliminarTodos() {
    const sb = await cliente();
    // Supabase exige un filtro en los delete: este cubre todas las filas
    await ok(sb.from('cubicajes').delete().not('id', 'is', null));
  },
  async reemplazar() {
    // Los datos de ejemplo solo existen en el modo local
  },
  suscribir() {
    return () => {};
  },
};

export const cubicajesRepo = usaSupabase ? remoto : local;
