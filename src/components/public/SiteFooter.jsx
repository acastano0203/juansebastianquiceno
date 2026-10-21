import { Link } from 'react-router-dom';
import { useI18n } from '../../i18n/LanguageContext';

export default function SiteFooter() {
  const { t } = useI18n();
  return (
    <footer className="bg-ink text-sage">
      <div className="mx-auto flex max-w-[1240px] flex-col gap-2.5 px-[22px] py-9 text-[13px] md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-5 md:p-10 md:text-sm">
        <span className="text-xs font-semibold tracking-[0.18em] text-white md:text-[13px] md:tracking-[0.22em]">JUAN SEBASTIÁN QUICENO</span>
        <span>{t('footer.areas')}</span>
        <span className="flex items-center gap-5">
          <Link to="/admin" className="inline-flex min-h-11 items-center text-sage hover:text-white">
            {t('footer.admin')}
          </Link>
          © 2026
        </span>
      </div>
    </footer>
  );
}
