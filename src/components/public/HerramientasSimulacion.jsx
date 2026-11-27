import { useMemo } from 'react';
import { useI18n } from '../../i18n/LanguageContext';
import { casoCafe } from '../../config/casoCafe';
import { PARAMS } from '../../config/params';
import { calcularSimulacion } from '../../engine/simulacion';
import { formatoDinero, formatoNumero, formatoPct } from '../../engine/unidades';
import BotonWhatsApp from '../simulador/BotonWhatsApp';
import { enlaceWhatsApp } from '../../lib/contacto';
import { ButtonLink } from '../ui/Button';
import { Alert, ArrowRight, Board, Chart, Doc } from '../ui/Icons';
import { AparecerImagen, Elemento, Grupo } from '../ui/Aparecer';

// Antes era el hero de la portada. Ahora va debajo del hero de consultoría (HeroConsultoria) y explica
// las herramientas: es el paso "antes de la sesión, calcula tu operación". Fondo claro y h2 para no competir.

// La tarjeta del ejemplo sale del motor, con una fecha fija: nunca puede contradecir el cálculo real
function TarjetaEjemplo() {
  const { t, lang } = useI18n();
  const r = useMemo(() => calcularSimulacion(casoCafe(), PARAMS, '2026-11-09'), []);
  const ev = r.equipos.find((e) => e.equipoId === r.seleccion.equipoId);
  const equipo = PARAMS.equipos.find((e) => e.id === r.seleccion.equipoId);
  const filas = [
    [t('hero.cardEquipo'), `FCL ${equipo.nombre[lang]} · ${formatoNumero(r.cubicaje.totalPallets, 0, lang)} pallets`],
    [t('hero.cardOcupacion'), formatoPct(ev.ocupacionVolumen, lang)],
    ['Incoterm', 'CIF Miami'],
    [t('sim.cos.totalParcial'), formatoDinero(r.rentabilidad.total, 'USD', lang)],
  ];
  return (
    <AparecerImagen retraso={0.15} className="relative hidden justify-center lg:flex" aria-hidden="true">
      <div className="absolute -top-7 -right-2.5 size-[300px] rounded-[0_160px_0_160px] bg-sage/45" />
      <div className="relative flex w-full max-w-[420px] flex-col gap-4 rounded-[32px_32px_32px_6px] border border-line bg-white p-7 shadow-[0_30px_60px_rgba(4,20,21,.14)]">
        <div className="flex items-center justify-between text-[13px] text-muted">
          <span className="font-semibold text-ink">{t('hero.cardTitle')}</span>
          <span>{t('hero.cardStep')}</span>
        </div>
        <div className="flex gap-1.5">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <span key={i} className={'h-1.5 flex-1 rounded-full ' + (i < 5 ? 'bg-gold' : 'bg-line-2')} />
          ))}
        </div>
        <div className="font-serif text-[26px] leading-[1.15] font-semibold">{t('hero.cardRuta')}</div>
        <dl className="m-0 flex flex-col">
          {filas.map(([k, v]) => (
            <div key={k} className="flex items-baseline justify-between gap-3 border-t border-line py-2.5 text-sm">
              <dt className="text-muted">{k}</dt>
              <dd className="m-0 text-right font-semibold">{v}</dd>
            </div>
          ))}
        </dl>
        <span className="text-[13px] text-muted italic">{t('hero.cardNota')}</span>
      </div>
    </AparecerImagen>
  );
}

function Beneficios() {
  const { t } = useI18n();
  const iconos = [Chart, Board, Alert, Doc];
  return (
    <Grupo as="ul" pausa={0.08} className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-4">
      {t('hero.beneficios').map((b, i) => {
        const Icono = iconos[i];
        return (
          <Elemento as="li" key={b} className="flex flex-col gap-3 rounded-[20px] border border-line bg-white p-5 text-ink">
            <Icono size={22} className="text-clay" />
            <span className="text-[15px] leading-[1.3] font-semibold">{b}</span>
          </Elemento>
        );
      })}
    </Grupo>
  );
}

export default function HerramientasSimulacion() {
  const { t } = useI18n();
  return (
    <section id="herramientas" className="bg-mist">
      <div className="mx-auto flex max-w-[1240px] flex-col gap-12 px-[22px] py-14 md:px-10 md:py-20">
        <div className="grid items-center gap-[56px] lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <Grupo className="flex min-w-0 flex-col gap-[22px] md:gap-6">
            <Elemento as="span" className="text-[11px] font-medium tracking-[0.12em] text-clay uppercase md:text-[13px] md:tracking-[0.14em]">{t('hero.eyebrow')}</Elemento>
            <Elemento as="h2" className="m-0 font-serif text-[32px] leading-[1.08] font-semibold tracking-[-0.015em] text-balance md:text-[46px]">
              {t('hero.title1')}
              <em className="font-normal text-clay italic">{t('hero.titleEm')}</em>
              {t('hero.title2')}
            </Elemento>
            <Elemento as="p" className="m-0 max-w-[600px] text-base leading-[1.55] text-muted md:text-[18px]">{t('hero.lead')}</Elemento>
            <Elemento className="mt-1 flex flex-col items-stretch gap-3 md:flex-row md:flex-wrap md:items-center">
              <ButtonLink to="/simulador" variant="gold" size="lg" lift>
                {t('hero.ctaSimular')}
                <ArrowRight />
              </ButtonLink>
              <ButtonLink to="/cubicaje" variant="outline-ink" size="lg">
                {t('hero.ctaCubicar')}
              </ButtonLink>
              <BotonWhatsApp variant="outline-ink" mensaje={t('sim.res.msgAsesor')}>
                {t('hero.ctaAsesor')}
              </BotonWhatsApp>
            </Elemento>
            {!enlaceWhatsApp('x') && <span className="text-[13px] text-muted">{t('sim.res.asesorInactivo')}</span>}
          </Grupo>
          <TarjetaEjemplo />
        </div>

        <Beneficios />
      </div>
    </section>
  );
}
