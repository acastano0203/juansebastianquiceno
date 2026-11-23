import { useI18n } from '../../i18n/LanguageContext';
import { PARAMS } from '../../config/params';
import { desdeMm, formatoDinero, formatoKg, formatoM3, formatoNumero, formatoPct } from '../../engine/unidades';
import { Button } from '../ui/Button';
import { Check, Download, Refresh } from '../ui/Icons';
import { Aviso, Tarjeta } from './Campos';
import BotonWhatsApp from './BotonWhatsApp';
import { ResumenSimple } from './EtapaResultado';

export function useNombreEmpaque() {
  const { t } = useI18n();
  return (empaque) => {
    const id = empaque || 'NINGUNO';
    return { uno: t('sim.cub.empUno.' + id), varios: t('sim.cub.empVarios.' + id) };
  };
}

const MODULOS = ['A', 'B', 'C', 'D', 'E', 'F'];

// El reporte de la simulación es gratis e inmediato: se arma con lo que ya está calculado y se guarda
// como PDF con la impresión del navegador. La validación experta (lo que agrega el asesor) va aparte.
function Seccion({ n, titulo, children }) {
  return (
    <section className="flex flex-col gap-3 border-t border-line pt-5">
      <h2 className="m-0 flex items-baseline gap-2.5 font-serif text-[20px] font-semibold">
        <span className="text-sm font-semibold text-clay">{String(n).padStart(2, '0')}</span>
        {titulo}
      </h2>
      {children}
    </section>
  );
}

function Tabla({ columnas, filas, alinear = [] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr>
            {columnas.map((c, i) => (
              <th key={c} className={'border-b border-line px-2 py-1.5 font-semibold text-muted ' + (alinear[i] === 'd' ? 'text-right' : 'text-left')}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.map((f, j) => (
            <tr key={j} className="break-inside-avoid">
              {f.map((v, i) => (
                <td key={i} className={'border-b border-line-2 px-2 py-1.5 align-top ' + (alinear[i] === 'd' ? 'text-right whitespace-nowrap' : '')}>{v}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Par({ k, v }) {
  return (
    <div className="flex justify-between gap-3 border-b border-line-2 py-1.5 text-[13px] last:border-0">
      <dt className="text-muted">{k}</dt>
      <dd className="m-0 text-right font-semibold">{v}</dd>
    </div>
  );
}

export function Documento({ s }) {
  const { t, lang } = useI18n();
  const nombreEmpaque = useNombreEmpaque();
  const { snapshot, codigo, captura3D } = s;
  const r = snapshot.resultado;
  const sim = snapshot.entradas;
  const op = sim.operacion;
  const ren = r.rentabilidad;
  const moneda = r.moneda;
  const dinero = (v) => (v == null ? '—' : formatoDinero(v, moneda, lang));
  const paises = new Intl.DisplayNames([lang], { type: 'region' });
  const lugar = (l) => [l.ciudad, l.pais && paises.of(l.pais)].filter(Boolean).join(', ');
  const equipo = r.seleccion ? PARAMS.equipos.find((e) => e.id === r.seleccion.equipoId) : null;
  const evaluacion = r.seleccion ? r.equipos.find((e) => e.equipoId === r.seleccion.equipoId) : null;
  const contraparte = t('sim.cos.contraparte.' + r.perspectiva);
  const tentativas = r.lineas.some((l) => l.origen === 'TENTATIVA' && l.suma);
  const pendientes = r.lineas.filter((l) => l.activo && l.estado === 'PENDIENTE');
  const emitido = new Date(snapshot.calculadoEn).toLocaleString(lang === 'en' ? 'en-US' : 'es-CO', { timeZone: 'America/Bogota', dateStyle: 'long', timeStyle: 'short' });
  const titulo = `${sim.productos.map((p) => p.nombre).filter(Boolean).join(' + ') || t('sim.rep.sinNombre')} · ${op.origen.ciudad} → ${op.destino.ciudad}`;

  const estadoLinea = (l) => {
    if (l.estado === 'NO_APLICA' && l.pagador && l.pagador !== r.perspectiva) return t('sim.rep.lopaga', { c: contraparte });
    if (l.origen === 'TENTATIVA') return t('sim.cos.tentativoBadge');
    return t('sim.cos.estados.' + l.estado);
  };

  return (
    <article id="reporte-simulacion" className="print-only-root flex flex-col gap-5 rounded-[20px] border border-line bg-white p-5 md:p-8 print:rounded-none print:border-0 print:p-0">
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <span className="text-xs font-semibold tracking-[0.1em] text-clay uppercase">{t('sim.rep.docTitulo')}</span>
            <h1 className="m-0 font-serif text-[26px] leading-tight font-semibold md:text-[30px]">{titulo}</h1>
          </div>
          <dl className="m-0 min-w-[220px] text-right text-[13px]">
            <div><dt className="inline text-muted">{t('sim.rep.codigo')}: </dt><dd className="inline font-semibold">{codigo}</dd></div>
            <div><dt className="inline text-muted">{t('sim.rep.emitido')}: </dt><dd className="inline">{emitido}</dd></div>
            <div><dt className="inline text-muted">{t('sim.rep.vigencia')}: </dt><dd className="inline">{r.vigenciaMinima ?? t('sim.rep.sinVigencia')}</dd></div>
          </dl>
        </div>
      </header>

      {snapshot.asistente && (
        <Seccion n={1} titulo={t('asi.rep.simple')}>
          <ResumenSimple snapshot={snapshot} />
          {captura3D && <img src={captura3D} alt={t('asi.res.imagenAlt')} className="w-full break-inside-avoid rounded-2xl border border-line" />}
          <p className="m-0 text-[13px] text-muted">{t('asi.res.estimacion')}</p>
        </Seccion>
      )}

      <Seccion n={2} titulo={t('sim.rep.s.resumen')}>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-mist-2 px-4 py-3">
            <span className="block text-[13px] text-muted">{ren.parcial ? t('sim.cos.totalParcial') : t('sim.rep.total')}</span>
            <span className="block font-serif text-[22px] font-semibold">{dinero(ren.total)}</span>
          </div>
          {ren.precioSugerido != null && (
            <div className="rounded-2xl bg-mist-2 px-4 py-3">
              <span className="block text-[13px] text-muted">{t('sim.res.precio', { i: op.incoterm })}</span>
              <span className="block font-serif text-[22px] font-semibold">{dinero(ren.precioSugerido)}</span>
            </div>
          )}
          {ren.costoKgNeto != null && (
            <div className="rounded-2xl bg-mist-2 px-4 py-3">
              <span className="block text-[13px] text-muted">{t('sim.rep.costoKg')}</span>
              <span className="block font-serif text-[22px] font-semibold">{dinero(ren.costoKgNeto)}</span>
            </div>
          )}
        </div>
        <dl className="m-0 grid gap-x-8 sm:grid-cols-2">
          <Par k={t('sim.op.tipo')} v={t('sim.tipoOperacion.' + op.tipo)} />
          <Par k={t('sim.op.incoterm')} v={`${op.incoterm}${op.lugarConvenido ? ' · ' + op.lugarConvenido : ''}`} />
          <Par k={t('sim.op.origen')} v={lugar(op.origen)} />
          <Par k={t('sim.op.destino')} v={lugar(op.destino)} />
          <Par k={t('sim.op.modalidad')} v={t('sim.modalidad.' + r.modalidadEfectiva)} />
          <Par k={t('sim.rep.equipo')} v={equipo ? `${r.seleccion.cantidad} × ${equipo.nombre[lang]}` : '—'} />
          {op.partida && <Par k={t('sim.op.partida')} v={op.partida} />}
          {op.fechaSalida && <Par k={t('sim.op.fecha')} v={op.fechaSalida} />}
        </dl>
      </Seccion>

      <Seccion n={3} titulo={t('sim.rep.s.productos')}>
        <Tabla
          columnas={[t('sim.prod.nombre'), t('sim.prod.cantidad'), t('sim.prod.valorUnitario'), t('sim.rep.subtotal')]}
          alinear={['i', 'd', 'd', 'd']}
          filas={sim.productos.map((p) => [
            p.nombre,
            `${formatoNumero(p.cantidad, 2, lang)} ${p.unidad ? t('sim.unidad.' + p.unidad) : ''}`,
            formatoDinero(p.valorUnitario, p.moneda || moneda, lang),
            formatoDinero(p.cantidad * p.valorUnitario, p.moneda || moneda, lang),
          ])}
        />
      </Seccion>

      <Seccion n={4} titulo={t('sim.rep.s.cubicaje')}>
        <Tabla
          columnas={[t('sim.rep.empaque'), t('sim.rep.cantidad'), t('sim.rep.medidas'), t('sim.rep.pesoUno'), t('sim.rep.volTotal'), t('sim.rep.pesoTotal')]}
          alinear={['i', 'd', 'd', 'd', 'd', 'd']}
          filas={sim.referencias.map((ref) => {
            const c = r.cubicaje.referencias.find((x) => x.referenciaId === ref.id);
            const u = ref.unidadMedida || 'cm';
            const m = (mm) => formatoNumero(desdeMm(mm, u), u === 'cm' ? 0 : 2, lang);
            const e = nombreEmpaque(ref.empaque);
            return [
              ref.nombre,
              `${formatoNumero(ref.bultos, 0, lang)} ${ref.bultos === 1 ? e.uno : e.varios}`,
              `${m(ref.largoMm)} × ${m(ref.anchoMm)} × ${m(ref.altoMm)} ${u}`,
              formatoKg(ref.pesoBrutoG, lang),
              c ? `${formatoNumero(c.volumenSueltoMm3 / 1e9, 2, lang)} m³` : '—',
              c ? formatoKg(c.pesoBrutoG, lang) : '—',
            ];
          })}
        />
        <dl className="m-0 grid gap-x-8 sm:grid-cols-2">
          <Par k={t('sim.cub.volSuelto')} v={formatoM3(r.cubicaje.volumenSueltoCm3, lang)} />
          {r.cubicaje.hayPaletizacion && <Par k={t('sim.cub.volPaletizado')} v={formatoM3(r.cubicaje.volumenCargaCm3, lang)} />}
          <Par k={t('sim.cub.pesoBrutoTotal')} v={formatoKg(r.cubicaje.pesoCargaG, lang)} />
          {r.cubicaje.totalPallets > 0 && <Par k={t('sim.cub.pallets')} v={formatoNumero(r.cubicaje.totalPallets, 0, lang)} />}
          {evaluacion && <Par k={t('sim.cub.ocupVol')} v={formatoPct(evaluacion.ocupacionVolumen, lang)} />}
          {evaluacion && <Par k={t('sim.cub.ocupPeso')} v={formatoPct(evaluacion.ocupacionPeso, lang)} />}
          <Par k={t('sim.cub.wm')} v={formatoNumero(r.bases.wmCarga, 2, lang)} />
          <Par k={t('sim.cub.cobrable')} v={formatoKg(r.bases.aereoCobrableKg * 1000, lang)} />
        </dl>
        {r.noUbicados.length > 0 && <Aviso tono="arcilla">{t('sim.cub.hayNoUbicados')}</Aviso>}
        <p className="m-0 text-xs text-muted">{PARAMS.textosLegales.cubicaje[lang]}</p>
      </Seccion>

      <Seccion n={5} titulo={t('sim.rep.s.costos')}>
        {MODULOS.map((m) => {
          const lineas = r.lineas.filter((l) => l.modulo === m && !l.informativo);
          if (!lineas.length) return null;
          return (
            <div key={m} className="flex break-inside-avoid flex-col gap-1">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="m-0 text-[15px] font-semibold">{t('sim.cos.pasos.' + m + '.titulo')}</h3>
                <span className="text-[15px] font-semibold">{dinero(r.subtotales[m])}</span>
              </div>
              <Tabla
                columnas={[t('sim.cos.rubro'), t('sim.cos.estado'), t('sim.cos.valor')]}
                alinear={['i', 'i', 'd']}
                filas={lineas.map((l) => [
                  l.nombre[lang],
                  <span key="e" className="text-muted">
                    {estadoLinea(l)}
                    {l.rango && l.origen === 'TENTATIVA' ? ` · ${dinero(l.rango[0])} – ${dinero(l.rango[1])}` : ''}
                  </span>,
                  l.suma ? dinero(l.valor) : '—',
                ])}
              />
            </div>
          );
        })}
        <div className="flex items-baseline justify-between gap-3 rounded-2xl bg-ink px-4 py-3 text-white">
          <span className="text-sm">{ren.parcial ? t('sim.cos.totalParcial') : t('sim.rep.total')}</span>
          <span className="font-serif text-[22px] font-semibold">{dinero(ren.total)}</span>
        </div>
      </Seccion>

      <Seccion n={6} titulo={t('sim.rep.s.precio')}>
        <dl className="m-0 grid gap-x-8 sm:grid-cols-2">
          <Par k={ren.parcial ? t('sim.cos.totalParcial') : t('sim.rep.total')} v={dinero(ren.total)} />
          {ren.costoKgNeto != null && <Par k={t('sim.rep.costoKg')} v={dinero(ren.costoKgNeto)} />}
          {ren.costoM3 != null && <Par k={t('sim.rep.costoM3')} v={dinero(ren.costoM3)} />}
          {ren.precioSugerido != null && <Par k={t('sim.res.precio', { i: op.incoterm })} v={dinero(ren.precioSugerido)} />}
          {ren.utilidad != null && <Par k={t('sim.rep.utilidad')} v={dinero(ren.utilidad)} />}
          {ren.margen != null && <Par k={t('sim.rep.margen')} v={formatoPct(ren.margen, lang)} />}
        </dl>
      </Seccion>

      <Seccion n={7} titulo={t('sim.rep.s.alertas')}>
        {r.alertas.length ? (
          <ul className="m-0 flex flex-col gap-1.5 pl-5 text-[13px] leading-normal">
            {r.alertas.map((a) => (
              <li key={a.id}>
                <strong className="font-semibold">{t('sim.rep.tipoAlerta.' + a.tipo)}:</strong> {a.texto[lang]}
              </li>
            ))}
          </ul>
        ) : (
          <p className="m-0 text-[13px] text-muted">{t('sim.res.sinAlertas')}</p>
        )}
      </Seccion>

      <Seccion n={8} titulo={t('sim.rep.s.supuestos')}>
        <ul className="m-0 flex flex-col gap-1.5 pl-5 text-[13px] leading-normal">
          <li>{t('sim.rep.supTrm', { v: formatoNumero(r.tasaReferencia, 2, lang), f: r.fuenteTasa })}</li>
          {tentativas && <li>{t('sim.rep.supTentativo')}</li>}
          {pendientes.length > 0 && <li>{t('sim.rep.supPendientes', { l: pendientes.map((l) => l.nombre[lang]).join(', ') })}</li>}
          <li>{t('sim.rep.supVersion', { p: r.versionParametros, a: r.versionAlgoritmo })}</li>
          <li>{PARAMS.textosLegales.resultado[lang]}</li>
        </ul>
      </Seccion>

      <footer className="flex break-inside-avoid flex-col gap-1 rounded-2xl bg-[#fbf3dc] px-4 py-3 text-[13px] leading-normal">
        <strong className="font-semibold">{t('sim.rep.pieT')}</strong>
        <span>{t('sim.rep.pie', { c: codigo })}</span>
      </footer>
    </article>
  );
}

// Guarda el reporte como PDF con la impresión del navegador; el nombre del archivo sale del título
export function useDescargarPdf(codigo) {
  const { t } = useI18n();
  return () => {
    // El nombre del PDF sale del título de la página
    const anterior = document.title;
    document.title = `${t('sim.rep.archivo')}-${codigo ?? ''}`;
    const restaurar = () => {
      document.title = anterior;
      window.removeEventListener('afterprint', restaurar);
    };
    window.addEventListener('afterprint', restaurar);
    window.print();
  };
}

export default function EtapaReporte({ s }) {
  const { t } = useI18n();
  const { snapshot, codigo, estado, vencida, calcular, faltantes, irA } = s;
  const descargar = useDescargarPdf(codigo);

  if (!snapshot) {
    return (
      <Tarjeta className="flex flex-col items-start gap-3">
        <h1 className="m-0 font-serif text-[28px] font-semibold">{t('sim.rep.sinCalcular')}</h1>
        <p className="m-0 text-sm text-muted">{t('sim.rep.sinCalcularD')}</p>
        <Button variant="ink" onClick={() => irA('resultado')}>{t('asi.res.irResultado')}</Button>
      </Tarjeta>
    );
  }

  const desactualizado = estado === 'BORRADOR' || vencida;

  return (
    <div className="flex flex-col gap-4">
      <div className="no-print flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <h1 className="m-0 font-serif text-[28px] leading-tight font-semibold md:text-[34px]">{t('sim.rep.titulo')}</h1>
          <p className="m-0 max-w-[680px] text-sm leading-[1.5] text-muted">{t('sim.rep.lead')}</p>
        </div>
        {desactualizado && (
          <Aviso tono="arcilla" className="flex flex-wrap items-center justify-between gap-3">
            <span>{vencida ? t('sim.rep.vencido') : t('sim.rep.desactualizado')}</span>
            <Button variant="ink" size="sm" disabled={faltantes.length > 0} onClick={() => { calcular(); irA('reporte'); }}>
              <Refresh size={14} />
              {t('sim.cos.recalcular')}
            </Button>
          </Aviso>
        )}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button variant="gold" size="lg" lift onClick={descargar}>
            <Download size={16} />
            {t('sim.rep.descargar')}
          </Button>
          <span className="text-[13px] text-muted">{t('sim.rep.descargarAyuda')}</span>
        </div>
      </div>

      <Documento s={s} />

      <Tarjeta className="no-print flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold tracking-[0.1em] text-clay uppercase">{t('sim.rep.expertoEtiqueta')}</span>
          <h2 className="m-0 font-serif text-[24px] leading-tight font-semibold">{t('sim.rep.expertoT')}</h2>
          <p className="m-0 max-w-[680px] text-sm leading-[1.5] text-muted">{t('sim.rep.expertoD')}</p>
        </div>
        <ul className="m-0 grid list-none gap-2 p-0 sm:grid-cols-2">
          {t('sim.rep.expertoItems').map((x) => (
            <li key={x} className="flex gap-2.5 text-sm leading-normal">
              <Check size={16} className="mt-0.5 flex-none text-[#245a30]" />
              {x}
            </li>
          ))}
        </ul>
        <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
          <BotonWhatsApp variant="ink" mensaje={t('sim.rep.msgValidar', { c: codigo ?? '' })}>{t('sim.rep.validar')}</BotonWhatsApp>
          <BotonWhatsApp mensaje={t('sim.res.msgAsesor')}>{t('sim.rep.hablar')}</BotonWhatsApp>
        </div>
      </Tarjeta>
    </div>
  );
}
