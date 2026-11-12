import { useState } from 'react';
import { useI18n } from '../../i18n/LanguageContext';
import Brand from '../ui/Brand';
import { ButtonLink } from '../ui/Button';
import { Close, Menu } from '../ui/Icons';
import { Link } from 'react-router-dom';
import LanguageSwitcher from '../ui/LanguageSwitcher';

export default function SiteHeader() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <header className="relative flex flex-wrap items-center justify-between gap-6 py-5 md:py-7">
      <Brand />
      <nav aria-label={t('nav.main')} className="hidden items-center gap-8 text-[15px] md:flex">
        <Link to="/simulador" className="text-pale no-underline hover:text-white">
          {t('nav.simulador')}
        </Link>
        <Link to="/cubicaje" className="text-pale no-underline hover:text-white">
          {t('hero.ctaCubicar')}
        </Link>
        <LanguageSwitcher />
        <ButtonLink to="/simulador" variant="outline-gold" size="md" lift className="px-[22px]">
          {t('nav.cta')}
        </ButtonLink>
      </nav>
      <div className="flex items-center gap-2 md:hidden">
        <LanguageSwitcher compact />
        <button
          type="button"
          aria-label={open ? t('nav.close') : t('nav.open')}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="flex size-11 items-center justify-center rounded-full border border-ink-3 bg-transparent text-white"
        >
          {open ? <Close size={20} /> : <Menu size={20} />}
        </button>
      </div>
      {open && (
        <nav aria-label={t('nav.main')} className="flex w-full flex-col gap-1 rounded-[20px_20px_20px_4px] bg-ink-2 p-3 md:hidden">
          <Link to="/cubicaje" onClick={() => setOpen(false)} className="flex min-h-11 items-center rounded-xl px-3 text-pale no-underline hover:text-white">
            {t('hero.ctaCubicar')}
          </Link>
          <ButtonLink to="/simulador" variant="gold" size="md" className="mt-1">
            {t('nav.cta')}
          </ButtonLink>
        </nav>
      )}
    </header>
  );
}
