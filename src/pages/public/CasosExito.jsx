import { useRef, useState } from 'react';
import { useI18n } from '../../i18n/LanguageContext';
import PaginaSeccion from '../../components/public/PaginaSeccion';
import { ButtonLink, classes } from '../../components/ui/Button';
import { ENLACE_AGENDA } from '../../lib/contacto';
import { ArrowRight, Check, ChevronLeft, ChevronRight } from '../../components/ui/Icons';
import expansion from '../../assets/casos/expansion-internacional.jpg';
import finanzas from '../../assets/casos/finanzas-comerciales.jpg';
import kpis from '../../assets/casos/resultados-kpis.jpg';
import cafe from '../../assets/casos/exportacion-cafe-agro.jpg';
import importacion from '../../assets/casos/importacion-estrategica.jpg';

// Fotos de los casos, en el mismo orden que t('casos.lista')
const FOTOS = [expansion, finanzas, kpis, cafe, importacion];

function Pestanas({ casos, activo, onCambiar }) {
  const refs = useRef([]);
  const mover = (i) => {
    const n = (i + casos.length) % casos.length;
    onCambiar(n);
    refs.current[n]?.focus();
  };
  return (
    <div
      role="tablist"
      className="-mx-[22px] flex snap-x gap-2.5 overflow-x-auto px-[22px] pb-2 md:mx-0 md:flex-wrap md:justify-center md:overflow-visible md:px-0"
    >
      {casos.map((c, i) => {
        const sel = i === activo;
        return (
          <button
            key={c.tab}
            ref={(el) => (refs.current[i] = el)}
            type="button"
            role="tab"
            id={`tab-caso-${i}`}
            aria-selected={sel}
            aria-controls="panel-caso"
            tabIndex={sel ? 0 : -1}
            onClick={() => onCambiar(i)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight') mover(i + 1);
              if (e.key === 'ArrowLeft') mover(i - 1);
            }}
            className={
              'min-h-11 shrink-0 snap-start rounded-full border px-5 text-sm font-semibold whitespace-nowrap transition-colors ' +
              (sel ? 'border-ink bg-ink text-white' : 'border-line bg-white text-ink hover:border-ink')
            }
          >
            {c.tab}
          </button>
        );
      })}
    </div>
  );
}

function Caso({ caso, foto }) {
  const { t } = useI18n();
  return (
    <article className="grid overflow-hidden rounded-[32px_32px_32px_6px] border border-line bg-white shadow-[0_30px_60px_rgba(4,20,21,.12)] lg:grid-cols-2">
      <div className="relative min-h-[280px] bg-ink md:min-h-[380px]">
        <img src={foto} alt={caso.alt} className="absolute inset-0 size-full object-cover" />
        <span className="absolute top-4 left-4 rounded-full bg-ink/90 px-3.5 py-1.5 text-[11px] font-bold tracking-[0.1em] text-gold uppercase">
          {caso.tag}
        </span>
      </div>
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <h2 className="m-0 font-serif text-[26px] leading-[1.15] font-semibold text-balance md:text-[30px]">{caso.titulo}</h2>
        {caso.parrafos.map((p) => (
          <p key={p.label} className="m-0 text-[15px] leading-[1.65] text-muted">
            <strong className="text-ink">{p.label}</strong>
            {p.text}
          </p>
        ))}
        <div className="flex flex-col gap-3 rounded-[0_16px_16px_0] border-l-2 border-gold bg-clay-bg/60 py-4 pr-4 pl-5">
          <p className="m-0 text-[12px] font-bold tracking-[0.1em] text-ink uppercase">{caso.entregablesTitulo}</p>
          <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
            {caso.entregables.map((e) => (
              <li key={e} className="flex gap-2.5 text-[14px] leading-[1.45]">
                <Check size={16} className="mt-0.5 shrink-0 text-gold" />
                <span>{e}</span>
              </li>
            ))}
          </ul>
        </div>
        {/* Reemplaza el "Consultar este Caso" (WhatsApp) del sitio original: cita concreta + herramienta propia */}
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <a href={ENLACE_AGENDA} target="_blank" rel="noopener noreferrer" className={classes({ variant: 'gold', size: 'lg', lift: true })}>
            {t('casos.agendar')}
            <ArrowRight />
          </a>
          <ButtonLink to="/simulador" variant="outline-ink" size="lg">
            {t('casos.simular')}
          </ButtonLink>
        </div>
      </div>
    </article>
  );
}

export default function CasosExito() {
  const { t } = useI18n();
  const casos = t('casos.lista');
  const [activo, setActivo] = useState(0);
  const ir = (i) => setActivo((i + casos.length) % casos.length);

  return (
    <PaginaSeccion>
      <section className="mx-auto flex max-w-[1240px] flex-col gap-8 px-[22px] py-12 md:px-10 md:py-20">
        <header className="mx-auto flex max-w-[820px] flex-col items-center gap-4 text-center">
          <span className="text-[11px] font-medium tracking-[0.12em] text-clay uppercase md:text-[13px] md:tracking-[0.14em]">{t('casos.badge')}</span>
          <h1 className="m-0 font-serif text-[32px] leading-[1.1] font-semibold tracking-[-0.015em] text-balance md:text-[46px]">{t('casos.titulo')}</h1>
          <p className="m-0 text-base leading-[1.6] text-muted md:text-[17px]">{t('casos.intro')}</p>
        </header>

        <div className="flex flex-col gap-4">
          <p className="m-0 text-center text-[13px] text-muted md:hidden">{t('casos.hint')}</p>
          <Pestanas casos={casos} activo={activo} onCambiar={ir} />
        </div>

        <div id="panel-caso" role="tabpanel" aria-labelledby={`tab-caso-${activo}`} key={activo} className="animate-[aparecer_.35s_ease-out]">
          <Caso caso={casos[activo]} foto={FOTOS[activo]} />
        </div>

        <nav aria-label={t('casos.menu')} className="flex items-center justify-between gap-3">
          <button type="button" onClick={() => ir(activo - 1)} className={classes({ variant: 'outline-ink', size: 'md' })}>
            <ChevronLeft size={16} />
            {t('casos.anterior')}
          </button>
          <div className="flex gap-2">
            {casos.map((c, i) => (
              <button
                key={c.tab}
                type="button"
                onClick={() => ir(i)}
                aria-label={t('casos.caso', { n: i + 1 })}
                aria-current={i === activo}
                className="flex size-6 items-center justify-center"
              >
                <span className={'block h-2 rounded-full transition-all ' + (i === activo ? 'w-6 bg-gold' : 'w-2 bg-line-2')} />
              </button>
            ))}
          </div>
          <button type="button" onClick={() => ir(activo + 1)} className={classes({ variant: 'outline-ink', size: 'md' })}>
            {t('casos.siguiente')}
            <ChevronRight size={16} />
          </button>
        </nav>
      </section>
    </PaginaSeccion>
  );
}
