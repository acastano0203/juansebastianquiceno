import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { useI18n } from '../../i18n/LanguageContext';
import { COLORES, LIMITES, TIPOS_PAQUETE } from '../../cubicaje/config';
import { orientacionesPermitidas } from '../../cubicaje/packing';
import { validarProducto } from '../../cubicaje/validate';
import { Button } from '../ui/Button';
import { Close } from '../ui/Icons';
import PaqueteIcono from './PaqueteIcono';

const BoxPreview3D = lazy(() => import('./BoxPreview3D'));

function formVacio(color) {
  return { nombre: '', tipoPaquete: 'box', largo: '', ancho: '', alto: '', peso: '', cantidad: '1', color, limitaRotX: false, limitaRotZ: false, limActivo: false, superior: '', frontal: '' };
}

function formDe(p) {
  const s = (v) => (v == null ? '' : String(v));
  return {
    nombre: p.nombre,
    tipoPaquete: p.tipoPaquete || 'box',
    largo: s(p.largo),
    ancho: s(p.ancho),
    alto: s(p.alto),
    peso: s(p.peso),
    cantidad: s(p.cantidad),
    color: p.color,
    limitaRotX: !!p.limitaRotX,
    limitaRotZ: !!p.limitaRotZ,
    limActivo: !!p.limitePeso?.activo,
    superior: s(p.limitePeso?.superior),
    frontal: s(p.limitePeso?.frontal),
  };
}

// ¿Cabe la caja en el contenedor en alguna orientación permitida?
function cabeEnContenedor(v, c) {
  return orientacionesPermitidas(v).some(({ ejes }) => v[ejes[0]] <= c.largo && v[ejes[1]] <= c.alto && v[ejes[2]] <= c.ancho);
}

function Requerido() {
  const { t } = useI18n();
  return (
    <>
      <span aria-hidden="true" className="text-clay"> *</span>
      <span className="sr-only"> ({t('cub.modal.obligatorio')})</span>
    </>
  );
}

/**
 * Modal "Añadir producto" / "Editar producto".
 * inicial: producto a editar (o null); contenedor: config del contenedor elegido.
 */
export default function ProductoModal({ inicial, contenedor, colorSugerido = COLORES[0], limites = LIMITES.admin, onGuardar, onCerrar }) {
  const { t } = useI18n();
  const ref = useRef();
  const [f, setF] = useState(() => (inicial ? formDe(inicial) : formVacio(colorSugerido)));
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  useEffect(() => {
    const d = ref.current;
    d.showModal();
    const close = () => onCerrar();
    d.addEventListener('close', close);
    return () => d.removeEventListener('close', close);
  }, [onCerrar]);

  const { ok, errores, valor } = validarProducto(
    { ...f, limitePeso: { activo: f.limActivo, superior: f.superior, frontal: f.frontal } },
    limites,
  );
  const dimsOk = !errores.largo && !errores.ancho && !errores.alto;
  const dimError = dimsOk && contenedor && !cabeEnContenedor(valor, contenedor);
  const valido = ok && !dimError;

  const faltan = [];
  if (errores.nombre) faltan.push(t('cub.modal.campos.nombre'));
  if (['largo', 'ancho', 'alto'].some((k) => errores[k] === 'requerido')) faltan.push(t('cub.modal.campos.dimensiones'));
  if (errores.peso === 'requerido') faltan.push(t('cub.modal.campos.peso'));
  if (errores.cantidad === 'requerido') faltan.push(t('cub.modal.campos.cantidad'));

  // Error de formato (no de vacío) para mostrar bajo el campo
  const errorDe = (...ks) => {
    const c = ks.map((k) => errores[k]).find((e) => e && e !== 'requerido');
    return c ? t('cub.modal.' + c) : null;
  };

  const guardar = (e) => {
    e.preventDefault();
    if (!valido) return;
    onGuardar({ ...valor, id: inicial?.id });
    ref.current.close();
  };

  const cant = Number(f.cantidad) || 0;
  const dimsTxt = contenedor ? `${contenedor.largo} × ${contenedor.ancho} × ${contenedor.alto} cm` : '';
  const errDims = errorDe('largo', 'ancho', 'alto');
  const inputNum = 'field min-h-12 w-full min-w-0 px-3';

  return (
    <dialog
      ref={ref}
      aria-labelledby="producto-modal-titulo"
      className="m-auto box-border max-h-[calc(100dvh-24px)] w-[min(1000px,calc(100%-24px))] max-w-none overflow-y-auto rounded-[32px_32px_32px_6px] border-0 bg-white p-0 text-ink backdrop:bg-[rgba(9,28,29,0.55)]"
      onClick={(e) => {
        if (e.target === ref.current) ref.current.close();
      }}
    >
      <form onSubmit={guardar} noValidate>
        <div className="flex items-center justify-between gap-4 border-b border-line-2 px-5 py-5 md:px-8 md:py-6">
          <h2 id="producto-modal-titulo" className="m-0 font-serif text-[24px] font-semibold md:text-[28px]">
            {inicial ? t('cub.modal.editar') : t('cub.modal.anadir')}
          </h2>
          <button
            type="button"
            aria-label={t('cub.modal.cerrar')}
            onClick={() => ref.current.close()}
            className="flex size-11 flex-none cursor-pointer items-center justify-center rounded-full border-0 bg-mist text-ink hover:bg-mist-2"
          >
            <Close size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-2.5 px-5 pt-6 md:px-8">
          <span className="text-[13px] font-semibold" id="tipo-paquete-label">
            {t('cub.modal.tipo')}
          </span>
          <div role="radiogroup" aria-labelledby="tipo-paquete-label" className="grid grid-cols-[repeat(auto-fit,minmax(96px,1fr))] gap-2">
            {TIPOS_PAQUETE.map((tp) => {
              const on = f.tipoPaquete === tp.id;
              return (
                <button
                  key={tp.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  disabled={!tp.habilitado}
                  title={tp.habilitado ? t('cub.paquetes.' + tp.id) : t('cub.modal.soloCaja')}
                  onClick={() => setF((x) => ({ ...x, tipoPaquete: tp.id }))}
                  className={
                    'flex cursor-pointer flex-col items-center gap-2 rounded-[18px_18px_18px_4px] border-[1.5px] px-2 py-3.5 text-[13px] font-semibold disabled:cursor-not-allowed disabled:opacity-50 ' +
                    (on ? 'border-ink bg-ink text-white' : 'border-line-2 bg-white text-muted')
                  }
                >
                  <PaqueteIcono tipo={tp.id} />
                  {t('cub.paquetes.' + tp.id)}
                </button>
              );
            })}
          </div>
          <span className="text-[13px] text-muted">{t('cub.modal.soloCaja')}</span>
        </div>

        <div className="flex flex-wrap gap-6 px-5 pt-5 pb-6 md:px-8">
          <section aria-label={t('cub.modal.vista')} className="flex min-w-0 flex-[1_1_300px] flex-col gap-2.5">
            <span className="text-[13px] font-semibold">{t('cub.modal.vista')}</span>
            <div className="relative flex min-h-[300px] flex-1 items-center justify-center overflow-hidden rounded-[24px_24px_24px_4px] bg-mist md:min-h-[340px]">
              {dimsOk ? (
                <>
                  <div className="absolute inset-0">
                    <Suspense fallback={null}>
                      <BoxPreview3D largo={valor.largo} ancho={valor.ancho} alto={valor.alto} color={f.color} nombre={f.nombre.trim() || t('cub.paquetes.box')} />
                    </Suspense>
                  </div>
                  <span className="absolute bottom-3.5 left-4 rounded-full bg-white px-3 py-1.5 text-xs font-semibold">
                    {valor.largo} × {valor.ancho} × {valor.alto} cm · {((valor.largo * valor.ancho * valor.alto) / 1e6).toFixed(3).replace('.', ',')} m³
                  </span>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2.5 p-6 text-center">
                  <span className="text-muted">
                    <PaqueteIcono tipo="box" size={40} />
                  </span>
                  <span className="text-[15px] font-semibold">{t('cub.modal.dimReq')}</span>
                  <span className="max-w-[240px] text-[13px] leading-normal text-muted">{t('cub.modal.dimReqD')}</span>
                </div>
              )}
            </div>
          </section>

          <section aria-label={t('cub.modal.info')} className="flex min-w-0 flex-[1.3_1_340px] flex-col gap-4">
            <span className="text-[13px] font-semibold">{t('cub.modal.info')}</span>
            <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
              <span>
                {t('cub.modal.nombre')}
                <Requerido />
              </span>
              <input className="field min-h-12" type="text" maxLength={80} value={f.nombre} onChange={set('nombre')} placeholder={t('cub.modal.nombrePh')} required autoFocus />
            </label>

            <fieldset className="m-0 flex flex-col gap-1.5 border-0 p-0">
              <legend className="p-0 pb-1.5 text-[13px] font-semibold">
                {t('cub.modal.dims')}
                <Requerido />
              </legend>
              <div className="grid grid-cols-3 gap-2">
                {['largo', 'ancho', 'alto'].map((k) => (
                  <label key={k} className="flex min-w-0 flex-col gap-1 text-xs text-muted">
                    {t('cub.modal.' + k)}
                    <input
                      className={inputNum + (dimError || (errores[k] && errores[k] !== 'requerido') ? ' border-clay' : '')}
                      type="number"
                      min="0"
                      step="any"
                      inputMode="decimal"
                      value={f[k]}
                      onChange={set(k)}
                      placeholder="0"
                      aria-invalid={!!dimError || (!!errores[k] && errores[k] !== 'requerido')}
                    />
                  </label>
                ))}
              </div>
              {(dimError || errDims) && (
                <span role="alert" className="text-xs text-clay-dark">
                  {dimError ? t('cub.modal.dimError', { dims: dimsTxt }) : errDims}
                </span>
              )}
            </fieldset>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex min-w-0 flex-col gap-1.5 text-[13px] font-semibold">
                <span>
                  {t('cub.modal.peso')}
                  <Requerido />
                </span>
                <input className={inputNum} type="number" min="0" step="any" inputMode="decimal" value={f.peso} onChange={set('peso')} placeholder="0" aria-invalid={!!errorDe('peso')} />
                {errorDe('peso') && <span role="alert" className="text-xs font-normal text-clay-dark">{errorDe('peso')}</span>}
              </label>
              <div className="flex min-w-0 flex-col gap-1.5">
                <label htmlFor="producto-cantidad" className="text-[13px] font-semibold">
                  {t('cub.modal.cantidad')}
                  <Requerido />
                </label>
                <div className="flex min-h-12 items-center overflow-hidden rounded-[14px] border-[1.5px] border-line">
                  <button type="button" aria-label={t('cub.modal.menos')} onClick={() => setF((x) => ({ ...x, cantidad: String(Math.max(1, cant - 1)) }))} className="size-[46px] flex-none cursor-pointer border-0 bg-white text-xl text-ink hover:bg-mist">
                    −
                  </button>
                  <input
                    id="producto-cantidad"
                    className="h-[46px] w-full min-w-0 flex-1 border-0 text-center text-[15px] font-semibold text-ink"
                    type="number"
                    min="1"
                    step="1"
                    inputMode="numeric"
                    value={f.cantidad}
                    onChange={set('cantidad')}
                    aria-invalid={!!errorDe('cantidad')}
                  />
                  <button type="button" aria-label={t('cub.modal.mas')} onClick={() => setF((x) => ({ ...x, cantidad: String(Math.min(limites.cajas, Math.floor(cant) + 1)) }))} className="size-[46px] flex-none cursor-pointer border-0 bg-white text-xl text-ink hover:bg-mist">
                    +
                  </button>
                </div>
                {errorDe('cantidad') && <span role="alert" className="text-xs text-clay-dark">{errorDe('cantidad')}</span>}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-[13px] font-semibold" id="color-label">
                {t('cub.modal.color')}
              </span>
              <div role="radiogroup" aria-labelledby="color-label" className="flex flex-wrap gap-2">
                {COLORES.map((hex, i) => {
                  const on = f.color === hex;
                  return (
                    <button
                      key={hex}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      aria-label={t('cub.colores')[i]}
                      title={t('cub.colores')[i]}
                      onClick={() => setF((x) => ({ ...x, color: hex }))}
                      className="size-11 cursor-pointer rounded-full p-0"
                      style={{ background: hex, border: `3px solid ${on ? '#FFFFFF' : hex}`, boxShadow: `0 0 0 2px ${on ? '#123638' : 'rgba(18,54,56,.15)'}` }}
                    />
                  );
                })}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <fieldset className="m-0 flex min-w-0 flex-[1_1_220px] flex-col gap-1 rounded-[18px_18px_18px_4px] border-0 bg-mist p-4">
                <legend className="float-left mb-1 p-0 text-[13px] font-semibold">{t('cub.modal.rot')}</legend>
                <label className="clear-both flex min-h-8 cursor-pointer items-center gap-2.5 text-sm">
                  <input type="checkbox" checked={f.limitaRotX} onChange={set('limitaRotX')} className="m-0 size-5 accent-ink" />
                  {t('cub.modal.rotX')}
                </label>
                <label className="flex min-h-8 cursor-pointer items-center gap-2.5 text-sm">
                  <input type="checkbox" checked={f.limitaRotZ} onChange={set('limitaRotZ')} className="m-0 size-5 accent-ink" />
                  {t('cub.modal.rotZ')}
                </label>
              </fieldset>
              <fieldset className="m-0 flex min-w-0 flex-[1.4_1_280px] flex-col gap-2 rounded-[18px_18px_18px_4px] border-0 bg-mist p-4">
                <legend className="float-left mb-1 p-0 text-[13px] font-semibold">{t('cub.modal.lim')}</legend>
                <label className="clear-both flex min-h-8 cursor-pointer items-center gap-2.5 text-sm">
                  <input type="checkbox" checked={f.limActivo} onChange={set('limActivo')} className="m-0 size-5 accent-ink" />
                  {t('cub.modal.limMax')}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    ['superior', 'limSup'],
                    ['frontal', 'limFro'],
                  ].map(([k, label]) => (
                    <label key={k} className="flex min-w-0 flex-col gap-1 text-xs text-muted">
                      {t('cub.modal.' + label)}
                      <input
                        className="field min-h-11 w-full min-w-0 rounded-xl bg-white px-3 disabled:opacity-50"
                        type="number"
                        min="0"
                        step="any"
                        inputMode="decimal"
                        value={f[k]}
                        onChange={set(k)}
                        disabled={!f.limActivo}
                        placeholder="kg"
                      />
                    </label>
                  ))}
                </div>
                <span className="text-xs text-muted">{t('cub.modal.limAyuda')}</span>
              </fieldset>
            </div>
          </section>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line-2 px-5 py-4 md:px-8">
          <span className="text-[13px] text-muted" aria-live="polite">
            {valido || !faltan.length ? (valido ? t('cub.modal.listo') : '') : t('cub.modal.faltan', { campos: faltan.join(', ') })}
          </span>
          <span className="flex flex-wrap gap-2.5">
            <Button variant="outline" size="md" className="min-h-12" onClick={() => ref.current.close()}>
              {t('cub.modal.cancelar')}
            </Button>
            <Button type="submit" variant="gold" size="md" className="min-h-12" disabled={!valido}>
              {inicial ? t('cub.modal.guardar') : t('cub.modal.anadir')}
            </Button>
          </span>
        </div>
      </form>
    </dialog>
  );
}
