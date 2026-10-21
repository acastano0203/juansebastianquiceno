// Banderas en SVG (los emoji de bandera no se ven en Windows)
export function FlagES({ className = '' }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 30 20" className={className}>
      <rect width="30" height="20" fill="#AA151B" />
      <rect y="5" width="30" height="10" fill="#F1BF00" />
    </svg>
  );
}

export function FlagUS({ className = '' }) {
  const stripes = [];
  for (let i = 0; i < 13; i += 2) stripes.push(<rect key={i} y={(i * 20) / 13} width="38" height={20 / 13} fill="#B22234" />);
  return (
    <svg aria-hidden="true" viewBox="0 0 38 20" preserveAspectRatio="none" className={className}>
      <rect width="38" height="20" fill="#FFFFFF" />
      {stripes}
      <rect width="15.2" height={(20 / 13) * 7} fill="#3C3B6E" />
    </svg>
  );
}
