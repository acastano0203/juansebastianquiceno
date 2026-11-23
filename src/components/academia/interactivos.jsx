import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../../i18n/LanguageContext';
import { CALCULADORA, MODULOS, RUTAS_ACADEMIA, recomendarPlan } from '../../config/academia';
import { PARAMS } from '../../config/params';
import { formatoDinero, formatoNumero } from '../../engine/unidades';
import { getTrm } from '../../services/precioCafe';
import { classes } from '../ui/Button';
import { ArrowRight, Check } from '../ui/Icons';
import { Revelar, Titulo } from './comun';

const sinMovimiento = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// ---------- Tarjeta "Ruta del curso" del hero: recorre los módulos sola hasta que la tocas ----------
export function TarjetaRuta() {
  const { t } = useI18n();
  const [sel, setSel] = useState(2);
  const [auto, setAuto] = useState(() => !sinMovimiento());
  const [pausa, setPausa] = useState(false);
  useEffect(() => {
    if (!auto || pausa) return undefined;
    const id = setInterval(() => setSel((s) => (s + 1) % MODULOS.length), 3200);
    return () => clearInterval(id);
  }, [auto, pausa]);
  const m = MODULOS[sel];
  const sig = MODULOS[(sel + 1) % MODULOS.length];
  const elegir = (i) => {
    setAuto(false);
    setSel(i);
  };
  return (
    <div
      className="flex w-full max-w-[440px] min-w-0 flex-col gap-5 rounded-2xl bg-white p-6 text-ink shadow-[0_24px_60px_rgba(0,0,0,0.28)] md:p-7"
      onMouseEnter={() => setPausa(true)}
      onMouseLeave={() => setPausa(false)}
      onFocus={() => setPausa(true)}
      onBlur={() => setPausa(false)}
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[13px] font-semibold tracking-[0.04em] text-muted">{t('aca.hero.ruta')}</span>
        <span className="font-serif text-xl font-semibold" aria-live="polite">{t('aca.hero.moduloDe', { n: sel + 1 })}</span>
      </div>
      <div className="grid grid-cols-7 gap-1.5" role="group" aria-label={t('aca.hero.tocaModulo')}>
        {MODULOS.map((x, i) => (
          <button
            key={x.n}
            type="button"
            aria-pressed={i === sel}
            aria-label={`${x.n} · ${t('aca.modulos.' + x.clave + '.t')}`}
            onClick={() => elegir(i)}
            className="group flex h-6 cursor-pointer items-center border-0 bg-transparent p-0"
          >
            <span className={'h-2 w-full rounded-full transition-colors duration-300 ' + (i <= sel ? 'bg-gold' : 'bg-line-2 group-hover:bg-sage')} />
          </button>
        ))}
      </div>
      <div key={m.n} className="flex flex-col animate-[aparecer_.3s_ease-out]">
        <p className="m-0 pb-1 font-serif text-[22px] leading-tight font-semibold">{t('aca.modulos.' + m.clave + '.t')}</p>
        <div className="flex justify-between gap-4 border-b border-line-2 py-3.5">
          <span className="text-sm text-muted">{t('aca.hero.aprendes')}</span>
          <span className="max-w-[62%] text-right text-sm font-semibold">{t('aca.modulos.' + m.clave + '.a')}</span>
        </div>
        <div className="flex justify-between gap-4 py-3.5">
          <span className="text-sm text-muted">{t('aca.hero.entregable')}</span>
          <span className="max-w-[62%] text-right text-sm font-semibold">{t('aca.modulos.' + m.clave + '.e')}</span>
        </div>
      </div>
      <button type="button" onClick={() => elegir((sel + 1) % MODULOS.length)} className="flex cursor-pointer items-center gap-2.5 rounded-xl border-0 bg-line-2 px-3.5 py-3 text-left text-[13px] text-ink hover:bg-mist-2">
        <ArrowRight size={18} className="flex-none text-clay" />
        {t('aca.hero.sigue', { m: `${sig.n} · ${t('aca.modulos.' + sig.clave + '.t')}` })}
      </button>
    </div>
  );
}

// ---------- Calculadora de precio del saco ----------
function Deslizador({ id, label, ayuda, valor, onCambio, min, max, paso, unidad }) {
  const pct = ((valor - min) / (max - min)) * 100;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-semibold">{label}</label>
        <span className="font-serif text-xl font-semibold tabular-nums">
          {valor}
          <span className="ml-1 font-sans text-xs font-medium text-muted">{unidad}</span>
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={paso}
        value={valor}
        onChange={(e) => onCambio(Number(e.target.value))}
        aria-describedby={id + '-a'}
        aria-valuetext={`${valor} ${unidad}`}
        className="h-11 w-full cursor-pointer accent-gold"
        style={{ background: 'transparent' }}
        data-pct={Math.round(pct)}
      />
      <span id={id + '-a'} className="text-xs text-muted">{ayuda}</span>
    </div>
  );
}

export function Calculadora() {
  const { t, lang } = useI18n();
  const id = useId();
  const [bolsa, setBolsa] = useState(CALCULADORA.bolsa.inicial);
  const [dif, setDif] = useState(CALCULADORA.diferencial.inicial);
  const [trm, setTrm] = useState({ copPorUsd: PARAMS.fx.copPorUnidad.USD, enVivo: false });
  useEffect(() => {
    let vivo = true;
    getTrm().then((x) => vivo && setTrm(x));
    return () => {
      vivo = false;
    };
  }, []);
  const usdLb = (bolsa + dif) / 100;
  const lbSaco = CALCULADORA.kgSaco * CALCULADORA.lbPorKg;
  const copLb = usdLb * trm.copPorUsd;
  const copSaco = copLb * lbSaco;
  const usdSaco = usdLb * lbSaco;

  return (
    <section className="px-5 py-16 md:px-20 md:py-[104px]" aria-labelledby={id + '-t'}>
      <div className="mx-auto grid max-w-[1120px] items-center gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        <Revelar className="flex flex-col gap-5">
          <div id={id + '-t'}>
            <Titulo eyebrow={t('aca.calc.eyebrow')} t1={t('aca.calc.t1')} em={t('aca.calc.tEm')} t2={t('aca.calc.t2')} />
          </div>
          <p className="m-0 max-w-[460px] text-base text-muted">{t('aca.calc.lead')}</p>
        </Revelar>
        <Revelar retraso={120} className="flex flex-col gap-6 rounded-2xl bg-white p-6 shadow-[0_16px_40px_rgba(18,54,56,0.14)] md:p-8">
          <div className="grid gap-6 md:grid-cols-2">
            <Deslizador id={id + '-b'} label={t('aca.calc.bolsa')} ayuda={t('aca.calc.bolsaAyuda')} valor={bolsa} onCambio={setBolsa} min={CALCULADORA.bolsa.min} max={CALCULADORA.bolsa.max} paso={CALCULADORA.bolsa.paso} unidad="¢/lb" />
            <Deslizador id={id + '-d'} label={t('aca.calc.dif')} ayuda={t('aca.calc.difAyuda')} valor={dif} onCambio={setDif} min={CALCULADORA.diferencial.min} max={CALCULADORA.diferencial.max} paso={CALCULADORA.diferencial.paso} unidad="¢/lb" />
          </div>
          <div className="flex items-center justify-between gap-3 rounded-xl bg-line-2 px-4 py-3 text-sm">
            <span className="text-muted">{trm.enVivo ? t('aca.calc.trmVivo') : t('aca.calc.trmRef')}</span>
            <span className="font-semibold tabular-nums">{formatoNumero(trm.copPorUsd, 2, lang)} COP</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-3" aria-live="polite">
            <Dato titulo={t('aca.calc.porLibra')} valor={formatoDinero(copLb, 'COP', lang)} />
            <Dato titulo={t('aca.calc.porSaco')} valor={formatoDinero(copSaco, 'COP', lang)} fuerte />
            <Dato titulo={t('aca.calc.usdSaco')} valor={formatoDinero(usdSaco, 'USD', lang)} />
          </div>
          <p className="m-0 text-[13px] text-muted">{t('aca.calc.nota')}</p>
          <Link to={RUTAS_ACADEMIA.masterclass} className={classes({ variant: 'ink', size: 'lg', className: 'self-start' })}>
            {t('aca.calc.cta')}
            <ArrowRight />
          </Link>
        </Revelar>
      </div>
    </section>
  );
}

function Dato({ titulo, valor, fuerte }) {
  return (
    <div className={'flex min-w-0 flex-col gap-1 rounded-xl p-4 ' + (fuerte ? 'bg-ink text-white' : 'bg-mist')}>
      <span className={'text-xs ' + (fuerte ? 'text-pale' : 'text-muted')}>{titulo}</span>
      <span className={'font-serif text-[19px] leading-tight font-semibold whitespace-nowrap tabular-nums xl:text-[21px] ' + (fuerte ? 'text-gold' : '')}>{valor}</span>
    </div>
  );
}

// ---------- Tres errores: la persona marca los que le han pasado ----------
export function Errores() {
  const { t } = useI18n();
  const items = t('aca.errores.items');
  const [marcados, setMarcados] = useState([]);
  const n = marcados.length;
  const mensaje = n === 0 ? t('aca.errores.ninguno') : n === 1 ? t('aca.errores.uno') : t('aca.errores.varios', { n });
  return (
    <section className="px-5 py-16 md:px-20 md:py-[104px]">
      <div className="mx-auto flex max-w-[1120px] flex-col gap-10">
        <Revelar className="flex max-w-[760px] flex-col gap-3">
          <Titulo eyebrow={t('aca.errores.eyebrow')} t1={t('aca.errores.t1')} em={t('aca.errores.tEm')} t2={t('aca.errores.t2')} />
          <p className="m-0 text-[15px] font-medium text-clay">{t('aca.errores.pregunta')}</p>
        </Revelar>
        <div className="grid gap-5 md:grid-cols-3">
          {items.map((e, i) => {
            const on = marcados.includes(i);
            return (
              <Revelar key={e.t} retraso={i * 100}>
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => setMarcados((m) => (on ? m.filter((x) => x !== i) : [...m, i]))}
                  className={
                    'flex h-full w-full cursor-pointer flex-col gap-3 rounded-2xl border-2 p-7 text-left transition-all duration-300 ' +
                    (on ? 'border-ink bg-ink text-white shadow-[0_16px_40px_rgba(18,54,56,0.25)]' : 'border-transparent bg-line-2 text-ink hover:-translate-y-0.5 hover:border-sage')
                  }
                >
                  <span className="flex items-start justify-between gap-3">
                    <span className={'font-serif text-[40px] leading-none font-semibold ' + (on ? 'text-gold' : 'text-clay')}>0{i + 1}</span>
                    <span aria-hidden="true" className={'grid size-7 place-items-center rounded-full border-[1.5px] ' + (on ? 'border-gold bg-gold text-ink' : 'border-ink-4 text-transparent')}>
                      <Check size={14} />
                    </span>
                  </span>
                  <span className="text-[19px] font-semibold">{e.t}</span>
                  <span className={'text-[15px] ' + (on ? 'text-pale' : 'text-muted')}>{e.d}</span>
                  {on && (
                    <span className="mt-1 rounded-xl bg-ink-2 px-3 py-2 text-[13px] text-pale animate-[aparecer_.25s_ease-out]">
                      {t('aca.errores.lo')} <strong className="text-white">{e.m}</strong>
                    </span>
                  )}
                </button>
              </Revelar>
            );
          })}
        </div>
        <div className="flex flex-col items-start gap-4 rounded-2xl border border-line px-6 py-5 md:flex-row md:items-center md:justify-between" aria-live="polite">
          <p className="m-0 text-base font-semibold">{mensaje}</p>
          {n > 0 && (
            <Link to={RUTAS_ACADEMIA.masterclass} className={classes({ variant: 'gold', size: 'lg', lift: true })}>
              {t('aca.cta.masterclass')}
              <ArrowRight />
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

// ---------- La ruta de 7 módulos: tocas uno y ves qué aprendes y qué te llevas ----------
export function Ruta() {
  const { t } = useI18n();
  const [sel, setSel] = useState(0);
  const id = useId();
  const m = MODULOS[sel];
  const lista = useRef(null);
  const teclas = (e) => {
    const d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const n = (sel + d + MODULOS.length) % MODULOS.length;
    setSel(n);
    lista.current?.querySelectorAll('[role=tab]')[n]?.focus();
  };
  return (
    <section className="bg-line-2 px-5 py-16 md:px-20 md:py-[104px]">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-10 md:gap-12">
        <Revelar className="flex max-w-[720px] flex-col gap-3">
          <Titulo eyebrow={t('aca.ruta.eyebrow')} t1={t('aca.ruta.t1')} em={t('aca.ruta.tEm')} />
          <p className="m-0 text-base text-muted">{t('aca.ruta.lead')}</p>
        </Revelar>

        <div className="relative">
          <span aria-hidden="true" className="absolute top-[23px] right-6 left-6 hidden h-0.5 bg-sage md:block" />
          <span aria-hidden="true" className="absolute top-[23px] left-6 hidden h-0.5 bg-gold transition-[width] duration-500 md:block" style={{ width: `calc((100% - 48px) * ${sel / (MODULOS.length - 1)})` }} />
          <div ref={lista} role="tablist" aria-label={t('aca.ruta.eyebrow')} onKeyDown={teclas} className="relative grid grid-cols-7 gap-2 md:gap-4">
            {MODULOS.map((x, i) => {
              const on = i === sel;
              return (
                <button
                  key={x.n}
                  role="tab"
                  type="button"
                  id={`${id}-tab-${i}`}
                  aria-selected={on}
                  aria-controls={`${id}-panel`}
                  tabIndex={on ? 0 : -1}
                  onClick={() => setSel(i)}
                  className="group flex cursor-pointer flex-col items-center gap-3 border-0 bg-transparent p-0 text-center text-ink md:items-start md:text-left"
                >
                  <span
                    className={
                      'grid size-10 place-items-center rounded-full font-serif text-[15px] font-semibold transition-all duration-300 md:size-12 md:text-[17px] ' +
                      (on ? 'scale-110 bg-gold text-ink shadow-[0_8px_20px_rgba(221,189,98,0.45)]' : i < sel ? 'bg-ink text-gold' : 'bg-ink text-gold group-hover:scale-105')
                    }
                  >
                    {x.n}
                  </span>
                  <span className={'hidden text-[15px] leading-[1.3] md:block ' + (on ? 'font-semibold' : 'font-medium text-muted group-hover:text-ink')}>{t('aca.modulos.' + x.clave + '.t')}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-tab-${sel}`} key={m.n} className="grid gap-4 rounded-2xl bg-white p-6 animate-[aparecer_.3s_ease-out] md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-center md:gap-8 md:p-8">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold tracking-[0.12em] text-muted uppercase">{t('aca.hero.moduloDe', { n: sel + 1 })}</span>
            <h3 className="m-0 font-serif text-[24px] leading-tight font-semibold">{t('aca.modulos.' + m.clave + '.t')}</h3>
            <p className="m-0 text-[15px] text-muted">{t('aca.modulos.' + m.clave + '.a')}</p>
          </div>
          <div className="flex flex-col gap-1 rounded-xl bg-mist p-4">
            <span className="text-[11px] font-semibold tracking-[0.12em] text-clay uppercase">{t('aca.ruta.entregable')}</span>
            <span className="text-[15px] font-semibold">{t('aca.modulos.' + m.clave + '.e')}</span>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setSel((s) => Math.max(0, s - 1))} disabled={sel === 0} className={classes({ variant: 'outline', size: 'md' })} aria-label="←">
              ←
            </button>
            <button type="button" onClick={() => setSel((s) => Math.min(MODULOS.length - 1, s + 1))} disabled={sel === MODULOS.length - 1} className={classes({ variant: 'ink', size: 'md' })} aria-label="→">
              →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------- ¿Qué plan es para ti? Tres preguntas, una recomendación ----------
export function QuizPlan() {
  const { t } = useI18n();
  const [r, setR] = useState({});
  const paso = r.tieneCafe === undefined ? 0 : r.exporto === undefined ? 1 : r.ritmo === undefined ? 2 : 3;
  const plan = paso === 3 ? recomendarPlan(r) : null;
  const preguntas = [
    { k: 'tieneCafe', q: t('aca.quiz.p1'), o: [[true, t('aca.quiz.p1o.si')], [false, t('aca.quiz.p1o.no')]] },
    { k: 'exporto', q: t('aca.quiz.p2'), o: [['Sí', t('aca.quiz.p2o.si')], ['No', t('aca.quiz.p2o.no')]] },
    { k: 'ritmo', q: t('aca.quiz.p3'), o: [['SOLO', t('aca.quiz.p3o.solo')], ['ACOMPA', t('aca.quiz.p3o.acompa')]] },
  ];
  const p = preguntas[paso];
  return (
    <section className="px-5 py-16 md:px-20 md:py-[104px]">
      <div className="mx-auto grid max-w-[1120px] items-start gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <Revelar>
          <Titulo eyebrow={t('aca.quiz.eyebrow')} t1={t('aca.quiz.t1')} em={t('aca.quiz.tEm')} t2={t('aca.quiz.t2')} />
        </Revelar>
        <Revelar retraso={100} className="flex min-h-[260px] flex-col gap-5 rounded-2xl bg-ink p-6 text-white md:p-8">
          <div className="grid grid-cols-3 gap-1.5" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <span key={i} className={'h-1.5 rounded-full transition-colors duration-300 ' + (i < paso ? 'bg-gold' : 'bg-ink-3')} />
            ))}
          </div>
          {p ? (
            <div key={paso} className="flex flex-col gap-4 animate-[aparecer_.25s_ease-out]">
              <span className="text-[13px] text-sage">{t('aca.quiz.paso', { n: paso + 1 })}</span>
              <p className="m-0 font-serif text-[24px] leading-tight font-semibold" id="quiz-q">{p.q}</p>
              <div className="grid gap-2.5 sm:grid-cols-2" role="group" aria-labelledby="quiz-q">
                {p.o.map(([v, label]) => (
                  <button key={String(v)} type="button" onClick={() => setR((x) => ({ ...x, [p.k]: v }))} className="min-h-14 cursor-pointer rounded-2xl border border-ink-3 bg-ink-2 px-4 text-left text-[15px] font-semibold text-white transition-colors hover:border-gold hover:bg-ink-3">
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4 animate-[aparecer_.3s_ease-out]" role="status">
              <span className="text-[13px] text-sage">{t('aca.quiz.resultado')}</span>
              <p className="m-0 font-serif text-[32px] leading-tight font-semibold text-gold">{t('aca.ins.planes.' + plan + '.t')}</p>
              <p className="m-0 text-[15px] text-pale">{t('aca.quiz.porque.' + plan)}</p>
              <div className="flex flex-wrap items-center gap-4 pt-1">
                <Link to={`${RUTAS_ACADEMIA.inscripcion}?plan=${plan}`} className={classes({ variant: 'gold', size: 'lg', lift: true })}>
                  {t('aca.quiz.ver')}
                  <ArrowRight />
                </Link>
                <button type="button" onClick={() => setR({})} className="min-h-11 cursor-pointer border-0 bg-transparent p-0 text-sm font-semibold text-pale underline hover:text-white">
                  {t('aca.quiz.otra')}
                </button>
              </div>
            </div>
          )}
        </Revelar>
      </div>
    </section>
  );
}

// ---------- Preguntas frecuentes ----------
export function Faq() {
  const { t } = useI18n();
  const items = t('aca.faq.items');
  const [abierta, setAbierta] = useState(0);
  const id = useId();
  return (
    <section className="bg-line-2 px-5 py-16 md:px-20 md:py-[104px]">
      <div className="mx-auto flex max-w-[820px] flex-col gap-8">
        <Revelar>
          <Titulo t1={t('aca.faq.t1')} em={t('aca.faq.tEm')} />
        </Revelar>
        <div className="flex flex-col gap-2.5">
          {items.map(([q, a], i) => {
            const on = abierta === i;
            return (
              <div key={q} className="rounded-2xl bg-white">
                <h3 className="m-0">
                  <button
                    type="button"
                    id={`${id}-q${i}`}
                    aria-expanded={on}
                    aria-controls={`${id}-a${i}`}
                    onClick={() => setAbierta(on ? -1 : i)}
                    className="flex min-h-[60px] w-full cursor-pointer items-center justify-between gap-4 border-0 bg-transparent px-[22px] py-[18px] text-left text-base font-semibold text-ink"
                  >
                    {q}
                    <span aria-hidden="true" className={'grid size-8 flex-none place-items-center rounded-full bg-line-2 text-lg transition-transform duration-300 ' + (on ? 'rotate-45' : '')}>
                      +
                    </span>
                  </button>
                </h3>
                <div id={`${id}-a${i}`} role="region" aria-labelledby={`${id}-q${i}`} hidden={!on}>
                  <p className="m-0 px-[22px] pb-5 text-[15px] text-muted animate-[aparecer_.2s_ease-out]">{a}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ---------- Cuenta regresiva de cupos o fecha de cohorte ----------
export function useFechaCorta(iso) {
  const { lang } = useI18n();
  return useMemo(() => (iso ? new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'es-CO', { day: 'numeric', month: 'long' }).format(new Date(iso + 'T12:00:00')) : null), [iso, lang]);
}
