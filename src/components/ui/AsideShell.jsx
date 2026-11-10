import Brand from './Brand';
import RootLines from './RootLines';
import LanguageSwitcher from './LanguageSwitcher';

export default function AsideShell({ children }) {
  return (
    <aside className="relative box-border flex max-w-full min-w-0 flex-[1_1_360px] flex-col gap-10 overflow-hidden rounded-br-[96px] bg-ink px-[22px] pt-8 pb-14 text-white md:rounded-br-[160px] md:px-12 md:pt-10 md:pb-[72px]">
      <RootLines variant="side" opacity={0.16} className="-right-20 -bottom-10" />
      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <Brand />
        <LanguageSwitcher compact />
      </div>
      {children}
    </aside>
  );
}
