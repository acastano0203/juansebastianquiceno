import { Link } from 'react-router-dom';
import { TIPOS, getArea, tipoDeLead } from '../../data/catalog';
import { useI18n } from '../../i18n/LanguageContext';
import { fechaCorta, haceCuanto, hora, money } from '../../lib/format';

export function ScoreBadge({ score }) {
  const { t } = useI18n();
  const tone = score >= 8 ? 'bg-ink text-white' : score >= 6 ? 'bg-sage text-ink' : 'bg-[#ECEFEA] text-muted';
  return (
    <span aria-label={t('card.score', { s: score })} className={'box-border flex h-[26px] min-w-[38px] flex-none items-center justify-center rounded-full px-2 text-[13px] font-semibold ' + tone}>
      {score}/10
    </span>
  );
}

function meta(lead, t, lang) {
  if (lead.stage === 0) return haceCuanto(lead.createdAt, lang);
  if (lead.stage === 1) return t('card.waiting');
  if (lead.stage === 2) return lead.cita ? fechaCorta(lead.cita, lang) + ' · ' + hora(lead.cita, lang) : t('card.noTime');
  return lead.valor ? money(lead.valor) : t('card.noValue');
}

export default function LeadCard({ lead, destacado, onDragStart, onDragEnd }) {
  const { t, lang } = useI18n();
  const tipo = TIPOS[lead.answers.perfil] || TIPOS.empresario;

  return (
    <article
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', lead.id);
        e.dataTransfer.effectAllowed = 'move';
        onDragStart?.(lead.id);
      }}
      onDragEnd={onDragEnd}
      className={
        'flex cursor-grab flex-col gap-3 rounded-[18px_18px_18px_4px] border-[1.5px] bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(18,54,56,.10)] active:cursor-grabbing ' +
        (destacado ? 'border-gold' : 'border-transparent')
      }
    >
      <div className="flex items-start justify-between gap-2.5">
        <span className="flex min-w-0 flex-col gap-[3px]">
          <Link to={`/admin/prospectos/${lead.id}`} className="text-[15px] leading-[1.3] font-semibold text-ink no-underline hover:underline">
            {lead.nombre}
          </Link>
          <span className="text-xs text-muted">{lead.lugar || t('card.noCity')}</span>
        </span>
        <ScoreBadge score={lead.score} />
      </div>
      <div className="flex flex-wrap gap-1.5">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-mist px-2.5 py-1 text-xs font-medium">
          <span aria-hidden="true" className="size-[7px] rounded-full" style={{ background: tipo.dot }} />
          {tipoDeLead(lead, lang)}
        </span>
        {lead.nuevo && <span className="rounded-full bg-gold/30 px-2.5 py-1 text-xs font-medium">{t('card.fromLanding')}</span>}
      </div>
      <span className="text-[13px] leading-[1.4]">{getArea(lead.answers.area, lang).nombre}</span>
      <div className="flex items-center justify-between gap-2 border-t border-line-2 pt-2.5 text-xs text-muted">
        <span>{meta(lead, t, lang)}</span>
        {lead.stage === 2 && (
          <Link to={`/admin/prospectos/${lead.id}`} className="inline-flex min-h-8 items-center rounded-full bg-gold px-3 font-semibold text-ink no-underline">
            {t('card.brief')}
          </Link>
        )}
      </div>
    </article>
  );
}
