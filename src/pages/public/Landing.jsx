import Hero from '../../components/public/Hero';
import HowItWorks from '../../components/public/HowItWorks';
import Areas from '../../components/public/Areas';
import CtaBand from '../../components/public/CtaBand';
import SiteFooter from '../../components/public/SiteFooter';

export default function Landing() {
  return (
    <div className="min-w-0 bg-white text-ink">
      <Hero />
      <HowItWorks />
      <Areas />
      <CtaBand />
      <SiteFooter />
    </div>
  );
}
