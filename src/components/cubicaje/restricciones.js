import { num } from '../../lib/format';

// Etiquetas de restricciones de un producto (lista de productos, tabla del detalle)
export function restricciones(p, t, lang) {
  const tags = [];
  if (p.limitaRotX) tags.push(t('cub.productos.tags.rotX'));
  if (p.limitaRotZ) tags.push(t('cub.productos.tags.rotZ'));
  if (p.limitePeso?.activo && p.limitePeso.superior != null) tags.push(t('cub.productos.tags.peso', { kg: num(p.limitePeso.superior, 0, lang) }));
  if (!tags.length) tags.push(t('cub.productos.tags.libre'));
  return tags;
}
