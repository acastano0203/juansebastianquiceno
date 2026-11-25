import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useI18n } from '../../i18n/LanguageContext';
import Brand from '../ui/Brand';
import { ButtonLink } from '../ui/Button';
import { Close, Menu } from '../ui/Icons';
import LanguageSwitcher from '../ui/LanguageSwitcher';
import { ENLACES_SITIO } from '../../config/menu';


const claseEscritorio = ({ isActive }) =>
  'relative py-1 whitespace-nowrap no-underline transition-colors ' +
  (isActive ? 'text-white after:absolute after:inset-x-0 after:-bottom-1 after:h-0.5 after:rounded-full after:bg-gold' : 'text-pale hover:text-white');

const claseMovil = ({ isActive }) =>
  'flex min-h-11 items-center rounded-xl px-3 no-underline ' + (isActive ? 'bg-ink-3 text-white' : 'text-pale hover:text-white');

export default function SiteHeader() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <header className="relative flex flex-col gap-4 py-5 md:py-7 lg:gap-5">
      {/* Fila 1: marca a la izquierda; idioma y llamado principal a la derecha */}
      <div className="flex items-center justify-between gap-6">
        <Brand logo />
        <div className="hidden items-center gap-5 lg:flex">
          <LanguageSwitcher />
          <ButtonLink to="/simulador" variant="outline-gold" size="md" lift className="px-[22px] whitespace-nowrap">
            {t('nav.cta')}
          </ButtonLink>
        </div>
        <div className="flex items-center gap-2 lg:hidden">
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
      </div>

      {/* Fila 2 (escritorio): todo el menú en una línea propia, para que quepan las secciones que se sigan migrando */}
      <nav aria-label={t('nav.main')} className="hidden flex-wrap items-center gap-x-7 gap-y-2 border-t border-ink-3 pt-4 text-[15px] lg:flex">
        {ENLACES_SITIO.map((e) => (
          <NavLink key={e.to} to={e.to} className={claseEscritorio}>
            {t(e.clave)}
          </NavLink>
        ))}
      </nav>

      {open && (
        <nav aria-label={t('nav.main')} className="flex w-full flex-col gap-1 rounded-[20px_20px_20px_4px] bg-ink-2 p-3 lg:hidden">
          {ENLACES_SITIO.map((e) => (
            <NavLink key={e.to} to={e.to} onClick={() => setOpen(false)} className={claseMovil}>
              {t(e.clave)}
            </NavLink>
          ))}
          <ButtonLink to="/simulador" variant="gold" size="md" className="mt-1">
            {t('nav.cta')}
          </ButtonLink>
        </nav>
      )}
    </header>
  );
}
