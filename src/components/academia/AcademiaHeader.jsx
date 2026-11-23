import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useI18n } from '../../i18n/LanguageContext';
import { RUTAS_ACADEMIA } from '../../config/academia';
import Brand from '../ui/Brand';
import LanguageSwitcher from '../ui/LanguageSwitcher';
import { classes } from '../ui/Button';
import { Close, Menu } from '../ui/Icons';

const ENLACES = [
  { to: '/', clave: 'inicio', end: true },
  { to: '/simulador', clave: 'simulador' },
  { to: '/cubicaje', clave: 'cubicaje' },
  { to: RUTAS_ACADEMIA.inicio, clave: 'academia' },
];

/** Menú del diseño de la Academia: mismas marcas y colores que la landing, con "Academia" activa */
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

  const claseEnlace = ({ isActive }) =>
    'no-underline transition-colors ' + (isActive ? 'border-b-2 border-gold pb-1 font-semibold text-white' : 'text-pale hover:text-white');

  return (
    <header className="relative flex flex-wrap items-center justify-between gap-6 py-5 md:py-6">
      <Brand />
      <nav aria-label={t('nav.main')} className="hidden items-center gap-8 text-[15px] lg:flex">
        {ENLACES.map((e) => (
          <NavLink key={e.clave} to={e.to} end={!!e.end} className={claseEnlace}>
            {t('aca.nav.' + e.clave)}
          </NavLink>
        ))}
      </nav>
      <div className="hidden items-center gap-4 lg:flex">
        <LanguageSwitcher />
        <button type="button" onClick={() => onAgendar?.()} className={classes({ variant: 'outline-gold', size: 'md', lift: true, className: 'px-5' })}>
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
      {abierto && (
        <nav aria-label={t('nav.main')} className="flex w-full flex-col gap-1 rounded-[20px_20px_20px_4px] bg-ink-2 p-3 lg:hidden">
          {ENLACES.map((e) => (
            <NavLink
              key={e.clave}
              to={e.to}
              end={!!e.end}
              onClick={() => setAbierto(false)}
              className={({ isActive }) => 'flex min-h-11 items-center rounded-xl px-3 no-underline ' + (isActive ? 'bg-ink-3 font-semibold text-white' : 'text-pale hover:text-white')}
            >
              {t('aca.nav.' + e.clave)}
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
