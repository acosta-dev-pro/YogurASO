-- 0004_product_extras.sql
-- Guarda en la base los campos del estudio de producto que hasta ahora solo vivian en el
-- navegador del administrador (localStorage). Sin estas columnas, el color fuerte, el precio
-- de 1 litro y la forma del letrero no llegaban a los celulares ni a otros equipos.
-- Es seguro ejecutarla varias veces (if not exists).

alter table public.products
  add column if not exists price_1l      numeric(10, 2) not null default 0 check (price_1l >= 0),
  add column if not exists color_dark    text check (color_dark is null or color_dark ~ '^#[0-9A-Fa-f]{6}$'),
  add column if not exists letrero_forma text not null default 'pill' check (letrero_forma in ('pill', 'rounded', 'flag'));

comment on column public.products.price_1l      is 'Precio de la presentacion de 1 litro; 0 = calcular automaticamente desde el de 500 ml.';
comment on column public.products.color_dark    is 'Color fuerte de marca del producto (#RRGGBB); de aqui se derivan las demas tonalidades.';
comment on column public.products.letrero_forma is 'Forma visual del letrero de la tarjeta.';
