-- Inscripciones al Curso de Exportación de Café pagadas con Stripe.
-- Flujo: el formulario de la landing llama a la función "pago-curso", que crea la fila (pendiente) y la sesión de
-- Stripe Checkout; el webhook de Stripe ("stripe-webhook") la marca como pagada, abandonada o reembolsada.
-- El público NO escribe directo en la tabla: solo las funciones (con la service role). El panel lee y actualiza.

create table if not exists inscripciones_curso (
  id uuid primary key default gen_random_uuid(),
  creado_en timestamptz not null default now(),
  nombre text not null check (char_length(nombre) between 2 and 120),
  correo text not null check (correo ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  telefono text not null check (telefono ~ '^\+?[0-9]{7,15}$'),
  direccion text not null check (char_length(direccion) between 4 and 200),
  ciudad text not null check (char_length(ciudad) between 2 and 80),
  pais text not null check (char_length(pais) between 2 and 60),
  -- pendiente: llenó el formulario y fue a Stripe · pagado · abandonado: la sesión de pago venció sin pagar
  -- reembolsado · acceso_enviado: el equipo ya le dio acceso al curso (lo marca el panel)
  estado text not null default 'pendiente' check (estado in ('pendiente', 'pagado', 'abandonado', 'reembolsado', 'acceso_enviado')),
  stripe_session_id text unique,
  stripe_payment_intent text,
  monto numeric,
  moneda text,
  pagado_en timestamptz,
  origen text,
  idioma text,
  notas text
);

create index if not exists inscripciones_curso_creado on inscripciones_curso (creado_en desc);
create index if not exists inscripciones_curso_estado on inscripciones_curso (estado);

alter table inscripciones_curso enable row level security;

create policy "inscripciones_curso_leer_panel" on inscripciones_curso for select to authenticated using (true);
create policy "inscripciones_curso_actualizar_panel" on inscripciones_curso for update to authenticated using (true) with check (true);
