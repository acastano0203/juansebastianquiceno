import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../../i18n/LanguageContext';
import Brand from '../ui/Brand';
import { ButtonLink } from '../ui/Button';
import { Close, Menu } from '../ui/Icons';
import LanguageSwitcher from '../ui/LanguageSwitcher';

export default function SiteHeader() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const links = [
    { href: '/#como', label: t('nav.how') },
    { href: '/#areas', label: t('nav.areas') },
  ];

  return (
    <header className="relative flex flex-wrap items-center justify-between gap-6 py-5 md:py-7">
      <Brand />
      <nav aria-label={t('nav.main')} className="hidden items-center gap-8 text-[15px] md:flex">
        {links.map((l) => (
          <a key={l.href} href={l.href} className="text-pale no-underline hover:text-white">
            {l.label}
          </a>
        ))}
        <Link to="/cubicaje" className="text-pale no-underline hover:text-white">
          {t('nav.cubicaje')}
        </Link>
        <LanguageSwitcher />
        <ButtonLink to="/diagnostico" variant="outline-gold" size="md" lift className="px-[22px]">
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
          {links.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="flex min-h-11 items-center rounded-xl px-3 text-pale no-underline hover:text-white">
              {l.label}
            </a>
          ))}
          <Link to="/cubicaje" onClick={() => setOpen(false)} className="flex min-h-11 items-center rounded-xl px-3 text-pale no-underline hover:text-white">
            {t('nav.cubicaje')}
          </Link>
          <ButtonLink to="/diagnostico" variant="gold" size="md" className="mt-1">
            {t('nav.cta')}
          </ButtonLink>
        </nav>
      )}
    </header>
  );
}
