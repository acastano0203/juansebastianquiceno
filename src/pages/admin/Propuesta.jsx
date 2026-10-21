import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useLead, useLeads } from '../../data/LeadsContext';
import { plantillaPropuesta, totalInversion } from '../../data/proposals';
import { fechaLarga, money, monthName } from '../../lib/format';
import { useI18n } from '../../i18n/LanguageContext';
import PageHeader from '../../components/admin/PageHeader';
import { Button } from '../../components/ui/Button';
import { Check, Download, Refresh } from '../../components/ui/Icons';

const SECCIONES = [
  ['contexto', 'Contexto'],
  ['diagnostico', 'Diagnóstico'],
  ['alcance', 'Alcance'],
  ['tiempos', 'Tiempos'],
];

function RegenButton({ busy, onClick }) {
  const { t } = useI18n();
  return (
    <button
      type="button"
      onClick={onClick}
      className="no-print inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-full border border-line bg-white px-3.5 text-[13px] font-medium text-ink hover:bg-mist"
    >
      <Refresh size={14} style={{ animation: busy ? 'spin-slow .8s linear infinite' : 'none' }} />
      {busy ? t('prop.regenerating') : t('prop.regen')}
    </button>
  );
}

function SectionTitle({ n, children }) {
  return (
    <h3 className="m-0 flex items-baseline gap-2.5 font-serif text-[22px] font-semibold">
      <span className="text-base font-normal text-clay italic">{n}</span>
      {children}
    </h3>
  );
}

export default function Propuesta() {
  const { id } = useParams();
  const lead = useLead(id);
  const { updateLead, moveLead } = useLeads();
  const { t, lang } = useI18n();
  const [busy, setBusy] = useState({});
  const [exporting, setExporting] = useState(false);
  const [aviso, setAviso] = useState('');
  const timers = useRef([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const later = (fn, ms) => timers.current.push(setTimeout(fn, ms));

  if (!lead) return <Navigate to="/admin" replace />;

  const tpl = plantillaPropuesta(lead);
  const estado = lead.propuesta || { v: {}, txt: {}, guardado: null };
  const save = (patch) =>
    updateLead(lead.id, (l) => {
      const prev = l.propuesta || { v: {}, txt: {} };
      return { propuesta: { ...prev, ...patch(prev), guardado: new Date().toISOString() } };
    });

  const regen = (k, n) => {
    if (busy[k]) return;
    setBusy((b) => ({ ...b, [k]: true }));
    later(() => {
      save((p) => {
        const txt = { ...p.txt };
        delete txt[k];
        return { v: { ...p.v, [k]: ((p.v[k] || 0) + 1) % n }, txt };
      });
      setBusy((b) => ({ ...b, [k]: false }));
    }, 800);
  };

  const inv = tpl.inversion[estado.v.inversion || 0];
  const total = totalInversion(inv.rows);
  const enviada = lead.stage >= 3;
  const hoy = new Date();
  const archivo = 'Propuesta_' + lead.nombre.replace(/\s+/g, '_') + '_JSQ.pdf';

  const exportar = () => {
    if (exporting) return;
    setExporting(true);
    const prevTitle = document.title;
    document.title = archivo.replace('.pdf', '');
    later(() => {
      window.print();
      document.title = prevTitle;
      setExporting(false);
      setAviso(t('prop.exported', { file: archivo }));
      later(() => setAviso(''), 5000);
    }, 300);
  };

  const marcarEnviada = () => {
    updateLead(lead.id, { valor: total });
    moveLead(lead.id, 3);
    setAviso(t('prop.sentMsg', { v: money(total) }));
    later(() => setAviso(''), 5000);
  };

  return (
    <>
      <div className="no-print">
        <PageHeader
          eyebrow={
            <nav aria-label={t('prop.crumb')} className="flex gap-2">
              <Link to={`/admin/prospectos/${lead.id}`} className="text-muted">
                {lead.nombre}
              </Link>
              <span aria-hidden="true">/</span>
              <span>{t('prop.crumb')}</span>
            </nav>
          }
          title={t('prop.title')}
        >
          <span className="text-[13px] text-muted">{estado.guardado ? t('prop.saved') : t('prop.unsaved')}</span>
          {!enviada && (
            <Button variant="outline-ink" size="md" onClick={marcarEnviada}>
              {t('prop.markSent')}
            </Button>
          )}
          <Button variant="gold" size="md" className="min-h-12 px-6 text-[15px]" onClick={exportar}>
            <Download />
            {exporting ? t('prop.exporting') : t('prop.export')}
          </Button>
        </PageHeader>
      </div>

      {aviso && (
        <div role="status" className="no-print flex items-center gap-3 rounded-2xl bg-ink px-[18px] py-3.5 text-sm text-white">
          <Check size={18} strokeWidth={2.4} className="text-gold" />
          <span>{aviso}</span>
        </div>
      )}

      {lang !== 'es' && <p className="no-print m-0 text-[13px] text-muted">{t('prop.docLang')}</p>}

      <div className="flex flex-wrap items-start gap-[22px]">
        <section className="no-print flex min-w-0 flex-[1_1_340px] flex-col gap-4 rounded-[28px_28px_28px_4px] bg-white p-6">
          {tpl.transcripcion ? (
            <>
              <div className="flex flex-col gap-1">
                <h2 className="m-0 text-base font-semibold">{t('prop.callWith', { name: lead.nombre })}</h2>
                <span className="text-[13px] text-muted">
                  {lead.cita ? fechaLarga(lead.cita, lang) + ' · ' : ''}
                  {tpl.transcripcion.resumen}
                </span>
              </div>
              <div className="flex max-h-[640px] flex-col gap-3.5 overflow-y-auto pr-1.5">
                {tpl.transcripcion.lineas.map(([ini, who, ts, txt]) => (
                  <div key={ts} className="flex gap-3">
                    <span className={'flex size-[30px] flex-none items-center justify-center rounded-full text-[11px] font-semibold text-white ' + (ini === 'JS' ? 'bg-ink' : 'bg-clay')}>{ini}</span>
                    <span className="flex flex-col gap-[3px]">
                      <span className="text-xs text-muted">
                        <strong className="font-semibold text-ink">{who}</strong> · {ts}
                      </span>
                      <span className="text-sm leading-[1.5]">{txt}</span>
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-1">
              <h2 className="m-0 text-base font-semibold">{t('prop.callWith', { name: lead.nombre })}</h2>
              <span className="text-[13px] leading-[1.5] text-muted">
                {lead.cita ? t('prop.scheduledFor', { fecha: lang === 'es' ? fechaLarga(lead.cita, lang).toLowerCase() : fechaLarga(lead.cita, lang) }) : ''}
                {t('prop.noTranscript')}
              </span>
            </div>
          )}
          <label className="flex flex-col gap-2 rounded-[18px_18px_18px_4px] bg-clay-bg px-[18px] py-4">
            <span className="text-[13px] font-semibold text-clay-dark">{t('prop.notes')}</span>
            <textarea
              value={estado.notas ?? tpl.notas}
              onChange={(e) => save(() => ({ notas: e.target.value }))}
              placeholder={t('prop.notesPh')}
              rows={3}
              className="field-sizing-content min-h-20 resize-none rounded-lg border-0 bg-transparent p-0 text-sm leading-[1.55] text-clay-ink outline-none placeholder:text-clay-dark/60 focus-visible:outline-none"
            />
          </label>
        </section>

        <article className="print-only-root min-w-0 flex-[999_1_560px] overflow-hidden rounded-[32px_32px_32px_4px] bg-white shadow-[0_16px_40px_rgba(18,54,56,.08)]">
          <header className="relative flex flex-col gap-[18px] rounded-br-[110px] bg-ink px-6 pt-9 pb-11 text-white md:px-11">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <span className="text-xs font-semibold tracking-[0.2em]">JUAN SEBASTIÁN QUICENO</span>
              <span className="text-xs text-sage">
                PRO-{hoy.getFullYear()}-{lead.id.slice(0, 4).toUpperCase()} · {hoy.getDate()} de {monthName(hoy.getMonth())} de {hoy.getFullYear()}
              </span>
            </div>
            <h2 className="m-0 font-serif text-[32px] leading-[1.1] font-semibold md:text-[38px]">
              {tpl.titulo} {tpl.destino && <em className="font-normal text-gold">{tpl.destino}</em>}
            </h2>
            <span className="text-[15px] text-pale">{tpl.para}</span>
          </header>

          <div className="flex flex-col gap-2 px-6 pt-8 pb-11 md:px-11">
            {SECCIONES.map(([k, title], i) => {
              const text = estado.txt[k] ?? tpl.variantes[k][estado.v[k] || 0];
              return (
                <section key={k} className="flex flex-col gap-2 border-b border-line-2 py-[18px]">
                  <div className="flex items-center justify-between gap-3">
                    <SectionTitle n={String(i + 1).padStart(2, '0')}>{title}</SectionTitle>
                    <RegenButton busy={busy[k]} onClick={() => regen(k, tpl.variantes[k].length)} />
                  </div>
                  <label htmlFor={'sec-' + k} className="sr-only">
                    {title}
                  </label>
                  <textarea
                    id={'sec-' + k}
                    value={text}
                    onChange={(e) => save((p) => ({ txt: { ...p.txt, [k]: e.target.value } }))}
                    className={
                      'field-sizing-content -mx-3 box-border min-h-20 w-[calc(100%+24px)] resize-none rounded-xl border-0 bg-transparent px-3 py-2.5 text-[15px] leading-[1.65] whitespace-pre-wrap text-ink transition hover:bg-[#FAFCFA] focus:bg-mist focus:shadow-[inset_0_0_0_1.5px_#B8D8B8] focus:outline-none ' +
                      (busy[k] ? 'opacity-35' : 'opacity-100')
                    }
                  />
                </section>
              );
            })}

            <section className="flex flex-col gap-3.5 pt-[18px]">
              <div className="flex items-center justify-between gap-3">
                <SectionTitle n="05">Inversión</SectionTitle>
                <RegenButton busy={busy.inversion} onClick={() => regen('inversion', tpl.inversion.length)} />
              </div>
              <div className={'flex flex-col overflow-hidden rounded-[20px_20px_20px_4px] border border-line-2 transition-opacity ' + (busy.inversion ? 'opacity-35' : 'opacity-100')}>
                {inv.rows.map((r) => (
                  <div key={r.c} className="flex justify-between gap-4 border-b border-line-2 px-[18px] py-3.5 text-[15px]">
                    <span>{r.c}</span>
                    <span className="font-semibold whitespace-nowrap tabular-nums">{money(r.v)}</span>
                  </div>
                ))}
                <div className="flex items-baseline justify-between gap-4 bg-ink px-[18px] py-4 text-white">
                  <span className="text-[15px] font-semibold">Total</span>
                  <span className="font-serif text-2xl font-semibold">
                    {money(total)} <span className="font-sans text-[13px] font-normal text-sage">COP + IVA</span>
                  </span>
                </div>
              </div>
              <p className="m-0 text-sm leading-[1.55] text-muted">{inv.nota}</p>
            </section>
          </div>
        </article>
      </div>
    </>
  );
}
