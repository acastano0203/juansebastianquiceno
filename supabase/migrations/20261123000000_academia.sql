-- Academia: registros de la masterclass gratis y llamadas de 15 minutos agendadas desde /academia.
-- El público solo puede insertar; leer queda para usuarios autenticados (panel).

create table if not exists academia_registros (
  id uuid primary key default gen_random_uuid(),
  creado_en timestamptz not null default now(),
  nombre text not null check (char_length(nombre) between 1 and 120),
  indicativo text not null,
  whatsapp text not null check (whatsapp ~ '^[0-9]{7,12}$'),
  correo text not null check (correo ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  pais text not null,
  perfil text not null,
  volumen text not null,
  exporto text,
  origen text,
  idioma text
);

create table if not exists academia_agendas (
  id uuid primary key default gen_random_uuid(),
  creado_en timestamptz not null default now(),
  nombre text not null check (char_length(nombre) between 1 and 120),
  whatsapp text not null,
  plan text not null check (plan in ('pregrabado', 'vivo', 'pro')),
  fecha date not null,
  hora text not null,
  origen text
);

alter table academia_registros enable row level security;
alter table academia_agendas enable row level security;

create policy "academia_registros_insertar_publico" on academia_registros for insert to anon, authenticated with check (true);
create policy "academia_registros_leer_admin" on academia_registros for select to authenticated using (true);
create policy "academia_agendas_insertar_publico" on academia_agendas for insert to anon, authenticated with check (true);
create policy "academia_agendas_leer_admin" on academia_agendas for select to authenticated using (true);
