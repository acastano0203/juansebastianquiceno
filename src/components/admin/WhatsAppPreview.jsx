import { useEffect, useRef } from 'react';
import { AREAS } from '../../data/catalog';
import { DAY_MS, fechaLarga, hora } from '../../lib/format';
import { useI18n } from '../../i18n/LanguageContext';
import { Close, Mic, Phone } from '../ui/Icons';

function Bubble({ out, children, time }) {
  return (
    <div
      className={
        'flex flex-col gap-1.5 text-sm leading-[1.45] shadow-[0_1px_1px_rgba(0,0,0,.08)] ' +
        (out ? 'max-w-[260px] self-end rounded-[16px_4px_16px_16px] bg-[#DCEFD9] px-3 pt-2 pb-1.5' : 'max-w-[300px] self-start rounded-[4px_16px_16px_16px] bg-white px-3 pt-2.5 pb-1.5')
      }
    >
      {children}
      <span className="self-end text-[11px] text-[#667781]">{time}</span>
    </div>
  );
}

function QuickReplies({ items }) {
  return (
    <div className="flex w-[300px] gap-1.5 self-start">
      {items.map((t) => (
        <span key={t} className="flex min-h-10 flex-1 items-center justify-center rounded-[10px] bg-white text-sm font-semibold text-ink">
          {t}
        </span>
      ))}
    </div>
  );
}

function DayTag({ children }) {
  return <span className="self-center rounded-lg bg-white px-3 py-[5px] text-xs text-[#54656F]">{children}</span>;
}

// Vista previa de los mensajes automáticos de confirmación y recordatorio
export function WhatsAppPhone({ lead }) {
  const cita = new Date(lead.cita);
  const enviado = new Date(lead.activity.find((a) => a.k === 'agendo')?.at || lead.createdAt);
  const recordatorio = new Date(cita.getTime() - DAY_MS);
  recordatorio.setHours(9, 0, 0, 0);
  const first = lead.nombre.split(' ')[0];
  const area = AREAS[lead.answers.area] || AREAS.comex;
  const confirmo = lead.activity.some((a) => a.k === 'confirmo');

  return (
    <div className="flex h-[844px] max-h-[calc(100vh-80px)] w-[390px] max-w-full flex-col overflow-hidden rounded-[28px] bg-[#EFEAE2] text-[#111B21]">
      <header className="flex items-center gap-2.5 bg-ink px-3 py-3.5 text-white">
        <span className="flex size-10 items-center justify-center rounded-full bg-gold text-sm font-semibold text-ink">JS</span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-base font-semibold">Juan Sebastián Quiceno</span>
          <span className="text-xs text-sage">Cuenta de empresa</span>
        </span>
        <Phone size={22} />
      </header>

      <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-3 py-3.5">
        <DayTag>{fechaLarga(enviado)}</DayTag>
        <Bubble time={hora(new Date(enviado.getTime() + 60000))}>
          <span>Hola, {first}. Soy Juan Sebastián Quiceno. Tu llamada de diagnóstico quedó agendada:</span>
          <span className="flex flex-col rounded-[10px] bg-mist px-2.5 py-2 text-ink">
            <strong className="font-semibold">{fechaLarga(cita)}</strong>
            <span>{hora(cita)} (hora de Colombia)</span>
            <span>30 minutos · Google Meet</span>
          </span>
          <span>Para aprovechar el tiempo, ten a mano {area.preparar}</span>
        </Bubble>
        <QuickReplies items={['Confirmar asistencia', 'Reprogramar']} />
        {confirmo && (
          <Bubble out time={hora(new Date(enviado.getTime() + 8 * 60000)) + ' ✓✓'}>
            <span>Confirmar asistencia</span>
          </Bubble>
        )}

        <DayTag>{fechaLarga(recordatorio)}</DayTag>
        <Bubble time={hora(recordatorio)}>
          <span className="text-xs font-semibold text-clay">Recordatorio</span>
          <span>
            {first}, te recuerdo nuestra llamada de mañana, <strong className="font-semibold">{fechaLarga(cita).toLowerCase()} a las {hora(cita)}</strong>
          </span>
          <span>Enlace: [enlace de Google Meet]</span>
          <span>Si algo cambia, responde este mensaje y te comparto otros horarios.</span>
        </Bubble>
        <QuickReplies items={['Ahí estaré', 'Reprogramar']} />
      </div>

      <div className="flex items-center gap-2 px-2.5 pt-2 pb-3.5">
        <span className="flex min-h-[46px] flex-1 items-center rounded-full bg-white px-4 text-[15px] text-[#667781]">Mensaje</span>
        <span className="flex size-[46px] items-center justify-center rounded-full bg-ink text-white">
          <Mic size={20} />
        </span>
      </div>
    </div>
  );
}

export default function WhatsAppDialog({ lead, onClose }) {
  const { t } = useI18n();
  const ref = useRef();
  useEffect(() => {
    const d = ref.current;
    d.showModal();
    const close = () => onClose();
    d.addEventListener('close', close);
    return () => d.removeEventListener('close', close);
  }, [onClose]);

  return (
    <dialog
      ref={ref}
      aria-label={t('wa.dialog')}
      className="m-auto border-0 bg-transparent p-0 backdrop:bg-ink/60"
      onClick={(e) => {
        if (e.target === ref.current) ref.current.close();
      }}
    >
      <div className="relative">
        <button
          type="button"
          aria-label={t('wa.close')}
          onClick={() => ref.current.close()}
          className="absolute top-3 right-3 z-10 flex size-11 cursor-pointer items-center justify-center rounded-full border-0 bg-ink-2 text-white"
        >
          <Close size={18} />
        </button>
        <WhatsAppPhone lead={lead} />
        <p className="m-0 mt-2 text-center text-xs text-white">{t('wa.note')}</p>
      </div>
    </dialog>
  );
}
