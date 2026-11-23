import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../../i18n/LanguageContext';
import { enlaceWhatsApp } from '../../lib/contacto';
import { RUTAS_ACADEMIA } from '../../config/academia';
import { classes } from '../ui/Button';
import { Check } from '../ui/Icons';

/** Antetítulo + título serif con una palabra en itálica (patrón del diseño) */
export function Titulo({ eyebrow, t1, em, t2 = '', as: Tag = 'h2', claro = false, centrado = false, className = '' }) {
  return (
    <div className={'flex flex-col gap-3 ' + (centrado ? 'items-center text-center ' : '') + className}>
      {eyebrow && <p className={'m-0 text-xs font-semibold tracking-[0.18em] uppercase ' + (claro ? 'text-gold' : 'text-muted')}>{eyebrow}</p>}
      <Tag className={'m-0 font-serif text-[30px] leading-[1.12] font-semibold text-balance md:text-[44px] ' + (claro ? 'text-white' : 'text-ink')}>
        {t1}
        <em className={'italic ' + (claro ? 'text-gold' : '')}>{em}</em>
        {t2}
      </Tag>
    </div>
  );
}

const reducido = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Aparece suave al entrar en pantalla. Sin IntersectionObserver o con movimiento reducido, se ve de una vez. */
export function Revelar({ children, className = '', retraso = 0, as: Tag = 'div' }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(() => typeof IntersectionObserver === 'undefined' || reducido());
  useEffect(() => {
    if (visible || !ref.current) return undefined;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: '0px 0px -8% 0px' },
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, [visible]);
  return (
    <Tag
      ref={ref}
      style={{ transitionDelay: visible ? `${retraso}ms` : '0ms' }}
      className={'transition-[opacity,transform] duration-700 ease-out ' + (visible ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0') + ' ' + className}
    >
      {children}
    </Tag>
  );
}

/** Curvas finas del fondo oscuro (motivo del diseño de la Academia) */
export function Curvas({ className = '', variante = 'hero' }) {
  const paths =
    variante === 'hero'
      ? ['M-40 640 C 300 520, 520 760, 860 600 S 1300 360, 1500 420', 'M-40 700 C 320 590, 560 820, 900 660 S 1320 430, 1500 490', 'M900 -20 C 980 200, 1180 260, 1500 220']
      : ['M-40 380 C 360 260, 640 460, 1000 320 S 1380 180, 1500 220'];
  return (
    <svg aria-hidden="true" viewBox={variante === 'hero' ? '0 0 1440 900' : '0 0 1440 500'} preserveAspectRatio="none" className={'pointer-events-none absolute inset-0 h-full w-full ' + className} fill="none" stroke="#B8D8B8" strokeOpacity="0.16">
      {paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

/** Los 3 pasos del embudo: dónde va la persona */
export function PasosEmbudo({ actual, claro = true }) {
  const { t } = useI18n();
  const pasos = t('aca.embudo.pasos');
  const rutas = [RUTAS_ACADEMIA.inicio, RUTAS_ACADEMIA.masterclass, RUTAS_ACADEMIA.inscripcion];
  return (
    <nav aria-label={t('aca.embudo.label')}>
      <ol className="m-0 flex list-none items-center gap-2 p-0 text-[13px]">
        {pasos.map((p, i) => {
          const hecho = i < actual;
          const ahora = i === actual;
          const marca = (
            <span
              className={
                'grid size-6 flex-none place-items-center rounded-full text-[11px] font-semibold ' +
                (hecho ? 'bg-gold text-ink' : ahora ? (claro ? 'bg-white text-ink' : 'bg-ink text-white') : claro ? 'border border-ink-3 text-sage' : 'border border-line text-muted')
              }
            >
              {hecho ? <Check size={12} strokeWidth={3} /> : i + 1}
            </span>
          );
          const texto = <span className={'hidden sm:inline ' + (ahora ? (claro ? 'font-semibold text-white' : 'font-semibold text-ink') : claro ? 'text-sage' : 'text-muted')}>{p}</span>;
          return (
            <li key={p} className="flex items-center gap-2" aria-current={ahora ? 'step' : undefined}>
              {hecho ? (
                <Link to={rutas[i]} className="flex items-center gap-2 no-underline">
                  {marca}
                  {texto}
                </Link>
              ) : (
                <span className="flex items-center gap-2">
                  {marca}
                  {texto}
                </span>
              )}
              {i < pasos.length - 1 && <span aria-hidden="true" className={'h-px w-5 sm:w-8 ' + (hecho ? 'bg-gold' : claro ? 'bg-ink-3' : 'bg-line')} />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

const IconoWhatsApp = ({ size = 18 }) => (
  <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round">
    <path d="M21 12a8.5 8.5 0 0 1-12.6 7.4L3 21l1.6-5.2A8.5 8.5 0 1 1 21 12Z" />
  </svg>
);

/** Enlace a WhatsApp: a una URL dada (p. ej. el grupo) o al asesor con un mensaje. Sin destino queda inactivo. */
export function EnlaceWhatsApp({ href, mensaje, variant = 'outline-white', size = 'lg', children, className = '', icono = true }) {
  const { t } = useI18n();
  const destino = href || enlaceWhatsApp(mensaje || t('aca.msgWhatsApp'));
  const contenido = (
    <>
      {icono && <IconoWhatsApp />}
      {children}
    </>
  );
  if (!destino) {
    return (
      <button type="button" disabled title={t('sim.res.asesorInactivo')} className={classes({ variant, size, className })}>
        {contenido}
      </button>
    );
  }
  return (
    <a href={destino} target="_blank" rel="noreferrer" className={classes({ variant, size, className })}>
      {contenido}
    </a>
  );
}

/** Lleva arriba de la página al cambiar de ruta dentro de la Academia */
export function useArriba() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
}
