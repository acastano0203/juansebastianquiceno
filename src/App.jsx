import { Navigate, Route, Routes } from 'react-router-dom';
import { useProximoLead } from './data/LeadsContext';
import Landing from './pages/public/Landing';
import Diagnostico from './pages/public/Diagnostico';
import CubicajePublico from './pages/public/Cubicaje';
import Login from './pages/admin/Login';
import AdminLayout from './components/admin/AdminLayout';
import Pipeline from './pages/admin/Pipeline';
import Brief from './pages/admin/Brief';
import Propuesta from './pages/admin/Propuesta';
import Resultados from './pages/admin/Resultados';
import DashboardCubicaje from './pages/admin/cubicaje/Dashboard';
import ListaCubicajes from './pages/admin/cubicaje/Lista';
import EditarCubicaje from './pages/admin/cubicaje/Editar';
import DetalleCubicaje from './pages/admin/cubicaje/Detalle';

// "Briefs" y "Propuestas" del menú abren el prospecto con la próxima llamada
function ProximoLead({ to }) {
  const lead = useProximoLead();
  return <Navigate to={lead ? `${to}/${lead.id}` : '/admin'} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/diagnostico" element={<Diagnostico />} />
      <Route path="/cubicaje" element={<CubicajePublico />} />
      <Route path="/admin/login" element={<Login />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Pipeline />} />
        <Route path="prospectos/:id" element={<Brief />} />
        <Route path="briefs" element={<ProximoLead to="/admin/prospectos" />} />
        <Route path="propuestas" element={<ProximoLead to="/admin/propuestas" />} />
        <Route path="propuestas/:id" element={<Propuesta />} />
        <Route path="resultados" element={<Resultados />} />
        <Route path="cubicaje" element={<DashboardCubicaje />} />
        <Route path="cubicaje/lista" element={<ListaCubicajes />} />
        <Route path="cubicaje/nuevo" element={<EditarCubicaje key="nuevo" />} />
        <Route path="cubicaje/:id" element={<DetalleCubicaje />} />
        <Route path="cubicaje/:id/editar" element={<EditarCubicaje key="editar" />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
