import { HISTORICO } from '../../data/metrics';
import { useI18n } from '../../i18n/LanguageContext';

// Tendencia de 6 meses: leads y llamadas (líneas) + cierres (barras)
export default function TrendChart() {
  const { t } = useI18n();
  const meses = t('res.months');
  const { leads, llamadas, cierres } = HISTORICO;
  const X = (i) => 70 + i * 120;
  const Y = (v) => 260 - (v / 50) * 230;
  const last = meses.length - 1;
  const line = (arr) => arr.map((v, i) => X(i) + ',' + Y(v)).join(' ');

  return (
    <svg
      role="img"
      aria-label={t('res.chartAria', { l0: leads[0], l1: leads[last], c0: llamadas[0], c1: llamadas[last] })}
      viewBox="0 0 720 300"
      className="block h-auto w-full font-sans"
    >
      {[0, 10, 20, 30, 40, 50].map((v) => (
        <g key={v}>
          <line x1="44" x2="704" y1={Y(v)} y2={Y(v)} stroke="#E3EEE4" strokeWidth="1" />
          <text x="34" y={Y(v) + 4} textAnchor="end" fontSize="11" fill="#4A6364">
            {v}
          </text>
        </g>
      ))}
      {cierres.map((c, i) => (
        <g key={i}>
          <rect x={X(i) - 11} y={Y(c)} width="22" height={260 - Y(c)} rx="4" fill="#DDBD62">
            <title>{`${t('res.closes')}: ${c}`}</title>
          </rect>
          <text x={X(i)} y={Y(c) - 6} textAnchor="middle" fontSize="11" fontWeight="600" fill="#7A5A10">
            {c}
          </text>
        </g>
      ))}
      <polyline points={line(leads)} fill="none" stroke="#123638" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
      <polyline points={line(llamadas)} fill="none" stroke="#995837" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
      {meses.map((mes, i) => (
        <g key={i}>
          <circle cx={X(i)} cy={Y(leads[i])} r="5" fill="#FFFFFF" stroke="#123638" strokeWidth="2.5">
            <title>{`${mes}: ${leads[i]} leads`}</title>
          </circle>
          <circle cx={X(i)} cy={Y(llamadas[i])} r="5" fill="#FFFFFF" stroke="#995837" strokeWidth="2.5">
            <title>{`${mes}: ${llamadas[i]} ${t('res.calls').toLowerCase()}`}</title>
          </circle>
          <text x={X(i)} y="292" textAnchor="middle" fontSize="12" fill="#4A6364">
            {mes}
          </text>
        </g>
      ))}
      <text x={X(last) - 4} y={Y(leads[last]) - 12} textAnchor="end" fontSize="13" fontWeight="600" fill="#123638">
        {leads[last]}
      </text>
      <text x={X(last) - 4} y={Y(llamadas[last]) - 12} textAnchor="end" fontSize="13" fontWeight="600" fill="#995837">
        {llamadas[last]}
      </text>
    </svg>
  );
}
