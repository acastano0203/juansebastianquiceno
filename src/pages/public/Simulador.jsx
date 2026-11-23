import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useI18n } from '../../i18n/LanguageContext';
import { Button } from '../../components/ui/Button';
import { ArrowRight, ChevronLeft } from '../../components/ui/Icons';
import ProgresoEtapas from '../../components/simulador/ProgresoEtapas';
import { PasoDestino, PasoEntrega, PasoNecesidad, PasoProducto, PasoVolumen } from '../../components/simulador/asistente/PasosIniciales';
import PasoEmpaque from '../../components/simulador/asistente/PasoEmpaque';
import PasoPrecio from '../../components/simulador/asistente/PasoPrecio';
import EtapaResultado from '../../components/simulador/EtapaResultado';
import EtapaReporte from '../../components/simulador/EtapaReporte';
import EtapaSoporte from '../../components/simulador/EtapaSoporte';
import { useSimulacion } from '../../components/simulador/useSimulacion';
import { esDeEntrada, primeraPendiente } from '../../components/simulador/asistente/etapas';

const VISTAS = {
  destino: PasoDestino,
  necesidad: PasoNecesidad,
  volumen: PasoVolumen,
  entrega: PasoEntrega,
  producto: PasoProducto,
  empaque: PasoEmpaque,
  precio: PasoPrecio,
  resultado: EtapaResultado,
  reporte: EtapaReporte,
  soporte: EtapaSoporte,
};

export default function Simulador() {
  const { t } = useI18n();
  const [params, setParams] = useSearchParams();
  const s = useSimulacion(params.get('etapa'));
  const { etapa, etapas, irA, completas, ultimaDeEntrada } = s;
  // Si el paso actual dejó de aplicar (p. ej. Precio cuando solo se quiere el cubicaje), se usa el siguiente visible
  const actual = etapas.includes(etapa) ? etapa : 'resultado';
  const indice = etapas.indexOf(actual);
  const Vista = VISTAS[actual];

  useEffect(() => {
    window.scrollTo(0, 0);
    setParams({ etapa: actual }, { replace: true });
  }, [actual]); // eslint-disable-line react-hooks/exhaustive-deps

  const incompleto = esDeEntrada(actual) && !completas[actual];
  const calcula = actual === ultimaDeEntrada;
  const pendiente = calcula && !incompleto ? primeraPendiente(s.respuestas, completas) : null;
  const siguiente = () => {
    if (calcula) s.calcular();
    else irA(etapas[indice + 1]);
  };

  return (
    <div className="flex min-h-screen min-w-0 flex-col bg-mist text-ink lg:flex-row">
      <ProgresoEtapas etapas={etapas} etapa={actual} completas={completas} onIr={irA} />

      <main className="flex min-w-0 flex-1 flex-col gap-4 px-4 py-5 md:px-8 md:py-7">
        <div className="no-print mx-auto flex w-full max-w-[1040px] flex-col gap-2.5">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm">
            <span className="font-semibold">
              {t('sim.paso', { n: indice + 1, total: etapas.length })} · {t('sim.etapas.' + actual)}
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
              {/* Salir borra la simulación del navegador: la próxima vez empieza desde cero */}
              <Link to="/" onClick={s.terminar} className="inline-flex min-h-9 items-center text-muted">
                {t('sim.guardarSalir')}
              </Link>
            </span>
          </div>
          <div className="flex gap-1.5" role="progressbar" aria-valuemin={1} aria-valuemax={etapas.length} aria-valuenow={indice + 1} aria-label={t('sim.progreso')}>
            {etapas.map((e, i) => (
              // Dorado = etapa completa; oscuro = la actual; claro = pendiente
              <span key={e} className={'h-1.5 flex-1 rounded-full ' + (completas[e] ? 'bg-gold' : i === indice ? 'bg-ink' : 'bg-line')} />
            ))}
          </div>
        </div>

        <div className="mx-auto w-full max-w-[1040px] min-w-0">
          <Vista s={s} />
        </div>

        <div className="no-print mx-auto flex w-full max-w-[1040px] flex-col gap-2 pb-4">
          <div className="flex items-center justify-between gap-3">
            <Button variant="outline" disabled={indice === 0} onClick={() => irA(etapas[indice - 1])}>
              <ChevronLeft size={16} />
              {t('sim.anterior')}
            </Button>
            {indice < etapas.length - 1 && (
              <Button variant="ink" onClick={siguiente} disabled={incompleto || !!pendiente || (calcula && s.faltantes.length > 0)}>
                {calcula ? t('asi.verResultado') : actual === 'reporte' ? t('sim.terminar') : t('sim.siguiente')}
                <ArrowRight size={16} />
              </Button>
            )}
          </div>
          {incompleto && <p className="m-0 text-right text-[13px] text-muted">{t('asi.falta.' + actual)}</p>}
          {/* Nunca dejar el botón apagado sin explicar por qué */}
          {calcula && !incompleto && !pendiente && s.faltantes.length > 0 && (() => {
            const f = s.faltantes.find((x) => x !== 'COSTOS_ORIGEN');
            const texto = f ? t(`asi.faltaMotor.${f}.t`) : t('asi.faltaCalculo');
            const ir = f ? t(`asi.faltaMotor.${f}.e`) : 'soporte';
            return (
              <p className="m-0 text-right text-[13px] text-muted" data-faltantes={s.faltantes.join(',')}>
                {texto}{' '}
                <button type="button" onClick={() => irA(ir)} className="cursor-pointer border-0 bg-transparent p-0 font-semibold text-ink underline">{t('sim.etapas.' + ir)}</button>
              </p>
            );
          })()}
          {pendiente && (
            <p className="m-0 text-right text-[13px] text-muted">
              {t('asi.faltaAntes')}{' '}
              <button type="button" onClick={() => irA(pendiente)} className="cursor-pointer border-0 bg-transparent p-0 font-semibold text-ink underline">{t('sim.etapas.' + pendiente)}</button>
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
