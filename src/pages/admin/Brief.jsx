import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { answerLabel, getArea, getQuestions, getStages, razonesPuntaje, resultadoTexto, tipoDeLead } from '../../data/catalog';
import { campo, useLead, useLeads } from '../../data/LeadsContext';
import { useI18n } from '../../i18n/LanguageContext';
import { diaMes, enCuanto, fechaLarga, hora, iniciales, money } from '../../lib/format';
import RootLines from '../../components/ui/RootLines';
import { Alert, Clock, Message, Video } from '../../components/ui/Icons';
import { ButtonLink } from '../../components/ui/Button';
import WhatsAppDialog from '../../components/admin/WhatsAppPreview';
import { cubicajesDeLead, useCubicajes } from '../../data/useCubicajes';
import { getContenedor } from '../../cubicaje/config';
import { EstadoBadge } from '../../components/cubicaje/CubicajeUI';
import { num } from '../../lib/format';

function Card({ title, aside, children, className = '' }) {
  return (
    <section className={'flex flex-col gap-5 rounded-[32px_32px_32px_4px] bg-white px-6 py-7 md:px-9 md:py-8 ' + className}>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="m-0 font-serif text-[26px] font-semibold">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

function ScoreRing({ score }) {
  const C = 2 * Math.PI * 38;
  return (
    <div className="relative size-[92px] flex-none">
      <svg aria-hidden="true" width="92" height="92" viewBox="0 0 92 92">
        <circle cx="46" cy="46" r="38" fill="none" stroke="#2C5E60" strokeWidth="8" />
        <circle cx="46" cy="46" r="38" fill="none" stroke="#DDBD62" strokeWidth="8" strokeLinecap="round" strokeDasharray={`${(score / 10) * C} ${C}`} transform="rotate(-90 46 46)" />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-serif text-[30px] font-semibold">
        {score}
        <span className="font-sans text-[15px] font-medium text-sage">/10</span>
      </span>
    </div>
  );
}

export default function Brief() {
  const { id } = useParams();
  const lead = useLead(id);
  const { updateLead, moveLead } = useLeads();
  const { t, lang } = useI18n();
  const [whatsapp, setWhatsapp] = useState(false);
  const { lista: todosCubicajes } = useCubicajes();

  if (!lead) return <Navigate to="/admin" replace />;

  const a = lead.answers;
  const area = getArea(a.area, lang);
  const tipo = tipoDeLead(lead, lang);
  const lugar = lead.lugar || t('card.noCity');
  const preguntas = campo(lead, 'preguntas', lang) || area.preguntas;
  const hechas = lead.preguntasHechas || {};
  const nHechas = preguntas.filter((_, i) => hechas[i]).length;
  const razones = campo(lead, 'razones', lang) || razonesPuntaje(a, lang);
  const quote = campo(lead, 'cita_texto', lang) || resultadoTexto(a, lang).frase1;
  const alertas = campo(lead, 'alertas', lang);
  const detalles = campo(lead, 'detalles', lang) || [
    [t('brief.type'), tipo],
    [t('brief.city'), lugar],
    [t('brief.interest'), area.nombre],
    [t('brief.origin'), lead.fuente],
  ];
  const contacto = [
    ['WhatsApp', lead.whatsapp || t('brief.notSet')],
    [t('brief.email'), lead.correo || t('brief.notSet')],
  ];
  const actividad = [...(lead.activity || [])].sort((x, y) => new Date(x.at) - new Date(y.at));

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <nav aria-label={t('brief.crumb')} className="flex items-center gap-2 text-sm text-muted">
          <Link to="/admin" className="text-muted">
            {t('side.pipeline')}
          </Link>
          <span aria-hidden="true">/</span>
          <span className="font-semibold text-ink">{t('brief.crumb')}</span>
        </nav>
        <div className="flex flex-wrap items-center gap-2.5">
          {lead.cita && (
            <span className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-4 text-sm font-medium">
              <Clock size={16} className="text-clay" />
              {fechaLarga(lead.cita, lang)} · {hora(lead.cita, lang)} · {enCuanto(lead.cita, lang)}
            </span>
          )}
          <label className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white pr-2 pl-4 text-sm text-muted">
            {t('brief.stage')}
            <select
              value={lead.stage}
              onChange={(e) => moveLead(lead.id, Number(e.target.value))}
              className="min-h-9 cursor-pointer rounded-full border-0 bg-mist px-3 text-sm font-semibold text-ink"
            >
              {getStages(lang).map((s, i) => (
                <option key={i} value={i}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <ButtonLink to={`/admin/propuestas/${lead.id}`} variant="outline-ink" size="md">
            {t('brief.openProposal')}
          </ButtonLink>
          {lead.cita && (
            <a
              href="https://meet.google.com/new"
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-gold px-5 text-sm font-semibold text-ink no-underline"
            >
              <Video size={16} />
              {t('brief.join')}
            </a>
          )}
        </div>
      </div>

      <section className="relative flex flex-wrap items-center justify-between gap-10 overflow-hidden rounded-[40px_40px_40px_6px] bg-ink px-6 py-8 text-white md:px-11 md:py-10">
        <RootLines variant="small" opacity={0.12} className="right-[180px] -bottom-[60px]" />
        <div className="relative flex min-w-0 flex-[999_1_520px] flex-col gap-[18px]">
          <div className="flex items-center gap-[18px]">
            <span className="flex size-16 flex-none items-center justify-center rounded-[0_32px_0_32px] bg-clay font-serif text-2xl font-semibold">{iniciales(lead.nombre)}</span>
            <div className="flex flex-col gap-1">
              <h1 className="m-0 font-serif text-[34px] leading-[1.05] font-semibold tracking-[-0.01em] md:text-[44px]">{lead.nombre}</h1>
              <span className="text-[15px] text-sage">{t('brief.arrived', { tipo, lugar, fecha: diaMes(lead.createdAt, lang), fuente: lead.fuente })}</span>
            </div>
          </div>
          <p className="m-0 max-w-[760px] font-serif text-[22px] leading-[1.35] italic md:text-[27px]">“{quote}”</p>
        </div>
        <div className="relative flex flex-[1_1_260px] items-center gap-[22px] rounded-[28px_28px_28px_4px] bg-ink-2 px-6 py-[22px]">
          <ScoreRing score={lead.score} />
          <div className="flex flex-col gap-1.5 text-[13px] text-pale">
            <span className="text-sm font-semibold text-white">{t('brief.score')}</span>
            {razones.map((r) => (
              <span key={r}>{r}</span>
            ))}
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-start gap-6">
        <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-6">
          <Card
            title={t('brief.who')}
            aside={
              <span className="text-xs text-muted">
                {t('brief.source')}
                {lead.detalles ? t('brief.sourceMore') : ''}
              </span>
            }
          >
            <dl className="m-0 grid gap-x-8 sm:grid-cols-2">
              {[...detalles, ...contacto].map(([dt, dd]) => (
                <div key={dt} className="flex flex-col gap-1 border-t border-line-2 py-3.5">
                  <dt className="text-[13px] text-muted">{dt}</dt>
                  <dd className="m-0 text-[15px] leading-[1.45] font-medium">{dd}</dd>
                </div>
              ))}
            </dl>
          </Card>

          <Card title={t('brief.answered')} aside={<span className="text-xs text-muted">{t('brief.completed', { fecha: diaMes(lead.createdAt, lang), hora: hora(lead.createdAt, lang) })}</span>}>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {getQuestions(lang).map((q) => (
                <div key={q.key} className="flex flex-col gap-1.5 rounded-[18px_18px_18px_4px] bg-mist px-[18px] py-4">
                  <span className="text-xs text-muted">{q.key === 'perfil' ? q.q : q.label}</span>
                  <span className="text-[15px] font-semibold">{answerLabel(q.key, a[q.key], lang) || '—'}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card title={t('brief.ask')} aside={<span className="text-[13px] text-muted">{t('brief.solved', { n: nHechas, total: preguntas.length })}</span>}>
            <ol className="m-0 flex list-none flex-col gap-1 p-0">
              {preguntas.map((p, i) => {
                const on = !!hechas[i];
                return (
                  <li key={i}>
                    <label className="group flex cursor-pointer items-start gap-4 border-t border-line-2 px-1 py-3.5">
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() => updateLead(lead.id, (l) => ({ preguntasHechas: { ...(l.preguntasHechas || {}), [i]: !on } }))}
                        className="mt-0.5 size-[22px] flex-none cursor-pointer accent-ink"
                      />
                      <span className="flex flex-col gap-1">
                        <span className={'text-base leading-[1.4] font-semibold group-hover:underline ' + (on ? 'text-muted line-through' : 'text-ink')}>{p.q}</span>
                        <span className="text-sm leading-[1.5] text-muted">{p.why}</span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ol>
          </Card>
          {cubicajesDeLead(todosCubicajes, lead).length > 0 && (
            <Card title={t('cub.marca.briefT')} aside={<span className="text-xs text-muted">{t('cub.marca.briefD')}</span>}>
              <div className="flex flex-col">
                {cubicajesDeLead(todosCubicajes, lead).map((c) => {
                  const m = c.resultado?.metricas;
                  return (
                    <Link key={c.id} to={`/admin/cubicaje/${c.id}`} className="-mx-3 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border-t border-line-2 px-3 py-3.5 text-ink no-underline first:border-t-0 hover:bg-mist">
                      <span className="flex min-w-0 flex-[999_1_220px] flex-col gap-0.5">
                        <span className="text-[15px] font-semibold">{c.nombre}</span>
                        <span className="text-xs text-muted">
                          {getContenedor(c.tipoContenedor)?.nombre} · {t('cub.dash.cajas', { n: num(c.productos.reduce((s2, p) => s2 + p.cantidad, 0), 0, lang) })}
                          {m && ` · ${num(m.ocupacion, 0, lang)} % · ${num(m.pesoTotal, 0, lang)} kg`}
                        </span>
                      </span>
                      <EstadoBadge estado={c.estado} />
                      <span className="text-sm font-semibold">{t('cub.marca.ver')}</span>
                    </Link>
                  );
                })}
              </div>
            </Card>
          )}
        </div>

        <div className="flex min-w-0 flex-[1_1_340px] flex-col gap-6">
          <section className="flex flex-col gap-[18px] rounded-[6px_36px_36px_36px] bg-sage p-8">
            <span className="text-xs font-semibold tracking-[0.14em] uppercase">{t('brief.suggested')}</span>
            <div className="flex flex-col gap-1.5">
              <h2 className="m-0 font-serif text-[30px] leading-[1.1] font-semibold">{area.servicio}</h2>
              <span className="text-sm text-[#1D4446]">{area.nombre}</span>
            </div>
            <ul className="m-0 flex list-none flex-col gap-2.5 p-0 text-[15px] leading-[1.45]">
              {(campo(lead, 'incluye', lang) || area.incluye).map((x) => (
                <li key={x} className="flex gap-2.5">
                  <span aria-hidden="true" className="mt-[7px] size-2 flex-none rounded-[0_4px_0_4px] bg-ink" />
                  {x}
                </li>
              ))}
            </ul>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="flex flex-col gap-0.5 rounded-2xl bg-white px-4 py-3.5">
                <span className="text-xs text-muted">{t('brief.duration')}</span>
                <span className="text-[17px] font-semibold">{area.duracion}</span>
              </div>
              <div className="flex flex-col gap-0.5 rounded-2xl bg-white px-4 py-3.5">
                <span className="text-xs text-muted">{t('brief.reference')}</span>
                <span className="text-[17px] font-semibold">{money(lead.valor || area.precio)}</span>
              </div>
            </div>
            <ButtonLink to={`/admin/propuestas/${lead.id}`} variant="ink" size="lg">
              {t('brief.prepare')}
            </ButtonLink>
          </section>

          {alertas && (
            <section className="flex flex-col gap-3.5 rounded-[32px_32px_32px_4px] bg-clay-bg px-[30px] py-7">
              <div className="flex items-center gap-2.5 text-clay-dark">
                <Alert size={20} />
                <h2 className="m-0 text-base font-semibold">{t('brief.watch')}</h2>
              </div>
              {alertas.map((x) => (
                <p key={x} className="m-0 text-[15px] leading-[1.55] text-clay-ink">
                  {x}
                </p>
              ))}
            </section>
          )}

          <section className="flex flex-col gap-4 rounded-[32px_32px_32px_4px] bg-white px-[30px] py-7">
            <div className="flex items-center justify-between gap-3">
              <h2 className="m-0 text-base font-semibold">{t('brief.activity')}</h2>
              {lead.cita && (
                <button
                  type="button"
                  onClick={() => setWhatsapp(true)}
                  className="inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-full border border-line bg-white px-3.5 text-[13px] font-medium text-ink hover:bg-mist"
                >
                  <Message size={14} />
                  {t('brief.seeWa')}
                </button>
              )}
            </div>
            <ol className="m-0 flex list-none flex-col gap-3.5 p-0 text-sm">
              {actividad.map((ev, i) => (
                <li key={i} className="flex gap-3">
                  <span aria-hidden="true" className={'mt-[5px] box-border size-2.5 flex-none rounded-full ' + (ev.pending ? 'border-2 border-clay' : 'bg-ink')} />
                  <span className="flex flex-col gap-0.5">
                    <span className="font-medium">{t('activity.' + ev.k)}</span>
                    <span className="text-muted">
                      {diaMes(ev.at, lang)} · {hora(ev.at, lang)}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>

      {whatsapp && <WhatsAppDialog lead={lead} onClose={() => setWhatsapp(false)} />}
    </>
  );
}
