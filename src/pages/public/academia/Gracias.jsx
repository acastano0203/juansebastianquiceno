import { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useI18n } from '../../../i18n/LanguageContext';
import { ENLACES_ACADEMIA, RUTAS_ACADEMIA, recomendarPlan } from '../../../config/academia';
import { registroGuardado } from '../../../services/academia';
import AcademiaHeader from '../../../components/academia/AcademiaHeader';
import { Curvas, EnlaceWhatsApp, PasosEmbudo, Revelar, useArriba } from '../../../components/academia/comun';
import { classes } from '../../../components/ui/Button';
import { Play } from 'lucide-react';
import { ArrowRight, Download } from '../../../components/ui/Icons';
import SiteFooter from '../../../components/public/SiteFooter';

function Reproductor() {
  const { t } = useI18n();
  if (ENLACES_ACADEMIA.videoMasterclass) {
    return (
      <iframe
        src={ENLACES_ACADEMIA.videoMasterclass}
        title={t('aca.gr.video')}
        className="aspect-video w-full rounded-2xl border-0 shadow-[0_24px_60px_rgba(0,0,0,0.3)]"
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
      />
    );
  }
  return (
    <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-2xl bg-[#0C2728] shadow-[0_24px_60px_rgba(0,0,0,0.3)]">
      <Curvas variante="cierre" />
      <div className="relative flex flex-col items-center gap-4 px-6 text-center">
        <span className="grid size-16 place-items-center rounded-full bg-gold md:size-[88px]">
          <Play size={30} className="ml-1 text-ink" fill="currentColor" strokeWidth={0} aria-hidden="true" />
        </span>
        <span className="max-w-[420px] text-sm text-pale">{t('aca.gr.videoPronto')}</span>
      </div>
      <div className="absolute inset-x-0 bottom-0 flex items-center gap-3.5 bg-[rgba(12,39,40,0.85)] px-5 py-4 text-[13px] text-pale">
        <span>0:00 / 45:00</span>
        <span className="h-1 flex-1 rounded-full bg-[rgba(214,230,216,0.25)]" />
        <span className="hidden sm:inline">{t('aca.gr.video')}</span>
      </div>
    </div>
  );
}

/** Los 7 mensajes de la semana: cuál toca hoy y qué llega después */
function Semana({ desde }) {
  const { t } = useI18n();
  const items = t('aca.gr.semana');
  const hoy = useMemo(() => {
    if (!desde) return 0;
    const dias = Math.floor((Date.now() - new Date(desde).getTime()) / 86_400_000);
    return Math.min(items.length - 1, Math.max(0, dias));
  }, [desde, items.length]);
  const [sel, setSel] = useState(hoy);
  return (
    <div className="flex flex-col gap-5">
      <h2 className="m-0 font-serif text-[26px] leading-tight font-semibold md:text-[30px]">{t('aca.gr.semanaT')}</h2>
      <div className="grid grid-cols-7 gap-1.5 md:gap-3" role="tablist" aria-label={t('aca.gr.semanaT')}>
        {items.map((x, i) => {
          const on = i === sel;
          return (
            <button
              key={x.t}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setSel(i)}
              className={
                'flex min-h-16 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border px-1 text-center transition-colors ' +
                (on ? 'border-ink bg-ink text-white' : i < hoy ? 'border-sage bg-mist-2 text-ink' : 'border-line bg-white text-ink hover:border-ink-4')
              }
            >
              <span className={'text-[11px] ' + (on ? 'text-gold' : 'text-muted')}>{i === hoy ? t('aca.gr.hoy') : t('aca.gr.dia', { n: i })}</span>
              <span className="font-serif text-lg font-semibold">{i}</span>
            </button>
          );
        })}
      </div>
      <div role="tabpanel" key={sel} className="flex flex-col gap-1 rounded-2xl bg-line-2 p-5 animate-[aparecer_.25s_ease-out]">
        <span className="text-xs font-semibold tracking-[0.12em] text-clay uppercase">{t('aca.gr.dia', { n: sel })}</span>
        <span className="text-lg font-semibold">{items[sel].t}</span>
        <span className="text-[15px] text-muted">{items[sel].d}</span>
      </div>
    </div>
  );
}

export default function Gracias() {
  useArriba();
  const { t } = useI18n();
  const { state } = useLocation();
  const registro = registroGuardado();
  const nombre = state?.nombre || registro?.nombre?.split(/\s+/)[0] || '';
  const plan = registro
    ? recomendarPlan({ perfil: registro.perfil, exporto: registro.exporto, tieneCafe: registro.volumen !== 'Aún no produzco' })
    : null;

  return (
    <div className="min-w-0 overflow-x-clip bg-white text-ink">
      <section className="relative overflow-hidden rounded-br-[96px] bg-ink pb-24 md:rounded-br-[240px] md:pb-[140px]">
        <Curvas />
        <div className="relative mx-auto max-w-[1040px] px-5 md:px-10">
          <AcademiaHeader />
          <div className="pb-6">
            <PasosEmbudo actual={2} />
          </div>
          <div className="flex flex-col gap-7 animate-[aparecer_.4s_ease-out]">
            <div className="flex flex-col gap-3">
              <p className="m-0 text-xs font-semibold tracking-[0.18em] text-gold uppercase">{t('aca.gr.eyebrow')}</p>
              <h1 className="m-0 font-serif text-[34px] leading-[1.08] font-semibold text-balance text-white md:text-[52px]">
                {nombre ? t('aca.gr.t1', { nombre }) : t('aca.gr.t1Anon')}
                <em className="text-gold italic">{t('aca.gr.tEm')}</em>
              </h1>
            </div>
            <Reproductor />
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <EnlaceWhatsApp href={ENLACES_ACADEMIA.grupoWhatsApp} variant="gold">
                {t('aca.gr.grupo')}
              </EnlaceWhatsApp>
              {ENLACES_ACADEMIA.checklistPdf ? (
                <a href={ENLACES_ACADEMIA.checklistPdf} download className={classes({ variant: 'outline-white', size: 'lg' })}>
                  <Download size={18} />
                  {t('aca.gr.checklist')}
                </a>
              ) : (
                <button type="button" disabled title={t('aca.gr.checklistPronto')} className={classes({ variant: 'outline-white', size: 'lg' })}>
                  <Download size={18} />
                  {t('aca.gr.checklist')}
                </button>
              )}
            </div>
            <p className="m-0 text-[15px] text-pale">{t('aca.gr.dias')}</p>
          </div>
        </div>
      </section>

      <section className="px-5 py-12 md:px-10 md:py-20">
        <div className="mx-auto flex max-w-[1040px] flex-col gap-12">
          <Revelar>
            <Semana desde={registro?.en} />
          </Revelar>
          <Revelar className="flex flex-wrap items-center justify-between gap-5 rounded-2xl bg-line-2 p-6 md:px-9 md:py-8">
            <div className="flex flex-[1_1_400px] flex-col gap-1.5">
              <h2 className="m-0 font-serif text-[28px] leading-[1.15] font-semibold">{t('aca.gr.empezarT')}</h2>
              <p className="m-0 text-[15px] text-muted">{plan ? t('aca.gr.recomendado', { plan: t('aca.ins.planes.' + plan + '.t') }) : t('aca.gr.empezarD')}</p>
            </div>
            <Link to={plan ? `${RUTAS_ACADEMIA.inscripcion}?plan=${plan}` : RUTAS_ACADEMIA.inscripcion} className={classes({ variant: 'ink', size: 'lg', lift: true })}>
              {t('aca.cta.planes')}
              <ArrowRight />
            </Link>
          </Revelar>
        </div>
      </section>
      {/* El pie del sitio sin la agenda diagnóstica: aquí manda la agenda de planes de la Academia */}
      <SiteFooter conAgenda={false} />
    </div>
  );
}
