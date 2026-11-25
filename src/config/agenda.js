// Agenda de la sesión diagnóstica (sección "Agenda una sesión" del pie de todas las páginas).
// Todo en hora de Colombia. Ajustar aquí el horario real del equipo: de él depende la promesa de contacto.

export const ZONA = 'America/Bogota';

// Horario en que un asesor puede cumplir "te contactamos en 15 a 20 minutos" (lunes a viernes)
export const ATENCION = { dias: [1, 2, 3, 4, 5], desde: 8, hasta: 18 };

// Minutos máximos de la promesa: en el panel, la cita marca "contactar antes de" con este plazo
export const MINUTOS_RESPUESTA = 20;

// Horarios que se ofrecen para la sesión de 30 a 45 minutos
export const HORAS_SESION = ['8:00', '9:30', '11:00', '14:00', '15:30', '17:00'];

// Temas de la sesión: son las áreas del diagnóstico del panel, así el brief y la propuesta funcionan igual
export const TEMAS = ['comex', 'estrategia', 'inversion', 'formacion'];

/** Fecha y hora "de pared" en Colombia, sin depender de la zona del navegador */
function partesBogota(fecha = new Date()) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', { timeZone: ZONA, weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })
      .formatToParts(fecha)
      .map((x) => [x.type, x.value]),
  );
  const dia = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[p.weekday];
  return { dia, hora: Number(p.hour) % 24, minuto: Number(p.minute), ymd: `${p.year}-${p.month}-${p.day}` };
}

/** ¿Hay un asesor disponible ahora mismo para cumplir los 15–20 minutos? */
export function enHorarioDeAtencion(fecha = new Date()) {
  const { dia, hora } = partesBogota(fecha);
  return ATENCION.dias.includes(dia) && hora >= ATENCION.desde && hora < ATENCION.hasta;
}

/** Próximo día hábil (como fecha a mediodía, para mostrarlo) después de hoy en Colombia */
export function proximoDiaHabil(fecha = new Date()) {
  const { ymd } = partesBogota(fecha);
  const d = new Date(ymd + 'T12:00:00');
  do d.setDate(d.getDate() + 1);
  while (!ATENCION.dias.includes(d.getDay()));
  return d;
}

/** Próximos n días hábiles para elegir la sesión, desde mañana */
export function diasDisponibles(n = 5, fecha = new Date()) {
  // Se trabaja con fechas a mediodía: sumar días nunca cruza la medianoche, sea cual sea la zona del navegador
  const d = proximoDiaHabil(fecha);
  const dias = [];
  while (dias.length < n) {
    if (ATENCION.dias.includes(d.getDay())) dias.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return dias;
}

/** Instante real (UTC) de una fecha y hora de Colombia. Colombia no tiene horario de verano: siempre UTC−5. */
export function instanteBogota(dia, horaTexto) {
  const [hh, mm] = horaTexto.split(':').map(Number);
  const ymd = `${dia.getFullYear()}-${String(dia.getMonth() + 1).padStart(2, '0')}-${String(dia.getDate()).padStart(2, '0')}`;
  return new Date(`${ymd}T${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:00-05:00`);
}
