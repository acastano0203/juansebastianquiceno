import { Link } from 'react-router-dom';
import { useI18n } from '../../i18n/LanguageContext';
import { PARAMS } from '../../config/params';

export default function SiteFooter() {
  const { t, lang } = useI18n();
  return (
    <footer className="bg-ink text-sage">
      <div className="mx-auto flex max-w-[1240px] flex-col gap-3 px-[22px] py-9 text-[13px] md:px-10 md:py-10 md:text-sm">
        <p className="m-0 text-base font-semibold text-white">{PARAMS.textosLegales.resultado[lang]}</p>
        <div className="flex flex-col gap-2.5 md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-5">
          <span className="text-xs font-semibold tracking-[0.18em] text-white md:text-[13px] md:tracking-[0.22em]">ACCESO INTERNACIONAL</span>
          <span>{t('footer.areas')}</span>
          <span className="flex items-center gap-5">
            <Link to="/admin" className="inline-flex min-h-11 items-center text-sage hover:text-white">
              {t('footer.admin')}
            </Link>
            © 2026
          </span>
        </div>
      </div>
    </footer>
  );
}
