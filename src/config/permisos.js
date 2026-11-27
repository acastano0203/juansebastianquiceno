// Módulos del panel a los que un rol puede dar acceso. La clave es la que se guarda en roles.permisos
// y debe coincidir con modulos_panel() de la migración 20261127000000_usuarios_roles.sql.
// El texto de cada módulo está en i18n: usr.modulos.<clave>.
export const MODULOS = [
  { clave: 'pipeline', ruta: '/admin' },
  { clave: 'briefs', ruta: '/admin/briefs' },
  { clave: 'propuestas', ruta: '/admin/propuestas' },
  { clave: 'resultados', ruta: '/admin/resultados' },
  { clave: 'inscripciones', ruta: '/admin/inscripciones' },
  { clave: 'cubicaje', ruta: '/admin/cubicaje' },
  { clave: 'usuarios', ruta: '/admin/usuarios' },
];

export const CLAVES_MODULOS = MODULOS.map((m) => m.clave);

/** ¿Este usuario puede entrar a este módulo? El administrador (rol de sistema) puede todo. */
export function puedeEntrar(user, modulo) {
  if (!user) return false;
  return !!user.esAdmin || (user.permisos || []).includes(modulo);
}

/** Primera página del panel a la que el usuario tiene acceso (null si no tiene ninguna). */
export function rutaInicial(user) {
  return MODULOS.find((m) => puedeEntrar(user, m.clave))?.ruta ?? null;
}
