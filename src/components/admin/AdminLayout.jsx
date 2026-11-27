import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';
import { useI18n } from '../../i18n/LanguageContext';
import { rutaInicial } from '../../config/permisos';
import Sidebar from './Sidebar';

export function RequireAuth({ children }) {
  const { user, cargando } = useAuth();
  const location = useLocation();
  // Mientras se recupera la sesión guardada no se manda al login (evita un parpadeo al recargar)
  if (cargando) return <div className="min-h-screen bg-mist" aria-busy="true" />;
  if (!user) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  return children;
}

/**
 * Muestra la página solo si el rol del usuario da acceso al módulo. Si no, lo lleva a la primera página
 * a la que sí tiene acceso (o muestra un aviso si no tiene ninguna). Los datos los protege además la base (RLS).
 */
export function Permiso({ modulo, soloAdmin = false, children }) {
  const { user, puede } = useAuth();
  const { t } = useI18n();
  const { pathname } = useLocation();
  const permitido = soloAdmin ? user?.esAdmin : puede(modulo);
  if (permitido) return children;
  const ruta = rutaInicial(user);
  if (ruta && ruta !== pathname) return <Navigate to={ruta} replace />;
  return (
    <div className="flex flex-col gap-2 rounded-2xl bg-white p-6">
      <h1 className="m-0 font-serif text-[28px] font-semibold">{t('usr.sinAcceso.titulo')}</h1>
      <p className="m-0 text-[15px] leading-[1.6] text-muted">{t('usr.sinAcceso.texto')}</p>
    </div>
  );
}

export default function AdminLayout() {
  return (
    <RequireAuth>
      <div className="flex min-h-screen flex-col bg-mist text-ink lg:flex-row">
        <Sidebar />
        <main className="box-border flex min-w-0 flex-1 flex-col gap-6 px-[22px] pt-8 pb-12 md:px-10">
          <Outlet />
        </main>
      </div>
    </RequireAuth>
  );
}
