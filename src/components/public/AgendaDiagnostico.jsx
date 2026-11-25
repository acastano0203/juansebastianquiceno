import { useId, useMemo, useState } from 'react';
import { CalendarCheck, Clock, LoaderCircle, MessageCircle, Video } from 'lucide-react';
import { useI18n } from '../../i18n/LanguageContext';
import { useLeads } from '../../data/LeadsContext';
import { getArea } from '../../data/catalog';
import { ATENCION, HORAS_SESION, MINUTOS_RESPUESTA, TEMAS, diasDisponibles, enHorarioDeAtencion, instanteBogota, proximoDiaHabil } from '../../config/agenda';
import { guardarAgendaDiagnostico } from '../../services/agendaDiagnostico';
import { ENLACE_AGENDA } from '../../lib/contacto';
import { Campo, entrada } from '../academia/ModalAgendar';
import RootLines from '../ui/RootLines';
import { classes } from '../ui/Button';
import { ArrowRight, Check } from '../ui/Icons';
import foto from '../../assets/juan-sebastian-quiceno-agendar.jpg';

const locale = (lang) => (lang === 'en' ? 'en-US' : 'es-CO');

function horaTexto(h, lang) {
  const [hh, mm] = h.split(':').map(Number);
  return new Intl.DateTimeFormat(locale(lang), { hour: 'numeric', minute: '2-digit' }).format(new Date(2000, 0, 1, hh, mm));
}

// Mismo estilo de botones de opción que la agenda de la Academia
const chip = (on) =>
  'min-h-12 cursor-pointer rounded-xl px-2 text-sm transition-colors ' +
  (on ? 'border-[1.5px] border-ink bg-ink font-semibold text-white' : 'border border-[#B8CFC0] bg-white font-medium text-ink hover:border-ink');

const correoValido = (c) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(c.trim());

function Formulario() {
  const { t, lang } = useI18n();
  const { registrarAgenda } = useLeads();
  const id = useId();
  const dias = useMemo(() => diasDisponibles(5), []);
  const [tema, setTema] = useState(TEMAS[0]);
  const [dia, setDia] = useState(0);
  const [hora, setHora] = useState(1);
  const [nombre, setNombre] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [correo, setCorreo] = useState('');
  const [errores, setErrores] = useState({});
  const [estado, setEstado] = useState('editando'); // editando | enviando | error | listo
  const [confirmacion, setConfirmacion] = useState(null);

  const fmtDia = (d, opts) => new Intl.DateTimeFormat(locale(lang), opts).format(d);
  const resumen = `${fmtDia(dias[dia], { weekday: 'long', day: 'numeric', month: 'long' })} · ${horaTexto(HORAS_SESION[hora], lang)}`;

  const enviar = async (e) => {
    e.preventDefault();
    const err = {};
    if (!nombre.trim()) err.nombre = t('agenda.err.nombre');
    if (whatsapp.replace(/\D/g, '').length < 9) err.whatsapp = t('agenda.err.whatsapp');
    if (!correoValido(correo)) err.correo = t('agenda.err.correo');
    setErrores(err);
    if (Object.keys(err).length) {
      document.getElementById(`${id}-${Object.keys(err)[0]}`)?.focus();
      return;
    }
    setEstado('enviando');
    const ahora = new Date();
    const enHorario = enHorarioDeAtencion(ahora);
    const cita = instanteBogota(dias[dia], HORAS_SESION[hora]);
    // Fuera de horario la promesa es el siguiente día hábil a primera hora (+ el mismo plazo)
    const base = enHorario ? ahora : instanteBogota(proximoDiaHabil(ahora), `${ATENCION.desde}:00`);
    const contactarAntes = new Date(base.getTime() + MINUTOS_RESPUESTA * 60 * 1000);
    const datos = { nombre, whatsapp, correo, tema, cita, contactarAntes, lang };
    try {
      await guardarAgendaDiagnostico(datos);
    } catch {
      setEstado('error');
      return;
    }
    registrarAgenda(datos);
    setConfirmacion({ nombre: nombre.trim().split(' ')[0], correo: correo.trim(), resumen, enHorario, diaContacto: fmtDia(proximoDiaHabil(ahora), { weekday: 'long', day: 'numeric', month: 'long' }) });
    setEstado('listo');
  };

  if (estado === 'listo' && confirmacion) {
    const c = confirmacion;
    return (
      <div role="status" className="flex flex-col items-start gap-4 py-2">
        <span className="grid size-14 place-items-center rounded-full bg-gold/25 text-ink">
          <Check size={26} />
        </span>
        <h3 className="m-0 font-serif text-[26px] leading-[1.15] font-semibold">{t('agenda.listoT', { nombre: c.nombre })}</h3>
        <p className="m-0 flex items-center gap-2 text-[15px] font-semibold text-ink first-letter:uppercase">
          <CalendarCheck size={18} className="flex-none text-clay" aria-hidden="true" />
          <span className="first-letter:uppercase">{t('agenda.listoCuando', { resumen: c.resumen })}</span>
        </p>
        <p className="m-0 flex gap-2.5 rounded-2xl bg-mist p-4 text-[15px] leading-[1.55] text-ink">
          <MessageCircle size={20} className="mt-0.5 flex-none text-clay" aria-hidden="true" />
          <span>{c.enHorario ? t('agenda.listoPromesa', { correo: c.correo }) : t('agenda.listoFuera', { correo: c.correo, dia: c.diaContacto })}</span>
        </p>
        <button
          type="button"
          onClick={() => {
            setEstado('editando');
            setConfirmacion(null);
          }}
          className="inline-flex min-h-11 cursor-pointer items-center border-0 bg-transparent p-0 text-[15px] font-semibold text-ink underline"
        >
          {t('agenda.otra')}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h3 className="m-0 font-serif text-[24px] leading-[1.15] font-semibold">{t('agenda.formTitulo')}</h3>
        <p className="m-0 flex items-center gap-1.5 text-sm text-muted">
          <Clock size={15} aria-hidden="true" />
          {t('agenda.formSub')}
        </p>
      </div>

      <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
        <legend className="pb-2 text-sm font-semibold">{t('agenda.tema')}</legend>
        <div className="grid grid-cols-2 gap-2">
          {TEMAS.map((x) => (
            <button key={x} type="button" aria-pressed={tema === x} onClick={() => setTema(x)} className={chip(tema === x) + ' text-left leading-[1.25] sm:px-3'}>
              {getArea(x, lang).nombre}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
        <legend className="pb-2 text-sm font-semibold">{t('agenda.dia')}</legend>
        <div className="grid grid-cols-5 gap-2">
          {dias.map((d, i) => (
            <button
              key={d.toDateString()}
              type="button"
              aria-pressed={dia === i}
              aria-label={fmtDia(d, { weekday: 'long', day: 'numeric', month: 'long' })}
              onClick={() => setDia(i)}
              className={chip(dia === i) + ' flex min-h-16 flex-col items-center justify-center gap-0.5 px-0'}
            >
              <span className="text-xs capitalize">{fmtDia(d, { weekday: 'short' }).replace('.', '')}</span>
              <span className="text-lg font-semibold">{d.getDate()}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
        <legend className="pb-2 text-sm font-semibold">{t('agenda.hora')}</legend>
        <div className="grid grid-cols-3 gap-2">
          {HORAS_SESION.map((h, i) => (
            <button key={h} type="button" aria-pressed={hora === i} onClick={() => setHora(i)} className={chip(hora === i)}>
              {horaTexto(h, lang)}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-wrap gap-3">
        <Campo id={`${id}-nombre`} label={t('agenda.nombre')} error={errores.nombre}>
          <input id={`${id}-nombre`} type="text" autoComplete="name" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder={t('agenda.nombrePh')} aria-invalid={!!errores.nombre} aria-describedby={errores.nombre ? `${id}-nombre-e` : undefined} className={entrada(errores.nombre)} />
        </Campo>
        <Campo id={`${id}-whatsapp`} label={t('agenda.whatsapp')} error={errores.whatsapp}>
          <input id={`${id}-whatsapp`} type="tel" autoComplete="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder={t('agenda.whatsappPh')} aria-invalid={!!errores.whatsapp} aria-describedby={errores.whatsapp ? `${id}-whatsapp-e` : undefined} className={entrada(errores.whatsapp)} />
        </Campo>
        <Campo id={`${id}-correo`} label={t('agenda.correo')} error={errores.correo} className="flex-[1_1_100%]">
          <input id={`${id}-correo`} type="email" autoComplete="email" value={correo} onChange={(e) => setCorreo(e.target.value)} placeholder={t('agenda.correoPh')} aria-invalid={!!errores.correo} aria-describedby={errores.correo ? `${id}-correo-e` : `${id}-correo-ayuda`} className={entrada(errores.correo)} />
          {!errores.correo && (
            <span id={`${id}-correo-ayuda`} className="text-[13px] text-muted">
              {t('agenda.correoAyuda')}
            </span>
          )}
        </Campo>
      </div>

      {estado === 'error' && (
        <div role="alert" className="flex flex-col gap-1.5 rounded-xl border border-[#B3261E]/30 bg-[#FFF7F6] p-3.5 text-sm text-[#8C1D18]">
          <span>{t('agenda.err.envio')}</span>
          <a href={ENLACE_AGENDA} target="_blank" rel="noopener noreferrer" className="font-semibold text-[#8C1D18] underline">
            {t('agenda.err.alterno')}
          </a>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <button type="submit" disabled={estado === 'enviando'} aria-busy={estado === 'enviando'} className={classes({ variant: 'gold', size: 'xl', lift: estado !== 'enviando', className: 'w-full' })}>
          {estado === 'enviando' ? <LoaderCircle size={20} className="animate-spin" aria-hidden="true" /> : null}
          {estado === 'enviando' ? t('agenda.enviando') : t('agenda.confirmar')}
          {estado !== 'enviando' && <ArrowRight />}
        </button>
        <p className="m-0 text-center text-[13px] text-muted first-letter:uppercase">{resumen}</p>
        <p className="m-0 text-center text-xs text-muted">{t('agenda.privacidad')}</p>
      </div>
    </form>
  );
}

// Foto con dos tarjetas flotantes, en el estilo del proyecto
function Retrato() {
  const { t } = useI18n();
  return (
    <div className="relative mx-auto mt-2 w-full max-w-[360px] pb-10 lg:mx-0">
      <div className="absolute -top-4 -left-4 size-[200px] rounded-[0_120px_0_120px] bg-ink-2" aria-hidden="true" />
      <div className="relative overflow-hidden rounded-[32px_96px_32px_6px] border-2 border-gold/40 shadow-[0_30px_60px_rgba(0,0,0,.35)]">
        <img src={foto} alt={t('agenda.fotoAlt')} className="block aspect-[4/5] w-full object-cover object-top" loading="lazy" />
      </div>
      <div className="absolute -right-2 bottom-16 flex items-center gap-3 rounded-2xl bg-white px-3.5 py-2.5 text-ink shadow-[0_15px_35px_rgba(0,0,0,.3)] md:-right-10">
        <span className="grid size-9 place-items-center rounded-xl bg-sage/40 text-ink">
          <Video size={18} aria-hidden="true" />
        </span>
        <span className="flex flex-col">
          <strong className="font-serif text-[14px]">{t('agenda.meet')}</strong>
          <span className="text-[12px] text-muted">{t('agenda.meetSub')}</span>
        </span>
      </div>
      <div className="absolute bottom-0 -left-2 flex items-center gap-3 rounded-2xl bg-white px-3.5 py-2.5 text-ink shadow-[0_15px_35px_rgba(0,0,0,.3)] md:-left-8">
        <span className="grid size-9 place-items-center rounded-xl bg-gold/25 text-clay">
          <MessageCircle size={18} aria-hidden="true" />
        </span>
        <span className="flex flex-col">
          <strong className="flex items-center gap-1.5 font-serif text-[14px]">
            {t('agenda.respuesta')}
            <span className="size-2 animate-pulse rounded-full bg-[#2E9E5B]" aria-hidden="true" />
          </strong>
          <span className="text-[12px] text-muted">{t('agenda.respuestaSub')}</span>
        </span>
      </div>
    </div>
  );
}

/** Sección "Agenda una sesión" que va sobre el pie de todas las páginas públicas */
export default function AgendaDiagnostico() {
  const { t, lang } = useI18n();
  const h = (n) => new Intl.DateTimeFormat(locale(lang), { hour: 'numeric', minute: '2-digit' }).format(new Date(2000, 0, 1, n));
  return (
    <section id="agendar-sesion" aria-labelledby="agenda-titulo" className="relative overflow-clip bg-ink text-white">
      <RootLines variant="hero" opacity={0.14} className="-bottom-24 -left-24 hidden md:block" />
      <div className="relative mx-auto grid max-w-[1240px] items-start gap-12 px-[22px] py-16 md:px-10 md:py-24 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-16">
        <div className="flex min-w-0 flex-col gap-6">
          <span className="inline-flex items-center gap-2 self-start rounded-full border border-gold/40 bg-gold/10 px-3.5 py-1.5 text-[11px] font-bold tracking-[0.12em] text-gold uppercase">
            <Video size={14} aria-hidden="true" />
            {t('agenda.badge')}
          </span>
          <h2 id="agenda-titulo" className="m-0 font-serif text-[32px] leading-[1.1] font-semibold text-balance md:text-[44px]">
            {t('agenda.titulo')}
          </h2>
          <p className="m-0 max-w-[560px] text-base leading-[1.6] text-pale md:text-[17px]">{t('agenda.lead')}</p>
          <ul className="m-0 flex list-none flex-col gap-3.5 p-0">
            {t('agenda.puntos').map((p) => (
              <li key={p.b} className="flex gap-3 text-[15px] leading-[1.5] text-pale">
                <span className="mt-0.5 grid size-6 flex-none place-items-center rounded-full bg-gold text-ink">
                  <Check size={14} />
                </span>
                <span>
                  <strong className="text-gold">{p.b}</strong>
                  {p.t}
                </span>
              </li>
            ))}
          </ul>
          <p className="m-0 text-[13px] text-sage">{t('agenda.horario', { desde: h(ATENCION.desde), hasta: h(ATENCION.hasta) })}</p>
          <div className="hidden lg:block">
            <Retrato />
          </div>
        </div>
        <div className="rounded-[28px_28px_28px_6px] bg-white p-5 text-ink shadow-[0_30px_70px_rgba(0,0,0,.35)] md:p-8 lg:sticky lg:top-6">
          <Formulario />
        </div>
      </div>
    </section>
  );
}
