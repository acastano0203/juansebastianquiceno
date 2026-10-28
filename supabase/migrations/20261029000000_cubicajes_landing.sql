-- Cubicajes que los clientes generan desde la landing: nuevo origen y datos de contacto.

alter table cubicajes drop constraint cubicajes_origen_check;
alter table cubicajes add constraint cubicajes_origen_check check (origen in ('admin', 'diagnostico', 'landing'));

-- Quién lo generó (nombre, whatsapp, correo). Se guarda aquí porque el cliente no tiene cuenta.
alter table cubicajes add column contacto jsonb;
