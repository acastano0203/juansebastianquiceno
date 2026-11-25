import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useI18n } from '../../../i18n/LanguageContext';
import { COHORTE, COMPARATIVA, ENLACES_ACADEMIA, FICHA_PRO, PLANES } from '../../../config/academia';
import { formatoDinero, formatoNumero } from '../../../engine/unidades';
import { enlaceWhatsApp } from '../../../lib/contacto';
import { registrarOrigen } from '../../../services/academia';
import AcademiaHeader from '../../../components/academia/AcademiaHeader';
import { useAgendar } from '../../../components/academia/ModalAgendar';
import { Curvas, EnlaceWhatsApp, PasosEmbudo, Revelar, Titulo, useArriba } from '../../../components/academia/comun';
import { useFechaCorta } from '../../../components/academia/interactivos';
import { classes } from '../../../components/ui/Button';
import { ArrowRight, Check } from '../../../components/ui/Icons';
import SiteFooter from '../../../components/public/SiteFooter';

const ORDEN_COLUMNAS = ['pregrabado', 'vivo', 'pro'];

function precioTexto(plan, t, lang) {
  return plan.precio == null ? t('aca.ins.porDefinir') : formatoDinero(plan.precio, plan.moneda, lang);
}

function AccionPlan({ plan, onAgendar, oscuro }) {
  const { t } = useI18n();
  const texto = t('aca.ins.planes.' + plan.id + '.boton');
  if (plan.accion === 'hotmart') {
    const href = ENLACES_ACADEMIA.hotmart || enlaceWhatsApp(t('aca.ins.msgHotmart'));
    const cls = classes({ variant: 'outline-ink', size: 'lg', className: 'w-full' });
    return href ? (
      <a href={href} target="_blank" rel="noreferrer" className={cls}>
        {texto}
      </a>
    ) : (
      <button type="button" disabled title={t('sim.res.asesorInactivo')} className={cls}>
        {texto}
      </button>
    );
  }
  return (
    <button type="button" onClick={() => onAgendar(plan.id)} className={classes({ variant: oscuro ? 'gold' : 'outline-ink', size: 'lg', lift: oscuro, className: 'w-full' })}>
      {texto}
      {oscuro && <ArrowRight />}
    </button>
  );
}

function TarjetaPlan({ plan, recomendado, onAgendar, refRecomendado }) {
  const { t, lang } = useI18n();
  const oscuro = !!plan.destacado;
  const p = (k) => t('aca.ins.planes.' + plan.id + '.' + k);
  const insignia = recomendado ? t('aca.ins.recomendado') : oscuro ? t('aca.ins.masCompleto') : null;
  return (
    <div
      ref={recomendado ? refRecomendado : undefined}
      className={
        'relative flex flex-col gap-[22px] rounded-2xl px-7 py-8 transition-transform duration-300 hover:-translate-y-1 ' +
        (oscuro ? 'bg-ink text-white shadow-[0_24px_56px_rgba(18,54,56,0.32)] ' : 'bg-white text-ink shadow-[0_16px_40px_rgba(18,54,56,0.14)] ') +
        (recomendado ? 'ring-4 ring-gold ring-offset-4 ring-offset-white' : '')
      }
    >
      {insignia && <span className="absolute -top-3.5 left-7 rounded-full bg-gold px-3.5 py-1.5 text-xs font-semibold tracking-[0.04em] text-ink">{insignia}</span>}
      <div className="flex flex-col gap-2">
        <h2 className="m-0 text-xl font-semibold">{p('t')}</h2>
        <p className={'m-0 text-sm ' + (oscuro ? 'text-pale' : 'text-muted')}>{p('d')}</p>
      </div>
      <div className="flex flex-col gap-0.5">
        <span className={'font-serif leading-[1.1] font-semibold ' + (oscuro ? 'text-[36px] text-gold' : 'text-[30px] md:text-[32px]')}>{precioTexto(plan, t, lang)}</span>
        <span className={'text-[13px] ' + (oscuro ? 'text-pale' : 'text-muted')}>
          {p('pago')}
          {plan.precioUsd ? ` · ≈ USD ${formatoNumero(plan.precioUsd, 0, lang)}` : ''}
        </span>
      </div>
      <ul className="m-0 flex list-none flex-col gap-3 p-0 text-[15px]">
        {p('items').map((x) => (
          <li key={x} className="flex gap-2.5">
            <Check size={18} className={'mt-0.5 flex-none ' + (oscuro ? 'text-sage' : 'text-clay')} />
            {x}
          </li>
        ))}
      </ul>
      <div className="mt-auto">
        <AccionPlan plan={plan} onAgendar={onAgendar} oscuro={oscuro} />
      </div>
    </div>
  );
}

function Ficha() {
  const { t } = useI18n();
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-line-2 px-6 py-[22px]">
      <span className="text-xs font-semibold tracking-[0.14em] text-muted uppercase">{t('aca.ins.ficha')}</span>
      <dl className="m-0 grid grid-cols-2 gap-x-4 gap-y-3">
        {FICHA_PRO.map((k) => {
          const [dt, dd] = t('aca.ins.fichaItems.' + k);
          return (
            <div key={k} className={'flex flex-col ' + (k === 'catacion' ? 'col-span-full' : '')}>
              <dt className="text-xs text-muted">{dt}</dt>
              <dd className="m-0 text-sm font-semibold">{dd}</dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}

function Comparativa({ recomendado }) {
  const { t, lang } = useI18n();
  const [soloDif, setSoloDif] = useState(false);
  const [col, setCol] = useState(recomendado ? ORDEN_COLUMNAS.indexOf(recomendado) : 2);
  const filas = soloDif ? COMPARATIVA.filter(([, a, b, c]) => !(a === b && b === c)) : COMPARATIVA;
  const planes = ORDEN_COLUMNAS.map((id) => PLANES.find((p) => p.id === id));
  const resalte = (i) => (i === col ? 'bg-mist-2' : '');
  return (
    <section className="px-5 py-16 md:px-20 md:py-24">
      <div className="mx-auto flex max-w-[1000px] flex-col gap-7">
        <Revelar className="flex flex-wrap items-end justify-between gap-4">
          <Titulo t1={t('aca.ins.comparar1')} em={t('aca.ins.compararEm')} />
          <label className="inline-flex min-h-11 cursor-pointer items-center gap-2.5 text-sm font-semibold">
            <input type="checkbox" checked={soloDif} onChange={(e) => setSoloDif(e.target.checked)} className="size-5 cursor-pointer accent-ink" />
            {t('aca.ins.soloDif')}
          </label>
        </Revelar>
        <Revelar className="overflow-x-auto rounded-2xl border border-line-2">
          <table className="w-full min-w-[600px] border-collapse text-sm">
            <thead>
              <tr className="bg-line-2">
                <th scope="col" className="px-5 py-4 text-left font-semibold">{t('aca.ins.incluye')}</th>
                {planes.map((p, i) => (
                  <th key={p.id} scope="col" className={'w-[130px] p-0 font-semibold ' + (p.destacado ? 'bg-ink text-gold' : '')}>
                    <button type="button" aria-pressed={i === col} onClick={() => setCol(i)} className={'min-h-14 w-full cursor-pointer border-0 bg-transparent px-3 font-semibold ' + (p.destacado ? 'text-gold' : 'text-ink') + (i === col ? ' underline decoration-2 underline-offset-4' : '')}>
                      {t('aca.ins.cortos.' + p.id)}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filas.map(([k, ...celdas]) => (
                <tr key={k} className="border-t border-line-2 animate-[aparecer_.2s_ease-out]">
                  <th scope="row" className="px-5 py-3.5 text-left font-medium">{t('aca.ins.filas.' + k)}</th>
                  {[celdas[0], celdas[1], celdas[2]].map((v, i) => (
                    <td key={i} className={'px-3 py-3.5 text-center transition-colors ' + resalte(i)}>
                      {v ? (
                        <span role="img" aria-label={t('aca.ins.incluido')} className="inline-flex text-ink">
                          <Check size={20} />
                        </span>
                      ) : (
                        <span role="img" aria-label={t('aca.ins.noIncluido')} className="text-lg text-[#8AA09E]">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="border-t border-line-2">
                <th scope="row" className="px-5 py-4 text-left font-semibold">{t('aca.ins.precio')}</th>
                {planes.map((p, i) => (
                  <td key={p.id} className={'px-3 py-4 text-center font-semibold ' + resalte(i)}>
                    {p.precio == null ? t('aca.ins.porDefinirCorto') : formatoDinero(p.precio, p.moneda, lang)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </Revelar>
        <p className="m-0 text-[15px] text-muted">
          {t('aca.ins.duda')}{' '}
          <EnlaceWhatsApp variant="outline-ink" size="sm" icono={false} className="!min-h-0 !border-0 !p-0 underline">
            {t('aca.ins.dudaLink')}
          </EnlaceWhatsApp>
        </p>
        <p className="m-0 text-[13px] text-muted">{t('aca.ins.pago')}</p>
      </div>
    </section>
  );
}

export default function Inscripcion() {
  useArriba();
  const { t } = useI18n();
  const [params] = useSearchParams();
  const agendar = useAgendar();
  const refRecomendado = useRef(null);
  const recomendado = PLANES.some((p) => p.id === params.get('plan')) ? params.get('plan') : null;
  const fecha = useFechaCorta(COHORTE.inicio);
  useEffect(() => registrarOrigen(), []);
  useEffect(() => {
    if (!recomendado || !refRecomendado.current) return undefined;
    const id = setTimeout(() => refRecomendado.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 450);
    return () => clearTimeout(id);
  }, [recomendado]);

  const pregrabado = PLANES.find((p) => p.id === 'pregrabado');
  const pro = PLANES.find((p) => p.id === 'pro');
  const vivo = PLANES.find((p) => p.id === 'vivo');

  return (
    <div className="min-w-0 overflow-x-clip bg-white text-ink">
      <section className="relative overflow-hidden rounded-br-[96px] bg-ink pb-24 md:rounded-br-[240px] md:pb-[150px]">
        <Curvas />
        <div className="relative mx-auto max-w-[1280px] px-5 md:px-20">
          <AcademiaHeader onAgendar={() => agendar.abrir(recomendado || 'pro')} />
          <div className="pb-2">
            <PasosEmbudo actual={2} />
          </div>
          <div className="mx-auto flex max-w-[820px] flex-col items-center gap-5 pt-6 text-center md:pt-10 animate-[aparecer_.4s_ease-out]">
            <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(221,189,98,0.5)] bg-ink-2 px-4 py-2 text-[13px] font-semibold text-gold">
              <span aria-hidden="true" className="size-2 animate-pulse rounded-full bg-gold" />
              {fecha ? t('aca.ins.cohorte', { fecha }) : t('aca.ins.cohorteSinFecha')}
              {COHORTE.cupos != null && ` · ${t('aca.ins.cupos', { n: COHORTE.cupos })}`}
            </span>
            <h1 className="m-0 font-serif text-[36px] leading-[1.08] font-semibold text-white md:text-[56px]">
              {t('aca.ins.t1')}
              <em className="text-gold italic">{t('aca.ins.tEm')}</em>
            </h1>
            <p className="m-0 text-[17px] text-pale">{t('aca.ins.lead')}</p>
          </div>
        </div>
      </section>

      <div className="relative mx-auto -mt-14 grid max-w-[1200px] items-start gap-5 px-5 md:-mt-[90px] md:px-20 lg:grid-cols-3">
        <div className="order-2 lg:order-none">
          <TarjetaPlan plan={pregrabado} recomendado={recomendado === 'pregrabado'} onAgendar={agendar.abrir} refRecomendado={refRecomendado} />
        </div>
        <div className="order-first flex flex-col gap-4 lg:order-none">
          <TarjetaPlan plan={pro} recomendado={recomendado === 'pro'} onAgendar={agendar.abrir} refRecomendado={refRecomendado} />
          <Ficha />
        </div>
        <div className="order-3 lg:order-none">
          <TarjetaPlan plan={vivo} recomendado={recomendado === 'vivo'} onAgendar={agendar.abrir} refRecomendado={refRecomendado} />
        </div>
      </div>

      <Comparativa recomendado={recomendado} />
      {/* El pie del sitio sin la agenda diagnóstica: aquí manda la agenda de planes de la Academia */}
      <SiteFooter conAgenda={false} />
      {agendar.modal}
    </div>
  );
}
