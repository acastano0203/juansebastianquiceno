import { Link } from 'react-router-dom';
import { useI18n } from '../../i18n/LanguageContext';
import logoQJ from '../../assets/logo-qj.png';

// logo: muestra el monograma QJ (blanco, para fondos verde oscuro) a la izquierda del nombre
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
      <Link to={to} className={'relative flex min-w-0 items-center gap-2.5 text-white no-underline md:gap-3.5 ' + className}>
        <img src={logoQJ} alt="" width="416" height="255" className="h-7 w-auto flex-none md:h-10" />
        <span aria-hidden="true" className="hidden h-10 w-px bg-ink-3 md:block" />
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
