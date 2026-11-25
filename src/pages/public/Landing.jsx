import HeroConsultoria from '../../components/public/HeroConsultoria';
import HerramientasSimulacion from '../../components/public/HerramientasSimulacion';
import SiteFooter from '../../components/public/SiteFooter';

// Portada: primero la consultoría (hero migrado del sitio oficial) y luego las herramientas para calcular antes de la sesión
export default function Landing() {
  return (
    <div className="min-w-0 bg-white text-ink">
      <HeroConsultoria />
      <HerramientasSimulacion />
      <SiteFooter />
    </div>
  );
}
