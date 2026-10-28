import { useEffect, useRef } from 'react';
import { answerLabel, getQuestions, getStages, tipoDeLead } from '../../data/catalog';
import { getContenedor } from '../../cubicaje/config';
import { totalCajas } from '../../data/cubicajesRepo';
import { useI18n } from '../../i18n/LanguageContext';
import { fechaConAnio, fechaCorta, hora, num } from '../../lib/format';
import { ButtonLink } from '../ui/Button';
import { ArrowRight, Close } from '../ui/Icons';
import { EstadoBadge } from '../cubicaje/CubicajeUI';
import { Cubo } from '../cubicaje/PaqueteIcono';
import { ScoreBadge } from './LeadCard';

function Seccion({ titulo, children }) {
  return (
    <section className="flex flex-col gap-2.5">
      <h3 className="m-0 text-xs font-semibold tracking-[0.08em] text-muted uppercase">{titulo}</h3>
      {children}
    </section>
  );
}

function Dato({ label, children }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="m-0 text-sm font-semibold break-words">{children}</dd>
    </div>
  );
}

// Ficha rápida del prospecto (doble clic en la tarjeta del tablero)
export default function LeadDialog({ lead, cubicajes, onClose }) {
  const { t, lang } = useI18n();
  const ref = useRef();

  useEffect(() => {
    const d = ref.current;
    d.showModal();
    const close = () => onClose();
    d.addEventListener('close', close);
    return () => d.removeEventListener('close', close);
  }, [onClose]);

  const etapa = getStages(lang)[lead.stage];
  const soloCubicaje = lead.fuente === 'Cubicaje';
  const respuestas = soloCubicaje ? [] : getQuestions(lang).filter((q) => lead.answers?.[q.key]);
  const actividad = [...(lead.activity || [])].filter((a) => !a.pending).sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, 5);
  const wa = (lead.whatsapp || '').replace(/\D/g, '');

  return (
    <dialog
      ref={ref}
      aria-labelledby="lead-dialog-titulo"
      className="m-auto box-border max-h-[calc(100dvh-24px)] w-[min(720px,calc(100%-24px))] max-w-none overflow-y-auto rounded-[32px_32px_32px_6px] border-0 bg-white p-0 text-ink backdrop:bg-[rgba(9,28,29,0.55)]"
      onClick={(e) => {
        if (e.target === ref.current) ref.current.close();
      }}
    >
      <div className="flex items-start justify-between gap-4 border-b border-line-2 px-6 py-5 md:px-8">
        <div className="flex min-w-0 flex-col gap-1.5">
          <span className="text-xs text-muted">{t('ficha.titulo')}</span>
          <h2 id="lead-dialog-titulo" className="m-0 font-serif text-[26px] leading-[1.15] font-semibold">
            {lead.nombre}
          </h2>
          <span className="flex flex-wrap items-center gap-2 text-[13px]">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-mist px-2.5 py-1 font-medium">
              <span aria-hidden="true" className="size-2 rounded-full" style={{ background: etapa.dot }} />
              {t('ficha.etapa')}: {etapa.name}
            </span>
            <span className="rounded-full bg-mist px-2.5 py-1 font-medium">{tipoDeLead(lead, lang)}</span>
            <ScoreBadge score={lead.score} />
          </span>
        </div>
        <button
          type="button"
          aria-label={t('ficha.cerrar')}
          onClick={() => ref.current.close()}
          className="flex size-11 flex-none cursor-pointer items-center justify-center rounded-full border-0 bg-mist text-ink hover:bg-mist-2"
        >
          <Close size={18} />
        </button>
      </div>

      <div className="flex flex-col gap-6 px-6 py-6 md:px-8">
        <Seccion titulo={t('ficha.contacto')}>
          <dl className="m-0 grid grid-cols-[repeat(auto-fit,minmax(min(180px,100%),1fr))] gap-x-5 gap-y-3">
            <Dato label={t('ficha.whatsapp')}>
              {wa ? (
                <a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer" className="text-ink">
                  {lead.whatsapp}
                </a>
              ) : (
                '—'
              )}
            </Dato>
            <Dato label={t('ficha.correo')}>{lead.correo ? <a href={`mailto:${lead.correo}`} className="text-ink">{lead.correo}</a> : '—'}</Dato>
            <Dato label={t('ficha.lugar')}>{lead.lugar || t('card.noCity')}</Dato>
            <Dato label={t('ficha.fuente')}>{lead.fuente || '—'}</Dato>
            <Dato label={t('ficha.creado')}>{fechaConAnio(lead.createdAt, lang)}</Dato>
            <Dato label={t('ficha.cita')}>{lead.cita ? `${fechaCorta(lead.cita, lang)} · ${hora(lead.cita, lang)}` : t('ficha.sinCita')}</Dato>
          </dl>
        </Seccion>

        <Seccion titulo={t('ficha.cubicajes')}>
          {cubicajes.length ? (
            <div className="flex flex-col gap-2">
              {cubicajes.map((c) => {
                const m = c.resultado?.metricas;
                return (
                  <div key={c.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[18px_18px_18px_4px] bg-mist px-4 py-3">
                    <span aria-hidden="true" className="flex size-10 flex-none items-center justify-center rounded-[0_20px_0_20px] bg-ink text-gold">
                      <Cubo size={20} />
                    </span>
                    <span className="flex min-w-0 flex-[999_1_200px] flex-col gap-0.5">
                      <span className="text-sm font-semibold">{c.nombre}</span>
                      <span className="text-xs text-muted">
                        {getContenedor(c.tipoContenedor)?.nombre} · {t('cub.dash.cajas', { n: num(totalCajas(c), 0, lang) })}
                        {m && ` · ${num(m.ocupacion, 0, lang)} % · ${num(m.pesoTotal, 0, lang)} kg`}
                      </span>
                    </span>
                    <EstadoBadge estado={c.estado} />
                    <ButtonLink to={`/admin/cubicaje/${c.id}`} variant="ink" size="sm" className="min-h-10">
                      {t('ficha.abrirCubicaje')}
                      <ArrowRight size={14} />
                    </ButtonLink>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="m-0 text-sm text-muted">{t('ficha.sinCubicajes')}</p>
          )}
        </Seccion>

        <Seccion titulo={t('ficha.respuestas')}>
          {respuestas.length ? (
            <dl className="m-0 grid grid-cols-[repeat(auto-fit,minmax(min(200px,100%),1fr))] gap-x-5 gap-y-3">
              {respuestas.map((q) => (
                <Dato key={q.key} label={q.label}>
                  {answerLabel(q.key, lead.answers[q.key], lang)}
                </Dato>
              ))}
            </dl>
          ) : (
            <p className="m-0 text-sm text-muted">{t('ficha.sinRespuestas')}</p>
          )}
        </Seccion>

        {actividad.length > 0 && (
          <Seccion titulo={t('ficha.actividad')}>
            <ul className="m-0 flex list-none flex-col gap-1.5 p-0 text-sm">
              {actividad.map((a, i) => (
                <li key={i} className="flex flex-wrap justify-between gap-2">
                  <span className="font-medium">{t('activity.' + a.k)}</span>
                  <span className="text-xs text-muted">
                    {fechaCorta(a.at, lang)} · {hora(a.at, lang)}
                  </span>
                </li>
              ))}
            </ul>
          </Seccion>
        )}
      </div>

      <div className="flex flex-wrap justify-end gap-2.5 border-t border-line-2 px-6 py-4 md:px-8">
        <button type="button" onClick={() => ref.current.close()} className="min-h-12 cursor-pointer rounded-full border-[1.5px] border-line bg-white px-5 text-sm font-semibold text-ink">
          {t('ficha.cerrar')}
        </button>
        <ButtonLink to={`/admin/prospectos/${lead.id}`} variant="gold" size="md" className="min-h-12">
          {t('ficha.verBrief')}
          <ArrowRight size={16} />
        </ButtonLink>
      </div>
    </dialog>
  );
}
