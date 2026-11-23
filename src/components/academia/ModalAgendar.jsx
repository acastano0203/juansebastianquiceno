import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useI18n } from '../../i18n/LanguageContext';
import { guardarAgenda, registroGuardado } from '../../services/academia';
import { enlaceWhatsApp } from '../../lib/contacto';
import { classes } from '../ui/Button';
import { ArrowRight, Check, Close } from '../ui/Icons';

const HORAS = ['9:00', '10:00', '11:30', '14:00', '15:30', '17:00'];
const PLANES_LLAMADA = ['pro', 'vivo', 'pregrabado'];

/** Próximos 5 días hábiles, contados desde mañana en hora de Colombia */
function diasHabiles(n = 5) {
  const hoy = new Date(new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date()) + 'T12:00:00');
  const dias = [];
  const d = new Date(hoy);
  while (dias.length < n) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0 && d.getDay() !== 6) dias.push(new Date(d));
  }
  return dias;
}

const iso = (d) => d.toISOString().slice(0, 10);

function horaTexto(h, lang) {
  const [hh, mm] = h.split(':').map(Number);
  const d = new Date(2000, 0, 1, hh, mm);
  return new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'es-CO', { hour: 'numeric', minute: '2-digit' }).format(d);
}

/** Estado del modal para cualquier página: const ag = useAgendar(); ag.abrir('pro'); {ag.modal} */
export function useAgendar() {
  const [plan, setPlan] = useState(null);
  const abrir = useCallback((p = 'pro') => setPlan(p), []);
  const cerrar = useCallback(() => setPlan(null), []);
  const modal = plan ? <ModalAgendar planInicial={plan} onCerrar={cerrar} /> : null;
  return { abrir, cerrar, modal };
}

export default function ModalAgendar({ planInicial = 'pro', onCerrar }) {
  const { t, lang } = useI18n();
  const id = useId();
  const caja = useRef(null);
  const dias = useMemo(() => diasHabiles(5), []);
  const previo = registroGuardado();
  const [plan, setPlan] = useState(planInicial);
  const [dia, setDia] = useState(0);
  const [hora, setHora] = useState(1);
  const [nombre, setNombre] = useState(previo?.nombre ?? '');
  const [whatsapp, setWhatsapp] = useState(previo ? `${previo.indicativo} ${previo.whatsapp}` : '');
  const [errores, setErrores] = useState({});
  const [estado, setEstado] = useState('editando'); // editando | enviando | listo

  // Escape cierra, el foco entra al diálogo y la página de atrás no se desplaza
  useEffect(() => {
    const anterior = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    caja.current?.querySelector('button, input')?.focus();
    const tecla = (e) => {
      if (e.key === 'Escape') onCerrar();
      if (e.key === 'Tab' && caja.current) {
        const f = [...caja.current.querySelectorAll('button:not([disabled]), input, a[href]')];
        if (!f.length) return;
        const [primero, ultimo] = [f[0], f[f.length - 1]];
        if (e.shiftKey && document.activeElement === primero) {
          e.preventDefault();
          ultimo.focus();
        } else if (!e.shiftKey && document.activeElement === ultimo) {
          e.preventDefault();
          primero.focus();
        }
      }
    };
    document.addEventListener('keydown', tecla);
    return () => {
      document.removeEventListener('keydown', tecla);
      document.body.style.overflow = overflow;
      anterior?.focus?.();
    };
  }, [onCerrar]);

  const fmtDia = (d, opts) => new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'es-CO', opts).format(d);
  const resumen = `${fmtDia(dias[dia], { weekday: 'long', day: 'numeric', month: 'long' })} · ${horaTexto(HORAS[hora], lang)}`;
  const nombrePlan = t('aca.ins.cortos.' + plan);

  const confirmar = async () => {
    const err = {};
    if (!nombre.trim()) err.nombre = t('aca.ag.err.nombre');
    if (whatsapp.replace(/\D/g, '').length < 9) err.whatsapp = t('aca.ag.err.whatsapp');
    setErrores(err);
    if (Object.keys(err).length) return;
    setEstado('enviando');
    try {
      await guardarAgenda({ nombre, whatsapp, plan, fecha: iso(dias[dia]), hora: HORAS[hora] });
    } catch {
      // La cita igual se confirma por WhatsApp desde la pantalla siguiente
    }
    setEstado('listo');
  };

  const chip = (on) =>
    'min-h-12 cursor-pointer rounded-xl text-sm transition-colors ' + (on ? 'border-[1.5px] border-ink bg-ink font-semibold text-white' : 'border border-[#B8CFC0] bg-white font-medium text-ink hover:border-ink');
  const msg = t('aca.ag.msg', { nombre: nombre.trim(), plan: nombrePlan, resumen });
  const wa = enlaceWhatsApp(msg);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(12,39,40,0.72)] md:items-center md:p-6" onMouseDown={(e) => e.target === e.currentTarget && onCerrar()}>
      <div
        ref={caja}
        role="dialog"
        aria-modal="true"
        aria-labelledby={id + '-t'}
        className="relative flex max-h-[92vh] w-full flex-col gap-5 overflow-y-auto rounded-t-3xl bg-white px-5 pt-6 pb-7 text-ink shadow-[0_24px_60px_rgba(0,0,0,0.35)] animate-[aparecer_.25s_ease-out] md:max-w-[560px] md:rounded-2xl md:p-8"
      >
        <button type="button" onClick={onCerrar} aria-label={t('aca.ag.cerrar')} className="absolute top-4 right-4 flex size-11 cursor-pointer items-center justify-center rounded-full border-0 bg-line-2 text-ink">
          <Close size={18} />
        </button>

        {estado !== 'listo' ? (
          <>
            <div className="flex flex-col gap-1.5 pr-12">
              <p className="m-0 text-xs font-semibold tracking-[0.16em] text-clay uppercase">{t('aca.ag.eyebrow')}</p>
              <h2 id={id + '-t'} className="m-0 font-serif text-[26px] leading-[1.15] font-semibold md:text-[28px]">{t('aca.ag.titulo')}</h2>
              <p className="m-0 text-sm text-muted">{t('aca.ag.lead')}</p>
            </div>

            <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
              <legend className="pb-2 text-sm font-semibold">{t('aca.ag.plan')}</legend>
              <div className="grid grid-cols-3 gap-2">
                {PLANES_LLAMADA.map((p) => (
                  <button key={p} type="button" aria-pressed={plan === p} onClick={() => setPlan(p)} className={chip(plan === p)}>
                    {t('aca.ins.cortos.' + p)}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
              <legend className="pb-2 text-sm font-semibold">{t('aca.ag.dia')}</legend>
              <div className="grid grid-cols-5 gap-2">
                {dias.map((d, i) => (
                  <button key={iso(d)} type="button" aria-pressed={dia === i} aria-label={fmtDia(d, { weekday: 'long', day: 'numeric', month: 'long' })} onClick={() => setDia(i)} className={chip(dia === i) + ' flex min-h-16 flex-col items-center justify-center gap-0.5'}>
                    <span className="text-xs capitalize">{fmtDia(d, { weekday: 'short' }).replace('.', '')}</span>
                    <span className="text-lg font-semibold">{d.getDate()}</span>
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
              <legend className="pb-2 text-sm font-semibold">{t('aca.ag.hora')}</legend>
              <div className="grid grid-cols-3 gap-2">
                {HORAS.map((h, i) => (
                  <button key={h} type="button" aria-pressed={hora === i} onClick={() => setHora(i)} className={chip(hora === i)}>
                    {horaTexto(h, lang)}
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="flex flex-wrap gap-3">
              <Campo id={id + '-n'} label={t('aca.ag.nombre')} error={errores.nombre}>
                <input id={id + '-n'} type="text" autoComplete="name" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Andrés Gómez" aria-invalid={!!errores.nombre} aria-describedby={errores.nombre ? id + '-n-e' : undefined} className={entrada(errores.nombre)} />
              </Campo>
              <Campo id={id + '-w'} label={t('aca.ag.whatsapp')} error={errores.whatsapp}>
                <input id={id + '-w'} type="tel" autoComplete="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder={t('aca.ag.whatsappPh')} aria-invalid={!!errores.whatsapp} aria-describedby={errores.whatsapp ? id + '-w-e' : undefined} className={entrada(errores.whatsapp)} />
              </Campo>
            </div>

            <button type="button" onClick={confirmar} disabled={estado === 'enviando'} aria-busy={estado === 'enviando'} className={classes({ variant: 'gold', size: 'xl', lift: true, className: 'w-full' })}>
              {t('aca.ag.confirmar')}
              <ArrowRight />
            </button>
            <p className="m-0 text-center text-[13px] text-muted first-letter:uppercase">{resumen}</p>
          </>
        ) : (
          <div className="flex flex-col items-start gap-3.5 py-2 pr-12" role="status">
            <span className="grid size-14 place-items-center rounded-full bg-line-2 text-ink">
              <Check size={26} />
            </span>
            <h2 id={id + '-t'} className="m-0 font-serif text-[28px] leading-[1.15] font-semibold">{t('aca.ag.listoT')}</h2>
            <p className="m-0 text-[15px] text-muted first-letter:uppercase">{t('aca.ag.listoD', { resumen })}</p>
            {wa && (
              <a href={wa} target="_blank" rel="noreferrer" className={classes({ variant: 'gold', size: 'lg' })}>
                {t('aca.ag.abrirWa')}
              </a>
            )}
            <button type="button" onClick={onCerrar} className="inline-flex min-h-11 cursor-pointer items-center border-0 bg-transparent p-0 text-[15px] font-semibold text-ink underline">
              {t('aca.ag.volver')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export const entrada = (error) =>
  'h-12 w-full min-w-0 rounded-xl px-3.5 text-[15px] text-ink outline-none transition-colors placeholder:text-[#8AA09E] ' +
  (error ? 'border-2 border-[#B3261E] bg-[#FFF7F6]' : 'border border-[#B8CFC0] bg-white focus:border-2 focus:border-ink');

export function Campo({ id, label, error, children, className = 'flex-[1_1_180px]' }) {
  return (
    <div className={'flex min-w-0 flex-col gap-1.5 ' + className}>
      <label htmlFor={id} className="text-sm font-semibold">{label}</label>
      {children}
      {error && (
        <p id={id + '-e'} className="m-0 flex items-center gap-1.5 text-[13px] font-medium text-[#B3261E]">
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7.5v5.5M12 16.5v.01" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}
