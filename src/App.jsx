import { Navigate, Route, Routes } from 'react-router-dom';
import { useProximoLead } from './data/LeadsContext';
import Landing from './pages/public/Landing';
import Simulador from './pages/public/Simulador';
import SobreMi from './pages/public/SobreMi';
import CubicajePublico from './pages/public/Cubicaje';
import Academia from './pages/public/academia/Academia';
import AcademiaMasterclass from './pages/public/academia/Masterclass';
import AcademiaGracias from './pages/public/academia/Gracias';
import AcademiaInscripcion from './pages/public/academia/Inscripcion';
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
      <Route path="/sobre-mi" element={<SobreMi />} />
      <Route path="/simulador" element={<Simulador />} />
      <Route path="/diagnostico" element={<Navigate to="/simulador" replace />} />
      <Route path="/cubicaje" element={<CubicajePublico />} />
      <Route path="/academia" element={<Academia />} />
      <Route path="/academia/masterclass" element={<AcademiaMasterclass />} />
      <Route path="/academia/gracias" element={<AcademiaGracias />} />
      <Route path="/academia/inscripcion" element={<AcademiaInscripcion />} />
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
