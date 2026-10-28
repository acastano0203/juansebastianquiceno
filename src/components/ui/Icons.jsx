// Íconos de trazo del diseño. Heredan el color con currentColor.
function Svg({ size = 18, strokeWidth = 2, children, className, style }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
    >
      {children}
    </svg>
  );
}

export const ArrowRight = (p) => (
  <Svg {...p}>
    <path d="M5 12h14" />
    <path d="M13 6l6 6-6 6" />
  </Svg>
);
export const Check = (p) => (
  <Svg strokeWidth={2.6} {...p}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </Svg>
);
export const Menu = (p) => (
  <Svg {...p}>
    <path d="M4 8h16" />
    <path d="M4 16h16" />
  </Svg>
);
export const Close = (p) => (
  <Svg {...p}>
    <path d="M6 6l12 12" />
    <path d="M18 6L6 18" />
  </Svg>
);
export const Board = (p) => (
  <Svg strokeWidth={1.8} {...p}>
    <rect x="3" y="4" width="5" height="16" rx="1.5" />
    <rect x="10" y="4" width="5" height="11" rx="1.5" />
    <rect x="17" y="4" width="4" height="7" rx="1.5" />
  </Svg>
);
export const Doc = (p) => (
  <Svg strokeWidth={1.8} {...p}>
    <path d="M6 3h9l4 4v14H6z" />
    <path d="M9 11h7" />
    <path d="M9 15h7" />
  </Svg>
);
export const Pen = (p) => (
  <Svg strokeWidth={1.8} {...p}>
    <path d="M4 20h4L19 9l-4-4L4 16z" />
    <path d="M13 7l4 4" />
  </Svg>
);
export const Chart = (p) => (
  <Svg strokeWidth={1.8} {...p}>
    <path d="M4 19V5" />
    <path d="M4 19h16" />
    <path d="M7 15l4-4 3 3 5-6" />
  </Svg>
);
export const Search = (p) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M20 20l-4-4" />
  </Svg>
);
export const Clock = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </Svg>
);
export const Video = (p) => (
  <Svg {...p}>
    <rect x="3" y="6" width="12" height="12" rx="2.5" />
    <path d="M15 10l6-3v10l-6-3" />
  </Svg>
);
export const Alert = (p) => (
  <Svg {...p}>
    <path d="M12 3l9.5 17h-19z" />
    <path d="M12 10v4" />
    <path d="M12 17.5v.01" />
  </Svg>
);
export const Calendar = (p) => (
  <Svg {...p}>
    <rect x="3.5" y="5" width="17" height="15" rx="3" />
    <path d="M3.5 10h17" />
    <path d="M8 3v4" />
    <path d="M16 3v4" />
  </Svg>
);
export const ChevronLeft = (p) => (
  <Svg {...p}>
    <path d="M15 6l-6 6 6 6" />
  </Svg>
);
export const ChevronRight = (p) => (
  <Svg {...p}>
    <path d="M9 6l6 6-6 6" />
  </Svg>
);
export const ChevronDown = (p) => (
  <Svg {...p}>
    <path d="M6 9l6 6 6-6" />
  </Svg>
);
export const Download = (p) => (
  <Svg {...p}>
    <path d="M12 4v11" />
    <path d="M7 10l5 5 5-5" />
    <path d="M5 20h14" />
  </Svg>
);
export const Refresh = (p) => (
  <Svg {...p}>
    <path d="M20 12a8 8 0 1 1-2.3-5.6" />
    <path d="M20 4v5h-5" />
  </Svg>
);
export const Phone = (p) => (
  <Svg strokeWidth={1.8} {...p}>
    <path d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />
  </Svg>
);
export const Mic = (p) => (
  <Svg {...p}>
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path d="M5 11a7 7 0 0 0 14 0" />
    <path d="M12 18v3" />
  </Svg>
);
export const Message = (p) => (
  <Svg strokeWidth={1.8} {...p}>
    <path d="M4 5h16v11H9l-5 4z" />
  </Svg>
);
export const Logout = (p) => (
  <Svg strokeWidth={1.8} {...p}>
    <path d="M15 4h4v16h-4" />
    <path d="M10 8l-4 4 4 4" />
    <path d="M6 12h10" />
  </Svg>
);
export const Lock = (p) => (
  <Svg strokeWidth={1.8} {...p}>
    <rect x="5" y="10.5" width="14" height="10" rx="2.5" />
    <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
  </Svg>
);
export const Plus = (p) => (
  <Svg strokeWidth={2.2} {...p}>
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </Svg>
);
export const Trash = (p) => (
  <Svg strokeWidth={1.8} {...p}>
    <path d="M4 7h16" />
    <path d="M9 7V4h6v3" />
    <path d="M6 7l1 13h10l1-13" />
  </Svg>
);
export const Copy = (p) => (
  <Svg strokeWidth={1.8} {...p}>
    <rect x="8" y="8" width="12" height="12" rx="2" />
    <path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" />
  </Svg>
);
