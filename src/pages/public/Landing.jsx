import Hero from '../../components/public/Hero';
import SiteFooter from '../../components/public/SiteFooter';

export default function Landing() {
  return (
    <div className="min-w-0 bg-white text-ink">
      <Hero />
      <div className="h-10 md:h-16" aria-hidden="true" />
      <SiteFooter />
    </div>
  );
}
