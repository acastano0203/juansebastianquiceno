import { useCallback, useEffect, useState } from 'react';
import { CircleCheck, Pencil, RefreshCw, ShieldCheck, UserPlus } from 'lucide-react';
import { useI18n } from '../../i18n/LanguageContext';
import { MODO_DEMO, useAuth } from '../../lib/AuthContext';
import { Button } from '../../components/ui/Button';
import { Copy, Plus, Trash } from '../../components/ui/Icons';
import ModalUsuario, { AccesosRol } from '../../components/admin/usuarios/ModalUsuario';
import ModalRol from '../../components/admin/usuarios/ModalRol';
import { eliminarRol, eliminarUsuario, listarRoles, listarUsuarios } from '../../services/usuarios';

// Usuarios del panel y sus roles.
// · Usuarios: quien tenga el permiso "usuarios". Solo un administrador puede crear o tocar administradores.
// · Roles: los ven todos los que entran aquí; solo un administrador los crea, edita o borra.

function Pestana({ activa, onClick, children }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={activa}
      onClick={onClick}
      className={'min-h-11 cursor-pointer border-0 border-b-[3px] bg-transparent px-1 text-[15px] ' + (activa ? 'border-gold font-semibold text-ink' : 'border-transparent text-muted hover:text-ink')}
    >
      {children}
    </button>
  );
}

export default function Usuarios() {
  const { t } = useI18n();
  const x = t('usr');
  const { user } = useAuth();
  const soyAdmin = !!user?.esAdmin;
  const [pestana, setPestana] = useState('usuarios');
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [estado, setEstado] = useState(MODO_DEMO ? 'demo' : 'cargando'); // cargando | listo | error | demo
  const [modal, setModal] = useState(null); // { tipo: 'usuario' | 'rol', item }
  const [creado, setCreado] = useState(null); // { correo, clave } del último usuario creado
  const [aviso, setAviso] = useState('');

  const cargar = useCallback(async () => {
    if (MODO_DEMO) return;
    setEstado('cargando');
    try {
      const [us, rs] = await Promise.all([listarUsuarios(), listarRoles()]);
      setUsuarios(us);
      setRoles(rs);
      setEstado('listo');
    } catch {
      setEstado('error');
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const rolDe = (id) => roles.find((r) => r.id === id);
  const errorMsg = (codigo) => x.errores[codigo] || x.errores.servidor;

  const borrarUsuario = async (u) => {
    if (!window.confirm(t('usr.confirmarBorrarUsuario', { nombre: u.nombre }))) return;
    setAviso('');
    try {
      await eliminarUsuario(u.id);
      setUsuarios((us) => us.filter((v) => v.id !== u.id));
    } catch (ex) {
      setAviso(errorMsg(ex.codigo));
    }
  };

  const borrarRol = async (r) => {
    if (!window.confirm(t('usr.confirmarBorrarRol', { nombre: r.nombre }))) return;
    setAviso('');
    try {
      await eliminarRol(r.id);
      setRoles((rs) => rs.filter((v) => v.id !== r.id));
    } catch (ex) {
      setAviso(errorMsg(ex.codigo));
    }
  };

  const cerrarModal = useCallback(() => setModal(null), []);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="m-0 font-serif text-[32px] leading-[1.1] font-semibold">{x.titulo}</h1>
          <p className="m-0 max-w-[620px] text-[15px] text-muted">{x.sub}</p>
        </div>
        {estado !== 'demo' && (
          <div className="flex flex-wrap gap-2.5">
            <Button variant="outline" size="md" onClick={cargar}>
              <RefreshCw size={16} aria-hidden="true" />
              {x.actualizar}
            </Button>
            {pestana === 'usuarios' ? (
              <Button variant="ink" size="md" onClick={() => setModal({ tipo: 'usuario', item: null })} disabled={estado !== 'listo'}>
                <UserPlus size={16} aria-hidden="true" />
                {x.nuevoUsuario}
              </Button>
            ) : (
              soyAdmin && (
                <Button variant="ink" size="md" onClick={() => setModal({ tipo: 'rol', item: null })} disabled={estado !== 'listo'}>
                  <Plus size={16} />
                  {x.nuevoRol}
                </Button>
              )
            )}
          </div>
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
          <div role="tablist" aria-label={x.titulo} className="flex gap-6 border-b border-line">
            <Pestana activa={pestana === 'usuarios'} onClick={() => setPestana('usuarios')}>
              {x.pestanas.usuarios} · {usuarios.length}
            </Pestana>
            <Pestana activa={pestana === 'roles'} onClick={() => setPestana('roles')}>
              {x.pestanas.roles} · {roles.length}
            </Pestana>
          </div>

          {creado && (
            <div role="status" className="flex flex-col gap-2 rounded-2xl border border-good/30 bg-[#EEF8F0] p-4 text-[15px]">
              <strong className="flex items-center gap-2">
                <CircleCheck size={18} aria-hidden="true" />
                {x.creado.titulo}
              </strong>
              <span className="text-muted">{x.creado.texto}</span>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1 font-mono text-sm">
                <span>{creado.correo}</span>
                <span>{creado.clave}</span>
                <Button variant="outline" size="sm" onClick={() => navigator.clipboard?.writeText(`${x.creado.copiaCorreo}: ${creado.correo}\n${x.creado.copiaClave}: ${creado.clave}\n${window.location.origin}/admin/login`)}>
                  <Copy size={14} />
                  {x.creado.copiar}
                </Button>
                <button type="button" onClick={() => setCreado(null)} className="min-h-9 cursor-pointer border-0 bg-transparent font-sans text-[13px] text-muted underline">
                  {x.creado.ocultar}
                </button>
              </div>
            </div>
          )}

          {aviso && (
            <p role="alert" className="m-0 rounded-xl border border-[#B3261E]/30 bg-[#FFF7F6] p-3.5 text-sm text-[#8C1D18]">
              {aviso}
            </p>
          )}

          {pestana === 'usuarios' && (
            <div role="tabpanel" className="overflow-x-auto rounded-2xl bg-white">
              <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-line text-[12px] tracking-[0.06em] text-muted uppercase">
                    {x.cols.map((c, i) => (
                      <th key={i} scope="col" className="px-4 py-3 font-semibold">
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
                  {usuarios.map((u) => {
                    const rol = rolDe(u.rol_id);
                    const esYo = u.id === user?.id;
                    const editable = soyAdmin || !rol?.sistema;
                    return (
                      <tr key={u.id} className="border-b border-line-2 align-top last:border-0">
                        <td className="px-4 py-3">
                          <strong className="block">
                            {u.nombre} {esYo && <span className="font-normal text-muted">{x.tu}</span>}
                          </strong>
                          <span className="text-[13px] text-muted">{u.correo}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 font-medium">
                            {rol?.sistema && <ShieldCheck size={15} aria-hidden="true" />}
                            {rol?.nombre ?? '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={'inline-block rounded-full px-2.5 py-1 text-xs font-semibold ' + (u.activo ? 'bg-[#DDF1E2] text-good' : 'bg-line-2 text-muted')}>
                            {u.activo ? x.activo : x.inactivo}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {editable && (
                            <div className="flex justify-end gap-1.5">
                              <Button variant="outline" size="sm" onClick={() => setModal({ tipo: 'usuario', item: u })} aria-label={`${x.editar}: ${u.nombre}`}>
                                <Pencil size={14} aria-hidden="true" />
                                {x.editar}
                              </Button>
                              {!esYo && (
                                <Button variant="outline" size="sm" onClick={() => borrarUsuario(u)} aria-label={`${x.eliminar}: ${u.nombre}`} title={x.eliminar}>
                                  <Trash size={14} />
                                </Button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {pestana === 'roles' && (
            <div role="tabpanel" className="grid gap-3 md:grid-cols-2">
              {!soyAdmin && <p className="m-0 text-sm text-muted md:col-span-2">{x.roles.soloAdmin}</p>}
              {roles.map((r) => {
                const cuantos = usuarios.filter((u) => u.rol_id === r.id).length;
                return (
                  <article key={r.id} className="flex flex-col gap-3 rounded-2xl bg-white p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 flex-col gap-1">
                        <h2 className="m-0 flex items-center gap-1.5 text-[17px] font-semibold">
                          {r.sistema && <ShieldCheck size={17} aria-hidden="true" />}
                          {r.nombre}
                        </h2>
                        {r.descripcion && <p className="m-0 text-sm text-muted">{r.descripcion}</p>}
                      </div>
                      <span className="flex-none rounded-full bg-mist px-2.5 py-1 text-xs font-semibold">{t('usr.roles.usuarios', { n: cuantos })}</span>
                    </div>
                    <AccesosRol rol={r} />
                    {r.sistema ? (
                      <p className="m-0 text-xs text-muted">{x.roles.sistema}</p>
                    ) : (
                      soyAdmin && (
                        <div className="flex gap-1.5">
                          <Button variant="outline" size="sm" onClick={() => setModal({ tipo: 'rol', item: r })}>
                            <Pencil size={14} aria-hidden="true" />
                            {x.editar}
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => borrarRol(r)} aria-label={`${x.eliminar}: ${r.nombre}`} title={x.eliminar}>
                            <Trash size={14} />
                          </Button>
                        </div>
                      )
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}

      {modal?.tipo === 'usuario' && (
        <ModalUsuario
          usuario={modal.item}
          roles={roles}
          soyAdmin={soyAdmin}
          esYo={modal.item?.id === user?.id}
          onCerrar={cerrarModal}
          onGuardado={(datosNuevo) => {
            setModal(null);
            setAviso('');
            if (datosNuevo) setCreado(datosNuevo);
            cargar();
          }}
        />
      )}
      {modal?.tipo === 'rol' && (
        <ModalRol
          rol={modal.item}
          onCerrar={cerrarModal}
          onGuardado={() => {
            setModal(null);
            setAviso('');
            cargar();
          }}
        />
      )}
    </div>
  );
}
