-- Sesiones diagnósticas agendadas desde la sección "Agenda una sesión" del pie de todas las páginas.
-- Igual que la Academia: el público solo puede insertar; leer y actualizar queda para usuarios autenticados (panel).

create table if not exists agendas_diagnostico (
  id uuid primary key default gen_random_uuid(),
  creado_en timestamptz not null default now(),
  nombre text not null check (char_length(nombre) between 1 and 120),
  whatsapp text not null check (whatsapp ~ '^\+?[0-9]{9,15}$'),
  correo text not null check (correo ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  tema text not null check (tema in ('comex', 'estrategia', 'inversion', 'formacion')),
  cita timestamptz not null,
  -- Hasta cuándo se prometió el primer contacto (15–20 min en horario de atención)
  contactar_antes timestamptz not null,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'contactado', 'realizada', 'cancelada')),
  pagina text,
  origen text,
  idioma text
);

create index if not exists agendas_diagnostico_cita on agendas_diagnostico (cita);

alter table agendas_diagnostico enable row level security;

create policy "agendas_diagnostico_insertar_publico" on agendas_diagnostico for insert to anon, authenticated with check (estado = 'pendiente');
create policy "agendas_diagnostico_leer_panel" on agendas_diagnostico for select to authenticated using (true);
create policy "agendas_diagnostico_actualizar_panel" on agendas_diagnostico for update to authenticated using (true) with check (true);
