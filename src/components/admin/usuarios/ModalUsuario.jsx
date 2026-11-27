import { useId, useState } from 'react';
import { KeyRound, LoaderCircle } from 'lucide-react';
import { useI18n } from '../../../i18n/LanguageContext';
import { Campo, entrada } from '../../academia/ModalAgendar';
import { Button } from '../../ui/Button';
import { Copy } from '../../ui/Icons';
import Dialogo from '../Dialogo';
import { MODULOS } from '../../../config/permisos';
import { actualizarUsuario, cambiarClave, claveTemporal, crearUsuario } from '../../../services/usuarios';

const correoValido = (c) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.trim());

/** Lista de módulos a los que da acceso un rol (lo que verá el usuario en su menú). */
export function AccesosRol({ rol }) {
  const { t } = useI18n();
  if (!rol) return null;
  const mods = rol.sistema ? MODULOS : MODULOS.filter((m) => rol.permisos.includes(m.clave));
  return (
    <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
      {mods.length ? (
        mods.map((m) => (
          <li key={m.clave} className="rounded-full bg-mist px-2.5 py-1 text-xs font-medium text-ink">
            {t(`usr.modulos.${m.clave}.t`)}
          </li>
        ))
      ) : (
        <li className="text-xs text-muted">{t('usr.roles.ninguno')}</li>
      )}
    </ul>
  );
}

/**
 * Crear (usuario = null) o editar un usuario del panel.
 * soyAdmin: solo un administrador puede asignar el rol de administrador.
 */
export default function ModalUsuario({ usuario, roles, soyAdmin, esYo, onCerrar, onGuardado }) {
  const { t } = useI18n();
  const x = t('usr.form');
  const id = useId();
  const nuevo = !usuario;
  const rolesAsignables = roles.filter((r) => soyAdmin || !r.sistema);
  const [datos, setDatos] = useState({
    nombre: usuario?.nombre ?? '',
    correo: usuario?.correo ?? '',
    rol_id: usuario?.rol_id ?? rolesAsignables.find((r) => !r.sistema)?.id ?? rolesAsignables[0]?.id ?? '',
    activo: usuario?.activo ?? true,
    clave: nuevo ? claveTemporal() : '',
  });
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState('');
  const [copiado, setCopiado] = useState(false);

  const rolElegido = roles.find((r) => r.id === datos.rol_id);
  const set = (k) => (e) => setDatos((d) => ({ ...d, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(datos.clave);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // sin portapapeles: la persona la copia a mano
    }
  };

  const enviar = async (e) => {
    e.preventDefault();
    const err = {};
    if (datos.nombre.trim().length < 2) err.nombre = x.err.nombre;
    if (nuevo && !correoValido(datos.correo)) err.correo = x.err.correo;
    if (!datos.rol_id) err.rol_id = x.err.rol;
    if ((nuevo || datos.clave) && (datos.clave.length < 8 || datos.clave.length > 72)) err.clave = x.err.clave;
    setErrores(err);
    const primero = ['nombre', 'correo', 'rol_id', 'clave'].find((k) => err[k]);
    if (primero) {
      document.getElementById(`${id}-${primero}`)?.focus();
      return;
    }
    setEnviando(true);
    setErrorEnvio('');
    try {
      if (nuevo) {
        await crearUsuario({ nombre: datos.nombre, correo: datos.correo, rol_id: datos.rol_id, clave: datos.clave });
      } else {
        const cambios = { nombre: datos.nombre };
        if (!esYo) Object.assign(cambios, { rol_id: datos.rol_id, activo: datos.activo });
        await actualizarUsuario(usuario.id, cambios);
        if (datos.clave) await cambiarClave(usuario.id, datos.clave);
      }
      onGuardado(nuevo ? { correo: datos.correo.trim().toLowerCase(), clave: datos.clave } : null);
    } catch (ex) {
      const msgs = t('usr.errores');
      setErrorEnvio(msgs[ex.codigo] || msgs.servidor);
      setEnviando(false);
    }
  };

  return (
    <Dialogo titulo={nuevo ? x.tituloNuevo : x.tituloEditar} subtitulo={nuevo ? x.subNuevo : usuario.correo} cerrarLabel={t('usr.cerrar')} onCerrar={onCerrar}>
      <form onSubmit={enviar} noValidate className="flex flex-col gap-5">
        <div className="flex flex-wrap gap-3">
          <Campo id={`${id}-nombre`} label={x.nombre} error={errores.nombre} className="flex-[1_1_100%]">
            <input id={`${id}-nombre`} className={entrada(errores.nombre)} value={datos.nombre} onChange={set('nombre')} autoComplete="off" aria-invalid={!!errores.nombre} />
          </Campo>
          {nuevo && (
            <Campo id={`${id}-correo`} label={x.correo} error={errores.correo} className="flex-[1_1_100%]">
              <input id={`${id}-correo`} type="email" inputMode="email" className={entrada(errores.correo)} value={datos.correo} onChange={set('correo')} autoComplete="off" aria-invalid={!!errores.correo} />
            </Campo>
          )}
          <Campo id={`${id}-rol_id`} label={x.rol} error={errores.rol_id} className="flex-[1_1_100%]">
            <select id={`${id}-rol_id`} className={entrada(errores.rol_id) + ' cursor-pointer'} value={datos.rol_id} onChange={set('rol_id')} disabled={esYo || (!soyAdmin && rolElegido?.sistema)}>
              {(rolElegido && !rolesAsignables.includes(rolElegido) ? [rolElegido, ...rolesAsignables] : rolesAsignables).map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nombre}
                </option>
              ))}
            </select>
          </Campo>
        </div>

        <div className="flex flex-col gap-2 rounded-2xl bg-[#F6F9F7] p-4">
          <span className="text-[13px] font-semibold">{x.accesos}</span>
          <AccesosRol rol={rolElegido} />
          {esYo && <span className="text-xs text-muted">{x.noPropioRol}</span>}
        </div>

        <Campo id={`${id}-clave`} label={nuevo ? x.claveNueva : x.claveCambiar} error={errores.clave} className="flex-[1_1_100%]">
          <div className="flex gap-2">
            <input
              id={`${id}-clave`}
              type="text"
              className={entrada(errores.clave) + ' font-mono'}
              value={datos.clave}
              onChange={set('clave')}
              placeholder={nuevo ? '' : x.claveVacia}
              autoComplete="new-password"
              spellCheck={false}
              aria-invalid={!!errores.clave}
            />
            <Button variant="outline" size="md" onClick={() => setDatos((d) => ({ ...d, clave: claveTemporal() }))} title={x.generar} aria-label={x.generar}>
              <KeyRound size={16} aria-hidden="true" />
            </Button>
            {datos.clave && (
              <Button variant="outline" size="md" onClick={copiar} title={x.copiar} aria-label={x.copiar}>
                <Copy size={16} />
              </Button>
            )}
          </div>
          <span role="status" className="text-xs text-muted">
            {copiado ? x.copiado : x.claveAyuda}
          </span>
        </Campo>

        {!nuevo && !esYo && (
          <label className="flex min-h-11 cursor-pointer items-center gap-3 text-[15px]">
            <input type="checkbox" className="size-5 cursor-pointer accent-[#0C2728]" checked={datos.activo} onChange={set('activo')} />
            <span>
              <strong className="block">{x.activo}</strong>
              <span className="text-[13px] text-muted">{x.activoAyuda}</span>
            </span>
          </label>
        )}

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
            {nuevo ? x.crear : x.guardar}
          </Button>
        </div>
      </form>
    </Dialogo>
  );
}
