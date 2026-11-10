import { useMemo } from 'react';
import { useI18n } from '../../i18n/LanguageContext';
import { PARAMS } from '../../config/params';
import { aplicarEscenario, calcularSimulacion } from '../../engine/simulacion';
import { formatoDinero, formatoNumero, formatoPct } from '../../engine/unidades';
import { Button } from '../ui/Button';
import { Plus } from '../ui/Icons';
import { Opciones } from './Campos';
import { nuevoId } from './useSimulacion';

const MODALIDADES = ['POR_EVALUAR', 'MARITIMA_FCL', 'MARITIMA_LCL', 'AEREA', 'TERRESTRE', 'COURIER', 'MULTIMODAL'];
const MAX_EXTRA = 3; // RN-SIM-08: de 2 a 4 escenarios lado a lado

// RN-SIM-07 y 08. El resultado gratuito compara totales; el detalle por tramo es del reporte.
export default function Escenarios({ s, entradas }) {
  const { t, lang } = useI18n();
  const { escenarios, setEscenarios, hoy } = s;

  const filas = useMemo(() => {
    const base = { id: 'base', nombre: t('sim.esc.base'), modalidad: entradas.operacion.modalidad, incoterm: entradas.operacion.incoterm, equipoId: entradas.equipoId };
    return [base, ...escenarios].map((e) => ({ e, r: calcularSimulacion(aplicarEscenario(entradas, e), PARAMS, hoy) }));
  }, [entradas, escenarios, hoy, t]);

  const menor = Math.min(...filas.map((f) => f.r.rentabilidad.total));
  const moneda = entradas.operacion.moneda;
  const cambiar = (id, cambios) => setEscenarios((lista) => lista.map((x) => (x.id === id ? { ...x, ...cambios } : x)));
  const anadir = () =>
    setEscenarios((lista) => [...lista, { id: nuevoId(), nombre: '', modalidad: 'MARITIMA_LCL', incoterm: entradas.operacion.incoterm, equipoId: null }]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="m-0 font-serif text-2xl font-semibold">{t('sim.esc.titulo')}</h2>
          <p className="m-0 mt-1 text-sm text-muted">{t('sim.esc.ayuda')}</p>
        </div>
        <Button variant="outline-ink" onClick={anadir} disabled={escenarios.length >= MAX_EXTRA}>
          <Plus size={16} />
          {t('sim.esc.anadir')}
        </Button>
      </div>
      <div className="relative overflow-x-auto">
        <table className="w-full min-w-[980px] border-collapse text-sm">
          <thead>
            <tr className="bg-mist-2 text-left">
              {['escenario', 'modalidad', 'incoterm', 'equipo', 'ocupacion', 'total', 'unitario', 'completitud'].map((c) => (
                <th key={c} className={'px-2.5 py-2 font-semibold ' + ({ modalidad: 'min-w-[190px]', incoterm: 'min-w-[120px]', equipo: 'min-w-[200px]' }[c] ?? '')}>{t('sim.esc.columnas.' + c)}</th>
              ))}
              <th><span className="sr-only">{t('sim.esc.quitar')}</span></th>
            </tr>
          </thead>
          <tbody>
            {filas.map(({ e, r }, i) => {
              const esBase = e.id === 'base';
              const ev = r.seleccion ? r.equipos.find((x) => x.equipoId === r.seleccion.equipoId) : null;
              const esMenor = filas.length > 1 && r.rentabilidad.total === menor;
              return (
                <tr key={e.id} className={'border-b border-line-2 ' + (esMenor ? 'bg-[#fbf3dc]' : '')}>
                  <td className="px-2.5 py-2 font-medium">{esBase ? e.nombre : t('sim.esc.nombre', { n: i })}</td>
                  <td className="px-2.5 py-2">
                    {esBase ? t('sim.modalidad.' + e.modalidad) : <Opciones aria-label={t('sim.esc.columnas.modalidad')} valor={e.modalidad} opciones={MODALIDADES.map((id) => ({ id, label: t('sim.modalidad.' + id) }))} onCambio={(modalidad) => cambiar(e.id, { modalidad, equipoId: null })} />}
                  </td>
                  <td className="px-2.5 py-2">
                    {esBase ? e.incoterm : <Opciones aria-label={t('sim.esc.columnas.incoterm')} valor={e.incoterm} opciones={Object.keys(PARAMS.matrizIncoterms).map((id) => ({ id, label: id }))} onCambio={(incoterm) => cambiar(e.id, { incoterm })} />}
                  </td>
                  <td className="px-2.5 py-2">
                    {esBase ? (ev ? PARAMS.equipos.find((x) => x.id === ev.equipoId).nombre[lang] : '—') : ['MARITIMA_FCL', 'MULTIMODAL', 'POR_EVALUAR'].includes(e.modalidad) ? (
                      <Opciones
                        aria-label={t('sim.esc.columnas.equipo')}
                        valor={e.equipoId ?? ''}
                        vacio={t('sim.esc.recomendado')}
                        opciones={PARAMS.equipos.filter((x) => x.habilitado).map((x) => ({ id: x.id, label: x.nombre[lang] }))}
                        onCambio={(equipoId) => cambiar(e.id, { equipoId: equipoId || null })}
                      />
                    ) : '—'}
                  </td>
                  <td className="px-2.5 py-2 whitespace-nowrap">{ev ? formatoPct(ev.ocupacionVolumen, lang) : '—'}</td>
                  <td className="px-2.5 py-2 whitespace-nowrap">
                    <span className="font-semibold">{formatoDinero(r.rentabilidad.total, moneda, lang)}</span>
                    {r.rentabilidad.parcial && <span className="block text-xs text-muted">{t('sim.esc.parcial')}</span>}
                    {esMenor && <span className="block text-xs font-semibold text-clay">{t('sim.esc.menor')}</span>}
                  </td>
                  <td className="px-2.5 py-2 whitespace-nowrap">{r.rentabilidad.costoKgNeto != null ? formatoNumero(r.rentabilidad.costoKgNeto, 2, lang) : '—'}</td>
                  <td className="px-2.5 py-2 whitespace-nowrap">{formatoNumero(r.completitud, 0, lang)} %</td>
                  <td className="px-1 py-2">
                    {!esBase && (
                      <button type="button" className="min-h-9 cursor-pointer border-0 bg-transparent text-xs text-muted underline" onClick={() => setEscenarios((lista) => lista.filter((x) => x.id !== e.id))}>
                        {t('sim.esc.quitar')}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="m-0 text-xs text-muted">{t('sim.esc.nota')}</p>
    </div>
  );
}
