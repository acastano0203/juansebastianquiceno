import { useId, useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { useI18n } from '../../../i18n/LanguageContext';
import { Campo, entrada } from '../../academia/ModalAgendar';
import { Button } from '../../ui/Button';
import Dialogo from '../Dialogo';
import { MODULOS } from '../../../config/permisos';
import { guardarRol } from '../../../services/usuarios';

/** Crear (rol = null) o editar un rol: nombre, descripción y a qué módulos del panel da acceso. */
export default function ModalRol({ rol, onCerrar, onGuardado }) {
  const { t } = useI18n();
  const x = t('usr.rolForm');
  const id = useId();
  const [datos, setDatos] = useState({ nombre: rol?.nombre ?? '', descripcion: rol?.descripcion ?? '', permisos: rol?.permisos ?? [] });
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState('');

  const alternar = (clave) =>
    setDatos((d) => ({ ...d, permisos: d.permisos.includes(clave) ? d.permisos.filter((p) => p !== clave) : [...d.permisos, clave] }));
  const todos = datos.permisos.length === MODULOS.length;

  const enviar = async (e) => {
    e.preventDefault();
    const err = {};
    if (datos.nombre.trim().length < 2) err.nombre = x.err.nombre;
    if (!datos.permisos.length) err.permisos = x.err.permisos;
    setErrores(err);
    if (err.nombre) return document.getElementById(`${id}-nombre`)?.focus();
    if (err.permisos) return;
    setEnviando(true);
    setErrorEnvio('');
    try {
      // Se guardan en el orden del menú
      await guardarRol({ id: rol?.id, ...datos, permisos: MODULOS.map((m) => m.clave).filter((c) => datos.permisos.includes(c)) });
      onGuardado();
    } catch (ex) {
      setErrorEnvio(ex.codigo === 'rol_existe' ? t('usr.errores.rol_existe') : t('usr.errores.servidor'));
      setEnviando(false);
    }
  };

  return (
    <Dialogo titulo={rol ? x.tituloEditar : x.tituloNuevo} subtitulo={x.sub} cerrarLabel={t('usr.cerrar')} onCerrar={onCerrar} ancho={620}>
      <form onSubmit={enviar} noValidate className="flex flex-col gap-5">
        <div className="flex flex-wrap gap-3">
          <Campo id={`${id}-nombre`} label={x.nombre} error={errores.nombre} className="flex-[1_1_100%]">
            <input id={`${id}-nombre`} className={entrada(errores.nombre)} value={datos.nombre} onChange={(e) => setDatos((d) => ({ ...d, nombre: e.target.value }))} placeholder={x.nombrePh} maxLength={60} aria-invalid={!!errores.nombre} />
          </Campo>
          <Campo id={`${id}-desc`} label={x.descripcion} className="flex-[1_1_100%]">
            <input id={`${id}-desc`} className={entrada(false)} value={datos.descripcion} onChange={(e) => setDatos((d) => ({ ...d, descripcion: e.target.value }))} placeholder={x.descripcionPh} maxLength={200} />
          </Campo>
        </div>

        <fieldset className="m-0 flex flex-col gap-2 border-0 p-0" aria-describedby={errores.permisos ? `${id}-perm-e` : undefined}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <legend className="text-sm font-semibold">{x.permisos}</legend>
            <button
              type="button"
              onClick={() => setDatos((d) => ({ ...d, permisos: todos ? [] : MODULOS.map((m) => m.clave) }))}
              className="min-h-9 cursor-pointer rounded-full border-0 bg-transparent px-2 text-[13px] font-semibold text-ink underline"
            >
              {todos ? x.ninguno : x.todos}
            </button>
          </div>
          <div className="flex flex-col gap-1.5">
            {MODULOS.map((m) => {
              const marcado = datos.permisos.includes(m.clave);
              return (
                <label
                  key={m.clave}
                  className={'flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-2.5 transition-colors ' + (marcado ? 'border-ink bg-[#F6F9F7]' : 'border-line bg-white')}
                >
                  <input type="checkbox" className="size-5 flex-none cursor-pointer accent-[#0C2728]" checked={marcado} onChange={() => alternar(m.clave)} />
                  <span className="flex min-w-0 flex-col">
                    <strong className="text-[15px]">{t(`usr.modulos.${m.clave}.t`)}</strong>
                    <span className="text-[13px] text-muted">{t(`usr.modulos.${m.clave}.d`)}</span>
                  </span>
                </label>
              );
            })}
          </div>
          {errores.permisos && (
            <p id={`${id}-perm-e`} role="alert" className="m-0 text-[13px] font-medium text-[#B3261E]">
              {errores.permisos}
            </p>
          )}
        </fieldset>

        {errorEnvio && (
          <p role="alert" className="m-0 rounded-xl border border-[#B3261E]/30 bg-[#FFF7F6] p-3.5 text-sm text-[#8C1D18]">
            {errorEnvio}
          </p>
        )}

        <div className="flex flex-wrap justify-end gap-2.5">
          <Button variant="outline" size="md" onClick={onCerrar}>
            {x.cancelar}
          </Button>
          <Button type="submit" variant="ink" size="md" disabled={enviando} aria-busy={enviando}>
            {enviando && <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />}
            {rol ? x.guardar : x.crear}
          </Button>
        </div>
      </form>
    </Dialogo>
  );
}
