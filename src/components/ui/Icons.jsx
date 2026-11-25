// Íconos del proyecto, sobre Lucide (https://lucide.dev, licencia ISC, gratuita).
// Se conservan los nombres de siempre para no tocar las pantallas que los usan: aquí se decide qué ícono de Lucide
// corresponde a cada uno. Heredan el color con currentColor; tamaño por defecto 18 px y trazo 2.
import {
  ArrowRight as LArrowRight,
  Calendar as LCalendar,
  ChartLine,
  Check as LCheck,
  ChevronDown as LChevronDown,
  ChevronLeft as LChevronLeft,
  ChevronRight as LChevronRight,
  Clock as LClock,
  Container,
  Copy as LCopy,
  Download as LDownload,
  FileText,
  Lock as LLock,
  LogOut,
  Menu as LMenu,
  MessageSquare,
  Mic as LMic,
  PenLine,
  Phone as LPhone,
  Plus as LPlus,
  RefreshCw,
  Search as LSearch,
  Trash2,
  TriangleAlert,
  Video as LVideo,
  X,
} from 'lucide-react';

// Envoltorio común: decorativo por defecto (aria-hidden) y con el tamaño/trazo del diseño
function icono(Componente, trazo = 2) {
  const Icono = ({ size = 18, strokeWidth = trazo, ...resto }) => (
    <Componente aria-hidden="true" focusable="false" size={size} strokeWidth={strokeWidth} {...resto} />
  );
  Icono.displayName = Componente.displayName;
  return Icono;
}

export const ArrowRight = icono(LArrowRight);
export const Check = icono(LCheck, 2.6);
export const Menu = icono(LMenu);
export const Close = icono(X);
export const Board = icono(Container, 1.8);
export const Doc = icono(FileText, 1.8);
export const Pen = icono(PenLine, 1.8);
export const Chart = icono(ChartLine, 1.8);
export const Search = icono(LSearch);
export const Clock = icono(LClock);
export const Video = icono(LVideo);
export const Alert = icono(TriangleAlert);
export const Calendar = icono(LCalendar);
export const ChevronLeft = icono(LChevronLeft);
export const ChevronRight = icono(LChevronRight);
export const ChevronDown = icono(LChevronDown);
export const Download = icono(LDownload);
export const Refresh = icono(RefreshCw);
export const Phone = icono(LPhone, 1.8);
export const Mic = icono(LMic);
export const Message = icono(MessageSquare, 1.8);
export const Logout = icono(LogOut, 1.8);
export const Lock = icono(LLock, 1.8);
export const Plus = icono(LPlus, 2.2);
export const Trash = icono(Trash2, 1.8);
export const Copy = icono(LCopy, 1.8);
