-- =====================================================================
-- YoguraSo - Datos iniciales para Supabase
-- Salen de database/schema.sql (los 7 productos que ya existían).
-- No se inventó ningún dato: nombres, descripciones, precios, stock,
-- categorías e imágenes son los mismos del proyecto actual.
--
-- Pendiente de confirmar con el dueño:
--   * Las descripciones de "Natural Clásico" y "Griego Cremoso" dicen "alto en proteína"
--     y "bajo en azúcar". Vienen del esquema viejo; confirmar que son verdad antes de publicar.
--   * Las imágenes con i.ibb.co son externas. Se reemplazan por /products/*.png cuando
--     estén los PNG transparentes (ver docs/design/INVENTARIO_ASSETS.md).
--   * Sabores nuevos (Griego, Maracuyá, Cereza, Banano, Coco) no tienen fila: falta precio.
-- =====================================================================

insert into public.products
  (id, slug, name, description, price, stock, image_url, category, sort_order)
overriding system value
values
  (1, 'fresa-natural',   'Fresa Natural',   'Yogur natural con trozos reales de fresa fresca.',          5500, 50, 'https://i.ibb.co/BH7B6G99/Fresa.png',     'Con Frutas',   10),
  (2, 'pina-tropical',   'Piña Tropical',   'Yogur fresco con sabor tropical de piña natural.',          5500, 50, 'https://i.ibb.co/rRDHmrkm/Pi-a.png',      'Con Frutas',   20),
  (3, 'mora-silvestre',  'Mora Silvestre',  'Yogur dulce y ligeramente ácido de mora silvestre.',        5500, 50, 'https://i.ibb.co/MxMprvdq/Mora.png',      'Con Frutas',   30),
  (4, 'melocoton',       'Melocotón',       'Yogur delicado, suave y aromático de melocotón.',           5500, 50, 'https://i.ibb.co/HpDChbkb/Melocoton.png', 'Con Frutas',   40),
  (5, 'natural-clasico', 'Natural Clásico', 'Yogur puro sin saborizantes, alto en proteína.',             4800, 60, null,                                      'Natural',      50),
  (6, 'griego-cremoso',  'Griego Cremoso',  'Yogur griego espeso y cremoso, bajo en azúcar.',            6200, 40, null,                                      'Griego',       60),
  (7, 'sin-lactosa',     'Sin Lactosa',     'Yogur especial para intolerantes a la lactosa.',            6500, 30, null,                                      'Sin Lactosa',  70)
on conflict (id) do nothing;

-- Deja la secuencia después del id 7 para que el próximo insert no choque.
select setval(pg_get_serial_sequence('public.products', 'id'), (select max(id) from public.products));

-- ---------------------------------------------------------------------
-- Administrador
-- El administrador de desarrollo del esquema viejo (admin@yoguraso.com con clave conocida)
-- NO se copia. Para crear el administrador real:
--   1. En Supabase > Authentication > Users, crea la cuenta con una clave fuerte.
--   2. Ejecuta esto con SU correo (en el SQL Editor, donde auth.uid() es nulo y se permite):
--
--   update public.profiles
--      set role = 'admin'
--    where id = (select id from auth.users where email = 'CORREO_DEL_ADMIN');
-- ---------------------------------------------------------------------
