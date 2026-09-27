/**
 * Genera Manual Técnico (AA10) y Manual de Usuario (AA11) de YogurASO — DOCX completos.
 */
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, BorderStyle, VerticalAlign, ShadingType,
  HeadingLevel, Header, Footer, PageNumber, PageBreak,
} = require('docx');
const fs = require('fs');
const path = require('path');

const DL = 'C:/Users/acost/Downloads';
const OUT_TEC = path.join(DL, 'Manual_Tecnico_YogurASO_GA10-220501097-AA10-EV01.docx');
const OUT_USR = path.join(DL, 'Manual_Usuario_YogurASO_GA10-220501097-AA11-EV01.docx');

const border = { style: BorderStyle.SINGLE, size: 6, color: '666666' };
const borders = { top: border, bottom: border, left: border, right: border };

function run(text, o = {}) {
  return new TextRun({
    text: String(text ?? ''),
    font: 'Times New Roman',
    size: o.size || 24,
    bold: !!o.bold,
    italics: !!o.italics,
    color: o.color || '000000',
  });
}

function p(text, o = {}) {
  return new Paragraph({
    spacing: { after: o.after ?? 160, before: o.before ?? 0, line: 276 },
    alignment: o.align || AlignmentType.JUSTIFIED,
    indent: o.indent,
    children: [run(text, o)],
  });
}

function pMulti(parts, o = {}) {
  return new Paragraph({
    spacing: { after: o.after ?? 160, before: o.before ?? 0, line: 276 },
    alignment: o.align || AlignmentType.JUSTIFIED,
    children: parts.map((x) => (typeof x === 'string' ? run(x) : run(x.text, x))),
  });
}

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 320, after: 160 },
    children: [run(text, { bold: true, size: 28 })],
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 260, after: 120 },
    children: [run(text, { bold: true, size: 26 })],
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 100 },
    children: [run(text, { bold: true, size: 24, italics: true })],
  });
}

function bullet(text) {
  return new Paragraph({
    spacing: { after: 80, line: 260 },
    indent: { left: 360 },
    children: [run('• ' + text, { size: 22 })],
  });
}

function num(n, text) {
  return new Paragraph({
    spacing: { after: 80, line: 260 },
    indent: { left: 360 },
    children: [run(`${n}. ${text}`, { size: 22 })],
  });
}

function cell(text, w, o = {}) {
  return new TableCell({
    borders,
    width: { size: w, type: WidthType.DXA },
    shading: o.fill ? { type: ShadingType.CLEAR, fill: o.fill } : undefined,
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({
      spacing: { after: 40, before: 40 },
      alignment: o.align || AlignmentType.LEFT,
      children: [run(text, { size: o.size || 18, bold: !!o.bold })],
    })],
  });
}

function simpleTable(headers, rows, widths) {
  return new Table({
    width: { size: 10000, type: WidthType.DXA },
    columnWidths: widths,
    rows: [
      new TableRow({
        children: headers.map((h, i) => cell(h, widths[i], { bold: true, fill: 'D9E2F3', align: AlignmentType.CENTER, size: 17 })),
      }),
      ...rows.map((r) => new TableRow({
        children: r.map((c, i) => cell(c, widths[i], { size: 17 })),
      })),
    ],
  });
}

function cover(tipo, codigo) {
  return [
    new Paragraph({ spacing: { after: 200 }, alignment: AlignmentType.CENTER, children: [run('YogurASO', { bold: true, size: 48, color: 'E08888' })] }),
    new Paragraph({ spacing: { after: 80 }, alignment: AlignmentType.CENTER, children: [run('Servicio Nacional de Aprendizaje — SENA', { size: 22 })] }),
    new Paragraph({ spacing: { after: 400 }, alignment: AlignmentType.CENTER, children: [run('Tecnólogo en Análisis y Desarrollo de Software', { size: 20, italics: true })] }),
    new Paragraph({ spacing: { after: 200 }, alignment: AlignmentType.CENTER, children: [run(tipo, { bold: true, size: 36 })] }),
    new Paragraph({ spacing: { after: 120 }, alignment: AlignmentType.CENTER, children: [run('Proyecto: YogurASO — Tienda web de yogurt artesanal', { size: 24 })] }),
    new Paragraph({ spacing: { after: 80 }, alignment: AlignmentType.CENTER, children: [run('Código de evidencia: ' + codigo, { size: 20, bold: true })] }),
    new Paragraph({ spacing: { after: 80 }, alignment: AlignmentType.CENTER, children: [run('Versión del sistema: 1.0.0 (MVP)', { size: 20 })] }),
    new Paragraph({ spacing: { after: 400 }, alignment: AlignmentType.CENTER, children: [run('Septiembre de 2026', { size: 22 })] }),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

function tocTitle() {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 240 },
    children: [run('CONTENIDO', { bold: true, size: 28 })],
  });
}

function footerHeader(label) {
  return {
    headers: {
      default: new Header({
        children: [new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [run(label, { size: 16, italics: true, color: '666666' })],
        })],
      }),
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            run('YogurASO · Página ', { size: 16 }),
            new TextRun({ children: [PageNumber.CURRENT], font: 'Times New Roman', size: 16 }),
          ],
        })],
      }),
    },
  };
}

/* ===================== MANUAL TÉCNICO AA10 ===================== */
function buildTecnico() {
  const kids = [
    ...cover('Manual Técnico', 'GA10-220501097-AA10-EV01'),
    tocTitle(),
    p('1. Introducción', { align: AlignmentType.LEFT, after: 60 }),
    p('2. Objetivos', { align: AlignmentType.LEFT, after: 60 }),
    p('3. Alcance', { align: AlignmentType.LEFT, after: 60 }),
    p('4. Prerrequisitos de instalación del sistema', { align: AlignmentType.LEFT, after: 60 }),
    p('   4.1 Requerimientos mínimos de hardware', { align: AlignmentType.LEFT, after: 60 }),
    p('   4.2 Requerimientos mínimos de software', { align: AlignmentType.LEFT, after: 60 }),
    p('5. Herramientas utilizadas para el desarrollo', { align: AlignmentType.LEFT, after: 60 }),
    p('6. Scripts (módulos frontend y backend)', { align: AlignmentType.LEFT, after: 60 }),
    p('7. Diseño de la arquitectura', { align: AlignmentType.LEFT, after: 60 }),
    p('   7.1 Diagrama de casos de uso del sistema', { align: AlignmentType.LEFT, after: 60 }),
    p('   7.2 Modelo entidad–relación de la base de datos', { align: AlignmentType.LEFT, after: 60 }),
    p('   7.3 Diccionario de datos', { align: AlignmentType.LEFT, after: 60 }),
    p('   7.4 Diagrama de componentes', { align: AlignmentType.LEFT, after: 60 }),
    p('8. Usuarios', { align: AlignmentType.LEFT, after: 60 }),
    p('9. Contingencias y soluciones', { align: AlignmentType.LEFT, after: 60 }),
    p('10. Instalación y despliegue técnico (resumen operativo)', { align: AlignmentType.LEFT, after: 60 }),
    p('11. Conclusiones', { align: AlignmentType.LEFT, after: 60 }),
    p('12. Bibliografía', { align: AlignmentType.LEFT, after: 200 }),
    new Paragraph({ children: [new PageBreak()] }),

    h1('1. Introducción'),
    p('El presente Manual Técnico describe la arquitectura, componentes, dependencias, base de datos y procedimientos de instalación y soporte del sistema de información YogurASO, una aplicación web orientada a la comercialización de yogurt artesanal en el departamento del Huila (Colombia).'),
    p('YogurASO está construido con un frontend estático (HTML, CSS y JavaScript modular), un backend en Node.js con Express que expone una API REST protegida con JWT, y una base de datos PostgreSQL. El carrito de compras opera en el navegador (localStorage) y el pedido se canaliza hacia WhatsApp Business. El panel administrador permite gestionar inventario de productos (incluido letreros/promociones) y el estado de usuarios.'),
    p('Este documento está destinado a personal técnico: desarrolladores, administradores de sistemas, analistas de soporte y evaluadores del proyecto formativo. Su propósito es permitir comprender, instalar, mantener y extender el software de forma controlada, alineada con buenas prácticas de ingeniería de software.'),

    h1('2. Objetivos'),
    h2('2.1 Objetivo general'),
    p('Documentar de manera clara y completa los aspectos técnicos de YogurASO para facilitar su instalación, operación, mantenimiento y evolución.'),
    h2('2.2 Objetivos específicos'),
    bullet('Describir la arquitectura lógica y física del sistema.'),
    bullet('Especificar requerimientos de hardware y software para entornos de desarrollo, pruebas y producción.'),
    bullet('Detallar módulos de código (frontend y backend) y scripts de base de datos.'),
    bullet('Presentar el modelo de datos, diccionario y relaciones entre entidades.'),
    bullet('Definir roles técnicos de usuario y privilegios asociados.'),
    bullet('Registrar contingencias frecuentes y sus soluciones recomendadas.'),

    h1('3. Alcance'),
    h2('3.1 Límites del documento'),
    p('El manual cubre el MVP de YogurASO en su versión 1.0.0: autenticación (local y Google opcional), catálogo de productos, carrito, perfil de usuario, recuperación de contraseña, panel admin de productos y usuarios, y despliegue local o en hosting con dominio/HTTPS. No incluye pasarela de pagos en línea ni aplicación nativa móvil; el canal de cierre de compra es WhatsApp.'),
    h2('3.2 Público objetivo'),
    p('Este documento está dirigido a: (a) aprendices e instructores SENA del programa Análisis y Desarrollo de Software; (b) desarrolladores encargados del mantenimiento; (c) administradores de base de datos e infraestructura que desplieguen el servicio.'),
    h2('3.3 Conocimientos básicos recomendados'),
    bullet('Fundamentos de HTML, CSS y JavaScript.'),
    bullet('Conceptos de API REST, HTTP y JSON.'),
    bullet('Node.js / npm y variables de entorno.'),
    bullet('SQL básico y administración de PostgreSQL.'),
    bullet('Uso de Git y nociones de DNS/HTTPS para publicación.'),

    h1('4. Prerrequisitos de instalación del sistema'),
    h2('4.1 Requerimientos mínimos de hardware'),
    simpleTable(
      ['Recurso', 'Desarrollo / pruebas', 'Producción (recomendado)'],
      [
        ['Procesador', 'Intel/AMD dual-core 2.0 GHz o superior', '2 vCPU o más'],
        ['Memoria RAM', '8 GB (mínimo 4 GB)', '4 GB o más dedicados al servicio'],
        ['Disco duro', '20 GB libres SSD/HDD', '40 GB+ (código, logs, uploads, backups)'],
        ['Red', 'Acceso a Internet estable', 'IP pública o hosting con dominio'],
        ['Pantalla (dev)', '1366×768 o superior', 'No aplica (servidor)'],
      ],
      [2800, 3600, 3600]
    ),
    h2('4.2 Requerimientos mínimos de software'),
    simpleTable(
      ['Componente', 'Versión / detalle', 'Observación'],
      [
        ['Sistema operativo', 'Windows 10/11, Ubuntu 22.04+ o similar', 'Desarrollo y/o servidor'],
        ['Node.js', 'LTS 18.x o 20.x', 'Runtime del backend Express'],
        ['npm', 'Incluido con Node.js', 'Gestión de dependencias'],
        ['PostgreSQL', '14 o superior', 'Puerto por defecto 5432'],
        ['Cliente SQL', 'psql, pgAdmin o DBeaver', 'Administración de BD'],
        ['Navegador', 'Chrome, Edge o Firefox actualizados', 'Pruebas del frontend'],
        ['Editor', 'Visual Studio Code (recomendado)', 'Desarrollo'],
        ['Git', '2.x', 'Control de versiones'],
        ['Servidor estático', 'Live Server / serve / Nginx', 'Entrega del frontend'],
        ['Licencias', 'Software libre/open source del stack', 'Node, Express, PostgreSQL, FA CDN'],
      ],
      [2800, 3600, 3600]
    ),
    p('Variables de entorno mínimas del backend (.env): PORT, DB_USER, DB_PASSWORD, DB_NAME, DB_HOST, DB_PORT, JWT_SECRET, PUBLIC_BASE_URL, CORS_ORIGINS, FRONTEND_URL. Opcionales: GOOGLE_CLIENT_ID, SMTP_* para correo de recuperación.'),

    h1('5. Herramientas utilizadas para el desarrollo'),
    h3('Herramienta 1 — HTML5 / CSS3 / JavaScript (Vanilla)'),
    p('Descripción: lenguajes estándar de la Web para estructura, presentación y comportamiento del cliente.'),
    p('Motivo: permiten una interfaz liviana sin framework, fácil de desplegar como estáticos y alineada al alcance formativo del MVP.'),
    h3('Herramienta 2 — Node.js + Express'),
    p('Descripción: entorno de ejecución JavaScript del lado servidor y framework minimalista para API REST.'),
    p('Motivo: unifica el lenguaje con el frontend, acelera el desarrollo de endpoints de auth, productos y usuarios, y facilita el despliegue en VPS/PaaS.'),
    h3('Herramienta 3 — PostgreSQL'),
    p('Descripción: sistema de gestión de bases de datos relacional robusto y de código abierto.'),
    p('Motivo: integridad referencial, tipos numéricos precisos para precios, índices y escalabilidad adecuada para catálogo y usuarios.'),
    h3('Herramienta 4 — JSON Web Token (JWT) + bcrypt'),
    p('Descripción: mecanismo de autenticación sin estado y hash de contraseñas.'),
    p('Motivo: proteger rutas privadas (perfil, admin) y almacenar credenciales de forma segura.'),
    h3('Herramienta 5 — Multer'),
    p('Descripción: middleware de carga de archivos para Express.'),
    p('Motivo: permitir al administrador subir imágenes de productos al directorio uploads.'),
    h3('Herramienta 6 — Helmet + CORS'),
    p('Descripción: cabeceras de seguridad HTTP y control de orígenes cruzados.'),
    p('Motivo: endurecer la API frente a vectores comunes y permitir solo orígenes autorizados del frontend.'),
    h3('Herramienta 7 — Playwright (pruebas)'),
    p('Descripción: automatización de pruebas de interfaz en navegadores reales.'),
    p('Motivo: validar flujos críticos (tienda, menú móvil) como parte del aseguramiento de calidad.'),
    h3('Herramienta 8 — Visual Studio Code + Git'),
    p('Descripción: IDE liviano y sistema de control de versiones.'),
    p('Motivo: productividad en edición, depuración y trazabilidad de cambios.'),

    h1('6. Scripts (módulos frontend y backend)'),
    h2('6.1 Backend — estructura principal'),
    simpleTable(
      ['Archivo / carpeta', 'Función'],
      [
        ['backend/server.js', 'Arranque Express, Helmet, CORS, estáticos /uploads, /api/health, montaje de rutas'],
        ['backend/src/config/db.js', 'Pool de conexión PostgreSQL'],
        ['backend/src/routes/authRoutes.js', 'Rutas de autenticación y perfil'],
        ['backend/src/routes/productRoutes.js', 'CRUD de productos'],
        ['backend/src/routes/userRoutes.js', 'Gestión de usuarios (admin)'],
        ['backend/src/controllers/*', 'Lógica de negocio (auth, productos, usuarios)'],
        ['backend/src/middleware/verifyToken.js', 'Validación de JWT y rol'],
        ['backend/src/services/mailService.js', 'Envío SMTP de recuperación de clave'],
        ['database/schema.sql', 'Creación de tablas, índices y datos iniciales'],
        ['database/migration_*.sql', 'Migraciones (Google auth, letreros)'],
      ],
      [4000, 6000]
    ),
    h2('6.2 Frontend — módulos JavaScript'),
    simpleTable(
      ['Archivo', 'Función'],
      [
        ['frontend/js/config.js', 'API_URL, WhatsApp, redes, Google Client ID'],
        ['frontend/js/api.js', 'Cliente HTTP hacia la API'],
        ['frontend/js/auth.js', 'Sesión, login/registro, nav (Mi perfil/Admin), perfil'],
        ['frontend/js/cart.js', 'Carrito localStorage, sidebar bolsa, checkout WhatsApp'],
        ['frontend/js/main.js', 'Render de cards de productos en home/catálogo'],
        ['frontend/js/admin.js', 'Panel inventario y usuarios'],
        ['frontend/js/nav.js', 'Menú hamburguesa responsive'],
        ['frontend/js/utils.js', 'Utilidades UI (toasts, confirmaciones)'],
      ],
      [4000, 6000]
    ),
    h2('6.3 Páginas del frontend'),
    p('index.html (inicio), pages/productos.html, login.html, registro.html, recuperar.html, reset-password.html, perfil.html, carrito.html, admin.html, privacidad.html, 404.html.'),
    h2('6.4 Endpoints principales de la API'),
    simpleTable(
      ['Método y ruta', 'Descripción', 'Auth'],
      [
        ['GET /api/health', 'Salud del servicio y BD', 'No'],
        ['POST /api/auth/registro', 'Alta de cliente', 'No'],
        ['POST /api/auth/login', 'Inicio de sesión JWT', 'No'],
        ['POST /api/auth/google', 'Login con Google', 'No'],
        ['GET/PUT /api/auth/perfil', 'Consulta/edición de perfil', 'Sí'],
        ['POST /api/auth/recuperar', 'Solicitud reset password', 'No'],
        ['POST /api/auth/reset-password', 'Aplicar nueva clave', 'Token'],
        ['GET /api/products', 'Listado de productos', 'Público'],
        ['POST/PUT/DELETE /api/products', 'CRUD inventario', 'Admin'],
        ['GET/PATCH /api/users', 'Listar/activar usuarios', 'Admin'],
        ['POST /api/upload', 'Subida de imagen', 'Admin'],
      ],
      [3400, 4200, 2400]
    ),

    h1('7. Diseño de la arquitectura'),
    p('Arquitectura en tres capas: (1) Presentación — navegador con HTML/CSS/JS; (2) Aplicación — API Express; (3) Datos — PostgreSQL. Comunicación por HTTPS/HTTP JSON. Archivos de imagen servidos desde /uploads.'),

    h2('7.1 Diagrama de casos de uso del sistema'),
    p('Actores: Visitante, Cliente autenticado, Administrador.'),
    simpleTable(
      ['Actor', 'Casos de uso principales'],
      [
        ['Visitante', 'Ver inicio y catálogo; registrarse; iniciar sesión; recuperar contraseña; agregar al carrito (sesión local)'],
        ['Cliente', 'Gestionar perfil; usar carrito; comprar por WhatsApp; cerrar sesión'],
        ['Administrador', 'Todo lo del cliente + CRUD productos; activar/desactivar usuarios; subir imágenes; exportar inventario'],
      ],
      [2500, 7500]
    ),
    p('Relaciones: el Administrador hereda privilegios de Cliente y añade casos de gestión. El Visitante se convierte en Cliente tras autenticación exitosa.'),

    h2('7.2 Modelo entidad–relación de la base de datos'),
    p('Entidades principales y cardinalidades:'),
    bullet('usuarios (1) — (0..N) tokens_recuperacion'),
    bullet('usuarios (1) — (0..1) carrito ; carrito (1) — (0..N) carrito_items ; productos (1) — (0..N) carrito_items'),
    bullet('usuarios (1) — (0..N) pedidos ; pedidos (1) — (1..N) detalles_pedido ; productos (1) — (0..N) detalles_pedido'),
    bullet('productos es entidad independiente del catálogo (activo, letrero, descuento).'),
    p('Nota operativa del MVP: el carrito efectivo en UI usa localStorage; las tablas carrito/pedidos existen en el esquema para evolución futura. La compra actual se concreta por WhatsApp.'),

    h2('7.3 Diccionario de datos'),
    h3('Tabla usuarios'),
    simpleTable(
      ['Campo', 'Tipo', 'Descripción'],
      [
        ['id', 'SERIAL PK', 'Identificador único'],
        ['nombre / apellido', 'VARCHAR(100)', 'Nombre del usuario'],
        ['email', 'VARCHAR(255) UNIQUE', 'Correo de acceso'],
        ['password', 'VARCHAR(255)', 'Hash bcrypt (nullable si Google)'],
        ['google_id', 'VARCHAR(255)', 'Id de cuenta Google'],
        ['auth_provider', 'VARCHAR(20)', 'local | google'],
        ['telefono', 'VARCHAR(20)', 'Contacto'],
        ['rol', 'VARCHAR(20)', 'cliente | admin'],
        ['activo', 'BOOLEAN', 'Habilita/inhabilita acceso'],
        ['created_at / updated_at', 'TIMESTAMP', 'Auditoría temporal'],
      ],
      [2800, 2800, 4400]
    ),
    h3('Tabla productos'),
    simpleTable(
      ['Campo', 'Tipo', 'Descripción'],
      [
        ['id', 'SERIAL PK', 'Identificador'],
        ['nombre', 'VARCHAR(150)', 'Nombre comercial'],
        ['descripcion', 'TEXT', 'Descripción del yogur'],
        ['precio', 'NUMERIC(10,2)', 'Precio base ≥ 0'],
        ['stock', 'INT', 'Existencias ≥ 0'],
        ['imagen_url', 'VARCHAR(500)', 'URL o ruta de imagen'],
        ['categoria', 'VARCHAR(80)', 'Ej. Con Frutas, Griego'],
        ['activo', 'BOOLEAN', 'Soft-delete lógico'],
        ['letrero', 'VARCHAR(40)', 'Texto promocional'],
        ['letrero_tipo', 'VARCHAR(20)', 'nuevo|oferta|descuento|destacado'],
        ['descuento', 'INT', 'Porcentaje de descuento'],
      ],
      [2800, 2800, 4400]
    ),
    h3('Tabla tokens_recuperacion'),
    simpleTable(
      ['Campo', 'Tipo', 'Descripción'],
      [
        ['id', 'SERIAL PK', 'Identificador'],
        ['usuario_id', 'INT FK', 'Usuario solicitante'],
        ['token', 'VARCHAR(255) UNIQUE', 'Token de un solo uso'],
        ['usado', 'BOOLEAN', 'Marca de consumo'],
        ['expira_en', 'TIMESTAMP', 'Vigencia del token'],
      ],
      [2800, 2800, 4400]
    ),

    h2('7.4 Diagrama de componentes'),
    simpleTable(
      ['Componente', 'Depende de', 'Expone'],
      [
        ['Navegador / Frontend', 'API_URL, CDN Font Awesome', 'UI pública y admin'],
        ['API Express', 'PostgreSQL, JWT, Multer, SMTP', '/api/* , /uploads'],
        ['PostgreSQL', 'Sistema de archivos / volumen', 'Datos persistentes'],
        ['WhatsApp (externo)', 'Enlace wa.me configurado', 'Canal de pedido'],
        ['Google / Gmail (opc.)', 'Client ID / SMTP app password', 'OAuth y correo'],
      ],
      [3000, 3500, 3500]
    ),
    p('Flujo resumido: Usuario → Frontend → (JSON/JWT) → API → PostgreSQL. Respuesta JSON → UI. Pedido final → deep link WhatsApp.'),

    h1('8. Usuarios'),
    simpleTable(
      ['Rol', 'Privilegios', 'Restricciones'],
      [
        ['Visitante', 'Navegar, ver catálogo, usar carrito local, registrarse', 'No ve perfil ni admin'],
        ['Cliente', 'Perfil, recuperar/cambiar clave, carrito, WhatsApp', 'Sin CRUD de productos ni usuarios'],
        ['Administrador', 'Todo lo del cliente + inventario + usuarios + upload', 'No debe desactivar su propia cuenta crítica sin control'],
      ],
      [2200, 4200, 3600]
    ),
    p('La autorización se aplica en el middleware verifyToken: las rutas de administración exigen rol admin en el JWT. El frontend oculta/muestra enlaces Admin y Mi perfil según sesión.'),

    h1('9. Contingencias y soluciones'),
    simpleTable(
      ['Contingencia', 'Síntoma', 'Solución recomendada'],
      [
        ['API caída o BD desconectada', 'Error de red / health fail', 'Revisar servicio Node y PostgreSQL; validar .env; reiniciar proceso'],
        ['CORS bloqueado', 'Fetch fallido en consola', 'Agregar origen del frontend en CORS_ORIGINS'],
        ['API_URL incorrecta', 'Catálogo vacío en producción', 'Actualizar frontend/js/config.js al dominio real del API'],
        ['JWT inválido', 'Logout inesperado / 401', 'Verificar JWT_SECRET estable; renovar sesión'],
        ['SMTP no envía correo', 'No llega reset password', 'Configurar contraseña de aplicación Gmail; revisar MAIL_FROM'],
        ['Imagen no sube', 'Error en admin upload', 'Permisos de carpeta uploads; límite Multer; autenticación admin'],
        ['Puerto 3000 ocupado', 'Server no arranca', 'Cambiar PORT o liberar proceso'],
        ['Certificado TLS vencido', 'Aviso de seguridad', 'Renovar Let’s Encrypt / certificado del hosting'],
        ['Caché de navegador', 'UI “vieja” tras deploy', 'Ctrl+F5 o versionar assets'],
      ],
      [2800, 3000, 4200]
    ),

    h1('10. Instalación y despliegue técnico (resumen operativo)'),
    num(1, 'Crear base: CREATE DATABASE yoguraso_db; ejecutar database/schema.sql y migraciones necesarias.'),
    num(2, 'En backend/: copiar .env.example → .env; npm install; npm run dev (puerto 3000).'),
    num(3, 'Verificar GET http://localhost:3000/api/health.'),
    num(4, 'Servir frontend/ (Live Server u otro) y alinear API_URL en config.js.'),
    num(5, 'Crear usuario admin (script/seed o actualización de rol en BD) y probar login + panel.'),
    num(6, 'Para producción: desplegar API y estáticos, configurar DNS/HTTPS, CORS, secretos y backups.'),

    h1('11. Conclusiones'),
    p('YogurASO implementa un MVP web completo y mantenible: separación clara entre presentación, API y datos; autenticación con JWT; administración de catálogo y usuarios; y un flujo de compra realista vía WhatsApp. El presente manual técnico consolida la información necesaria para instalar, operar y evolucionar el sistema con criterios profesionales, sirviendo como base documental para evidencias de formación y para el equipo de soporte.'),

    h1('12. Bibliografía'),
    p('Express.js. (2024). Documentación oficial. https://expressjs.com', { align: AlignmentType.LEFT }),
    p('MDN Web Docs. (2024). HTML, CSS, JavaScript y HTTP. https://developer.mozilla.org', { align: AlignmentType.LEFT }),
    p('Node.js. (2024). Documentación LTS. https://nodejs.org', { align: AlignmentType.LEFT }),
    p('PostgreSQL Global Development Group. (2024). PostgreSQL Documentation. https://www.postgresql.org/docs/', { align: AlignmentType.LEFT }),
    p('Pressman, R. S., & Maxim, B. R. (2015). Software engineering: A practitioner’s approach (8.ª ed.). McGraw-Hill.', { align: AlignmentType.LEFT }),
    p('Servicio Nacional de Aprendizaje [SENA]. (2024). GFPI-F-135 V01 — Guía de aprendizaje.', { align: AlignmentType.LEFT }),
  ];

  return new Document({
    styles: {
      default: { document: { styles: [] } },
      paragraphStyles: [
        { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickStyle: true,
          paragraph: { spacing: { before: 320, after: 160 } },
          run: { font: 'Times New Roman', size: 28, bold: true } },
        { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickStyle: true,
          paragraph: { spacing: { before: 260, after: 120 } },
          run: { font: 'Times New Roman', size: 26, bold: true } },
        { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickStyle: true,
          paragraph: { spacing: { before: 200, after: 100 } },
          run: { font: 'Times New Roman', size: 24, bold: true, italics: true } },
      ],
    },
    sections: [{
      properties: { page: { margin: { top: 1008, right: 1008, bottom: 1008, left: 1008 } } },
      ...footerHeader('Manual Técnico · GA10-220501097-AA10-EV01'),
      children: kids,
    }],
  });
}

/* ===================== MANUAL USUARIO AA11 ===================== */
function buildUsuario() {
  const kids = [
    ...cover('Manual de Usuario', 'GA10-220501097-AA11-EV01'),
    tocTitle(),
    p('1. Introducción', { align: AlignmentType.LEFT, after: 50 }),
    p('2. Alcance funcional y organizacional', { align: AlignmentType.LEFT, after: 50 }),
    p('3. Prerrequisitos para el uso del sistema', { align: AlignmentType.LEFT, after: 50 }),
    p('   3.1 Requerimientos mínimos de hardware', { align: AlignmentType.LEFT, after: 50 }),
    p('   3.2 Requerimientos mínimos de software', { align: AlignmentType.LEFT, after: 50 }),
    p('   3.3 Configuración en el computador del usuario', { align: AlignmentType.LEFT, after: 50 }),
    p('4. Funcionalidad y servicios ofrecidos', { align: AlignmentType.LEFT, after: 50 }),
    p('   4.1 Cómo acceder a la aplicación (URL)', { align: AlignmentType.LEFT, after: 50 }),
    p('   4.2 Página de bienvenida (Inicio)', { align: AlignmentType.LEFT, after: 50 }),
    p('   4.3 Quiénes somos / identidad de marca', { align: AlignmentType.LEFT, after: 50 }),
    p('   4.4 Consulta de productos y navegación', { align: AlignmentType.LEFT, after: 50 }),
    p('5. Paso a paso de cada opción del sistema', { align: AlignmentType.LEFT, after: 50 }),
    p('   5.1 Usuario Administrador', { align: AlignmentType.LEFT, after: 50 }),
    p('   5.2 Usuario Cliente', { align: AlignmentType.LEFT, after: 50 }),
    p('6. Preguntas frecuentes', { align: AlignmentType.LEFT, after: 50 }),
    p('7. Solución de problemas', { align: AlignmentType.LEFT, after: 50 }),
    p('8. Datos de contacto', { align: AlignmentType.LEFT, after: 50 }),
    p('9. Glosario', { align: AlignmentType.LEFT, after: 50 }),
    p('10. Conclusiones', { align: AlignmentType.LEFT, after: 50 }),
    p('11. Bibliografía', { align: AlignmentType.LEFT, after: 200 }),
    new Paragraph({ children: [new PageBreak()] }),

    h1('1. Introducción'),
    p('Bienvenido(a) al Manual de Usuario de YogurASO, el sistema de información web de la marca de yogurt artesanal YogurASO. Este documento explica, en lenguaje claro, cómo utilizar la tienda en línea: explorar sabores, crear una cuenta, iniciar sesión, armar el carrito (bolsa), enviar el pedido por WhatsApp y, si usted es administrador, gestionar el inventario y los usuarios.'),
    p('Módulos y funcionalidades principales:'),
    bullet('Inicio / vitrina de marca y productos destacados.'),
    bullet('Catálogo de productos con precios, stock, categorías y letreros (nuevo, oferta, descuento, destacado).'),
    bullet('Registro e inicio de sesión (correo/clave o Google, si está habilitado).'),
    bullet('Recuperación y cambio de contraseña.'),
    bullet('Mi perfil (datos personales y acceso a pedidos/seguridad según pestañas).'),
    bullet('Carrito o bolsa de compra en el encabezado.'),
    bullet('Panel Admin: inventario (crear/editar/desactivar productos) y usuarios (activar/pausar).'),
    bullet('Página de privacidad y manejo de error 404.'),

    h1('2. Alcance funcional y organizacional'),
    h2('2.1 Alcance funcional (negocio)'),
    p('Desde el punto de vista del negocio, YogurASO apoya la comercialización de yogurt artesanal al detal y con orientación a mayoristas del Huila (Tello y Neiva). El sistema permite:'),
    bullet('Difundir el catálogo de sabores y precios actualizados.'),
    bullet('Captar clientes mediante registro y perfil.'),
    bullet('Construir un pedido en el navegador y remitirlo por WhatsApp al canal comercial.'),
    bullet('Administrar el inventario y el estado de las cuentas desde un panel restringido.'),
    p('Procesos de negocio apoyados: divulgación de oferta → selección de productos → autenticación del cliente → armado del pedido → contacto comercial por WhatsApp → gestión interna de stock y usuarios. No incluye facturación electrónica ni pasarela de pagos; el acuerdo comercial se cierra fuera de la pasarela, vía mensajería.'),

    h2('2.2 Alcance organizacional (grupos de interés)'),
    simpleTable(
      ['Grupo de interés', 'Tipo', 'Rol / impacto', 'Prioridad'],
      [
        ['Clientes finales', 'Externo', 'Compran / consultan catálogo', 'Alta'],
        ['Mayoristas / aliados', 'Externo', 'Consultan oferta y contactan por WhatsApp', 'Alta'],
        ['Administrador de tienda', 'Interno', 'Gestiona productos y usuarios', 'Alta'],
        ['Equipo comercial YogurASO', 'Interno', 'Atiende pedidos WhatsApp', 'Alta'],
        ['Desarrollador / soporte TI', 'Interno', 'Mantiene el sistema', 'Media'],
        ['Instructor SENA / evaluadores', 'Externo formativo', 'Revisa evidencias del proyecto', 'Media'],
      ],
      [2800, 1600, 3600, 2000]
    ),

    h1('3. Prerrequisitos para el uso del sistema por parte del usuario final'),
    h2('3.1 Requerimientos mínimos de hardware'),
    simpleTable(
      ['Recurso', 'Mínimo recomendado'],
      [
        ['Procesador', 'Dual-core 1.5 GHz o superior (PC) / smartphone gama media'],
        ['Memoria RAM', '4 GB en computador; 3 GB en celular'],
        ['Disco / almacenamiento', 'Espacio libre suficiente para el navegador y caché'],
        ['Pantalla', 'HD 1366×768 o móvil desde 5 pulgadas'],
        ['Conexión', 'Internet banda ancha o datos móviles estables'],
      ],
      [3500, 6500]
    ),
    h2('3.2 Requerimientos mínimos de software'),
    simpleTable(
      ['Elemento', 'Detalle'],
      [
        ['Sistema operativo', 'Windows 10/11, macOS, Android 10+, iOS 14+ o Linux con navegador moderno'],
        ['Licencias', 'No se requiere licencia de pago para usar la tienda; basta un navegador actualizado'],
        ['Links de acceso', 'Entorno local típico: http://127.0.0.1:5500/index.html (frontend) y API en http://localhost:3000. En producción: la URL pública del dominio YogurASO configurada por el administrador'],
        ['Navegadores compatibles', 'Google Chrome, Microsoft Edge y Mozilla Firefox (últimas dos versiones estables). Safari en iOS/macOS compatible con el diseño responsivo'],
        ['Permisos por rol', 'Visitante: solo público. Cliente: cuenta activa. Administrador: rol admin asignado en base de datos / panel'],
      ],
      [3200, 6800]
    ),
    h2('3.3 Configuración del sistema en el computador del usuario'),
    bullet('Tener instalado un navegador actualizado (Chrome/Edge/Firefox).'),
    bullet('Permitir JavaScript (habilitado por defecto).'),
    bullet('No bloquear cookies/almacenamiento local del sitio (el carrito usa localStorage).'),
    bullet('Si usa bloqueadores agresivos, permitir el dominio de YogurASO y el de la API.'),
    bullet('En corporativos: abrir puertos/salida HTTPS hacia el hosting y, si aplica, WhatsApp Web.'),
    bullet('Para pedidos: disponer de WhatsApp instalado o WhatsApp Web para enviar el mensaje generado.'),
    bullet('No se requiere instalar software adicional ni impresoras especiales para usar la tienda.'),

    h1('4. Funcionalidad y servicios ofrecidos'),
    h2('4.1 Cómo acceder a la aplicación (dirección URL)'),
    p('1) Abra el navegador. 2) Escriba la dirección suministrada por el administrador. En desarrollo formativo suele ser http://127.0.0.1:5500/ (Live Server sobre la carpeta frontend). En producción será https://su-dominio (ejemplo ilustrativo: https://yoguraso.com). 3) Pulse Enter. Debe aparecer la portada con el logo YogurASO, el menú Inicio / Productos / Contacto y el ícono de la bolsa.'),
    p('Si la página no carga, verifique internet, la URL exacta y que el servicio esté publicado (sección Solución de problemas).'),

    h2('4.2 Página de bienvenida (Inicio)'),
    p('La página de inicio presenta la identidad de marca YogurASO (hero), beneficios del producto, productos destacados en tarjetas y acceso rápido al catálogo. El encabezado (header) es común a todo el sitio:'),
    bullet('Logo YogurASO → vuelve al inicio.'),
    bullet('Menú: Inicio, Productos, Contacto; si hay sesión: Mi perfil; si es admin: Admin.'),
    bullet('Ícono de bolsa → abre el panel lateral del carrito.'),
    bullet('En celular: botón de tres rayas (menú hamburguesa).'),
    p('Pie de página: enlaces de cuenta, contacto (correo hola@yoguraso.co y WhatsApp comercial), privacidad y derechos de autor. No hay sidebar permanente; el carrito actúa como panel lateral (sidebar) temporal.'),

    h2('4.3 Quiénes somos / identidad de marca'),
    p('YogurASO se presenta como yogurt artesanal del Huila. En la home y secciones de contenido se comunican valores de naturalidad, sabor y cercanía comercial (detal y mayoristas). El visitante encuentra el mensaje de marca en el hero y en bloques informativos; el contacto formal está en el pie y en la sección Contacto del inicio (ancla #contact).'),

    h2('4.4 Consulta de productos, usuarios, rutas'),
    p('Productos: menú Productos o CTA del inicio. Cada tarjeta muestra nombre, precio, categoría, letrero si aplica y botón para agregar a la bolsa. Usuarios: gestión solo en Admin (listado, búsqueda, activar/desactivar). Rutas principales: /index.html, /pages/productos.html, /pages/login.html, /pages/registro.html, /pages/perfil.html, /pages/carrito.html, /pages/admin.html, /pages/recuperar.html, /pages/privacidad.html.'),

    h1('5. Paso a paso de cada opción del sistema'),
    h2('5.1 Usuario Administrador'),
    h3('5.1.1 Inicio de sesión (Administrador)'),
    num(1, 'Ingrese a pages/login.html (enlace Entrar / Mi perfil según estado).'),
    num(2, 'Digite el correo y la contraseña de la cuenta con rol admin.'),
    num(3, 'Pulse Entrar. El sistema guarda el token JWT en el navegador.'),
    num(4, 'En el menú aparecerá Admin. Ábralo para entrar al panel.'),
    h3('5.1.2 Registro de usuario'),
    p('El registro público crea cuentas con rol cliente. Un administrador no “se auto-registra” como admin desde el formulario abierto: el rol admin se asigna de forma controlada en base de datos o por procedimiento interno de seguridad. Para dar de alta un cliente: use Registro (nombre, apellido, email, clave) o solicite al usuario que se registre solo.'),
    h3('5.1.3 Modificación de usuarios'),
    num(1, 'En Admin, abra la subsección Usuarios.'),
    num(2, 'Busque por nombre o email.'),
    num(3, 'Active o pause la cuenta según política (no desactive su propia cuenta administrativa sin otro admin de respaldo).'),
    num(4, 'Los datos personales del admin también pueden editarse en Mi perfil.'),
    h3('5.1.4 Gestión de productos (inventario)'),
    num(1, 'En Admin → Inventario revise la hoja de productos.'),
    num(2, 'Use Nuevo yogur para crear: nombre, descripción real, precio, stock, categoría, imagen, letrero y descuento.'),
    num(3, 'Edite o desactive productos (soft-delete: dejan de mostrarse en catálogo).'),
    num(4, 'Exporte CSV si necesita un respaldo tabular del inventario.'),
    h3('5.1.5 Eliminación / desactivación de usuarios'),
    p('La política del sistema privilegia la desactivación (activo = false) frente al borrado físico, para conservar trazabilidad. Desde Admin → Usuarios, pause cuentas que no deban ingresar. La eliminación definitiva, si se requiere, es un procedimiento técnico de base de datos fuera del uso cotidiano del panel.'),
    h3('5.1.6 Cerrar sesión'),
    num(1, 'Vaya a Mi perfil o use la opción de cerrar sesión disponible en la interfaz de cuenta.'),
    num(2, 'Confirme el cierre. El token se elimina y el menú vuelve al estado de visitante.'),

    h2('5.2 Usuario Cliente'),
    h3('5.2.1 Inicio de sesión'),
    num(1, 'Abra Login.'),
    num(2, 'Ingrese email y contraseña (o botón Google si está configurado).'),
    num(3, 'Al autenticarse verá Mi perfil en el menú y podrá continuar su compra.'),
    h3('5.2.2 Registro de usuario'),
    num(1, 'Abra Registro.'),
    num(2, 'Complete nombre, apellido, correo y contraseña segura.'),
    num(3, 'Envíe el formulario. Si el correo ya existe, el sistema lo indicará.'),
    num(4, 'Inicie sesión con las nuevas credenciales.'),
    h3('5.2.3 Explorar productos y armar el carrito'),
    num(1, 'Vaya a Productos.'),
    num(2, 'Pulse agregar en las tarjetas deseadas.'),
    num(3, 'Abra la bolsa (ícono del header) para ver cantidades, total, vaciar o comprar.'),
    num(4, 'Comprar por WhatsApp genera el mensaje con el detalle del pedido.'),
    h3('5.2.4 Mi perfil y seguridad'),
    num(1, 'Entre a Mi perfil.'),
    num(2, 'Actualice datos de contacto.'),
    num(3, 'En seguridad, cambie la contraseña si el proveedor es local.'),
    num(4, 'Si olvidó la clave desde Login, use Recuperar y siga el enlace del correo (o instrucciones del entorno formativo).'),
    h3('5.2.5 Cerrar sesión'),
    p('Desde Mi perfil seleccione Cerrar sesión. Confirme. La bolsa puede conservar ítems locales según el diseño actual del carrito en el navegador; la sesión de cuenta sí queda cerrada.'),

    h1('6. Preguntas frecuentes'),
    h3('Sobre resultados — ¿Qué puedo hacer con el sistema?'),
    p('Puede conocer el catálogo YogurASO, crear cuenta, armar un pedido en la bolsa y enviarlo por WhatsApp. Si es administrador, además gestiona productos y usuarios.'),
    h3('Sobre conceptos — ¿Qué es la bolsa?'),
    p('Es el carrito de compras del encabezado. Guarda temporalmente los productos que piensa pedir antes de enviarlos por WhatsApp.'),
    h3('Sobre procedimientos — ¿Cómo compro?'),
    p('Agregue productos → abra la bolsa → pulse Comprar por WhatsApp → complete la conversación con el asesor comercial.'),
    h3('Sobre interpretaciones — ¿Qué significa un producto inactivo?'),
    p('El administrador lo ocultó del catálogo (no está disponible para la venta en la web), aunque puede conservarse en base de datos.'),
    h3('Sobre navegación — ¿Dónde estoy y a dónde seguir?'),
    p('El menú superior indica Inicio, Productos y Contacto. Tras iniciar sesión use Mi perfil. El admin usa la opción Admin. El logo siempre regresa al inicio.'),

    h1('7. Solución de problemas'),
    simpleTable(
      ['Problema', 'Rol', 'Qué hacer'],
      [
        ['No carga la página', 'Todos', 'Verificar URL, internet y que el sitio esté en línea'],
        ['No inicia sesión', 'Cliente/Admin', 'Revisar correo/clave; cuenta activa; Caps Lock; usar Recuperar'],
        ['No llega correo de recuperación', 'Cliente', 'Revisar spam; confirmar SMTP configurado; contactar soporte'],
        ['Catálogo vacío', 'Todos', 'API caída o API_URL mal configurada; avisar a soporte técnico'],
        ['No aparece Admin', 'Usuario', 'Su rol no es admin; solicitar habilitación al administrador del sistema'],
        ['La bolsa no guarda', 'Cliente', 'Permitir almacenamiento del sitio; no usar modo que bloquee localStorage'],
        ['WhatsApp no abre', 'Cliente', 'Instalar WhatsApp o usar WhatsApp Web; permitir ventanas emergentes'],
        ['Vista rota en el celular', 'Todos', 'Actualizar navegador; usar menú hamburguesa; ampliar con gestos solo si es necesario'],
        ['Error al subir imagen', 'Admin', 'Verificar sesión admin, formato de imagen y tamaño'],
      ],
      [2800, 1600, 5600]
    ),

    h1('8. Datos de contacto'),
    p('Soporte comercial YogurASO:'),
    bullet('Correo: hola@yoguraso.co'),
    bullet('WhatsApp: +57 300 123 4567 (número configurado en el proyecto; validar el vigente en config.js / pie de página)'),
    p('Soporte técnico / administración del sistema (proyecto formativo): canal interno del equipo de desarrollo o mesa de ayuda definida por el instructor. Para incidentes de acceso admin, escriba al administrador técnico con capturas y hora del error.'),

    h1('9. Glosario'),
    simpleTable(
      ['Término', 'Significado en YogurASO'],
      [
        ['API', 'Servicio backend que entrega datos (productos, login, etc.) al sitio'],
        ['Bolsa / Carrito', 'Lista temporal de productos a pedir'],
        ['JWT', 'Token de sesión que demuestra que usted inició sesión'],
        ['Letrero', 'Etiqueta promocional del producto (nuevo, oferta, etc.)'],
        ['MVP', 'Producto mínimo viable: versión funcional inicial'],
        ['Rol admin', 'Permiso para gestionar inventario y usuarios'],
        ['Soft-delete', 'Desactivar sin borrar físicamente el registro'],
        ['WhatsApp checkout', 'Envío del pedido por mensajería en lugar de pago en línea'],
      ],
      [2500, 7500]
    ),

    h1('10. Conclusiones'),
    p('Este manual orienta al usuario final —cliente o administrador— para aprovechar YogurASO de forma segura y ordenada: desde la navegación del catálogo hasta el pedido por WhatsApp y la gestión del inventario. Seguir los pasos descritos reduce errores, unifica el uso del sistema en el equipo comercial y facilita el soporte. Ante cualquier duda no resuelta aquí, utilice los datos de contacto y la sección de solución de problemas.'),

    h1('11. Bibliografía'),
    p('Google. (2024). Ayuda de Chrome y prácticas de navegación segura. https://support.google.com/chrome', { align: AlignmentType.LEFT }),
    p('MDN Web Docs. (2024). Guías para usuarios y desarrolladores web. https://developer.mozilla.org', { align: AlignmentType.LEFT }),
    p('Nielsen Norman Group. (2020). Usabilidad y experiencia de usuario en la web. https://www.nngroup.com', { align: AlignmentType.LEFT }),
    p('Servicio Nacional de Aprendizaje [SENA]. (2024). GFPI-F-135 V01 — Guía de aprendizaje y lineamientos de manuales de usuario.', { align: AlignmentType.LEFT }),
    p('YogurASO-WEB. (2026). README y documentación interna del proyecto formativo.', { align: AlignmentType.LEFT }),
  ];

  return new Document({
    styles: {
      paragraphStyles: [
        { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickStyle: true,
          paragraph: { spacing: { before: 320, after: 160 } },
          run: { font: 'Times New Roman', size: 28, bold: true } },
        { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickStyle: true,
          paragraph: { spacing: { before: 260, after: 120 } },
          run: { font: 'Times New Roman', size: 26, bold: true } },
        { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickStyle: true,
          paragraph: { spacing: { before: 200, after: 100 } },
          run: { font: 'Times New Roman', size: 24, bold: true, italics: true } },
      ],
    },
    sections: [{
      properties: { page: { margin: { top: 1008, right: 1008, bottom: 1008, left: 1008 } } },
      ...footerHeader('Manual de Usuario · GA10-220501097-AA11-EV01'),
      children: kids,
    }],
  });
}

async function main() {
  const bufT = await Packer.toBuffer(buildTecnico());
  fs.writeFileSync(OUT_TEC, bufT);
  console.log('OK', OUT_TEC);

  const bufU = await Packer.toBuffer(buildUsuario());
  fs.writeFileSync(OUT_USR, bufU);
  console.log('OK', OUT_USR);

  // También reemplazar nombres “plantilla” por versiones llenas (copias claras)
  const tecCopy = path.join(DL, 'Plantilla_manual_tecnico_GA10-220501097-AA10-EV01_LLENADO.docx');
  const usrCopy = path.join(DL, 'Plantilla_manual_usuario_GA10-220501097-AA11-EV01_LLENADO.docx');
  fs.copyFileSync(OUT_TEC, tecCopy);
  fs.copyFileSync(OUT_USR, usrCopy);
  console.log('OK', tecCopy);
  console.log('OK', usrCopy);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
