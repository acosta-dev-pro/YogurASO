-- =====================================================================
-- YoguraSo - Esquema inicial para Supabase (PostgreSQL)
-- Traducido de database/schema.sql y las 3 migraciones de database/.
--
-- Qué cambia respecto al esquema de Node:
--   usuarios              -> auth.users (lo maneja Supabase) + public.profiles
--   tokens_recuperacion   -> desaparece: Supabase Auth guarda y vence los códigos
--   productos             -> public.products (columnas en inglés, igual al modelo Product del plan)
--   carrito, carrito_items, pedidos, detalles_pedido
--                         -> carts, cart_items, orders, order_items (hoy no se usan; la compra va por WhatsApp)
--   bcrypt y JWT propios  -> desaparecen
--
-- Cómo aplicarlo: Supabase CLI (`supabase db push`) o pegarlo en SQL Editor.
-- NO lo ejecutes contra la base de datos local de Node: es solo para Supabase.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Funciones comunes
-- ---------------------------------------------------------------------

-- Mantiene updated_at al día (reemplaza update_updated_at_column del esquema viejo).
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- 2. Perfiles (reemplaza la tabla usuarios)
--    La clave y el correo viven en auth.users. Aquí solo van los datos de la tienda.
-- ---------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text,
  first_name  text not null default '' check (char_length(first_name) <= 100),
  last_name   text not null default '' check (char_length(last_name)  <= 100),
  phone       text check (phone is null or char_length(phone) <= 20),
  role        text not null default 'customer' check (role in ('customer', 'admin')),
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table  public.profiles is 'Datos de cada persona registrada. El correo real vive en auth.users; aquí hay una copia para que el panel admin pueda listarlo.';
comment on column public.profiles.role is 'customer o admin. Solo un admin (o SQL directo) puede cambiarlo.';
comment on column public.profiles.is_active is 'false = cuenta desactivada desde el panel (antes usuarios.activo).';

create index idx_profiles_role on public.profiles (role) where role = 'admin';

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ¿La persona que hace la consulta es administradora activa?
-- SECURITY DEFINER para poder leer profiles sin entrar en bucle con su propia RLS.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'admin'
      and p.is_active
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- Crea el perfil automáticamente cuando alguien se registra en Auth.
-- El rol SIEMPRE nace como 'customer'; nunca se lee de los metadatos que manda el navegador.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  full_name text := coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', '');
  given     text := coalesce(new.raw_user_meta_data ->> 'first_name', new.raw_user_meta_data ->> 'given_name', '');
  family    text := coalesce(new.raw_user_meta_data ->> 'last_name',  new.raw_user_meta_data ->> 'family_name', '');
begin
  if given = '' and full_name <> '' then
    given  := split_part(full_name, ' ', 1);
    family := nullif(btrim(substr(full_name, length(given) + 1)), '');
  end if;

  insert into public.profiles (id, email, first_name, last_name, phone)
  values (
    new.id,
    new.email,
    left(given, 100),
    left(coalesce(family, ''), 100),
    left(nullif(new.raw_user_meta_data ->> 'phone', ''), 20)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Si la persona cambia su correo en Auth, la copia de profiles se actualiza sola.
create or replace function public.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row when (old.email is distinct from new.email)
  execute function public.handle_user_email_change();

-- Impide que una cliente se suba el rol a admin o se reactive sola, y que un admin se desactive a sí mismo.
create or replace function public.protect_profile_privileged_columns()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- auth.uid() es null cuando la sentencia viene del SQL Editor o de una migración.
  if (select auth.uid()) is not null and not public.is_admin() then
    if new.role is distinct from old.role or new.is_active is distinct from old.is_active then
      raise exception 'No tienes permiso para cambiar el rol ni el estado de la cuenta'
        using errcode = '42501';
    end if;
    if new.email is distinct from old.email then
      raise exception 'El correo se cambia desde Auth, no desde el perfil'
        using errcode = '42501';
    end if;
  elsif (select auth.uid()) is not null and new.id = (select auth.uid()) and new.is_active = false then
    -- Igual que el backend viejo: un admin no puede desactivar su propia cuenta.
    raise exception 'No puedes desactivar tu propia cuenta' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger trg_profiles_protect
  before update on public.profiles
  for each row execute function public.protect_profile_privileged_columns();

-- ---------------------------------------------------------------------
-- 3. Productos (reemplaza productos)
--    Equivalencias: nombre->name, descripcion->description, precio->price,
--    imagen_url->image_url, categoria->category, activo->is_active,
--    letrero->badge_text, letrero_tipo->badge_type, descuento->discount_percent,
--    color_fondo->background_color
-- ---------------------------------------------------------------------
create table public.products (
  id                bigint generated by default as identity primary key,
  slug              text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name              text not null check (char_length(btrim(name)) between 1 and 150),
  flavor            text,
  description       text,
  short_description text,
  price             numeric(10, 2) not null check (price >= 0),
  stock             integer not null default 0 check (stock >= 0),
  volume            text not null default '500 ml',
  image_url         text,
  background_color  text not null default '#FFF8F4' check (background_color ~ '^#[0-9A-Fa-f]{6}$'),
  accent_color      text check (accent_color is null or accent_color ~ '^#[0-9A-Fa-f]{6}$'),
  category          text not null default 'Yogur',
  is_active         boolean not null default true,
  is_featured       boolean not null default false,
  sort_order        integer not null default 0,
  badge_text        text check (badge_text is null or char_length(badge_text) <= 40),
  badge_type        text check (badge_type is null or badge_type in ('nuevo', 'oferta', 'descuento', 'destacado')),
  discount_percent  integer not null default 0 check (discount_percent between 0 and 80),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on table public.products is 'Catálogo. Los sabores son filas, no código.';
comment on column public.products.image_url is 'URL pública (Storage o /products/...). Hoy algunas filas apuntan a i.ibb.co.';

create index idx_products_active_sort on public.products (is_active, sort_order, id desc);
create index idx_products_category    on public.products (category);
create index idx_products_featured    on public.products (sort_order) where is_featured and is_active;

create trigger trg_products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 4. Carrito en base de datos (reemplaza carrito y carrito_items)
--    Hoy NO se usa: el carrito vive en localStorage. Se deja por paridad con el esquema viejo.
-- ---------------------------------------------------------------------
create table public.carts (
  id          bigint generated by default as identity primary key,
  user_id     uuid not null unique references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger trg_carts_updated_at
  before update on public.carts
  for each row execute function public.set_updated_at();

create table public.cart_items (
  id          bigint generated by default as identity primary key,
  cart_id     bigint not null references public.carts (id) on delete cascade,
  product_id  bigint not null references public.products (id) on delete cascade,
  quantity    integer not null default 1 check (quantity > 0),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (cart_id, product_id)
);

create index idx_cart_items_cart    on public.cart_items (cart_id);
create index idx_cart_items_product on public.cart_items (product_id);

create trigger trg_cart_items_updated_at
  before update on public.cart_items
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 5. Pedidos (reemplaza pedidos y detalles_pedido)
--    Hoy NO se usan: el pedido sale por WhatsApp. Solo el admin escribe aquí.
-- ---------------------------------------------------------------------
create table public.orders (
  id              bigint generated by default as identity primary key,
  user_id         uuid not null references public.profiles (id),
  order_number    text not null unique,
  status          text not null default 'pendiente'
                  check (status in ('pendiente', 'en_proceso', 'enviado', 'completado', 'cancelado')),
  shipping_name   text,
  shipping_email  text,
  shipping_phone  text,
  address         text,
  city            text,
  postal_code     text,
  subtotal        numeric(12, 2) not null check (subtotal >= 0),
  shipping_cost   numeric(10, 2) not null default 5000 check (shipping_cost >= 0),
  total           numeric(12, 2) not null check (total >= 0),
  payment_method  text,
  payment_status  text not null default 'pendiente'
                  check (payment_status in ('pendiente', 'pagado', 'fallido', 'reembolsado')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_orders_user   on public.orders (user_id);
create index idx_orders_status on public.orders (status);

create trigger trg_orders_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

create table public.order_items (
  id            bigint generated by default as identity primary key,
  order_id      bigint not null references public.orders (id) on delete cascade,
  product_id    bigint references public.products (id) on delete set null,
  product_name  text not null,
  unit_price    numeric(10, 2) not null check (unit_price >= 0),
  quantity      integer not null check (quantity > 0),
  subtotal      numeric(12, 2) not null check (subtotal >= 0)
);

create index idx_order_items_order   on public.order_items (order_id);
create index idx_order_items_product on public.order_items (product_id);

-- ---------------------------------------------------------------------
-- 6. Row Level Security
-- ---------------------------------------------------------------------
alter table public.profiles    enable row level security;
alter table public.products    enable row level security;
alter table public.carts       enable row level security;
alter table public.cart_items  enable row level security;
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;

-- Permisos de tabla (RLS decide después qué filas se ven).
grant select                         on public.products    to anon, authenticated;
grant insert, update, delete         on public.products    to authenticated;
grant select, update                 on public.profiles    to authenticated;
grant select, insert, update, delete on public.carts       to authenticated;
grant select, insert, update, delete on public.cart_items  to authenticated;
grant select, insert, update         on public.orders      to authenticated;
grant select, insert, update, delete on public.order_items to authenticated;

-- profiles ------------------------------------------------------------
create policy "profiles: cada persona ve el suyo"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()));

create policy "profiles: admin ve todos"
  on public.profiles for select to authenticated
  using ((select public.is_admin()));

create policy "profiles: cada persona edita el suyo"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy "profiles: admin edita todos"
  on public.profiles for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));
-- No hay policy de insert ni delete: el perfil lo crea el trigger y se borra con la cuenta de Auth.

-- products ------------------------------------------------------------
create policy "products: lectura pública de los publicados"
  on public.products for select to anon, authenticated
  using (is_active);

create policy "products: admin ve todos"
  on public.products for select to authenticated
  using ((select public.is_admin()));

create policy "products: admin crea"
  on public.products for insert to authenticated
  with check ((select public.is_admin()));

create policy "products: admin edita"
  on public.products for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "products: admin borra"
  on public.products for delete to authenticated
  using ((select public.is_admin()));

-- carts y cart_items --------------------------------------------------
create policy "carts: dueña o dueño"
  on public.carts for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "cart_items: dueña o dueño del carrito"
  on public.cart_items for all to authenticated
  using (exists (
    select 1 from public.carts c
    where c.id = cart_items.cart_id and c.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.carts c
    where c.id = cart_items.cart_id and c.user_id = (select auth.uid())
  ));

-- orders y order_items ------------------------------------------------
create policy "orders: cada persona ve los suyos"
  on public.orders for select to authenticated
  using (user_id = (select auth.uid()));

create policy "orders: admin ve todos"
  on public.orders for select to authenticated
  using ((select public.is_admin()));

create policy "orders: admin crea"
  on public.orders for insert to authenticated
  with check ((select public.is_admin()));

create policy "orders: admin edita"
  on public.orders for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "order_items: ve quien ve el pedido"
  on public.order_items for select to authenticated
  using (exists (
    select 1 from public.orders o
    where o.id = order_items.order_id
      and (o.user_id = (select auth.uid()) or (select public.is_admin()))
  ));

create policy "order_items: admin crea"
  on public.order_items for insert to authenticated
  with check ((select public.is_admin()));

create policy "order_items: admin edita"
  on public.order_items for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "order_items: admin borra"
  on public.order_items for delete to authenticated
  using ((select public.is_admin()));

-- ---------------------------------------------------------------------
-- 7. Storage: imágenes de producto (reemplaza Multer y backend/uploads)
--    Mismos límites que el servidor viejo: 5 MB y JPG, PNG, WEBP, GIF.
--    Bucket público: las imágenes se leen por URL sin sesión.
--    Solo un admin puede subir, cambiar o borrar.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "product-images: admin sube"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images' and (select public.is_admin()));

create policy "product-images: admin cambia"
  on storage.objects for update to authenticated
  using (bucket_id = 'product-images' and (select public.is_admin()))
  with check (bucket_id = 'product-images' and (select public.is_admin()));

create policy "product-images: admin borra"
  on storage.objects for delete to authenticated
  using (bucket_id = 'product-images' and (select public.is_admin()));
