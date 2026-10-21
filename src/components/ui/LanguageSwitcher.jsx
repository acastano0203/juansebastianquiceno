import { useI18n } from '../../i18n/LanguageContext';
import { FlagES, FlagUS } from './Flags';

const OPTIONS = [
  { id: 'es', code: 'ES', Flag: FlagES },
  { id: 'en', code: 'EN', Flag: FlagUS },
];

// tone="dark" sobre fondos verde oscuro, tone="light" sobre fondos claros
export default function LanguageSwitcher({ tone = 'dark', compact = false, className = '' }) {
  const { lang, setLang, t } = useI18n();
  const dark = tone === 'dark';

  return (
    <div role="group" aria-label={t('lang.label')} className={'inline-flex items-center gap-1 rounded-full p-1 ' + (dark ? 'bg-ink-2' : 'bg-white') + ' ' + className}>
      {OPTIONS.map(({ id, code, Flag }) => {
        const on = lang === id;
        return (
          <button
            key={id}
            type="button"
            aria-pressed={on}
            aria-label={t('lang.' + id)}
            title={t('lang.' + id)}
            onClick={() => setLang(id)}
            className={
              'inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full border-0 px-2.5 text-xs font-semibold tracking-[0.06em] transition-colors ' +
              (on ? (dark ? 'bg-white text-ink' : 'bg-ink text-white') : dark ? 'bg-transparent text-sage hover:text-white' : 'bg-transparent text-muted hover:text-ink')
            }
          >
            <Flag className="h-3.5 w-5 flex-none overflow-hidden rounded-[3px] shadow-[0_0_0_1px_rgba(0,0,0,.12)]" />
            <span className={compact ? 'hidden sm:inline' : ''}>{code}</span>
          </button>
        );
      })}
    </div>
  );
}
