// Validación y normalización de cubicajes. Módulo puro: la usan el formulario y el servidor.

import { CONTENEDORES, LIMITES, TIPOS_PAQUETE } from './config.js';

const HEX = /^#[0-9a-fA-F]{6}$/;

function num(v) {
  if (typeof v === 'string') v = v.replace(',', '.').trim();
  if (v === '' || v == null) return NaN;
  return Number(v);
}

function opcionalNoNeg(v) {
  const n = num(v);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/**
 * Valida un producto. Devuelve { ok, errores: { campo: codigo }, valor } con números ya convertidos.
 * Códigos: requerido, positivo, entero, maximo, tipo.
 */
export function validarProducto(p, limites = LIMITES.admin) {
  const errores = {};
  const nombre = typeof p.nombre === 'string' ? p.nombre.trim().slice(0, 80) : '';
  if (!nombre) errores.nombre = 'requerido';

  const tipo = TIPOS_PAQUETE.find((t) => t.id === (p.tipoPaquete || 'box'));
  if (!tipo || !tipo.habilitado) errores.tipoPaquete = 'tipo';

  const valor = { nombre, tipoPaquete: tipo ? tipo.id : 'box' };
  for (const k of ['largo', 'ancho', 'alto']) {
    const n = num(p[k]);
    if (!Number.isFinite(n)) errores[k] = 'requerido';
    else if (n <= 0) errores[k] = 'positivo';
    else if (n > limites.dimension) errores[k] = 'maximo';
    valor[k] = n;
  }
  const peso = num(p.peso);
  if (!Number.isFinite(peso)) errores.peso = 'requerido';
  else if (peso <= 0) errores.peso = 'positivo';
  else if (peso > limites.peso) errores.peso = 'maximo';
  valor.peso = peso;

  const cant = num(p.cantidad ?? 1);
  if (!Number.isFinite(cant)) errores.cantidad = 'requerido';
  else if (cant <= 0) errores.cantidad = 'positivo';
  else if (!Number.isInteger(cant)) errores.cantidad = 'entero';
  else if (cant > limites.cajas) errores.cantidad = 'maximo';
  valor.cantidad = cant;

  valor.color = HEX.test(p.color || '') ? p.color : '#DDBD62';
  valor.limitaRotX = !!p.limitaRotX;
  valor.limitaRotZ = !!p.limitaRotZ;
  const lp = p.limitePeso || {};
  valor.limitePeso = { activo: !!lp.activo, superior: opcionalNoNeg(lp.superior), frontal: opcionalNoNeg(lp.frontal) };
  if (p.id != null) valor.id = String(p.id).slice(0, 64);

  return { ok: Object.keys(errores).length === 0, errores, valor };
}

/**
 * Valida un cubicaje completo. errores: [{ campo, codigo, indice? }]
 */
export function validarCubicaje(c, limites = LIMITES.admin) {
  const errores = [];
  const nombre = typeof c?.nombre === 'string' ? c.nombre.trim().slice(0, 120) : '';
  if (!nombre) errores.push({ campo: 'nombre', codigo: 'requerido' });
  if (!CONTENEDORES[c?.tipoContenedor]) errores.push({ campo: 'tipoContenedor', codigo: 'tipo' });

  const lista = Array.isArray(c?.productos) ? c.productos : [];
  if (!lista.length) errores.push({ campo: 'productos', codigo: 'requerido' });
  if (lista.length > limites.productos) errores.push({ campo: 'productos', codigo: 'maximo' });

  const productos = [];
  lista.slice(0, limites.productos).forEach((p, i) => {
    const r = validarProducto(p || {}, limites);
    Object.entries(r.errores).forEach(([campo, codigo]) => errores.push({ campo, codigo, indice: i }));
    productos.push({ ...r.valor, id: r.valor.id || 'p' + (i + 1) });
  });

  const cajas = productos.reduce((s, p) => s + (Number.isInteger(p.cantidad) ? p.cantidad : 0), 0);
  if (cajas > limites.cajas) errores.push({ campo: 'cajas', codigo: 'maximo' });

  return { ok: errores.length === 0, errores, valor: { nombre, tipoContenedor: c?.tipoContenedor, productos } };
}
