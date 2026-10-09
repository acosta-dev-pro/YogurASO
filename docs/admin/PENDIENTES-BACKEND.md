# Panel admin: lo que falta del lado de la base

El panel nuevo (`frontend/pages/admin.html`, `js/admin.js`, `js/admin/*.js`, `css/admin-theme.css`)
ya usa lo que hay. Esto es lo que falta para que todo quede conectado. No hay datos inventados:
si algo no existe, el panel lo dice.

## Ya conectado (datos reales)

| Parte del panel | De dónde sale |
| --- | --- |
| Inventario, ficha completa, foto, activar/ocultar, eliminar, selección | `api.js` → `products` y bucket `product-images` |
| Exportar a Excel (.xlsx; CSV si no carga SheetJS) | inventario + preguntas + comentarios + pedidos que el panel ya tenga |
| Usuarios | `api.js` → `profiles` |
| Me gusta del post «Sobre nosotros» y de cada sabor | RPC `like_state` (migración 0002, aún sin correr en Supabase) |
| Comentarios del post (leer) | tabla `content_comments` (migración 0002) |
| Preguntas (leer) | tabla `faq_questions` (migración 0002, aún sin correr en Supabase) |
| Pedidos (leer y cambiar estado) | `orders` + `order_items` (migración 0001, políticas admin ya existen) |
| Color de fondo (pastel) por producto | `products.background_color` vía `api.js` (`color_fondo`) |

## 1. Preguntas: responder y ver las pendientes

Hoy el admin solo puede LEER las preguntas aprobadas (no hay policy de admin) y no hay dónde
guardar la respuesta. Propuesta de migración `0003_admin_panel.sql`:

```sql
alter table public.faq_questions
  add column answer      text check (answer is null or char_length(answer) <= 800),
  add column answered_at timestamptz;

create policy "faq_questions: admin ve todas"
  on public.faq_questions for select to authenticated
  using ((select public.is_admin()));

create policy "faq_questions: admin edita"
  on public.faq_questions for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

grant update (status, answer, answered_at) on public.faq_questions to authenticated;
```

Además, para que la respuesta se vea en la web: `list_faq_questions` debe devolver `answer`
(hay que hacer `drop function` y crearla de nuevo con la columna extra) y `js/interactions.js`
pintarla debajo de la pregunta.

El panel ya llama: `select … answer, answered_at` (si no existen, sigue sin ellas y lo avisa)
y `update({ answer, answered_at, status: 'approved' })`.

## 2. Color fuerte por producto

`products.accent_color` ya existe, pero `productToDb()` en `api.js` no lo envía. Agregar:

```js
if (has('color_acento')) row.accent_color = /^#[0-9A-Fa-f]{6}$/.test(String(p.color_acento || '')) ? p.color_acento : null;
```

Mientras tanto, el panel guarda el color fuerte también en `localStorage`
(`yog_admin_colores_v1`) y lo dice en pantalla. Cuando la base lo devuelva, el panel deja de usar ese respaldo.

Para que la TIENDA use estos colores: hoy `main.js` (`cardHtml`, `normalizeProducts`) da prioridad
a `--fondo-claro-<sabor>` sobre `color_fondo`. Debe preferir `color_fondo` cuando sea un hex distinto
de `#FFF8F4` (el valor por defecto de la tabla) y pasar `color_acento` a la ficha (`--yfm-c`).

## 3. Pedidos

El carrito manda el pedido por WhatsApp y solo lo guarda en el navegador del cliente
(`yogur_order_history`). Para verlos en el panel, antes de abrir WhatsApp hay que guardarlos en
`orders` + `order_items`. Ojo: hoy solo el admin puede insertar en `orders`, así que hace falta una
función `create_order(...)` con `security definer` que valide precios contra `products`.

## 4. Post estilo Instagram de la web («Sobre nosotros»)

No es la cuenta real de Instagram: es el post del inicio donde la gente da me gusta (y, si se vuelven
a abrir, deja comentarios). Datos de la migración 0002: `content_likes` y `content_comments`
(`target_type = 'post'`, `target_id = 'nosotros'`). Nota: hoy `js/interactions.js` dice que el post
ya no muestra caja de comentarios; los comentarios solo llegarán si se vuelve a abrir esa caja.

El panel lo maneja en `js/admin/instagram.js`. El conteo de me gusta ya funciona con `like_state`.
Falta en la base:

```sql
alter table public.content_comments
  add column reply      text check (reply is null or char_length(reply) <= 400),
  add column replied_at timestamptz;

create policy "content_comments: admin ve todos"
  on public.content_comments for select to authenticated using ((select public.is_admin()));
create policy "content_comments: admin edita"
  on public.content_comments for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "content_comments: admin borra"
  on public.content_comments for delete to authenticated using ((select public.is_admin()));

grant update (status, reply, replied_at), delete on public.content_comments to authenticated;
```

Y `list_post_comments` debe devolver `reply` para que la respuesta se vea en la web.

## 5. Contacto y distribuidores

Hoy solo abren WhatsApp con el mensaje escrito; no se guardan en ninguna tabla. Si se quieren ver en
el panel, haría falta una tabla `contact_messages` (insert para anon con límite como en 0002 y select/update
solo admin). El panel lo menciona en la vista Preguntas.
