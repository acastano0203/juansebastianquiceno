import { useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useI18n } from '../../i18n/LanguageContext';
import { ETAPAS, etapasCompletas } from '../../engine/simulacion';
import { Button } from '../../components/ui/Button';
import { ArrowRight, ChevronLeft } from '../../components/ui/Icons';
import ProgresoEtapas from '../../components/simulador/ProgresoEtapas';
import EtapaOperacion from '../../components/simulador/EtapaOperacion';
import EtapaProducto from '../../components/simulador/EtapaProducto';
import EtapaCubicaje from '../../components/simulador/EtapaCubicaje';
import ResultadoCubicaje from '../../components/simulador/ResultadoCubicaje';
import EtapaCostos from '../../components/simulador/EtapaCostos';
import EtapaResultado from '../../components/simulador/EtapaResultado';
import EtapaReporte from '../../components/simulador/EtapaReporte';
import EtapaSoporte from '../../components/simulador/EtapaSoporte';
import { useSimulacion } from '../../components/simulador/useSimulacion';

const VISTAS = { operacion: EtapaOperacion, producto: EtapaProducto, cubicaje: EtapaCubicaje, costos: EtapaCostos, resultado: EtapaResultado, reporte: EtapaReporte, soporte: EtapaSoporte };

export default function Simulador() {
  const { t } = useI18n();
  const [params, setParams] = useSearchParams();
  const s = useSimulacion(params.get('etapa'), params.get('vista'));
  const { etapa, irA, sim, snapshot, estado, cubVista, setCubVista } = s;
  const indice = ETAPAS.indexOf(etapa);
  // La etapa Cubicaje tiene dos pantallas: referencias de carga y resultado (láminas 09 y 10)
  const enResultadoCub = etapa === 'cubicaje' && cubVista === 'resultado';
  const Vista = enResultadoCub ? ResultadoCubicaje : VISTAS[etapa];
  const completas = useMemo(() => etapasCompletas(sim, !!snapshot && estado !== 'BORRADOR'), [sim, snapshot, estado]);

  useEffect(() => {
    window.scrollTo(0, 0);
    setParams(enResultadoCub ? { etapa, vista: 'resultado' } : { etapa }, { replace: true });
  }, [etapa, enResultadoCub]); // eslint-disable-line react-hooks/exhaustive-deps

  // Desde Costos solo se avanza calculando, y calcular exige los mínimos y los costos de origen cubiertos
  const bloqueado = etapa === 'costos' && s.faltantes.length > 0;
  const siguiente = () => {
    if (etapa === 'costos') s.calcular();
    else if (etapa === 'cubicaje' && !enResultadoCub) setCubVista('resultado');
    else irA(ETAPAS[indice + 1]);
  };
  const anterior = () => {
    if (enResultadoCub) setCubVista('referencias');
    else if (ETAPAS[indice - 1] === 'cubicaje') irA('cubicaje', 'resultado');
    else irA(ETAPAS[indice - 1]);
  };

  return (
    <div className="flex min-h-screen min-w-0 flex-col bg-mist text-ink lg:flex-row">
      <ProgresoEtapas etapa={etapa} completas={completas} onIr={irA} />

      <main className="flex min-w-0 flex-1 flex-col gap-4 px-4 py-5 md:px-8 md:py-7">
        <div className="no-print mx-auto flex w-full max-w-[1040px] flex-col gap-2.5">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm">
            <span className="font-semibold">
              {t('sim.paso', { n: indice + 1 })} · {t('sim.etapas.' + etapa)}
              {enResultadoCub && ` · ${t('sim.cub.subResultado')}`}
            </span>
            <span className="flex flex-wrap items-center gap-x-4">
              <button type="button" onClick={s.cargarEjemplo} className="min-h-9 cursor-pointer border-0 bg-transparent p-0 text-muted underline">
                {t('sim.cargarEjemplo')}
              </button>
              <button
                type="button"
                onClick={() => window.confirm(t('sim.confirmarReinicio')) && s.reiniciar()}
                className="min-h-9 cursor-pointer border-0 bg-transparent p-0 text-muted underline"
              >
                {t('sim.reiniciar')}
              </button>
              <Link to="/" className="inline-flex min-h-9 items-center text-muted">
                {t('sim.guardarSalir')}
              </Link>
            </span>
          </div>
          <div className="flex gap-1.5" role="progressbar" aria-valuemin={1} aria-valuemax={ETAPAS.length} aria-valuenow={indice + 1} aria-label={t('sim.progreso')}>
            {ETAPAS.map((e, i) => (
              <span key={e} className={'h-1.5 flex-1 rounded-full ' + (i <= indice ? 'bg-gold' : 'bg-line')} />
            ))}
          </div>
        </div>

        <div className="mx-auto w-full max-w-[1040px] min-w-0">
          <Vista s={s} />
        </div>

        <div className="no-print mx-auto flex w-full max-w-[1040px] items-center justify-between gap-3 pb-4">
          <Button variant="outline" disabled={indice === 0} onClick={anterior}>
            <ChevronLeft size={16} />
            {t('sim.anterior')}
          </Button>
          {indice < ETAPAS.length - 1 && (
            <Button variant="ink" onClick={siguiente} disabled={bloqueado} title={bloqueado ? t('sim.cos.faltan', { f: s.faltantes.map((f) => t('sim.faltante.' + f)).join(', ') }) : undefined}>
              {etapa === 'cubicaje' && !enResultadoCub ? t('sim.cub.verResultado') : etapa === 'costos' ? t('sim.cos.calcular') : etapa === 'reporte' ? t('sim.terminar') : t('sim.siguiente')}
              <ArrowRight size={16} />
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
