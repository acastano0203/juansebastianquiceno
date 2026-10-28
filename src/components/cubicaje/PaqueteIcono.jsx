// Íconos de tipo de paquete del diseño
const TRAZOS = {
  box: ['M12 3l8 4.5v9L12 21l-8-4.5v-9z', 'M4 7.5l8 4.5 8-4.5', 'M12 12v9'],
  bigbag: ['M6 7h12l1 12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z', 'M8 7V4', 'M16 7V4'],
  sack: ['M7 6c0-2 10-2 10 0l2 13c0 2-14 2-14 0z', 'M9 4.5L12 7l3-2.5', 'M8 13h8'],
  barrel: ['M6 4h12v16H6z', 'M6 9h12', 'M6 15h12'],
  roll: ['M8 5h10v14H8', 'M8 5a3 7 0 1 0 0 14a3 7 0 1 0 0-14', 'M8 11v2'],
  pipe: ['M4 8h16', 'M4 12h16', 'M4 16h16'],
  bulk: ['M3 19h18', 'M5 19l4-7 3 4 2-3 5 6', 'M9 9v.01'],
};

export default function PaqueteIcono({ tipo, size = 24 }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {(TRAZOS[tipo] || TRAZOS.box).map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

export const Cubo = (p) => <PaqueteIcono tipo="box" size={18} {...p} />;
