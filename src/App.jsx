import { Navigate, Route, Routes } from 'react-router-dom';
import { useProximoLead } from './data/LeadsContext';
import ScrollAlNavegar from './components/ui/ScrollAlNavegar';
import Landing from './pages/public/Landing';
import Simulador from './pages/public/Simulador';
import SobreMi from './pages/public/SobreMi';
import CasosExito from './pages/public/CasosExito';
import Servicios from './pages/public/Servicios';
import Criterios from './pages/public/Criterios';
import Programas from './pages/public/Programas';
import VideosPodcast from './pages/public/VideosPodcast';
import Sedes from './pages/public/Sedes';
import CursoCafe from './pages/public/CursoCafe';
import CursoCafeGracias from './pages/public/CursoCafeGracias';
import Inscripciones from './pages/admin/Inscripciones';
import { RUTA_CURSO_CAFE } from './config/cursoCafe';
import CubicajePublico from './pages/public/Cubicaje';
import Academia from './pages/public/academia/Academia';
import AcademiaMasterclass from './pages/public/academia/Masterclass';
import AcademiaGracias from './pages/public/academia/Gracias';
import AcademiaInscripcion from './pages/public/academia/Inscripcion';
import Login from './pages/admin/Login';
import AdminLayout, { Permiso } from './components/admin/AdminLayout';
import Usuarios from './pages/admin/Usuarios';
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
    <>
      <ScrollAlNavegar />
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/sobre-mi" element={<SobreMi />} />
      <Route path="/casos-de-exito" element={<CasosExito />} />
      <Route path="/servicios" element={<Servicios />} />
      <Route path="/criterios" element={<Criterios />} />
      <Route path="/programas" element={<Programas />} />
      <Route path="/videos-podcast" element={<VideosPodcast />} />
      <Route path="/sedes" element={<Sedes />} />
      <Route path={RUTA_CURSO_CAFE} element={<CursoCafe />} />
      <Route path={`${RUTA_CURSO_CAFE}/gracias`} element={<CursoCafeGracias />} />
      {/* Misma dirección que tenía en el sitio anterior, para no romper enlaces ni anuncios existentes */}
      <Route path="/presentacion-del-curso" element={<Navigate to={RUTA_CURSO_CAFE} replace />} />
      <Route path="/simulador" element={<Simulador />} />
      <Route path="/diagnostico" element={<Navigate to="/simulador" replace />} />
      <Route path="/cubicaje" element={<CubicajePublico />} />
      <Route path="/academia" element={<Academia />} />
      <Route path="/academia/masterclass" element={<AcademiaMasterclass />} />
      <Route path="/academia/gracias" element={<AcademiaGracias />} />
      <Route path="/academia/inscripcion" element={<AcademiaInscripcion />} />
      <Route path="/admin/login" element={<Login />} />
      <Route path="/admin" element={<AdminLayout />}>
        {/* Cada página exige el permiso de su módulo (roles.permisos); sin él, se redirige a la primera permitida */}
        <Route index element={<Permiso modulo="pipeline"><Pipeline /></Permiso>} />
        <Route path="prospectos/:id" element={<Permiso modulo="briefs"><Brief /></Permiso>} />
        <Route path="briefs" element={<Permiso modulo="briefs"><ProximoLead to="/admin/prospectos" /></Permiso>} />
        <Route path="propuestas" element={<Permiso modulo="propuestas"><ProximoLead to="/admin/propuestas" /></Permiso>} />
        <Route path="propuestas/:id" element={<Permiso modulo="propuestas"><Propuesta /></Permiso>} />
        <Route path="resultados" element={<Permiso modulo="resultados"><Resultados /></Permiso>} />
        <Route path="inscripciones" element={<Permiso modulo="inscripciones"><Inscripciones /></Permiso>} />
        <Route path="cubicaje" element={<Permiso modulo="cubicaje"><DashboardCubicaje /></Permiso>} />
        <Route path="cubicaje/lista" element={<Permiso modulo="cubicaje"><ListaCubicajes /></Permiso>} />
        <Route path="cubicaje/nuevo" element={<Permiso modulo="cubicaje"><EditarCubicaje key="nuevo" /></Permiso>} />
        <Route path="cubicaje/:id" element={<Permiso modulo="cubicaje"><DetalleCubicaje /></Permiso>} />
        <Route path="cubicaje/:id/editar" element={<Permiso modulo="cubicaje"><EditarCubicaje key="editar" /></Permiso>} />
        <Route path="usuarios" element={<Permiso modulo="usuarios"><Usuarios /></Permiso>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  );
}
