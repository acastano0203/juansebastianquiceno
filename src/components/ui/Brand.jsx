import { Link } from 'react-router-dom';
import { useI18n } from '../../i18n/LanguageContext';

// Isotipo oficial de Juan Sebastián Quiceno (mismo trazo de juansebastianquiceno.com), dorado sobre fondo verde oscuro
const ISOTIPO =
  'M49.35,56.92l18.73,18.73c7.79,7.79,18.31,12.17,29.32,12.23l5.03.04c19.6-.71,35.33-16.92,35.33-36.68v-24.93c0-8.65-7.02-15.67-15.67-15.67h-33.6c-.61,0-1.11.48-1.11,1.09v.04c0,5.15,4.19,9.32,9.34,9.32h25.37c2.89,0,5.22,2.33,5.22,5.22v24.93c0,14.49-11.75,26.22-26.22,26.22h-3c-8.59,0-16.84-3.41-22.93-9.49l-18.45-18.45M57.06,79.42c-1.49-1.47-3.54-2.22-5.63-2.05-.71.04-1.44.08-2.16.08-15.88,0-28.69-13.18-28.07-29.2.55-14.56,12.42-26.43,26.98-26.98,16.02-.59,29.18,12.21,29.18,28.09,0,.78-.02,1.57-.1,2.35-.17,2.09.57,4.13,2.07,5.63l4.9,4.9c.57.57,1.55.34,1.82-.42,1.36-4.02,2.09-8.32,2.05-12.8-.17-20.71-16.94-37.81-37.64-38.37-22.27-.61-40.44,17.57-39.8,39.84.59,20.61,17.57,37.3,38.18,37.58,4.44.06,8.71-.63,12.67-1.93.78-.27,1.01-1.24.44-1.84l-4.88-4.88ZM74.86,67.65l-23.71-23.77c-.44-.44-1.15-.44-1.59,0-3.66,3.64-3.66,9.55-.02,13.18l17.91,17.97';

export function Emblema({ className = '' }) {
  return (
    <span
      aria-hidden="true"
      className={
        'flex flex-none items-center justify-center rounded-xl border-[1.5px] border-gold/45 bg-ink/85 p-[5px] shadow-[0_0_16px_rgba(221,189,98,.25)] transition-transform duration-300 group-hover:scale-105 ' +
        className
      }
    >
      <svg viewBox="8 8 132 82" className="h-auto w-full" fill="currentColor">
        <path d={ISOTIPO} className="text-gold" />
      </svg>
    </span>
  );
}

// logo: muestra el isotipo a la izquierda del nombre
export default function Brand({ to = '/', sub, small = false, logo = false, className = '' }) {
  const { t } = useI18n();
  const texto = (
    <>
      <span className={(small ? 'text-xs tracking-[0.18em]' : 'text-xs tracking-[0.18em] md:text-sm md:tracking-[0.22em]') + ' font-semibold'}>
        ACCESO INTERNACIONAL
      </span>
      <span className="text-xs tracking-[0.04em] text-sage">{sub || t('brand.sub')}</span>
    </>
  );
  if (logo) {
    return (
      <Link to={to} className={'group relative flex min-w-0 items-center gap-2.5 text-white no-underline md:gap-3.5 ' + className}>
        <Emblema className="size-10 md:size-11" />
        <span className="flex flex-col gap-1">{texto}</span>
      </Link>
    );
  }
  return (
    <Link to={to} className={'relative flex flex-col gap-1 text-white no-underline ' + className}>
      {texto}
    </Link>
  );
}
