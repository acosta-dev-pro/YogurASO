# Panel admin: lo que falta del lado de la base

El panel nuevo (`frontend/pages/admin.html`, `js/admin.js`, `js/admin/*.js`, `css/admin-theme.css`)
ya usa lo que hay. Esto es lo que falta para que todo quede conectado. No hay datos inventados:
si algo no existe, el panel lo dice.

## Ya conectado (datos reales)

| Parte del panel | De dónde sale |
| --- | --- |
| Inventario, ficha completa, foto, activar/ocultar, eliminar, selección | `api.js` → `products` y bucket `product-images` |
| Exportar a Excel (.xlsx; CSV si no carga SheetJS) | inventario + preguntas + pedidos que el panel ya tenga |
| Usuarios | `api.js` → `profiles` |
| Me gusta de la web (post «Sobre nosotros» y cada sabor) | RPC `like_state` (migración 0002) |
| Preguntas (leer) | tabla `faq_questions` (migración 0002) |
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

## 4. Instagram (me gusta, comentarios y responder)

Solo se puede con la Instagram Graph API. Juan debe:

1. Pasar @yoguraso a cuenta **Business** o **Creator**.
2. Crear una app en **Meta for Developers** (producto Instagram) con permisos para leer el perfil y
   administrar comentarios (`instagram_business_basic` e `instagram_business_manage_comments`, o con
   inicio de sesión de Facebook: `instagram_basic`, `instagram_manage_comments`, `pages_show_list`,
   `pages_read_engagement`, con la cuenta enlazada a una página de Facebook).
3. Sacar un token de larga duración y el ID de la cuenta de Instagram.

Backend: Edge Function de Supabase llamada **`instagram`** con secretos `IG_ACCESS_TOKEN` e `IG_USER_ID`
(nunca en el frontend). Debe comprobar que quien llama es admin (`rpc('is_admin')` con el JWT del
encabezado `Authorization`) y responder a este contrato (lo usa `js/admin/instagram.js`):

| body | Graph API | respuesta |
| --- | --- | --- |
| `{ action: 'status' }` | `GET /{ig-user-id}?fields=username,name,profile_picture_url,followers_count,media_count` | `{ connected: true, ...campos }` o `{ connected: false }` si no hay token |
| `{ action: 'media', limit }` | `GET /{ig-user-id}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count` | `{ posts: [...] }` |
| `{ action: 'comments', mediaId }` | `GET /{media-id}/comments?fields=id,text,username,timestamp,like_count,replies{id,text,username,timestamp}` | `{ comments: [...] }` |
| `{ action: 'reply', commentId, message }` | `POST /{comment-id}/replies?message=…` | `{ id }` |

Errores: `{ error: '<texto en español>' }`. El token de larga duración vence a los 60 días: renovarlo
con un cron o desde la misma función.

## 5. Contacto y distribuidores

Hoy solo abren WhatsApp con el mensaje escrito; no se guardan en ninguna tabla. Si se quieren ver en
el panel, haría falta una tabla `contact_messages` (insert para anon con límite como en 0002 y select/update
solo admin). El panel lo menciona en la vista Preguntas.
