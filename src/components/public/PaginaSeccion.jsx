import SiteHeader from './SiteHeader';
import SiteFooter from './SiteFooter';
import RootLines from '../ui/RootLines';

// Marco de las páginas migradas desde juansebastianquiceno.com: banda oscura con el menú, contenido y pie.
export default function PaginaSeccion({ children }) {
  return (
    <div className="min-w-0 bg-white text-ink">
      <section className="relative overflow-hidden rounded-br-[96px] bg-ink md:rounded-br-[200px]">
        <RootLines variant="small" opacity={0.18} className="-right-[90px] -bottom-10" />
        <div className="relative mx-auto max-w-[1240px] px-[22px] pb-10 md:px-10 md:pb-14">
          <SiteHeader />
        </div>
      </section>
      {children}
      <SiteFooter />
    </div>
  );
}
