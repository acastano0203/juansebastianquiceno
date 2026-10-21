export function Stat({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-[18px_18px_18px_4px] bg-white px-[18px] py-3">
      <span className="text-xs text-muted">{label}</span>
      <span className="text-xl font-semibold">{value}</span>
    </div>
  );
}

export default function PageHeader({ eyebrow, title, children }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-5">
      <div className="flex flex-col gap-1.5">
        {eyebrow && <div className="text-sm text-muted">{eyebrow}</div>}
        <h1 className="m-0 font-serif text-[36px] leading-[1.1] font-semibold md:text-[40px]">{title}</h1>
      </div>
      {children && <div className="flex flex-wrap items-center gap-3">{children}</div>}
    </div>
  );
}
