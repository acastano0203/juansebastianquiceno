import { useI18n } from '../../i18n/LanguageContext';
import { PARAMS } from '../../config/params';
import { aMm, desdeMm, formatoKg, formatoM3, formatoNumero, kgAG } from '../../engine/unidades';
import { medidaExcedida } from '../../engine/cubicaje';
import { Button } from '../ui/Button';
import { ArrowRight, Plus, Trash } from '../ui/Icons';
import { Aviso, Campo, Dato, Interruptor, Numero, Opciones, Tarjeta, Texto } from './Campos';
import { EMPAQUES } from './EtapaProducto';
import { nuevaReferencia, nuevoProducto } from './useSimulacion';

const UNIDADES = ['cm', 'm', 'in'];
const ROTACIONES = ['SOLO_BASE', 'LIBRE', 'FIJA'];
// Productos creados desde aquí (el usuario solo escribió el nombre): no cuentan como declarados en la Etapa 2
const declarados = (productos) => productos.filter((p) => !p.desdeCubicaje);

// Si el empaque ya es un pallet o una estiba, no tiene sentido preguntar si va sobre pallets
const YA_PALETIZADO = ['PALLET', 'ESTIBA'];

// Nombre del empaque en singular y plural para que las etiquetas hablen el idioma del usuario:
// "Cantidad de cajas", "Medidas de cada saco"…
export function useNombreEmpaque() {
  const { t } = useI18n();
  return (empaque) => {
    const id = empaque || 'NINGUNO';
    return { uno: t('sim.cub.empUno.' + id), varios: t('sim.cub.empVarios.' + id) };
  };
}

function Bloque({ n, titulo, ayuda, children }) {
  return (
    <section className="flex min-w-0 flex-col gap-3">
      <div className="flex items-baseline gap-2.5">
        <span className="grid size-6 flex-none place-items-center rounded-full bg-ink text-xs font-semibold text-white">{n}</span>
        <div className="flex min-w-0 flex-col gap-0.5">
          <h3 className="m-0 text-[15px] font-semibold">{titulo}</h3>
          {ayuda && <p className="m-0 text-[13px] leading-normal text-muted">{ayuda}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

// Lo mínimo que el cálculo necesita de un empaque (el motor ignora los que no lo tienen)
export function faltantesReferencia(r) {
  const f = [];
  if (!(r.bultos >= 1)) f.push('bultos');
  if (!r.unidadMedida) f.push('unidad');
  if (!(r.largoMm > 0 && r.anchoMm > 0 && r.altoMm > 0)) f.push('medidas');
  if (!(r.pesoBrutoG > 0)) f.push('peso');
  return f;
}

function Referencia({ r, s, calc, indice }) {
  const { t, lang } = useI18n();
  const nombreEmpaque = useNombreEmpaque();
  const { sim, actualizar } = s;
  const u = r.unidadMedida;
  const e = nombreEmpaque(r.empaque);
  const cambiar = (cambios) => actualizar((sm) => ({ ...sm, referencias: sm.referencias.map((x) => (x.id === r.id ? { ...x, ...cambios } : x)) }));
  const manejo = (cambios) => cambiar({ manejo: { ...r.manejo, ...cambios } });
  const pallet = (cambios) => cambiar({ pallet: { ...r.pallet, ...cambios } });
  const repetido = sim.referencias.some((x) => x.id !== r.id && x.nombre.trim() && x.nombre.trim() === r.nombre.trim());
  const pesoMal = r.pesoNetoG != null && r.pesoNetoG > r.pesoBrutoG && r.pesoBrutoG > 0;
  const sinUnidad = !u;
  const etiquetaU = u ? ` (${u === 'in' ? (lang === 'en' ? 'in' : 'pulg') : u})` : '';
  const medida = (mm) => (mm && u ? desdeMm(mm, u) : null);
  const excede = medidaExcedida(r, PARAMS.equipos);
  const enUnidad = (mm) => `${formatoNumero(desdeMm(mm, u || 'cm'), u === 'cm' || !u ? 0 : 2, lang)} ${u === 'in' ? (lang === 'en' ? 'in' : 'pulg') : u || 'cm'}`;
  const cmPallet = (mm) => (mm ? mm / 10 : null);
  const apilable = r.apilable && !r.manejo.fragil;
  const yaPaletizado = YA_PALETIZADO.includes(r.empaque);
  // Se marcan los campos que faltan solo después de que el usuario intentó seguir
  const faltan = s.revisarCub ? faltantesReferencia(r) : [];
  const obligatorio = t('sim.cub.obligatorio');

  // Si no hay productos declarados en la Etapa 2 (p. ej. entró directo a Cubicaje), el usuario solo escribe
  // qué producto es y por debajo se crea uno propio de esta referencia; no tiene que saber que existe la Etapa 2.
  const escribirProducto = declarados(sim.productos).length === 0;
  const productoPropio = sim.productos.find((p) => p.id === r.productoId && p.desdeCubicaje);
  const nombrarProducto = (nombre) =>
    actualizar((sm) => {
      const propio = sm.productos.find((p) => p.id === r.productoId && p.desdeCubicaje);
      if (propio) return { ...sm, productos: sm.productos.map((p) => (p.id === propio.id ? { ...p, nombre } : p)) };
      const prod = { ...nuevoProducto(sm.productos.length + 1, nombre), empaque: r.empaque || '', desdeCubicaje: true };
      return { ...sm, productos: [...sm.productos, prod], referencias: sm.referencias.map((x) => (x.id === r.id ? { ...x, productoId: prod.id } : x)) };
    });

  // Al elegir el producto se propone el empaque que se declaró en la Etapa 2, si aún no hay uno
  const elegirProducto = (productoId) => {
    const prod = sim.productos.find((p) => p.id === productoId);
    cambiar({ productoId, ...(!r.empaque && prod?.empaque ? { empaque: prod.empaque } : {}) });
  };

  return (
    <Tarjeta className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="m-0 font-serif text-[22px] leading-tight font-semibold">
          {r.bultos > 0 && r.empaque ? `${formatoNumero(r.bultos, 0, lang)} ${r.bultos === 1 ? e.uno : e.varios}` : t('sim.cub.tarjeta', { n: indice + 1 })}
          {r.productoId && sim.productos.find((p) => p.id === r.productoId)?.nombre && (
            <span className="font-sans text-[15px] font-normal text-muted"> · {sim.productos.find((p) => p.id === r.productoId).nombre}</span>
          )}
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            actualizar((sm) => ({
              ...sm,
              referencias: sm.referencias.filter((x) => x.id !== r.id),
              // El producto que se creó solo para esta referencia se va con ella
              productos: sm.productos.filter((p) => !(p.desdeCubicaje && p.id === r.productoId)),
            }))
          }
        >
          <Trash size={14} />
          {t('sim.cub.eliminar')}
        </Button>
      </div>

      {faltan.length > 0 && (
        <Aviso tono="arcilla">{t('sim.cub.falta', { f: faltan.map((k) => t('sim.cub.faltaCampo.' + k, { e: e.varios })).join(', ') })}</Aviso>
      )}

      <Bloque n={1} titulo={t('sim.cub.b1')}>
        <div className="grid gap-3 sm:grid-cols-3">
          <Campo label={t('sim.cub.producto')}>
            {escribirProducto ? (
              <Texto valor={productoPropio?.nombre ?? ''} maxLength={120} placeholder={t('sim.cub.productoPh')} onCambio={nombrarProducto} />
            ) : (
              <Opciones
                valor={r.productoId}
                vacio={t('sim.cub.elegirProducto')}
                opciones={sim.productos.map((p, i) => ({ id: p.id, label: p.nombre || t('sim.prod.nombreDefecto', { n: i + 1 }) }))}
                onCambio={elegirProducto}
              />
            )}
          </Campo>
          <Campo label={t('sim.cub.empaque')}>
            <Opciones valor={r.empaque ?? ''} vacio={t('sim.elegir')} opciones={EMPAQUES.map((id) => ({ id, label: t('sim.empaque.' + id) }))} onCambio={(empaque) => cambiar({ empaque, ...(YA_PALETIZADO.includes(empaque) ? { paletizar: false } : {}) })} />
          </Campo>
          <Campo label={t('sim.cub.cantidad', { e: e.varios })} error={faltan.includes('bultos') ? obligatorio : null}>
            <Numero valor={r.bultos || null} placeholder={t('sim.cub.cantidadPh')} onCambio={(v) => cambiar({ bultos: v == null ? 0 : Math.max(0, Math.floor(v)) })} />
          </Campo>
        </div>
      </Bloque>

      <Bloque n={2} titulo={t('sim.cub.b2', { e: e.uno })} ayuda={t('sim.cub.b2Ayuda', { e: e.uno })}>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Campo label={t('sim.cub.unidadMedida')} error={faltan.includes('unidad') ? obligatorio : null}>
            <Opciones valor={u} vacio={t('sim.elegir')} opciones={UNIDADES.map((id) => ({ id, label: t('sim.cub.unidadNombre.' + id) }))} onCambio={(unidadMedida) => cambiar({ unidadMedida })} />
          </Campo>
          {['largo', 'ancho', 'alto'].map((d) => (
            <Campo key={d} label={`${t('sim.cub.' + d)}${etiquetaU}`} error={faltan.includes('medidas') && !(r[d + 'Mm'] > 0) ? obligatorio : null}>
              <Numero
                valor={medida(r[d + 'Mm'])}
                disabled={sinUnidad}
                placeholder={sinUnidad ? t('sim.cub.primeroUnidad') : undefined}
                onCambio={(v) => cambiar({ [d + 'Mm']: v == null ? 0 : aMm(v, u) })}
              />
            </Campo>
          ))}
        </div>
        {excede && (
          <Aviso tono="arcilla">
            {t('sim.cub.medidaExcede', { m: t('sim.cub.' + excede.medida).toLowerCase(), v: enUnidad(excede.valorMm), x: enUnidad(excede.maximoMm), e: e.uno })}
          </Aviso>
        )}
      </Bloque>

      <Bloque n={3} titulo={t('sim.cub.b3', { e: e.uno })}>
        <div className="grid gap-3 sm:grid-cols-3">
          <Campo label={t('sim.cub.pesoBruto')} ayuda={t('sim.cub.pesoBrutoAyuda')} error={pesoMal ? t('sim.cub.pesoError') : faltan.includes('peso') ? obligatorio : null}>
            <Numero valor={r.pesoBrutoG ? r.pesoBrutoG / 1000 : null} onCambio={(v) => cambiar({ pesoBrutoG: v == null ? 0 : kgAG(v) })} />
          </Campo>
          <Campo label={t('sim.cub.pesoNeto')} ayuda={t('sim.cub.opcional')}>
            <Numero valor={r.pesoNetoG != null ? r.pesoNetoG / 1000 : null} onCambio={(v) => cambiar({ pesoNetoG: v == null ? null : kgAG(v) })} />
          </Campo>
          <Campo label={t('sim.cub.unidadesBulto', { e: e.uno })} ayuda={t('sim.cub.unidadesAyuda')}>
            <Numero valor={r.unidadesPorBulto} onCambio={(v) => cambiar({ unidadesPorBulto: v == null ? null : Math.floor(v) })} />
          </Campo>
        </div>
      </Bloque>

      <Bloque n={4} titulo={t('sim.cub.b4')} ayuda={t('sim.cub.b4Ayuda')}>
        <Campo label={t('sim.cub.rotacion', { e: e.uno })} className="max-w-[420px]">
          <Opciones valor={r.rotacion} vacio={t('sim.elegir')} opciones={ROTACIONES.map((id) => ({ id, label: t('sim.rotacion.' + id) }))} onCambio={(rotacion) => cambiar({ rotacion })} />
        </Campo>
        <div className="flex flex-wrap items-end gap-x-6 gap-y-2">
          <Interruptor checked={apilable} onCambio={(v) => cambiar({ apilable: v, niveles: v ? null : 1 })}>{t('sim.cub.apilable', { e: e.varios })}</Interruptor>
          {apilable && (
            <Campo label={t('sim.cub.niveles')} ayuda={r.niveles == null ? t('sim.cub.nivelesTecho') : null} className="w-56">
              <Numero valor={r.niveles} placeholder={t('sim.cub.sinLimite')} onCambio={(v) => cambiar({ niveles: v == null ? null : Math.max(1, Math.floor(v)) })} />
            </Campo>
          )}
        </div>
        <div className="flex flex-wrap items-end gap-x-6 gap-y-1">
          <Interruptor checked={r.manejo.fragil} onCambio={(fragil) => manejo({ fragil })}>{t('sim.cub.fragil')}</Interruptor>
          <Interruptor checked={r.manejo.peligroso} onCambio={(peligroso) => manejo({ peligroso })}>{t('sim.cub.peligroso')}</Interruptor>
          <Interruptor checked={r.manejo.refrigerado} onCambio={(refrigerado) => manejo({ refrigerado })}>{t('sim.cub.refrigerado')}</Interruptor>
          {!yaPaletizado && <Interruptor checked={r.paletizar} onCambio={(paletizar) => cambiar({ paletizar })}>{t('sim.cub.paletizar', { e: e.varios })}</Interruptor>}
        </div>

        {r.manejo.peligroso && (
          <Campo label={t('sim.cub.claseOnu')} ayuda={t('sim.cub.claseOnuAyuda')} className="max-w-[260px]">
            <Texto valor={r.manejo.claseOnu} onCambio={(claseOnu) => manejo({ claseOnu })} />
          </Campo>
        )}
        {r.manejo.refrigerado && (
          <div className="grid max-w-[440px] grid-cols-2 gap-3">
            <Campo label={t('sim.cub.tempMin')}>
              <Numero valor={r.manejo.tempMin} onCambio={(tempMin) => manejo({ tempMin })} />
            </Campo>
            <Campo label={t('sim.cub.tempMax')}>
              <Numero valor={r.manejo.tempMax} onCambio={(tempMax) => manejo({ tempMax })} />
            </Campo>
          </div>
        )}
        {r.paletizar && !yaPaletizado && (
          <fieldset className="m-0 grid min-w-0 grid-cols-2 gap-3 rounded-2xl border border-line p-3.5 md:grid-cols-5">
            <legend className="px-1.5 text-[13px] font-semibold">{t('sim.cub.palletTitulo')}</legend>
            <p className="col-span-full m-0 text-[13px] text-muted">{t('sim.cub.palletAyuda')}</p>
            <Campo label={t('sim.cub.palletLargo')}>
              <Numero valor={cmPallet(r.pallet.largoMm)} onCambio={(v) => pallet({ largoMm: v == null ? 0 : aMm(v, 'cm') })} />
            </Campo>
            <Campo label={t('sim.cub.palletAncho')}>
              <Numero valor={cmPallet(r.pallet.anchoMm)} onCambio={(v) => pallet({ anchoMm: v == null ? 0 : aMm(v, 'cm') })} />
            </Campo>
            <Campo label={t('sim.cub.palletAlto')}>
              <Numero valor={cmPallet(r.pallet.altoMm)} onCambio={(v) => pallet({ altoMm: v == null ? 0 : aMm(v, 'cm') })} />
            </Campo>
            <Campo label={t('sim.cub.palletPeso')}>
              <Numero valor={r.pallet.pesoG / 1000} onCambio={(v) => pallet({ pesoG: v == null ? 0 : kgAG(v) })} />
            </Campo>
            <Campo label={t('sim.cub.palletMax')}>
              <Numero valor={cmPallet(r.pallet.alturaMaxMm)} onCambio={(v) => pallet({ alturaMaxMm: v == null ? 0 : aMm(v, 'cm') })} />
            </Campo>
          </fieldset>
        )}
      </Bloque>

      <Campo label={t('sim.cub.nombre')} ayuda={t('sim.cub.nombreAyuda')} error={repetido ? t('sim.cub.nombreRepetido') : null} className="max-w-[420px]">
        <Texto valor={r.nombre} onCambio={(nombre) => cambiar({ nombre })} />
      </Campo>

      {calc && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Dato etiqueta={t('sim.cub.volBulto', { e: e.uno })} valor={`${formatoNumero(calc.volumenBultoMm3 / 1e9, 3, lang)} m³`} />
          <Dato etiqueta={t('sim.cub.volRef', { e: e.varios })} valor={`${formatoNumero(calc.volumenSueltoMm3 / 1e9, 2, lang)} m³`} />
          <Dato etiqueta={t('sim.cub.pesoRef', { e: e.varios })} valor={formatoKg(calc.pesoBrutoG, lang)} />
          {calc.numPallets > 0 && <Dato etiqueta={t('sim.cub.palletsRef')} valor={formatoNumero(calc.numPallets, 0, lang)} nota={t('sim.cub.palletsDetalle', { c: calc.bultosPorCapa, n: calc.capasPorPallet })} />}
        </div>
      )}
    </Tarjeta>
  );
}

export default function EtapaCubicaje({ s }) {
  const { t, lang } = useI18n();
  const { sim, actualizar, vivo, verResultadoCub } = s;
  const c = vivo.cubicaje;
  const hayCarga = c.referencias.length > 0;
  const equipo = vivo.seleccion ? PARAMS.equipos.find((e) => e.id === vivo.seleccion.equipoId) : null;

  const anadir = () =>
    actualizar((sm) => {
      const decl = declarados(sm.productos);
      const prod = decl.length === 1 ? decl[0] : null;
      return { ...sm, referencias: [...sm.referencias, nuevaReferencia(prod?.id ?? '', t('sim.cub.nombreDefecto', { n: sm.referencias.length + 1 }), prod?.empaque ?? '')] };
    });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h1 className="m-0 font-serif text-[28px] leading-tight font-semibold md:text-[34px]">{t('sim.cub.titulo')}</h1>
        <p className="m-0 max-w-[720px] text-[15px] leading-normal text-muted">{t('sim.cub.intro')}</p>
      </div>

      <Aviso tono="menta" titulo={t('sim.cub.ejemploT')}>{t('sim.cub.ejemplo')}</Aviso>

      {sim.referencias.map((r, i) => (
        <div key={r.id} id={'empaque-' + r.id} className="scroll-mt-4">
          <Referencia r={r} s={s} indice={i} calc={vivo.cubicaje.referencias.find((x) => x.referenciaId === r.id)} />
        </div>
      ))}

      <button
        type="button"
        onClick={anadir}
        className="flex min-h-14 cursor-pointer items-center justify-center gap-2 rounded-[20px] border-2 border-dashed border-line bg-white/60 px-4 text-[15px] font-semibold text-ink hover:border-ink"
      >
        <Plus size={18} />
        {sim.referencias.length ? t('sim.cub.anadirOtro') : t('sim.cub.anadir')}
      </button>

      {hayCarga && (
        <Tarjeta className="flex flex-col gap-4">
          <h2 className="m-0 text-[15px] font-semibold">{t('sim.cub.totalT')}</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Dato etiqueta={t('sim.cub.volSuelto')} valor={formatoM3(c.volumenSueltoCm3, lang)} />
            {c.hayPaletizacion && <Dato etiqueta={t('sim.cub.volPaletizado')} valor={formatoM3(c.volumenCargaCm3, lang)} />}
            <Dato etiqueta={t('sim.cub.pesoBrutoTotal')} valor={formatoKg(c.pesoCargaG, lang)} />
            {c.totalPallets > 0 && <Dato etiqueta={t('sim.cub.pallets')} valor={formatoNumero(c.totalPallets, 0, lang)} />}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm">
              {equipo ? (
                <>
                  {vivo.seleccion.recomendado ? t('sim.cub.recomendado') : t('sim.cub.seleccionado')}: <strong className="font-semibold">{equipo.nombre[lang]}</strong>
                </>
              ) : (
                <>
                  {t('sim.res.modalidad')}: <strong className="font-semibold">{t('sim.modalidad.' + vivo.modalidadEfectiva)}</strong>
                </>
              )}
            </span>
            <Button variant="gold" onClick={verResultadoCub}>
              {t('sim.cub.verResultado')}
              <ArrowRight size={16} />
            </Button>
          </div>
          {vivo.noUbicados.length > 0 && <Aviso tono="arcilla">{t('sim.cub.hayNoUbicados')}</Aviso>}
        </Tarjeta>
      )}
    </div>
  );
}
