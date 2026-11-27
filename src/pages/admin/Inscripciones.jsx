import { useCallback, useEffect, useMemo, useState } from 'react';
import { Mail, MessageCircle, RefreshCw } from 'lucide-react';
import { useI18n } from '../../i18n/LanguageContext';
import { MODO_DEMO } from '../../lib/AuthContext';
import { obtenerSupabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';

// Inscripciones al Curso de Exportación de Café (tabla inscripciones_curso).
// Los estados "pagado", "abandonado" y "reembolsado" los pone el webhook de Stripe;
// "acceso enviado" lo marca el equipo aquí cuando ya le dio acceso al curso.

const ESTADOS = ['todos', 'pagado', 'pendiente', 'acceso_enviado', 'abandonado', 'reembolsado'];
const TONO = {
  pagado: 'bg-[#DDF1E2] text-good',
  acceso_enviado: 'bg-ink text-white',
  pendiente: 'bg-[#FFF3D6] text-clay-ink',
  abandonado: 'bg-line-2 text-muted',
  reembolsado: 'bg-[#FBE4E2] text-[#8C1D18]',
};

const fecha = (iso, lang) =>
  iso ? new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'es-CO', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }).format(new Date(iso)) : '—';

export default function Inscripciones() {
  const { t, lang } = useI18n();
  const x = t('insc');
  const [filas, setFilas] = useState([]);
  const [estado, setEstado] = useState('cargando'); // cargando | listo | error | demo
  const [filtro, setFiltro] = useState('todos');

  const cargar = useCallback(async () => {
    if (MODO_DEMO) {
      setEstado('demo');
      return;
    }
    setEstado('cargando');
    const sb = await obtenerSupabase();
    const { data, error } = await sb.from('inscripciones_curso').select('*').order('creado_en', { ascending: false }).limit(500);
    if (error) {
      setEstado('error');
      return;
    }
    setFilas(data);
    setEstado('listo');
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const marcarAcceso = async (fila) => {
    const sb = await obtenerSupabase();
    const { error } = await sb.from('inscripciones_curso').update({ estado: 'acceso_enviado' }).eq('id', fila.id);
    if (!error) setFilas((fs) => fs.map((f) => (f.id === fila.id ? { ...f, estado: 'acceso_enviado' } : f)));
  };

  const visibles = useMemo(() => (filtro === 'todos' ? filas : filas.filter((f) => f.estado === filtro)), [filas, filtro]);
  const cuenta = (e) => (e === 'todos' ? filas.length : filas.filter((f) => f.estado === e).length);
  // Stripe puede cobrar en varias monedas (USD, COP...): los ingresos se suman por moneda, nunca mezclados
  const porMoneda = {};
  for (const f of filas) {
    if ((f.estado === 'pagado' || f.estado === 'acceso_enviado') && f.monto) porMoneda[f.moneda] = (porMoneda[f.moneda] || 0) + Number(f.monto);
  }
  const ingresos =
    Object.entries(porMoneda)
      .map(([moneda, total]) => `$${total.toLocaleString('es-CO', { maximumFractionDigits: 2 })} ${moneda}`)
      .join(' · ') || '$0';

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="m-0 font-serif text-[32px] leading-[1.1] font-semibold">{x.titulo}</h1>
          <p className="m-0 text-[15px] text-muted">{x.sub}</p>
        </div>
        {estado !== 'demo' && (
          <Button variant="outline" size="md" onClick={cargar}>
            <RefreshCw size={16} aria-hidden="true" />
            {x.actualizar}
          </Button>
        )}
      </header>

      {estado === 'demo' && <p className="m-0 rounded-2xl bg-white p-5 text-[15px] leading-[1.6] text-muted">{x.demo}</p>}
      {estado === 'error' && (
        <p role="alert" className="m-0 rounded-2xl bg-[#FFF7F6] p-5 text-[15px] text-[#8C1D18]">
          {x.error}
        </p>
      )}

      {(estado === 'listo' || estado === 'cargando') && (
        <>
          <dl className="m-0 grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              [x.kpi.total, filas.length],
              [x.kpi.pagadas, cuenta('pagado') + cuenta('acceso_enviado')],
              [x.kpi.pendientes, cuenta('pendiente')],
              [x.kpi.ingresos, ingresos],
            ].map(([k, v]) => (
              <div key={k} className="flex flex-col gap-1 rounded-2xl bg-white p-4">
                <dt className="text-[13px] text-muted">{k}</dt>
                <dd className="m-0 font-serif text-[26px] font-semibold">{v}</dd>
              </div>
            ))}
          </dl>

          <div role="group" aria-label={x.filtrar} className="flex flex-wrap gap-2">
            {ESTADOS.map((e) => (
              <button
                key={e}
                type="button"
                aria-pressed={filtro === e}
                onClick={() => setFiltro(e)}
                className={'min-h-10 cursor-pointer rounded-full px-4 text-sm font-medium transition-colors ' + (filtro === e ? 'border-0 bg-ink text-white' : 'border border-line bg-white text-ink hover:border-ink')}
              >
                {x.estados[e]} · {cuenta(e)}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto rounded-2xl bg-white">
            <table className="w-full min-w-[880px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-line text-[12px] tracking-[0.06em] text-muted uppercase">
                  {x.cols.map((c) => (
                    <th key={c} scope="col" className="px-4 py-3 font-semibold">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {estado === 'cargando' && (
                  <tr>
                    <td colSpan={x.cols.length} className="px-4 py-8 text-center text-muted">
                      {x.cargando}
                    </td>
                  </tr>
                )}
                {estado === 'listo' && !visibles.length && (
                  <tr>
                    <td colSpan={x.cols.length} className="px-4 py-8 text-center text-muted">
                      {x.vacio}
                    </td>
                  </tr>
                )}
                {visibles.map((f) => {
                  const tel = f.telefono.replace(/\D/g, '');
                  return (
                    <tr key={f.id} className="border-b border-line-2 align-top last:border-0">
                      <td className="px-4 py-3 whitespace-nowrap text-muted">{fecha(f.creado_en, lang)}</td>
                      <td className="px-4 py-3">
                        <strong className="block">{f.nombre}</strong>
                        <span className="text-[13px] text-muted">{f.origen || '—'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <a href={`mailto:${f.correo}`} className="flex items-center gap-1.5 text-ink">
                          <Mail size={14} aria-hidden="true" />
                          {f.correo}
                        </a>
                        <a href={`https://wa.me/${tel}`} target="_blank" rel="noopener noreferrer" className="mt-1 flex items-center gap-1.5 text-ink">
                          <MessageCircle size={14} aria-hidden="true" />
                          {f.telefono}
                        </a>
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {f.direccion}
                        <br />
                        {f.ciudad}, {f.pais}
                      </td>
                      <td className="px-4 py-3">
                        <span className={'inline-block rounded-full px-2.5 py-1 text-xs font-semibold ' + TONO[f.estado]}>{x.estados[f.estado]}</span>
                        {f.pagado_en && <span className="mt-1 block text-[12px] text-muted">{fecha(f.pagado_en, lang)}</span>}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">{f.monto ? `$${Number(f.monto).toLocaleString('es-CO', { maximumFractionDigits: 2 })} ${f.moneda}` : '—'}</td>
                      <td className="px-4 py-3">
                        {f.estado === 'pagado' && (
                          <Button variant="ink" size="sm" onClick={() => marcarAcceso(f)}>
                            {x.marcarAcceso}
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
