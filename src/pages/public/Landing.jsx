import HeroConsultoria from '../../components/public/HeroConsultoria';
import BannerCursoCafe from '../../components/public/BannerCursoCafe';
import HerramientasSimulacion from '../../components/public/HerramientasSimulacion';
import SiteFooter from '../../components/public/SiteFooter';
import { Animaciones } from '../../components/ui/Aparecer';

// Portada: la consultoría (hero migrado del sitio oficial), el banner del curso de café (va después del hero, como en el original)
// y las herramientas para calcular antes de la sesión
export default function Landing() {
  return (
    // Animaciones: el contenido aparece suavemente al hacer scroll (solo en la portada)
    <Animaciones>
      <div className="min-w-0 bg-white text-ink">
        <HeroConsultoria />
        <BannerCursoCafe />
        <HerramientasSimulacion />
        <SiteFooter />
      </div>
    </Animaciones>
  );
}
