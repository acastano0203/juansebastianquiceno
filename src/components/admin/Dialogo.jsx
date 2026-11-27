import { useEffect, useId, useRef } from 'react';
import { Close } from '../ui/Icons';

// Ventana modal del panel sobre <dialog> nativo: Escape cierra, el foco queda dentro y vuelve al botón que la abrió.
export default function Dialogo({ titulo, subtitulo, cerrarLabel, onCerrar, children, ancho = 560 }) {
  const ref = useRef();
  const id = useId();
  const alCerrar = useRef(onCerrar);
  alCerrar.current = onCerrar;

  // Se abre una sola vez al montarse (aunque el padre pase una función nueva en cada render)
  useEffect(() => {
    const d = ref.current;
    if (!d.open) d.showModal();
    const cerrar = () => alCerrar.current();
    d.addEventListener('close', cerrar);
    return () => d.removeEventListener('close', cerrar);
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby={`${id}-t`}
      style={{ width: `min(${ancho}px, calc(100% - 24px))` }}
      className="m-auto box-border max-h-[calc(100dvh-24px)] max-w-none overflow-y-auto rounded-[28px_28px_28px_6px] border-0 bg-white p-0 text-ink backdrop:bg-[rgba(9,28,29,0.55)]"
      onClick={(e) => e.target === ref.current && ref.current.close()}
    >
      <div className="flex items-start justify-between gap-4 border-b border-line-2 px-6 py-5">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 id={`${id}-t`} className="m-0 font-serif text-[24px] leading-[1.15] font-semibold">
            {titulo}
          </h2>
          {subtitulo && <p className="m-0 text-sm text-muted">{subtitulo}</p>}
        </div>
        <button
          type="button"
          onClick={() => ref.current.close()}
          aria-label={cerrarLabel}
          className="flex size-11 flex-none cursor-pointer items-center justify-center rounded-full border-0 bg-line-2 text-ink"
        >
          <Close size={18} />
        </button>
      </div>
      <div className="px-6 py-5">{children}</div>
    </dialog>
  );
}
