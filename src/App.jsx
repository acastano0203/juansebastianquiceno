import { Navigate, Route, Routes } from 'react-router-dom';
import { useProximoLead } from './data/LeadsContext';
import Landing from './pages/public/Landing';
import Diagnostico from './pages/public/Diagnostico';
import Login from './pages/admin/Login';
import AdminLayout from './components/admin/AdminLayout';
import Pipeline from './pages/admin/Pipeline';
import Brief from './pages/admin/Brief';
import Propuesta from './pages/admin/Propuesta';
import Resultados from './pages/admin/Resultados';

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
      <Route path="/admin/login" element={<Login />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Pipeline />} />
        <Route path="prospectos/:id" element={<Brief />} />
        <Route path="briefs" element={<ProximoLead to="/admin/prospectos" />} />
        <Route path="propuestas" element={<ProximoLead to="/admin/propuestas" />} />
        <Route path="propuestas/:id" element={<Propuesta />} />
        <Route path="resultados" element={<Resultados />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
