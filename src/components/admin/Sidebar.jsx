import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';
import { useI18n } from '../../i18n/LanguageContext';
import { Board, Chart, Doc, Logout, Pen } from '../ui/Icons';
import LanguageSwitcher from '../ui/LanguageSwitcher';
import { Cubo } from '../cubicaje/PaqueteIcono';

const NAV = [
  { to: '/admin', end: true, key: 'pipeline', Icon: Board },
  { to: '/admin/briefs', key: 'briefs', Icon: Doc, prefix: '/admin/prospectos' },
  { to: '/admin/propuestas', key: 'proposals', Icon: Pen },
  { to: '/admin/resultados', key: 'results', Icon: Chart },
];

const CUBICAJE_SUB = [
  { to: '/admin/cubicaje', end: true, key: 'resumen' },
  { to: '/admin/cubicaje/lista', key: 'lista' },
  { to: '/admin/cubicaje/nuevo', key: 'nuevo' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <aside className="no-print box-border flex flex-col gap-6 rounded-br-[40px] bg-ink px-[18px] py-6 text-white lg:sticky lg:top-0 lg:h-screen lg:w-[240px] lg:flex-none lg:gap-9 lg:rounded-br-none lg:rounded-tr-[40px] lg:py-7">
      <div className="flex flex-wrap items-center justify-between gap-3 px-2.5">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold tracking-[0.2em]">JUAN SEBASTIÁN QUICENO</span>
          <span className="text-xs text-sage">{t('brand.panel')}</span>
        </div>
        <LanguageSwitcher compact className="lg:hidden" />
      </div>
      <nav aria-label={t('side.panel')} className="flex flex-row flex-wrap gap-1 text-[15px] lg:flex-col">
        {NAV.map(({ to, end, key, Icon, prefix }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => {
              const active = isActive || (prefix && pathname.startsWith(prefix));
              return (
                'flex min-h-11 items-center gap-3 rounded-xl px-3 no-underline hover:bg-ink-2 hover:text-white ' +
                (active ? 'bg-ink-2 font-semibold text-white' : 'text-sage')
              );
            }}
          >
            <Icon />
            {t('side.' + key)}
          </NavLink>
        ))}
        <NavLink
          to="/admin/cubicaje"
          className={({ isActive }) =>
            'flex min-h-11 items-center gap-3 rounded-xl px-3 no-underline hover:bg-ink-2 hover:text-white ' + (isActive ? 'bg-ink-2 font-semibold text-white' : 'text-sage')
          }
        >
          <Cubo />
          {t('cub.menu')}
        </NavLink>
        {pathname.startsWith('/admin/cubicaje') && (
          <div className="flex basis-full flex-row gap-0.5 overflow-x-auto text-sm lg:mt-0.5 lg:ml-[21px] lg:basis-auto lg:flex-col lg:flex-nowrap lg:border-l lg:border-ink-3 lg:pl-[18px]">
            {CUBICAJE_SUB.map(({ to, end, key }) => (
              <NavLink
                key={key}
                to={to}
                end={end}
                className={({ isActive }) =>
                  'flex min-h-11 items-center gap-2 border-b-[3px] px-3.5 whitespace-nowrap no-underline hover:text-white lg:min-h-10 lg:border-b-0 lg:px-0 ' +
                  (isActive ? 'border-gold font-semibold text-white' : 'border-transparent text-sage lg:pl-3.5')
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && <span aria-hidden="true" className="hidden size-1.5 rounded-[0_3px_0_3px] bg-gold lg:block" />}
                    {t('cub.sub.' + key)}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        )}
      </nav>
      <div className="flex flex-col gap-4 lg:mt-auto">
        <div className="hidden px-2.5 lg:block">
          <LanguageSwitcher />
        </div>
        <div className="flex items-center gap-3 px-2.5">
          <span className="flex size-[38px] items-center justify-center rounded-full bg-gold text-[13px] font-semibold text-ink">JS</span>
          <span className="flex min-w-0 flex-1 flex-col text-[13px]">
            <span className="font-semibold">{user?.nombre}</span>
            <span className="text-sage">{t('side.role')}</span>
          </span>
          <button
            type="button"
            aria-label={t('side.logout')}
            title={t('side.logout')}
            onClick={() => {
              logout();
              navigate('/admin/login');
            }}
            className="flex size-11 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent text-sage hover:bg-ink-2 hover:text-white"
          >
            <Logout />
          </button>
        </div>
      </div>
    </aside>
  );
}
