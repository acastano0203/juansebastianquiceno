-- Módulo de cubicaje: cubicajes, sus productos y el control de abuso del endpoint público.

create extension if not exists pgcrypto;

-- Tipos de paquete: por ahora solo 'box' se habilita en la app; los demás quedan listos para después
create type tipo_paquete as enum ('box', 'bigbag', 'sack', 'barrel', 'roll', 'pipe', 'bulk');

create table cubicajes (
  id              uuid primary key default gen_random_uuid(),
  nombre          text not null check (char_length(nombre) between 1 and 120),
  tipo_contenedor text not null check (tipo_contenedor in ('20', '40', '40HC')),
  origen          text not null default 'admin' check (origen in ('admin', 'diagnostico')),
  -- Id del prospecto del diagnóstico (texto: hoy los prospectos se generan en el frontend)
  prospecto_id    text,
  estado          text not null default 'borrador' check (estado in ('borrador', 'listo', 'excede')),
  -- Resultado calculado: contenedor usado, posiciones, cajas que no cupieron y métricas
  resultado       jsonb,
  -- Copias de las métricas para el listado y el tablero sin abrir el JSON
  ocupacion       numeric(6, 2),
  peso_total      numeric(12, 2),
  cajas_total     integer,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index cubicajes_created_at_idx on cubicajes (created_at desc);
create index cubicajes_origen_idx on cubicajes (origen);
create index cubicajes_prospecto_idx on cubicajes (prospecto_id) where prospecto_id is not null;

create table cubicaje_productos (
  id                 uuid primary key default gen_random_uuid(),
  cubicaje_id        uuid not null references cubicajes (id) on delete cascade,
  orden              integer not null default 0,
  nombre             text not null check (char_length(nombre) between 1 and 80),
  tipo_paquete       tipo_paquete not null default 'box',
  largo              numeric(8, 2) not null check (largo > 0),
  ancho              numeric(8, 2) not null check (ancho > 0),
  alto               numeric(8, 2) not null check (alto > 0),
  peso               numeric(10, 3) not null check (peso > 0),
  cantidad           integer not null default 1 check (cantidad > 0),
  color              text not null default '#DDBD62' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  limita_rot_x       boolean not null default false,
  limita_rot_z       boolean not null default false,
  limite_peso_activo boolean not null default false,
  -- Kg que soporta encima con la cara superior/inferior arriba y con la frontal/posterior arriba
  carga_superior     numeric(10, 2) check (carga_superior >= 0),
  carga_frontal      numeric(10, 2) check (carga_frontal >= 0)
);

create index cubicaje_productos_cubicaje_idx on cubicaje_productos (cubicaje_id, orden);

create function set_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger cubicajes_updated_at before update on cubicajes
  for each row execute function set_updated_at();

-- Rate limit del endpoint público (lo usa solo la Edge Function con la service role)
create table rate_limits (
  clave   text not null,
  ventana timestamptz not null,
  conteo  integer not null default 0,
  primary key (clave, ventana)
);

-- Suma un intento y dice si sigue dentro del límite. Atómico frente a peticiones simultáneas.
create function rate_limit_hit(p_clave text, p_segundos integer, p_max integer) returns boolean
language plpgsql security definer set search_path = public as $$
declare
  v_ventana timestamptz := to_timestamp(floor(extract(epoch from now()) / p_segundos) * p_segundos);
  v_conteo integer;
begin
  insert into rate_limits (clave, ventana, conteo) values (p_clave, v_ventana, 1)
  on conflict (clave, ventana) do update set conteo = rate_limits.conteo + 1
  returning conteo into v_conteo;
  delete from rate_limits where ventana < now() - interval '1 day';
  return v_conteo <= p_max;
end;
$$;

revoke all on function rate_limit_hit(text, integer, integer) from public, anon, authenticated;

-- Seguridad: el público no lee ni escribe directo. El panel entra autenticado;
-- el diagnóstico guarda a través de la Edge Function (service role).
alter table cubicajes enable row level security;
alter table cubicaje_productos enable row level security;
alter table rate_limits enable row level security;

create policy "panel gestiona cubicajes" on cubicajes
  for all to authenticated using (true) with check (true);
create policy "panel gestiona productos" on cubicaje_productos
  for all to authenticated using (true) with check (true);
