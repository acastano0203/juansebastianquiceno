import { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

// Al cambiar de página (menú, pie, botones) la nueva página abre arriba: React Router conserva el scroll
// y, desde el pie, la página nueva se abría abajo, como si el enlace no hubiera hecho nada.
// Con #ancla (p. ej. /servicios#servicio-2) baja a esa parte. Con "atrás/adelante" del navegador no se toca.
export default function ScrollAlNavegar() {
  const { pathname, hash, search, key } = useLocation();
  const tipo = useNavigationType();

  useEffect(() => {
    if (hash) {
      // Se espera a que la página nueva pinte su contenido antes de buscar el ancla
      const id = decodeURIComponent(hash.slice(1));
      const raf = requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: 'start' }));
      return () => cancelAnimationFrame(raf);
    }
    if (tipo !== 'POP') window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    return undefined;
  }, [pathname, hash, search, key, tipo]);

  return null;
}
