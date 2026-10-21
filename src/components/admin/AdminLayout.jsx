import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';
import Sidebar from './Sidebar';

export function RequireAuth({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  return children;
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
