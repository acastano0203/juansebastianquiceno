import { useEffect, useRef, useState } from 'react';
import { calcularAsync } from '../../cubicaje/calcular';

/**
 * Recalcula el cubicaje cada vez que cambian el contenedor o los productos (en un Web Worker).
 * `inicial` es el resultado ya guardado al editar: no se recalcula hasta que haya un cambio.
 * `version` aumenta con cada resultado nuevo (sirve para reiniciar la secuencia de carga).
 */
export function useCubicajeEnVivo(tipoContenedor, productos, inicial = null) {
  const [estado, setEstado] = useState({ resultado: inicial, calculando: false, error: false, version: 0 });
  const base = useRef({ tipoContenedor, productos });
  const seq = useRef(0);

  useEffect(() => {
    if (base.current && base.current.tipoContenedor === tipoContenedor && base.current.productos === productos && inicial) return undefined;
    base.current = null;
    const id = ++seq.current;
    if (!productos.length) {
      setEstado((s) => ({ resultado: null, calculando: false, error: false, version: s.version + 1 }));
      return undefined;
    }
    setEstado((s) => ({ ...s, calculando: true, error: false }));
    const timer = setTimeout(() => {
      calcularAsync(tipoContenedor, productos)
        .then((resultado) => {
          if (id === seq.current) setEstado((s) => ({ resultado, calculando: false, error: false, version: s.version + 1 }));
        })
        .catch(() => {
          if (id === seq.current) setEstado((s) => ({ ...s, calculando: false, error: true }));
        });
    }, 200);
    return () => clearTimeout(timer);
  }, [tipoContenedor, productos]); // eslint-disable-line react-hooks/exhaustive-deps

  return estado;
}
