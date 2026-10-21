// Trazos de raíces decorativos (motivo "Desde la raíz" del diseño).
const VARIANTS = {
  hero: {
    w: 720,
    h: 520,
    paths: [
      ['M360 0 C360 120 340 180 300 240 C250 310 160 330 60 420', 1.5],
      ['M300 240 C320 320 300 400 240 520', 1.5],
      ['M360 0 C370 140 420 220 500 280 C580 340 620 420 640 520', 1.5],
      ['M500 280 C470 360 480 440 520 520', 1.5],
      ['M200 320 C160 380 150 450 170 520', 1],
      ['M430 230 C460 300 440 360 400 420', 1],
    ],
  },
  side: {
    w: 420,
    h: 360,
    paths: [
      ['M210 0 C210 90 190 140 150 190 C110 240 60 270 0 330', 1.5],
      ['M210 0 C220 100 260 160 320 210 C370 250 400 300 410 360', 1.5],
      ['M150 190 C170 250 160 300 130 360', 1.2],
      ['M320 210 C300 270 300 320 320 360', 1.2],
    ],
  },
  small: {
    w: 360,
    h: 300,
    paths: [
      ['M180 0 C180 80 160 120 120 160 C80 200 40 230 0 300', 1.5],
      ['M180 0 C190 90 230 140 280 180 C320 210 345 250 360 300', 1.5],
      ['M120 160 C135 210 130 250 110 300', 1.2],
    ],
  },
};

export default function RootLines({ variant = 'hero', className = '', opacity = 0.2 }) {
  const v = VARIANTS[variant];
  return (
    <svg
      aria-hidden="true"
      width={v.w}
      height={v.h}
      viewBox={`0 0 ${v.w} ${v.h}`}
      fill="none"
      className={'pointer-events-none absolute ' + className}
      style={{ opacity }}
    >
      {v.paths.map(([d, sw]) => (
        <path key={d} d={d} stroke="#B8D8B8" strokeWidth={sw} strokeLinecap="round" />
      ))}
    </svg>
  );
}
