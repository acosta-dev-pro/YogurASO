# YOGURASO — MEGA PROMPT MAESTRO
## Rediseño integral + nueva arquitectura + migración a Supabase + sistema de diseño + motion + 3D

> **USO:** Este documento es el prompt maestro para Cursor/Agente de código.
> **OBJETIVO:** transformar el proyecto existente de YoguraSo sin perder funcionalidades, primero ordenando y mapeando el proyecto, después construyendo el nuevo sistema visual y finalmente preparando/ejecutando la migración de Node/PostgreSQL/JWT hacia Supabase.
>
> **REGLA CRÍTICA:** NO empieces a editar masivamente. Primero audita, mapea y propone. El trabajo se ejecuta por fases y cada fase debe dejar documentación, pruebas y un punto de recuperación.

---

# 0. CONTEXTO DEL PROYECTO

Marca: **YoguraSo**

Producto: yogurt artesanal.

Identidad visual aprobada:
- Logo YoguraSo con símbolo orgánico tipo Y + hoja verde.
- Logo principal normalmente rojo sobre fondos claros.
- Logo inverso blanco sobre fondos de color.
- Marca moderna, fresca, artesanal y premium.
- No usar estética rústica, genérica, infantil ni de supermercado barato.
- La marca debe sentirse colombiana/Huila de manera sutil y contemporánea.

Productos actuales/planeados:
- Fresa
- Piña
- Mora
- Melocotón
- Yogur Griego
- Frutos Rojos
- Café
- Guanábana
- Mango
- Maracuyá
- Cereza
- Banano
- Coco

Presentación principal:
- 500 ml.
- Existirá posteriormente una versión de 1 litro.
- El envase debe conservar una geometría única y consistente para todos los sabores.
- Los assets finales de producto deben ser PNG transparente para poder usarlos en la web.

---

# 1. REFERENCIA VISUAL OBLIGATORIA

La referencia visual entregada por el cliente muestra el hero final deseado.

## Hero

Composición:

- Fondo completo de color sólido/limpio asociado al sabor seleccionado.
- Producto principal grande y protagonista.
- Segundo producto del siguiente sabor al lado derecho, más pequeño y alejado visualmente para comunicar profundidad.
- No utilizar flechas visibles.
- El usuario cambia de sabor mediante interacción/selección.
- Al cambiar el sabor:
  1. cambia el producto principal;
  2. cambia el producto secundario;
  3. cambia el color de fondo;
  4. cambia el contenido textual;
  5. cambian los detalles/acentos visuales;
  6. la transición debe ser suave y coordinada.
- El producto NO debe aparecer inicialmente con salpicaduras externas alrededor del hero.
- El producto mostrado debe ser el packshot limpio del envase.
- Debe existir sensación de producto físico apoyado sobre una superficie mediante sombra/contact-shadow muy sutil.
- No usar flechas grandes de carrusel.
- La navegación de sabores debe sentirse como selector premium.

## Referencia de proporción

El envase aprobado de Fresa es la plantilla maestra.

Todos los productos deben conservar:
- mismo ancho relativo;
- misma altura;
- misma perspectiva;
- mismo tamaño de tapa;
- mismo cuello;
- mismos hombros;
- mismo mango;
- misma base;
- misma escala dentro del lienzo;
- misma iluminación;
- misma posición;
- misma composición de etiqueta.

NO redibujar un envase diferente por sabor.

Solo cambiar:
- color del producto;
- color de etiqueta;
- fruta/ingredientes visuales;
- nombre del sabor;
- información específica del sabor.

---

# 2. TIPOGRAFÍA

## Tipografía principal de referencia

Usar **Fredoka** como tipografía display principal para reproducir la estética de la referencia.

Pesos:
- 400 — texto secundario
- 500 — navegación
- 600 — botones/labels
- 700 — títulos y hero

La referencia visual no contiene metadata tipográfica verificable, por lo que Fredoka debe tratarse como el **target de implementación** y no como una afirmación de que el archivo de referencia fue generado exactamente con esa fuente.

## Tipografía secundaria

Usar **Nunito Sans** para:
- textos largos;
- descripciones;
- formularios;
- metadata;
- accesibilidad;
- textos administrativos.

Regla:
- Nunca usar más de 2 familias tipográficas.
- No introducir fuentes adicionales sin justificarlo.

Carga recomendada:
- Google Fonts con `font-display: swap`.
- Si el rendimiento lo requiere, evaluar self-hosting de WOFF2.

---

# 3. SISTEMA DE COLOR

Crear tokens CSS/TypeScript centralizados.

## Brand

```css
--brand-red: #E51D2A;
--brand-red-dark: #C91522;
--brand-red-soft: #F04A54;
--brand-green: #4FAE45;
--cream: #FFF7E8;
--white: #FFFFFF;
--ink: #171717;
```

Estos valores son una base de implementación y deben ajustarse mediante el brand board final.

## Fondos por sabor

```text
Fresa        -> rojo / coral
Piña         -> amarillo tropical
Mora         -> morado
Melocotón    -> naranja / durazno
Griego       -> azul suave
Frutos rojos -> rojo frambuesa
Café         -> café/chocolate
Guanábana    -> verde suave
Mango        -> naranja/dorado
Maracuyá     -> amarillo intenso
Cereza       -> rojo cereza oscuro
Banano       -> amarillo crema
Coco         -> turquesa / blanco
```

Regla:
El color del sabor puede dominar el fondo y los acentos, pero el logo debe conservar su sistema de marca.

---

# 4. DESIGN SYSTEM

Crear un Design System real, no estilos aislados.

## Espaciado

Usar escala basada en 4/8 px:

```text
4
8
12
16
24
32
40
48
64
80
96
128
```

## Radios

```text
sm   10px
md   16px
lg   24px
xl   32px
pill 999px
```

## Sombras

Nada de sombras negras pesadas.

Usar:
- contacto de producto;
- sombras difusas;
- profundidad muy suave;
- glass surfaces solo donde tengan sentido.

## Bordes

Preferir:
- 1px;
- opacidad baja;
- bordes suaves;
- contraste controlado.

---

# 5. ESTRUCTURA DE PROYECTO OBJETIVO

Primero inspeccionar el proyecto actual.

NO mover archivos a ciegas.

Crear progresivamente una estructura equivalente a:

```text
YOGURASO-WEB/
│
├── app/
│   ├── routes/
│   ├── providers/
│   └── layouts/
│
├── src/
│   ├── components/
│   │   ├── ui/
│   │   ├── navigation/
│   │   ├── hero/
│   │   ├── products/
│   │   ├── cart/
│   │   ├── auth/
│   │   └── admin/
│   │
│   ├── features/
│   │   ├── product-showcase/
│   │   ├── product-catalog/
│   │   ├── cart/
│   │   ├── checkout/
│   │   ├── auth/
│   │   ├── profile/
│   │   └── admin/
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   ├── motion/
│   │   ├── utils/
│   │   └── validation/
│   │
│   ├── data/
│   │   ├── products/
│   │   └── site/
│   │
│   ├── hooks/
│   ├── styles/
│   ├── types/
│   └── assets/
│
├── public/
│   ├── products/
│   ├── brand/
│   ├── icons/
│   └── sounds/
│
├── supabase/
│   ├── migrations/
│   ├── functions/
│   ├── seed/
│   └── config.toml
│
├── docs/
│   ├── architecture/
│   ├── brand/
│   ├── design/
│   ├── migration/
│   ├── qa/
│   └── decisions/
│
├── .cursor/
│   ├── rules/
│   └── commands/
│
└── package.json
```

IMPORTANTE:
La estructura anterior es el objetivo conceptual. Primero debes mapear el proyecto existente y decidir qué puede migrarse sin romperlo.

---

# 6. NUEVO MAPEO OBLIGATORIO

Antes de cambiar código crea:

```text
docs/architecture/YOGURASO_PROJECT_MAP_V2.md
```

Debe incluir:

## A. Inventario

Para cada archivo:
- ruta;
- propósito;
- dependencias;
- dependencias inversas;
- si está activo;
- si está duplicado;
- si está obsoleto;
- si debe migrarse;
- si debe eliminarse;
- riesgo de modificación.

## B. Rutas

Mapear:
- `/`
- `/productos`
- `/carrito`
- `/login`
- `/registro`
- `/perfil`
- `/admin`
- `/privacidad`
- cualquier ruta adicional encontrada.

## C. Flujos

Documentar:

```text
Usuario
 ↓
Home
 ↓
Productos
 ↓
Carrito
 ↓
WhatsApp checkout
```

Auth:

```text
Registro
 ↓
Supabase Auth
 ↓
Perfil
 ↓
RLS
```

Admin:

```text
Login
 ↓
Role check
 ↓
Admin dashboard
 ↓
Supabase
```

## D. Dependencias

Detectar:
- Node;
- Express;
- JWT;
- bcrypt;
- Multer;
- PostgreSQL;
- API REST;
- localStorage;
- WhatsApp;
- Google Auth;
- cualquier SDK;
- cualquier servicio externo.

## E. Deuda técnica

Clasificar:
- crítica;
- alta;
- media;
- baja.

## F. Código muerto

No eliminar inmediatamente.

Primero listar.

---

# 7. REGLA DE ORO DEL MIGRADOR

No borrar Node inmediatamente.

Proceso:

```text
AUDIT
 ↓
MAP
 ↓
PLAN
 ↓
MIGRATE
 ↓
PARITY TEST
 ↓
REMOVE LEGACY
```

Durante la migración:
- mantener backup;
- crear rama Git;
- crear checkpoints;
- ejecutar tests;
- comprobar funcionalidad;
- solamente después retirar Node.

---

# 8. MIGRACIÓN NODE -> SUPABASE

El objetivo final es eliminar la dependencia del backend Node/Express para las funciones que Supabase puede cubrir.

## Supabase utilizará:

### Auth

Para:
- registro;
- login;
- logout;
- recuperación;
- sesión;
- Google OAuth si se conserva.

### Database

Supabase PostgreSQL para:
- perfiles;
- productos;
- categorías;
- inventario;
- configuraciones;
- cualquier dato persistente existente.

### Storage

Para:
- imágenes de productos;
- imágenes administrativas;
- assets que realmente deban ser gestionados dinámicamente.

### RLS

Obligatorio.

Nunca confiar únicamente en ocultar botones de admin.

## Edge Functions

Usarlas únicamente cuando:
- exista lógica que necesite secreto;
- integración externa;
- procesamiento server-side;
- webhook;
- operación que no deba ejecutarse desde el navegador.

No crear Edge Functions innecesariamente.

---

# 9. SEGURIDAD SUPABASE

Nunca:

```text
service_role
```

en:
- frontend;
- archivos públicos;
- variables VITE;
- repositorio.

El frontend solamente puede usar la clave pública correspondiente.

Crear políticas RLS para:
- lectura pública de productos publicados;
- modificación solo para administradores;
- perfiles solo para su propietario;
- datos sensibles restringidos.

Documentar cada política.

---

# 10. PRODUCT DATA MODEL

Crear un modelo consistente:

```ts
Product {
  id
  slug
  name
  flavor
  description
  shortDescription
  price
  volume
  image
  backgroundColor
  accentColor
  category
  isActive
  isFeatured
  sortOrder
  createdAt
  updatedAt
}
```

No duplicar lógica de sabor dentro de 15 componentes.

Los sabores deben ser datos.

Ejemplo:

```ts
{
  slug: "fresa",
  name: "Fresa",
  volume: "500 ml",
  background: "#D91F2B",
  accent: "#F7B7BD",
  image: "/products/yoguraso-fresa-500ml.png"
}
```

---

# 11. HERO PRODUCT SHOWCASE

Crear componente:

```text
ProductShowcase
```

Subcomponentes:

```text
ProductShowcase
├── HeroCopy
├── ProductStage
├── ProductCarousel
├── FlavorSelector
├── SecondaryProduct
└── ProductMeta
```

Comportamiento:

- producto seleccionado al centro;
- producto anterior/siguiente parcialmente visible;
- siguiente producto más pequeño;
- profundidad mediante escala, opacidad y blur moderado;
- ningún botón de flecha visible;
- teclado debe funcionar;
- touch/swipe debe funcionar;
- selección por click/tap;
- URL/query opcional si mejora deep-linking.

---

# 12. TRANSICIONES DEL HERO

Implementar:

## Staggered Fade-In + Slide-Up

Para grupos de elementos:

```text
opacity: 0 -> 1
y: 16px -> 0
```

Duración aproximada:
```text
0.35s - 0.5s
```

Stagger:
```text
80ms - 120ms
```

Nunca usar delays exagerados.

## Morphing Background

No cambiar el fondo con un salto.

Usar:
- crossfade;
- color interpolation;
- opcionalmente gradient mesh muy sutil.

El cambio debe sentirse como una transformación del mismo producto, no como otra página.

---

# 13. GRADIENT MESH

El hero puede utilizar un Gradient Mesh extremadamente sutil.

Base:

```css
radial-gradient(...)
radial-gradient(...)
```

Pero la prioridad visual es:

```text
producto > copy > navegación > fondo
```

El fondo nunca debe competir con el producto.

Movimiento:
- lento;
- mínimo;
- opcional;
- respetar `prefers-reduced-motion`.

---

# 14. FRAMER MOTION

Si el frontend final es React:

```bash
npm install framer-motion
```

Usarlo para:
- entrada de hero;
- stagger;
- navegación;
- selector de sabores;
- cards;
- modales;
- cart drawer;
- microinteracciones.

No animar todo.

Regla:
Una animación debe comunicar:
- entrada;
- estado;
- relación;
- feedback.

Nunca animar por animar.

---

# 15. GSAP

Instalar solo si realmente aporta valor.

Usar GSAP para:
- secuencias complejas;
- scroll storytelling;
- escenas coordinadas;
- transiciones avanzadas.

No usar Framer Motion y GSAP para la misma animación sin necesidad.

Regla:
- UI -> Framer Motion.
- Timeline/scroll complejo -> GSAP.

---

# 16. 3D

El 3D no debe convertir YoguraSo en una demo técnica.

Posibles usos:
- hero especial;
- producto 3D interactivo;
- sección de storytelling;
- rotación suave del envase;
- partículas muy ligeras.

Stack posible:

```text
Three.js
React Three Fiber
@react-three/drei
```

Física solo si realmente aporta:

```text
Rapier
```

No introducir física solo porque existe.

---

# 17. REGLA DE PERFORMANCE 3D

Desktop:
- 3D opcional.

Mobile:
- fallback 2D obligatorio.

Si:
```text
prefers-reduced-motion
```

entonces:
- reducir;
- desactivar;
- mostrar versión estática.

No cargar modelos 3D enormes.

Preferir:
- `.glb`
- Draco/Meshopt
- texturas WebP/AVIF/KTX2 cuando corresponda.

---

# 18. MICROINTERACCIONES

Crear sistema de microinteracciones.

### Buttons

Hover:
```text
translateY(-2px)
scale(1.01)
```

No exagerar.

### Cards

Hover:
- translateY(-4px);
- borde ligeramente más visible;
- imagen escala 1.02;
- sombra suave.

### Flavor selector

Seleccionado:
- pill activo;
- indicador;
- transición de color;
- icono ligeramente elevado.

### Cart

Al añadir:
- micro feedback;
- contador animado;
- toast elegante.

---

# 19. SONIDO

Los sonidos son opcionales.

No reproducir audio automáticamente.

Agregar sonidos únicamente para:
- interacción premium;
- confirmación;
- acciones especiales.

Reglas:
- volumen bajo;
- botón para silenciar;
- respetar preferencias;
- nunca sonido en hover;
- no sonido continuo.

Crear:

```text
public/sounds/
```

Solo después de validar que realmente mejora UX.

---

# 20. IMÁGENES

Eliminar imágenes antiguas únicamente después de mapearlas.

Crear:

```text
public/products/
```

Convención:

```text
yoguraso-fresa-500ml.png
yoguraso-pina-500ml.png
yoguraso-mora-500ml.png
yoguraso-melocoton-500ml.png
yoguraso-griego-500ml.png
yoguraso-frutos-rojos-500ml.png
yoguraso-cafe-500ml.png
yoguraso-guanabana-500ml.png
yoguraso-mango-500ml.png
yoguraso-maracuya-500ml.png
yoguraso-cereza-500ml.png
yoguraso-banano-500ml.png
yoguraso-coco-500ml.png
```

No usar imágenes generadas como logos.

El logo debe ser un asset real:

```text
SVG
```

cuando sea posible.

---

# 21. LOGO

Crear:

```text
brand/
├── logo-primary.svg
├── logo-white.svg
├── logo-dark.svg
├── logo-mark.svg
├── favicon.svg
```

No escribir `YoguraSo` con una fuente intentando imitar el logo.

El logo es un elemento gráfico independiente.

Reglas:
- no deformar;
- no estirar;
- no cambiar proporciones;
- no aplicar sombras aleatorias;
- mantener área de seguridad;
- usar versión blanca sobre fondos de color.

---

# 22. NAVEGACIÓN

Desktop:

```text
[Logo]       [Sabores] [Nosotros] [Distribuidores] [Contacto]       [Buscar] [Carrito]
```

La navegación debe ser:
- pill;
- limpia;
- blanca sobre hero de color;
- activa con rojo;
- sticky solamente si no perjudica el hero.

Mobile:
- menú accesible;
- drawer;
- animación corta;
- focus trap;
- ESC;
- navegación por teclado.

---

# 23. HOME

Orden recomendado:

```text
01 Hero Product Showcase
02 Sabores
03 Historia / Nosotros
04 Cómo se hace
05 Beneficios / características verificables
06 Productos destacados
07 Distribuidores
08 Testimonios
09 CTA / WhatsApp
10 Footer
```

No llenar todo de cards.

La home debe tener ritmo visual.

---

# 24. SECCIÓN SABORES

Debe sentirse como continuación natural del hero.

Cards:
- producto;
- nombre;
- volumen;
- precio;
- CTA.

Hover:
- pequeño movimiento;
- cambio de fondo;
- imagen escala suavemente.

No:
- sombras enormes;
- bordes pesados;
- 4 botones;
- exceso de información.

---

# 25. CART

Conservar el flujo actual si funciona.

Mejorar:
- drawer lateral;
- resumen;
- cantidades;
- eliminar;
- subtotal;
- CTA WhatsApp.

WhatsApp seguirá siendo el canal de checkout mientras no se implemente un gateway de pagos.

No inventar integración de pagos.

---

# 26. AUTH

Migrar a Supabase Auth.

Pantallas:
- login;
- registro;
- recuperación;
- perfil.

Estados:
- loading;
- success;
- error;
- session expired.

Nunca mostrar errores internos de Supabase al usuario final sin traducirlos.

---

# 27. ADMIN

Mantener funcionalidad.

Modernizar UI.

Dashboard:
- productos;
- inventario;
- usuarios/perfiles si corresponde;
- configuración.

Protección:

```text
Auth
 ↓
Role/Profile
 ↓
RLS
 ↓
Admin UI
```

La UI no es la seguridad.

---

# 28. ACCESSIBILITY

Obligatorio:

- semantic HTML;
- labels;
- alt;
- keyboard navigation;
- focus visible;
- contraste;
- reduced motion;
- aria solo cuando corresponda;
- botones reales para acciones;
- no divs clickeables innecesarios.

---

# 29. RESPONSIVE

Breakpoints razonables:

```text
mobile
tablet
desktop
wide desktop
```

No diseñar desktop y luego “encoger”.

El hero móvil debe ser rediseñado.

Mobile:
- producto protagonista;
- copy compacto;
- selector de sabores horizontal scrollable;
- navegación usable;
- sin WebGL pesado si afecta performance.

---

# 30. SEO

Mantener/mejorar:

- title;
- description;
- canonical;
- Open Graph;
- Twitter/X card;
- robots;
- sitemap;
- structured data cuando aplique.

Para productos:
- Product schema si los datos reales lo permiten.

No inventar:
- ratings;
- precios;
- reviews;
- características nutricionales.

---

# 31. PERFORMANCE

Objetivos:

- imágenes optimizadas;
- lazy loading;
- responsive images;
- evitar JS innecesario;
- code splitting;
- no cargar Three.js en páginas que no lo necesitan;
- no cargar sonido antes de interacción;
- reducir fuentes;
- evitar layout shift.

Medir:
- Lighthouse;
- Web Vitals;
- bundle size.

---

# 32. COMPONENTES 21ST.DEV

21st.dev puede utilizarse como fuente de inspiración/componentes.

Regla:
No copiar componentes sin adaptarlos.

Cada componente debe:
- respetar el design system;
- respetar accesibilidad;
- respetar branding;
- evitar dependencias innecesarias.

No convertir la web en un collage de componentes.

---

# 33. SKILLS

Antes de instalar skills:

1. inspeccionar qué sistema de skills soporta el entorno actual;
2. no instalar duplicados;
3. no instalar skills desconocidos o inseguros;
4. documentar cada skill.

Skills recomendadas conceptualmente:

```text
UI/UX Design Intelligence
Frontend Architecture
React
TypeScript
Tailwind CSS
Accessibility
Web Performance
SEO
Supabase
Motion Design
Three.js / React Three Fiber
Testing / Playwright
Git / Code Review
```

Si el entorno ofrece un skill oficial equivalente, usarlo.

Si no existe, crear documentación local equivalente.

---

# 34. CURSOR RULES

Crear reglas modulares en:

```text
.cursor/rules/
```

Propuesta:

```text
00-project-overview.mdc
01-architecture.mdc
02-brand-system.mdc
03-ui-design.mdc
04-motion.mdc
05-accessibility.mdc
06-performance.mdc
07-supabase.mdc
08-security.mdc
09-testing.mdc
10-code-style.mdc
11-assets.mdc
12-no-regressions.mdc
```

Cada regla debe ser corta y específica.

No crear un único archivo de 5.000 líneas.

---

# 35. CURSOR COMMANDS

Crear comandos reutilizables:

```text
.cursor/commands/audit-project.md
.cursor/commands/map-project.md
.cursor/commands/check-design.md
.cursor/commands/check-supabase.md
.cursor/commands/check-performance.md
.cursor/commands/run-tests.md
.cursor/commands/check-accessibility.md
.cursor/commands/prepare-migration.md
```

Cada comando debe:
- tener objetivo;
- entradas;
- pasos;
- criterios de éxito;
- archivos que puede modificar;
- archivos que no puede modificar.

---

# 36. DOCUMENTACIÓN

Crear:

```text
docs/
├── architecture/
│   ├── YOGURASO_PROJECT_MAP_V2.md
│   ├── TARGET_ARCHITECTURE.md
│   └── DEPENDENCY_MAP.md
│
├── design/
│   ├── DESIGN_SYSTEM.md
│   ├── MOTION_SYSTEM.md
│   ├── PRODUCT_SHOWCASE.md
│   └── RESPONSIVE_RULES.md
│
├── brand/
│   ├── BRAND_GUIDELINES.md
│   ├── LOGO_RULES.md
│   ├── COLOR_SYSTEM.md
│   └── PRODUCT_ASSETS.md
│
├── migration/
│   ├── NODE_TO_SUPABASE.md
│   ├── DATA_MODEL.md
│   ├── RLS_POLICY_MAP.md
│   └── MIGRATION_CHECKLIST.md
│
├── qa/
│   ├── TEST_PLAN.md
│   ├── ACCESSIBILITY_CHECKLIST.md
│   └── PERFORMANCE_CHECKLIST.md
│
└── decisions/
    └── ADR-*.md
```

---

# 37. ADR

Cada decisión arquitectónica importante debe quedar documentada.

Ejemplos:

```text
ADR-001-frontend-modernization.md
ADR-002-supabase-migration.md
ADR-003-product-showcase.md
ADR-004-motion-system.md
ADR-005-3d-strategy.md
```

---

# 38. PLAN DE EJECUCIÓN EXACTO

## FASE 1 — CONGELAR Y RESPALDAR

Antes de editar:

```bash
git status
git branch
git log -5
```

Crear rama:

```bash
git checkout -b redesign/yoguraso-v2
```

Si existen cambios sin commit:
- NO borrarlos.
- Documentarlos.

---

## FASE 2 — AUDITORÍA

No modificar UI.

Generar:

```text
YOGURASO_PROJECT_MAP_V2.md
DEPENDENCY_MAP.md
TARGET_ARCHITECTURE.md
```

Reportar:
- qué existe;
- qué se mantiene;
- qué migra;
- qué desaparece;
- qué se reemplaza.

DETENERSE.

Esperar aprobación humana antes de cambios destructivos.

---

## FASE 3 — BRAND + DESIGN SYSTEM

Implementar:
- tokens;
- tipografía;
- colores;
- botones;
- navegación;
- cards;
- spacing;
- responsive foundations.

Todavía NO migrar toda la aplicación.

---

## FASE 4 — NUEVO HERO

Construir:

```text
ProductShowcase
```

Primero:
- Fresa;
- Piña;
- Mora.

Después conectar todos los productos.

Validar:
- dimensiones;
- responsive;
- animación;
- selector.

---

## FASE 5 — MIGRACIÓN DE ASSETS

Eliminar/reemplazar imágenes antiguas solo después de:
- localizar referencias;
- confirmar que no se usan;
- sustituirlas;
- ejecutar build.

---

## FASE 6 — SUPABASE

Crear proyecto/configuración.

Migrar:
- auth;
- tablas;
- perfiles;
- productos;
- storage;
- RLS.

No eliminar Node todavía.

---

## FASE 7 — PARIDAD

Probar:

```text
Registro
Login
Logout
Recovery
Google Auth si aplica
Perfil
Productos
Carrito
WhatsApp
Admin
CRUD
Imágenes
Responsive
```

---

## FASE 8 — ELIMINACIÓN DE LEGACY

Solo si todas las pruebas pasan:

- retirar Express;
- retirar JWT propio;
- retirar bcrypt propio;
- retirar endpoints reemplazados;
- retirar código muerto;
- retirar dependencias no utilizadas.

Después:

```bash
npm install
npm run build
npm test
```

y ejecutar Playwright si existe.

---

# 39. TESTING

Mantener/actualizar Playwright.

Crear tests para:

```text
home.spec
products.spec
cart.spec
auth.spec
admin.spec
responsive.spec
accessibility.spec
```

No considerar la migración terminada hasta que los flujos críticos pasen.

---

# 40. GIT

Commits pequeños:

```text
feat(brand): add design tokens
feat(hero): add product showcase
feat(motion): add flavor transitions
feat(supabase): add auth integration
feat(supabase): add product repository
feat(admin): migrate product management
refactor: remove legacy API
chore: remove unused dependencies
test: update e2e flows
```

Nunca:

```text
mega cambio final definitivo
```

---

# 41. REGLAS ABSOLUTAS PARA EL AGENTE

1. No romper funcionalidad existente.
2. No borrar archivos sin mapearlos.
3. No reemplazar arquitectura sin explicar impacto.
4. No inventar datos.
5. No inventar precios.
6. No inventar información nutricional.
7. No exponer secretos.
8. No colocar service role en frontend.
9. No introducir 3D innecesario.
10. No introducir sonido automático.
11. No usar animaciones excesivas.
12. No usar flechas de carrusel en el hero principal.
13. No deformar los assets de producto.
14. No recrear el logo como texto.
15. No usar imágenes placeholder en producción.
16. No dejar TODO críticos sin documentar.
17. No instalar paquetes sin justificar.
18. No crear duplicación de lógica.
19. No eliminar Node antes de pasar paridad.
20. No hacer un rewrite completo sin checkpoint.

---

# 42. CRITERIOS DE ACEPTACIÓN DEL HERO

El hero se considera aprobado únicamente si:

- parece YoguraSo;
- el producto domina visualmente;
- el segundo producto comunica profundidad;
- el fondo cambia con el sabor;
- el cambio es fluido;
- no existen flechas grandes;
- el selector es claro;
- funciona en mouse;
- funciona en touch;
- funciona con teclado;
- respeta reduced motion;
- carga rápido;
- no genera CLS importante;
- el producto conserva sus proporciones.

---

# 43. CRITERIOS DE ACEPTACIÓN DEL DISEÑO

Debe sentirse:

```text
moderno
artesanal
premium
fresco
amigable
limpio
colombiano de forma sutil
```

No debe sentirse:

```text
genérico
plantilla IA
supermercado barato
rústico
infantil
excesivamente tech
dashboard empresarial
```

---

# 44. PRINCIPIO DE JERARQUÍA

En cualquier pantalla:

```text
1. Producto
2. Marca
3. Mensaje
4. CTA
5. Navegación
6. Información secundaria
```

No competir con el producto.

---

# 45. ENTREGABLE FINAL

Al terminar todas las fases debe existir:

```text
MAPA DEL PROYECTO
DESIGN SYSTEM
BRAND SYSTEM
MOTION SYSTEM
PRODUCT SYSTEM
SUPABASE ARCHITECTURE
RLS POLICIES
TEST PLAN
PERFORMANCE PLAN
CURSOR RULES
CURSOR COMMANDS
SKILLS DOCUMENTATION
MIGRATION DOCUMENTATION
```

Y el proyecto debe:

```text
npm install
npm run build
npm test
```

sin errores.

---

# 46. PROMPT DE ARRANQUE PARA EL AGENTE

Copia todo este documento como contexto y luego ejecuta exactamente:

> **PRIMERA TAREA — NO MODIFIQUES EL PROYECTO TODAVÍA.**
>
> Audita completamente el repositorio YoguraSo existente.
>
> Quiero que descubras la arquitectura real, todas las rutas, archivos, dependencias, APIs, autenticación, carrito, WhatsApp, admin, PostgreSQL, Node/Express, JWT, bcrypt, uploads, imágenes y tests.
>
> Compara la arquitectura actual contra la arquitectura objetivo de este documento.
>
> Genera:
>
> `docs/architecture/YOGURASO_PROJECT_MAP_V2.md`
>
> `docs/architecture/DEPENDENCY_MAP.md`
>
> `docs/architecture/TARGET_ARCHITECTURE.md`
>
> `docs/migration/NODE_TO_SUPABASE.md`
>
> `docs/design/DESIGN_GAP_ANALYSIS.md`
>
> `docs/decisions/ADR-001-project-modernization.md`
>
> Además crea un informe de:
>
> 1. qué se mantiene;
> 2. qué se migra;
> 3. qué se reemplaza;
> 4. qué se elimina;
> 5. qué archivos están duplicados;
> 6. qué archivos están muertos;
> 7. qué riesgos existen;
> 8. qué dependencias nuevas son necesarias;
> 9. qué dependencias actuales pueden eliminarse;
> 10. qué parte del backend puede pasar directamente a Supabase;
> 11. qué parte necesita Edge Functions;
> 12. qué partes del frontend necesitan React/TypeScript si el proyecto actual no los utiliza;
> 13. qué cambios son obligatorios para implementar el hero de referencia.
>
> **NO edites componentes existentes todavía.**
>
> **NO borres Node.**
>
> **NO borres imágenes.**
>
> **NO instales dependencias nuevas todavía salvo que sean estrictamente necesarias para realizar la auditoría.**
>
> Al finalizar, muestra un resumen ejecutivo y espera aprobación antes de iniciar la FASE 3.

---

# 47. SEGUNDO PROMPT — DESPUÉS DE APROBAR EL MAPA

> Con base en los documentos de arquitectura aprobados, comienza la modernización.
>
> Primero crea el sistema de diseño:
>
> - Fredoka;
> - Nunito Sans;
> - tokens;
> - colores;
> - spacing;
> - radii;
> - botones;
> - navegación;
> - superficies;
> - responsive;
> - accessibility.
>
> Después crea el nuevo `ProductShowcase`.
>
> Implementa primero Fresa, Piña y Mora.
>
> No conectes todavía todos los productos hasta comprobar que la composición visual funciona.
>
> Ejecuta build y tests.
>
> No migres Supabase en esta fase salvo que sea necesario para preparar interfaces/abstracciones.
>
> Documenta todo.

---

# 48. TERCER PROMPT — MIGRACIÓN SUPABASE

> Inicia la migración Node -> Supabase únicamente después de tener paridad visual y funcional.
>
> Primero documenta el modelo actual.
>
> Después crea las migraciones SQL.
>
> Después crea RLS.
>
> Después conecta Auth.
>
> Después conecta productos.
>
> Después Storage.
>
> Después Admin.
>
> Ejecuta pruebas después de cada bloque.
>
> Mantén Node funcionando como fallback durante la migración.
>
> Solo cuando todas las pruebas pasen, elimina la dependencia legacy.

---

# 49. CUARTO PROMPT — PULIDO PREMIUM

> Ahora realiza una revisión de calidad visual.
>
> Revisa:
>
> - spacing;
> - tipografía;
> - jerarquía;
> - proporciones;
> - animaciones;
> - accesibilidad;
> - responsive;
> - performance;
> - assets;
> - contraste;
> - estados hover/focus/active;
> - loading;
> - errores;
> - empty states.
>
> El resultado debe sentirse como una marca real de producto, no como una plantilla generada por IA.
>
> No agregues efectos solamente porque son técnicamente posibles.
>
> Cada efecto debe tener una función visual o UX.

---

# 50. REGLA FINAL

**Primero estructura. Después diseño. Después interacción. Después migración. Después optimización.**

No hacer todo simultáneamente.

Orden definitivo:

```text
BACKUP
↓
AUDIT
↓
MAP
↓
APPROVAL
↓
DESIGN SYSTEM
↓
HERO
↓
PRODUCT SYSTEM
↓
RESPONSIVE
↓
MOTION
↓
SUPABASE
↓
RLS
↓
PARITY
↓
TESTS
↓
REMOVE LEGACY
↓
PERFORMANCE
↓
SEO
↓
FINAL QA
↓
DEPLOY
```

Este orden es obligatorio para evitar convertir el proyecto en un rewrite descontrolado.
