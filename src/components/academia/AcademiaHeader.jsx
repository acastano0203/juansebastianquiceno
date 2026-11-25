import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useI18n } from '../../i18n/LanguageContext';
import { RUTAS_ACADEMIA } from '../../config/academia';
import { ENLACES_SITIO } from '../../config/menu';
import Brand from '../ui/Brand';
import LanguageSwitcher from '../ui/LanguageSwitcher';
import { classes } from '../ui/Button';
import { Close, Menu } from '../ui/Icons';

// Mismo menú del sitio (config/menu.js) con "Inicio" delante: desde la Academia no hay hero con el logo que lleve a la portada.
const ENLACES = [{ to: '/', clave: 'aca.nav.inicio', end: true }, ...ENLACES_SITIO];

const claseEscritorio = ({ isActive }) =>
  'relative py-1 whitespace-nowrap no-underline transition-colors ' +
  (isActive ? 'text-white after:absolute after:inset-x-0 after:-bottom-1 after:h-0.5 after:rounded-full after:bg-gold' : 'text-pale hover:text-white');

const claseMovil = ({ isActive }) =>
  'flex min-h-11 items-center rounded-xl px-3 no-underline ' + (isActive ? 'bg-ink-3 font-semibold text-white' : 'text-pale hover:text-white');

/** Menú del diseño de la Academia: mismas marcas, colores y enlaces que el sitio, con "Academia" activa */
export default function AcademiaHeader({ onAgendar, minimo = false }) {
  const { t } = useI18n();
  const [abierto, setAbierto] = useState(false);

  if (minimo) {
    return (
      <header className="relative flex items-center justify-between gap-4 py-5 md:py-7">
        <Brand to={RUTAS_ACADEMIA.inicio} sub={t('aca.sub')} />
        <LanguageSwitcher compact />
      </header>
    );
  }

  return (
    <header className="relative flex flex-col gap-4 py-5 md:py-6 lg:gap-5">
      {/* Fila 1: marca; idioma y "Agendar asesoría" a la derecha */}
      <div className="flex items-center justify-between gap-6">
        <Brand logo />
        <div className="hidden items-center gap-4 lg:flex">
          <LanguageSwitcher />
          <button type="button" onClick={() => onAgendar?.()} className={classes({ variant: 'outline-gold', size: 'md', lift: true, className: 'px-5 whitespace-nowrap' })}>
            {t('aca.nav.agendar')}
          </button>
        </div>
        <div className="flex items-center gap-2 lg:hidden">
          <LanguageSwitcher compact />
          <button
            type="button"
            aria-label={abierto ? t('nav.close') : t('nav.open')}
            aria-expanded={abierto}
            onClick={() => setAbierto((o) => !o)}
            className="flex size-11 cursor-pointer items-center justify-center rounded-full border border-ink-3 bg-transparent text-white"
          >
            {abierto ? <Close size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Fila 2 (escritorio): el menú completo */}
      <nav aria-label={t('nav.main')} className="hidden flex-wrap items-center gap-x-7 gap-y-2 border-t border-ink-3 pt-4 text-[15px] lg:flex">
        {ENLACES.map((e) => (
          <NavLink key={e.to} to={e.to} end={!!e.end} className={claseEscritorio}>
            {t(e.clave)}
          </NavLink>
        ))}
      </nav>

      {abierto && (
        <nav aria-label={t('nav.main')} className="flex w-full flex-col gap-1 rounded-[20px_20px_20px_4px] bg-ink-2 p-3 lg:hidden">
          {ENLACES.map((e) => (
            <NavLink key={e.to} to={e.to} end={!!e.end} onClick={() => setAbierto(false)} className={claseMovil}>
              {t(e.clave)}
            </NavLink>
          ))}
          <button
            type="button"
            onClick={() => {
              setAbierto(false);
              onAgendar?.();
            }}
            className={classes({ variant: 'gold', size: 'md', className: 'mt-1' })}
          >
            {t('aca.nav.agendar')}
          </button>
        </nav>
      )}
    </header>
  );
}
