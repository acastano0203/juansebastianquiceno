import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../../i18n/LanguageContext';
import { cubicajesRepo, usaSupabase } from '../../data/cubicajesRepo';
import { ButtonLink, Button } from '../ui/Button';
import { Check, Plus } from '../ui/Icons';
import PaqueteIcono from './PaqueteIcono';

export const ESTADO_CLASES = {
  listo: 'bg-[#DCEBDC] text-[#1E4D2B]',
  borrador: 'bg-[#ECEFEA] text-muted',
  excede: 'bg-clay-bg text-clay-dark',
  procesando: 'bg-[#FBF3DC] text-[#6B5410]',
};

export function EstadoBadge({ estado }) {
  const { t } = useI18n();
  return (
    <span className={'inline-flex min-h-[26px] flex-none items-center rounded-full px-2.5 text-xs font-semibold whitespace-nowrap ' + ESTADO_CLASES[estado]}>
      {estado === 'procesando' ? t('cub.detalle.procesando') : t('cub.estados.' + estado)}
    </span>
  );
}

export function OrigenBadge({ origen }) {
  const { t } = useI18n();
  return (
    <span className={'inline-flex min-h-[26px] items-center rounded-full px-2.5 text-xs font-semibold whitespace-nowrap ' + (origen === 'admin' ? 'bg-mist text-ink' : 'bg-[#FBF3DC] text-[#6B5410]')}>
      {t('cub.origen.' + origen)}
    </span>
  );
}

export function Toast({ children }) {
  if (!children) return null;
  return (
    <div role="status" className="fixed right-4 bottom-4 left-4 z-20 flex items-center gap-3 rounded-2xl bg-ink px-[18px] py-3.5 text-sm text-white shadow-lg sm:left-auto">
      <Check size={16} />
      {children}
    </div>
  );
}

export function useToast() {
  const [msg, setMsg] = useState('');
  const timer = useRef();
  useEffect(() => () => clearTimeout(timer.current), []);
  const avisar = (m) => {
    setMsg(m);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(''), 3500);
  };
  return [msg, avisar];
}

// Estado vacío "Sin cubicajes". En modo local ofrece cargar ejemplos para probar el tablero.
export function VacioCubicajes({ onCargado }) {
  const { t } = useI18n();
  const [cargando, setCargando] = useState(false);

  const cargarEjemplos = async () => {
    setCargando(true);
    const { generarEjemplos } = await import('../../data/cubicajesSeed');
    await cubicajesRepo.reemplazar(await generarEjemplos());
    setCargando(false);
    onCargado?.();
  };

  return (
    <section className="flex flex-col items-center gap-[18px] rounded-[32px_32px_32px_4px] bg-white px-6 py-14 text-center md:py-20">
      <span className="flex size-24 items-center justify-center rounded-[0_48px_0_48px] bg-mist text-ink">
        <PaqueteIcono tipo="box" size={44} />
      </span>
      <h2 className="m-0 font-serif text-[26px] font-semibold md:text-[32px]">{t('cub.lista.vacioT')}</h2>
      <p className="m-0 max-w-[460px] text-base leading-[1.6] text-muted">{t('cub.lista.vacioD')}</p>
      <ButtonLink to="/admin/cubicaje/nuevo" variant="gold" size="lg">
        <Plus size={18} />
        {t('cub.lista.crearPrimero')}
      </ButtonLink>
      <div className="flex flex-wrap justify-center gap-x-7 gap-y-2.5 pt-2.5 text-sm text-muted">
        {t('cub.lista.vacioPasos').map((paso, i) => (
          <span key={paso}>
            <strong className="mr-1 font-serif text-lg font-normal text-clay italic">{i + 1}</strong> {paso}
          </span>
        ))}
      </div>
      {!usaSupabase && (
        <button type="button" onClick={cargarEjemplos} disabled={cargando} className="min-h-11 cursor-pointer border-0 bg-transparent px-2 text-sm font-semibold text-ink underline disabled:cursor-wait disabled:opacity-60">
          {cargando ? t('cub.lista.cargandoEjemplos') : t('cub.lista.ejemplos')}
        </button>
      )}
    </section>
  );
}

// Confirmación de borrado (diálogo nativo, como el de WhatsApp)
export function ConfirmarEliminar({ nombre, titulo, texto, onConfirmar, onCerrar }) {
  const { t } = useI18n();
  const ref = useRef();
  useEffect(() => {
    const d = ref.current;
    d.showModal();
    const close = () => onCerrar();
    d.addEventListener('close', close);
    return () => d.removeEventListener('close', close);
  }, [onCerrar]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="eliminar-titulo"
      className="m-auto w-[min(440px,calc(100%-32px))] rounded-[32px_32px_32px_6px] border-0 bg-white p-8 text-ink backdrop:bg-[rgba(9,28,29,0.55)]"
      onClick={(e) => {
        if (e.target === ref.current) ref.current.close();
      }}
    >
      <div className="flex flex-col gap-3.5">
        <h2 id="eliminar-titulo" className="m-0 font-serif text-[26px] font-semibold">
          {titulo || t('cub.lista.confirmarT')}
        </h2>
        <p className="m-0 text-[15px] leading-[1.55] text-muted">
          {texto || (
            <>
              {t('cub.lista.confirmarD')[0]}
              <strong className="text-ink">{nombre}</strong>
              {t('cub.lista.confirmarD')[1]}
            </>
          )}
        </p>
        <div className="flex flex-wrap justify-end gap-2.5 pt-1.5">
          <Button variant="outline" size="md" className="min-h-12" onClick={() => ref.current.close()}>
            {t('cub.lista.cancelar')}
          </Button>
          <Button
            variant="ink"
            size="md"
            className="min-h-12"
            style={{ background: '#7A4429' }}
            onClick={() => {
              onConfirmar();
              ref.current.close();
            }}
          >
            {t('cub.lista.eliminarBtn')}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
