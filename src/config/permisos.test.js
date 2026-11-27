import { describe, expect, it } from 'vitest';
import { puedeEntrar, rutaInicial } from './permisos';

describe('permisos del panel', () => {
  const soporte = { permisos: ['inscripciones', 'briefs'] };

  it('el administrador entra a todo', () => {
    expect(puedeEntrar({ esAdmin: true, permisos: [] }, 'usuarios')).toBe(true);
  });

  it('un rol solo entra a sus módulos', () => {
    expect(puedeEntrar(soporte, 'inscripciones')).toBe(true);
    expect(puedeEntrar(soporte, 'cubicaje')).toBe(false);
    expect(puedeEntrar(null, 'pipeline')).toBe(false);
  });

  it('la página inicial es el primer módulo permitido, en el orden del menú', () => {
    expect(rutaInicial(soporte)).toBe('/admin/briefs');
    expect(rutaInicial({ esAdmin: true })).toBe('/admin');
    expect(rutaInicial({ permisos: [] })).toBeNull();
  });
});
