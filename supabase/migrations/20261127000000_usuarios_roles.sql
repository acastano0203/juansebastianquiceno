-- Usuarios del panel y roles con permisos por módulo.
--
-- · roles: cada rol tiene la lista de módulos del panel a los que da acceso (permisos).
--   El rol "Administrador" es de sistema: tiene acceso a todo (también a módulos futuros) y no se edita ni se borra.
-- · perfiles: una fila por cada cuenta de Supabase Auth que puede entrar al panel (nombre, rol, activo).
--   Una cuenta sin perfil, o con el perfil inactivo, no ve nada.
-- · Las políticas de las tablas del panel dejan de aceptar "cualquier usuario autenticado" y pasan a exigir
--   el permiso del módulo correspondiente (tiene_permiso).
--
-- Crear, editar y borrar usuarios lo hace la función "usuarios-admin" (necesita la service role).
-- Los roles los gestiona directamente el panel, solo para administradores (políticas de abajo).

-- Módulos válidos (deben coincidir con src/config/permisos.js)
create or replace function public.modulos_panel() returns text[]
language sql immutable as $$
  select array['pipeline', 'briefs', 'propuestas', 'resultados', 'inscripciones', 'cubicaje', 'usuarios']
$$;

create table if not exists roles (
  id uuid primary key default gen_random_uuid(),
  creado_en timestamptz not null default now(),
  nombre text not null unique check (char_length(nombre) between 2 and 60),
  descripcion text check (char_length(descripcion) <= 200),
  permisos text[] not null default '{}' check (permisos <@ public.modulos_panel()),
  sistema boolean not null default false
);

create table if not exists perfiles (
  id uuid primary key references auth.users (id) on delete cascade,
  creado_en timestamptz not null default now(),
  nombre text not null check (char_length(nombre) between 2 and 120),
  correo text not null,
  rol_id uuid not null references roles (id) on delete restrict,
  activo boolean not null default true
);

create index if not exists perfiles_rol on perfiles (rol_id);

-- Solo puede existir un rol de sistema
create unique index if not exists roles_un_solo_sistema on roles (sistema) where sistema;

insert into roles (nombre, descripcion, permisos, sistema) values
  ('Administrador', 'Acceso total al panel, incluida la gestión de usuarios y roles.', public.modulos_panel(), true),
  ('Soporte nivel 1', 'Seguimiento de clientes: prospectos, briefs e inscripciones del curso.', array['pipeline', 'briefs', 'inscripciones'], false)
on conflict (nombre) do nothing;

-- ¿La persona que hace la consulta tiene acceso a este módulo?
create or replace function public.tiene_permiso(modulo text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from perfiles pf join roles r on r.id = pf.rol_id
    where pf.id = auth.uid() and pf.activo and (r.sistema or modulo = any (r.permisos))
  )
$$;

-- ¿Es administrador (rol de sistema) y está activo?
create or replace function public.es_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from perfiles pf join roles r on r.id = pf.rol_id
    where pf.id = auth.uid() and pf.activo and r.sistema
  )
$$;

revoke all on function public.tiene_permiso(text) from public, anon;
revoke all on function public.es_admin() from public, anon;
grant execute on function public.tiene_permiso(text) to authenticated;
grant execute on function public.es_admin() to authenticated;

-- Primer administrador: las cuentas que YA existen en Supabase Auth quedan como administradores.
-- Antes de aplicar, revisa en Authentication → Users que solo estén las cuentas de tu equipo.
insert into perfiles (id, nombre, correo, rol_id)
select u.id,
       coalesce(nullif(u.raw_user_meta_data ->> 'nombre', ''), split_part(u.email, '@', 1)),
       u.email,
       (select id from roles where sistema)
from auth.users u
where u.email is not null
on conflict (id) do nothing;

-- ── Políticas de roles y perfiles ──────────────────────────────────────────────
alter table roles enable row level security;
alter table perfiles enable row level security;

-- Cualquier cuenta con perfil activo ve los roles (el panel muestra el nombre del rol)
create policy "roles_leer" on roles for select to authenticated
  using (exists (select 1 from perfiles where id = auth.uid() and activo));
-- Solo administradores crean, editan y borran roles; el de sistema no se toca
create policy "roles_crear" on roles for insert to authenticated with check (public.es_admin() and not sistema);
create policy "roles_editar" on roles for update to authenticated using (public.es_admin() and not sistema) with check (public.es_admin() and not sistema);
create policy "roles_borrar" on roles for delete to authenticated using (public.es_admin() and not sistema);

-- Cada quien ve su propio perfil; quien gestiona usuarios ve todos. Nadie escribe directo (lo hace la función).
create policy "perfiles_leer" on perfiles for select to authenticated
  using (id = auth.uid() or public.tiene_permiso('usuarios'));

-- ── Las tablas del panel pasan a exigir el permiso del módulo ──────────────────
drop policy if exists "inscripciones_curso_leer_panel" on inscripciones_curso;
drop policy if exists "inscripciones_curso_actualizar_panel" on inscripciones_curso;
create policy "inscripciones_curso_leer_panel" on inscripciones_curso for select to authenticated using (public.tiene_permiso('inscripciones'));
create policy "inscripciones_curso_actualizar_panel" on inscripciones_curso for update to authenticated
  using (public.tiene_permiso('inscripciones')) with check (public.tiene_permiso('inscripciones'));

drop policy if exists "panel gestiona cubicajes" on cubicajes;
drop policy if exists "panel gestiona productos" on cubicaje_productos;
create policy "panel gestiona cubicajes" on cubicajes for all to authenticated
  using (public.tiene_permiso('cubicaje')) with check (public.tiene_permiso('cubicaje'));
create policy "panel gestiona productos" on cubicaje_productos for all to authenticated
  using (public.tiene_permiso('cubicaje')) with check (public.tiene_permiso('cubicaje'));

-- Agendas de llamada de diagnóstico: son prospectos
drop policy if exists "agendas_diagnostico_leer_panel" on agendas_diagnostico;
drop policy if exists "agendas_diagnostico_actualizar_panel" on agendas_diagnostico;
create policy "agendas_diagnostico_leer_panel" on agendas_diagnostico for select to authenticated using (public.tiene_permiso('pipeline'));
create policy "agendas_diagnostico_actualizar_panel" on agendas_diagnostico for update to authenticated
  using (public.tiene_permiso('pipeline')) with check (public.tiene_permiso('pipeline'));

-- Registros y agendas de la academia: van con las inscripciones del curso
drop policy if exists "academia_registros_leer_admin" on academia_registros;
drop policy if exists "academia_agendas_leer_admin" on academia_agendas;
create policy "academia_registros_leer_admin" on academia_registros for select to authenticated using (public.tiene_permiso('inscripciones'));
create policy "academia_agendas_leer_admin" on academia_agendas for select to authenticated using (public.tiene_permiso('inscripciones'));
