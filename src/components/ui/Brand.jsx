import { Link } from 'react-router-dom';
import { useI18n } from '../../i18n/LanguageContext';

export default function Brand({ to = '/', sub, small = false, className = '' }) {
  const { t } = useI18n();
  return (
    <Link to={to} className={'relative flex flex-col gap-1 text-white no-underline ' + className}>
      <span className={(small ? 'text-xs tracking-[0.18em]' : 'text-xs tracking-[0.18em] md:text-sm md:tracking-[0.22em]') + ' font-semibold'}>
        JUAN SEBASTIÁN QUICENO
      </span>
      <span className="text-xs tracking-[0.04em] text-sage">{sub || t('brand.sub')}</span>
    </Link>
  );
}
