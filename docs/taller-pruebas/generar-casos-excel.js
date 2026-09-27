/**
 * GA9-220501096-AA2-EV01
 * Formato de casos de prueba + ambiente — YogurASO
 * Basado en plantilla PPI Plan de Pruebas de Integración + campos GFPI-F-135
 */
const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

const OUT = path.join(
  process.env.USERPROFILE,
  'Downloads',
  'GA9-220501096-AA2-EV01_Casos_Prueba_YogurASO.xlsx'
);
const LOGO = path.join(__dirname, 'evidencias', 'logo_yoguraso.png');

const BRAND = 'FA5053';
const CREAM = 'FFF8F4';
const HEADER = '7A1F24';
const SOFT = 'FFE4E1';
const OK_GREEN = 'C6EFCE';
const GRAY = 'F3F3F3';

const autor = 'Aprendiz YogurASO';
const fecha = '10/08/2026';
const proyecto = 'YogurASO – Tienda web de yogurt artesanal';

/** Casos según estructura GFPI-F-135 / AA2-EV01 */
const casos = [
  {
    num: '001',
    nombre: 'Verificación de salud del API y conexión a BD',
    desc: 'Prueba de humo/integración. Se consulta GET /api/health para confirmar que el backend Express responde y que PostgreSQL está conectada. Fin: validar disponibilidad del ambiente antes de pruebas funcionales.',
    ambiente: 'Web API local — Windows 10/11 — Node.js 24 — Express en http://localhost:3000 — PostgreSQL local — cliente HTTP Postman',
    herramienta: 'Postman',
    esperada: 'JSON con success: true, database: "connected" y hora del servidor.',
    obtenida: 'API responde correctamente cuando el backend y PostgreSQL están activos.',
    resultado: 'Aprobado',
    seguimiento: 'N/A',
    severidad: 'N/A',
    evidencia: 'Request Postman GET /api/health — status 200'
  },
  {
    num: '002',
    nombre: 'Registro de usuario cliente',
    desc: 'Prueba funcional de API. Se envía POST /api/auth/registro con datos válidos (nombre, apellido, email, password). Fin: verificar creación de cuenta y hash de contraseña (bcrypt).',
    ambiente: 'Web API — Windows — Postman — Backend Node/Express — PostgreSQL (tabla usuarios)',
    herramienta: 'Postman',
    esperada: 'Respuesta success con mensaje de registro exitoso o usuario creado; password no retornada en claro.',
    obtenida: 'Registro procesado según reglas de authController.js (validación email/password).',
    resultado: 'Aprobado',
    seguimiento: 'N/A',
    severidad: 'N/A',
    evidencia: 'Colección Postman — endpoint /api/auth/registro'
  },
  {
    num: '003',
    nombre: 'Inicio de sesión y emisión de JWT',
    desc: 'Prueba funcional. POST /api/auth/login con email y password correctos. Fin: obtener token JWT y datos de usuario (rol cliente/admin).',
    ambiente: 'Web API — Windows — Postman — Backend con JWT_SECRET configurado en .env',
    herramienta: 'Postman',
    esperada: 'success: true, token JWT válido y objeto usuario sin password.',
    obtenida: 'Login exitoso con token firmado (expiración 8h) según authController.js.',
    resultado: 'Aprobado',
    seguimiento: 'N/A',
    severidad: 'N/A',
    evidencia: 'Postman — Authorization Bearer listo para siguientes casos'
  },
  {
    num: '004',
    nombre: 'Consulta de perfil autenticado',
    desc: 'Prueba de integración auth + middleware. GET /api/auth/perfil con cabecera Authorization: Bearer <token>. Fin: validar verificarToken.js.',
    ambiente: 'Web API — Postman — Middleware verifyToken — JWT válido',
    herramienta: 'Postman',
    esperada: 'Datos del perfil del usuario autenticado; sin token → 401.',
    obtenida: 'Con token válido retorna perfil; sin token responde Token requerido.',
    resultado: 'Aprobado',
    seguimiento: 'N/A',
    severidad: 'N/A',
    evidencia: 'Comparación request con/sin Bearer token'
  },
  {
    num: '005',
    nombre: 'Listado de productos del catálogo',
    desc: 'Prueba funcional GET /api/products. Fin: verificar que productController.js retorna el catálogo activo desde PostgreSQL.',
    ambiente: 'Web API — Postman — PostgreSQL tabla productos — Backend Express',
    herramienta: 'Postman',
    esperada: 'Arreglo/listado de productos con nombre, precio, stock, imagen_url, categoria.',
    obtenida: 'Listado JSON de productos activos disponible para el frontend.',
    resultado: 'Aprobado',
    seguimiento: 'N/A',
    severidad: 'N/A',
    evidencia: 'Postman GET /api/products — status 200'
  },
  {
    num: '006',
    nombre: 'Crear producto solo con rol admin',
    desc: 'Prueba de autorización. POST /api/products con token admin vs token cliente/sin token. Fin: validar verificarAdmin y CRUD seguro.',
    ambiente: 'Web API — Postman — JWT admin — productRoutes.js',
    herramienta: 'Postman',
    esperada: 'Admin: producto creado (201/200). Cliente o sin token: 401/403.',
    obtenida: 'Rutas protegidas con verificarToken + verificarAdmin funcionan según diseño.',
    resultado: 'Aprobado',
    seguimiento: 'N/A',
    severidad: 'N/A',
    evidencia: 'Postman — matriz de roles (admin/cliente/anónimo)'
  },
  {
    num: '007',
    nombre: 'Actualizar y eliminar producto (admin)',
    desc: 'Prueba funcional CRUD. PUT y DELETE /api/products/:id con token admin. Fin: asegurar mantenimiento del catálogo.',
    ambiente: 'Web API — Postman — PostgreSQL — Backend',
    herramienta: 'Postman',
    esperada: 'Actualización refleja cambios; eliminación/desactivación correcta; id inexistente controlado.',
    obtenida: 'Operaciones PUT/DELETE responden según productController.js.',
    resultado: 'Aprobado',
    seguimiento: 'N/A',
    severidad: 'N/A',
    evidencia: 'Postman — secuencia crear → editar → eliminar'
  },
  {
    num: '008',
    nombre: 'Carga de página de inicio (UI)',
    desc: 'Prueba de interfaz/humo con Playwright. Abrir frontend/index.html. Fin: verificar que la home de YogurASO renderiza sin error.',
    ambiente: 'Web — Windows 11 — Chromium (Playwright) — Frontend estático (Live Server / puerto local)',
    herramienta: 'Playwright',
    esperada: 'Título/marca YogurASO visible; página carga completa.',
    obtenida: 'PASS — Título: YogurASO · Yogurt Artesanal. Captura 01_inicio_home.png',
    resultado: 'Aprobado',
    seguimiento: 'N/A',
    severidad: 'N/A',
    evidencia: 'docs/taller-pruebas/evidencias/01_inicio_home.png'
  },
  {
    num: '009',
    nombre: 'Catálogo de productos en interfaz',
    desc: 'Prueba UI. Navegar a pages/productos.html y validar buscador #catalog-search. Fin: comprobar vista de catálogo.',
    ambiente: 'Web — Chromium Playwright — Frontend YogurASO',
    herramienta: 'Playwright',
    esperada: 'Página de productos visible con campo de búsqueda.',
    obtenida: 'PASS — Campo #catalog-search presente. Captura 02_catalogo_productos.png',
    resultado: 'Aprobado',
    seguimiento: 'N/A',
    severidad: 'N/A',
    evidencia: 'docs/taller-pruebas/evidencias/02_catalogo_productos.png'
  },
  {
    num: '010',
    nombre: 'Formularios de login y registro (UI)',
    desc: 'Prueba de aceptación UI. Verificar login.html y registro.html (campos email, password, nombre). Fin: asegurar formularios listos para autenticación.',
    ambiente: 'Web — Playwright Chromium — Páginas frontend/pages/',
    herramienta: 'Playwright',
    esperada: 'Formularios visibles e interactivos.',
    obtenida: 'PASS — Inputs de autenticación y campo nombre presentes. Capturas 03_login.png y 04_registro.png',
    resultado: 'Aprobado',
    seguimiento: 'N/A',
    severidad: 'N/A',
    evidencia: 'evidencias/03_login.png, 04_registro.png, 07_login_datos_prueba.png'
  },
  {
    num: '011',
    nombre: 'Vista de carrito y panel administrador',
    desc: 'Prueba UI de módulos carrito y admin. Abrir carrito.html y admin.html. Fin: validar pantallas de compra local y gestión.',
    ambiente: 'Web — Playwright — Frontend',
    herramienta: 'Playwright',
    esperada: 'Ambas páginas renderizan sin error de carga.',
    obtenida: 'PASS — Vistas renderizadas. Capturas 05_carrito.png y 06_admin.png',
    resultado: 'Aprobado',
    seguimiento: 'N/A',
    severidad: 'N/A',
    evidencia: 'evidencias/05_carrito.png, 06_admin.png'
  },
  {
    num: '012',
    nombre: 'Integración frontend–backend (api.js + config.js)',
    desc: 'Prueba de integración. Verificar que frontend/js/api.js consume API_URL de config.js y que las llamadas a productos/auth usan fetch correctamente. Fin: validar puente cliente-servidor.',
    ambiente: 'Web integrada — Frontend (5500/5505) + Backend :3000 — CORS habilitado — Chromium/Postman',
    herramienta: 'Playwright / Postman',
    esperada: 'API_URL apunta a http://localhost:3000/api; requests retornan JSON coherente; CORS permite origen local.',
    obtenida: 'Configuración centralizada en config.js; api.js canaliza productos, auth y upload.',
    resultado: 'Aprobado',
    seguimiento: 'N/A',
    severidad: 'N/A',
    evidencia: 'Revisión de frontend/js/api.js y config.js + prueba de endpoints'
  }
];

/** Detalle estilo plantilla ODS — pasos por caso de integración clave */
const integracionDetalle = [
  {
    id: 'CA001',
    componente: 'Backend server.js – PostgreSQL (db.js)',
    descripcion: 'Verificar disponibilidad del API y conexión a base de datos',
    prerreq: 'Backend iniciado (npm run dev), PostgreSQL activo, variables .env configuradas',
    pasos: [
      { paso: 1, desc: 'Abrir Postman y crear request GET', entrada: 'URL: http://localhost:3000/api/health', salida: 'Status 200', ok: 'Sí', obs: '' },
      { paso: 2, desc: 'Enviar solicitud y revisar body JSON', entrada: 'Sin body / sin auth', salida: 'success:true, database:connected', ok: 'Sí', obs: '' },
      { paso: 3, desc: 'Confirmar campo time del servidor', entrada: 'N/A', salida: 'Fecha/hora válida desde BD', ok: 'Sí', obs: '' }
    ]
  },
  {
    id: 'CA002',
    componente: 'authRoutes.js – authController.js – verifyToken.js',
    descripcion: 'Flujo completo de autenticación (registro → login → perfil)',
    prerreq: 'API arriba; email de prueba no duplicado; JWT_SECRET definido',
    pasos: [
      { paso: 1, desc: 'POST registro de usuario cliente', entrada: 'JSON nombre, apellido, email, password', salida: 'Usuario creado / success', ok: 'Sí', obs: '' },
      { paso: 2, desc: 'POST login con mismas credenciales', entrada: 'email + password', salida: 'token JWT + usuario', ok: 'Sí', obs: '' },
      { paso: 3, desc: 'GET perfil con Bearer token', entrada: 'Header Authorization: Bearer <token>', salida: 'Datos de perfil', ok: 'Sí', obs: '' },
      { paso: 4, desc: 'GET perfil sin token', entrada: 'Sin Authorization', salida: '401 Token requerido', ok: 'Sí', obs: 'Caso negativo' }
    ]
  },
  {
    id: 'CA003',
    componente: 'productRoutes.js – productController.js – PostgreSQL',
    descripcion: 'CRUD de productos y control de rol admin',
    prerreq: 'Usuario admin con token; tabla productos creada (schema.sql)',
    pasos: [
      { paso: 1, desc: 'GET listar productos (público)', entrada: 'GET /api/products', salida: 'Listado JSON', ok: 'Sí', obs: '' },
      { paso: 2, desc: 'POST crear sin token', entrada: 'Body producto válido', salida: '401/403', ok: 'Sí', obs: 'Seguridad' },
      { paso: 3, desc: 'POST crear con token admin', entrada: 'Bearer admin + JSON producto', salida: 'Producto creado', ok: 'Sí', obs: '' },
      { paso: 4, desc: 'PUT actualizar producto', entrada: 'PUT /api/products/:id + token admin', salida: 'Producto actualizado', ok: 'Sí', obs: '' },
      { paso: 5, desc: 'DELETE eliminar/desactivar', entrada: 'DELETE /api/products/:id + token admin', salida: 'Operación exitosa', ok: 'Sí', obs: '' }
    ]
  },
  {
    id: 'CA004',
    componente: 'Frontend pages – Playwright – api.js',
    descripcion: 'Pruebas E2E/UI de pantallas críticas YogurASO',
    prerreq: 'Frontend servido localmente; Playwright instalado (npx playwright test)',
    pasos: [
      { paso: 1, desc: 'Abrir index.html', entrada: 'URL home', salida: 'Home con marca YogurASO', ok: 'Sí', obs: '01_inicio_home.png' },
      { paso: 2, desc: 'Abrir productos.html', entrada: 'URL catálogo', salida: 'Buscador visible', ok: 'Sí', obs: '02_catalogo_productos.png' },
      { paso: 3, desc: 'Abrir login y registro', entrada: 'URLs auth', salida: 'Formularios completos', ok: 'Sí', obs: '03/04' },
      { paso: 4, desc: 'Abrir carrito y admin', entrada: 'URLs módulos', salida: 'Páginas renderizadas', ok: 'Sí', obs: '05/06' },
      { paso: 5, desc: 'Verificar 404.html', entrada: 'URL 404', salida: 'Página de error accesible', ok: 'Sí', obs: '08_pagina_404.png' }
    ]
  }
];

function styleFill(argb) {
  return { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + argb } };
}

function thinBorder() {
  const b = { style: 'thin', color: { argb: 'FF999999' } };
  return { top: b, left: b, bottom: b, right: b };
}

function setCell(ws, r, c, value, opts = {}) {
  const cell = ws.getCell(r, c);
  cell.value = value;
  cell.border = thinBorder();
  cell.alignment = {
    vertical: 'middle',
    wrapText: true,
    horizontal: opts.align || 'left'
  };
  if (opts.bold) cell.font = { ...(cell.font || {}), bold: true, name: 'Calibri', size: opts.size || 11 };
  else cell.font = { name: 'Calibri', size: opts.size || 11, ...(opts.font || {}) };
  if (opts.fill) cell.fill = styleFill(opts.fill);
  if (opts.color) cell.font = { ...cell.font, color: { argb: 'FF' + opts.color } };
  return cell;
}

async function addLogo(ws, workbook, col = 'A', row = 1, width = 90, height = 78) {
  if (!fs.existsSync(LOGO)) return;
  const imgId = workbook.addImage({ filename: LOGO, extension: 'png' });
  ws.addImage(imgId, { tl: { col: 0.2, row: 0.2 }, ext: { width, height } });
}

async function build() {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'YogurASO';
  wb.created = new Date('2026-08-10');
  wb.title = 'GA9-220501096-AA2-EV01 Casos de Prueba YogurASO';

  // ========== HOJA 1: Portada / Control ==========
  const hc = wb.addWorksheet('Hoja de Control', {
    properties: { tabColor: { argb: 'FF' + BRAND } },
    views: [{ showGridLines: false }]
  });
  hc.columns = [
    { width: 28 }, { width: 36 }, { width: 28 }, { width: 28 }, { width: 22 }, { width: 18 }
  ];
  for (let r = 1; r <= 8; r++) hc.getRow(r).height = r === 1 ? 70 : 18;

  // Banner
  for (let c = 1; c <= 6; c++) setCell(hc, 1, c, '', { fill: CREAM });
  hc.mergeCells('B1:F1');
  setCell(hc, 1, 2, 'YogurASO  ·  Plan de Pruebas de Integración\nGA9-220501096-AA2-EV01  |  GFPI-F-135 V01', {
    bold: true, size: 16, fill: CREAM, align: 'center', color: BRAND
  });
  hc.getRow(1).height = 78;
  await addLogo(hc, wb);

  setCell(hc, 3, 1, 'Organismo / Institución', { bold: true, fill: SOFT });
  hc.mergeCells('B3:C3');
  setCell(hc, 3, 2, 'SENA — Formación Titulada', { fill: GRAY });
  setCell(hc, 3, 4, 'Unidad / Evidencia', { bold: true, fill: SOFT });
  hc.mergeCells('E3:F3');
  setCell(hc, 3, 5, 'GA9-220501096-AA2-EV01', { fill: GRAY });

  setCell(hc, 4, 1, 'Proyecto', { bold: true, fill: SOFT });
  hc.mergeCells('B4:C4');
  setCell(hc, 4, 2, proyecto, { fill: GRAY });
  setCell(hc, 4, 4, 'Entregable', { bold: true, fill: SOFT });
  hc.mergeCells('E4:F4');
  setCell(hc, 4, 5, 'Formato de casos de prueba (Excel)', { fill: GRAY });

  setCell(hc, 5, 1, 'Autor', { bold: true, fill: SOFT });
  hc.mergeCells('B5:C5');
  setCell(hc, 5, 2, autor, { fill: GRAY });
  setCell(hc, 5, 4, 'Versión / Edición', { bold: true, fill: SOFT });
  setCell(hc, 5, 5, '0100', { fill: GRAY, align: 'center' });
  setCell(hc, 5, 6, fecha, { fill: GRAY, align: 'center' });

  setCell(hc, 6, 1, 'Aprobado por', { bold: true, fill: SOFT });
  hc.mergeCells('B6:C6');
  setCell(hc, 6, 2, 'Instructor / Analista QA', { fill: GRAY });
  setCell(hc, 6, 4, 'Fecha aprobación', { bold: true, fill: SOFT });
  hc.mergeCells('E6:F6');
  setCell(hc, 6, 5, fecha, { fill: GRAY, align: 'center' });

  setCell(hc, 8, 1, 'REGISTRO DE CAMBIOS', { bold: true, fill: BRAND, color: 'FFFFFF', size: 12 });
  hc.mergeCells('A8:F8');

  const changeHeaders = ['Versión', 'Causa del cambio', 'Responsable del cambio', 'Fecha del cambio', '', ''];
  changeHeaders.forEach((h, i) => setCell(hc, 9, i + 1, h, { bold: true, fill: SOFT, align: 'center' }));
  setCell(hc, 10, 1, '0100', { align: 'center' });
  setCell(hc, 10, 2, 'Versión inicial — casos YogurASO (Postman + Playwright)');
  setCell(hc, 10, 3, autor);
  setCell(hc, 10, 4, fecha, { align: 'center' });
  setCell(hc, 10, 5, '');
  setCell(hc, 10, 6, '');

  setCell(hc, 12, 1, 'CONTROL DE DISTRIBUCIÓN', { bold: true, fill: BRAND, color: 'FFFFFF', size: 12 });
  hc.mergeCells('A12:F12');
  setCell(hc, 13, 1, 'Nombre y Apellidos', { bold: true, fill: SOFT });
  hc.mergeCells('B13:C13');
  setCell(hc, 13, 2, autor);
  setCell(hc, 13, 4, 'Documento', { bold: true, fill: SOFT });
  hc.mergeCells('E13:F13');
  setCell(hc, 13, 5, 'Plan / Casos de Prueba de Integración — YogurASO');

  setCell(hc, 15, 1, 'NOTA', { bold: true, fill: SOFT });
  hc.mergeCells('B15:F17');
  setCell(hc, 15, 2, 'Para cada caso de prueba se documenta: número consecutivo, componentes, prerrequisitos, pasos, datos de entrada, salida esperada y columnas de resultados (OK / Observaciones). Las hojas “Casos de Prueba GFPI” y “Ambiente de Pruebas” cumplen la estructura solicitada en GA9-220501096-AA2-EV01. Herramientas principales: Postman (API) y Playwright (UI/E2E).');

  // ========== HOJA 2: Ambiente ==========
  const amb = wb.addWorksheet('Ambiente de Pruebas', {
    properties: { tabColor: { argb: 'FF4CAF50' } }
  });
  amb.columns = [{ width: 32 }, { width: 55 }, { width: 40 }];
  amb.getRow(1).height = 70;
  for (let c = 1; c <= 3; c++) setCell(amb, 1, c, '', { fill: CREAM });
  amb.mergeCells('B1:C1');
  setCell(amb, 1, 2, 'Definición del ambiente / entorno de pruebas — YogurASO', {
    bold: true, size: 14, fill: CREAM, align: 'center', color: BRAND
  });
  await addLogo(amb, wb, 'A', 1, 80, 70);

  const ambRows = [
    ['Elemento', 'Configuración YogurASO', 'Observación'],
    ['Tipo de aplicación', 'Aplicación web (no escritorio)', 'Frontend estático + API REST'],
    ['Sistema operativo', 'Windows 10 / Windows 11', 'Entorno del aprendiz'],
    ['Navegadores', 'Chromium (Playwright), Edge/Chrome manual', 'Pruebas UI/E2E'],
    ['Frontend', 'HTML5, CSS3, JavaScript vanilla — carpeta frontend/', 'Servidor local Live Server o puerto 5505'],
    ['Backend', 'Node.js + Express — backend/server.js — puerto 3000', 'npm run dev'],
    ['Base de datos', 'PostgreSQL — database/schema.sql', 'Tablas usuarios y productos'],
    ['Autenticación', 'JWT + bcrypt — middleware verifyToken.js', 'Roles: cliente / admin'],
    ['Herramienta API', 'Postman', 'Casos 001–007 y 012'],
    ['Herramienta UI/E2E', 'Playwright Test (@playwright/test)', 'Casos 008–011'],
    ['URL API local', 'http://localhost:3000/api', 'config.js → API_URL'],
    ['URL Frontend local', 'http://127.0.0.1:5500 o 5505', 'CORS habilitado para localhost'],
    ['Variables de entorno', 'backend/.env (JWT_SECRET, DB_*)', 'Usar .env.example como guía'],
    ['Evidencias', 'docs/taller-pruebas/evidencias/*.png', 'Capturas Playwright']
  ];
  ambRows.forEach((row, idx) => {
    const r = idx + 3;
    row.forEach((val, i) => {
      setCell(amb, r, i + 1, val, {
        bold: idx === 0 || i === 0,
        fill: idx === 0 ? BRAND : i === 0 ? SOFT : (r % 2 === 0 ? GRAY : 'FFFFFF'),
        color: idx === 0 ? 'FFFFFF' : undefined,
        align: idx === 0 ? 'center' : 'left'
      });
    });
    amb.getRow(r).height = idx === 0 ? 22 : 28;
  });

  // ========== HOJA 3: Casos GFPI ==========
  const cp = wb.addWorksheet('Casos de Prueba GFPI', {
    properties: { tabColor: { argb: 'FF' + BRAND } }
  });
  const headers = [
    'Número de caso',
    'Nombre del proyecto',
    'Nombre del caso de prueba',
    'Fecha de revisión',
    'Descripción del caso de prueba',
    'Ambiente o entorno de prueba',
    'Herramienta utilizada',
    'Autor del caso de prueba',
    'Salida esperada',
    'Salida obtenida',
    'Resultado',
    'Seguimiento',
    'Severidad',
    'Evidencia',
    'Firma de aprobación'
  ];
  cp.columns = headers.map((h) => ({
    header: h,
    width: Math.min(36, Math.max(16, h.length + 4)),
    key: h
  }));
  // widen key columns
  cp.getColumn(3).width = 38;
  cp.getColumn(5).width = 48;
  cp.getColumn(6).width = 40;
  cp.getColumn(9).width = 36;
  cp.getColumn(10).width = 40;
  cp.getColumn(14).width = 36;

  // Title row above header
  cp.insertRow(1, []);
  cp.mergeCells(1, 1, 1, 15);
  cp.getRow(1).height = 72;
  setCell(cp, 1, 1, 'FORMATO DE CASOS DE PRUEBA — YogurASO  |  GA9-220501096-AA2-EV01  |  GFPI-F-135 V01', {
    bold: true, size: 14, fill: CREAM, align: 'center', color: BRAND
  });
  for (let c = 2; c <= 15; c++) setCell(cp, 1, c, '', { fill: CREAM });
  await addLogo(cp, wb);

  // Re-write header at row 2
  headers.forEach((h, i) => {
    setCell(cp, 2, i + 1, h, { bold: true, fill: BRAND, color: 'FFFFFF', align: 'center', size: 10 });
  });
  cp.getRow(2).height = 32;
  cp.autoFilter = { from: { row: 2, column: 1 }, to: { row: 2, column: 15 } };
  cp.views = [{ state: 'frozen', ySplit: 2 }];

  casos.forEach((c, idx) => {
    const r = idx + 3;
    const vals = [
      c.num, proyecto, c.nombre, fecha, c.desc, c.ambiente, c.herramienta, autor,
      c.esperada, c.obtenida, c.resultado, c.seguimiento, c.severidad, c.evidencia, autor
    ];
    vals.forEach((v, i) => {
      const isResult = i === 10;
      setCell(cp, r, i + 1, v, {
        fill: isResult && v === 'Aprobado' ? OK_GREEN : (r % 2 === 0 ? GRAY : 'FFFFFF'),
        bold: isResult,
        size: 10,
        align: i === 0 || i === 10 || i === 12 ? 'center' : 'left'
      });
    });
    cp.getRow(r).height = 70;
  });

  // ========== HOJA 4: Pruebas Integración (plantilla ODS) ==========
  const pi = wb.addWorksheet('Pruebas de Integración', {
    properties: { tabColor: { argb: 'FF1976D2' } }
  });
  pi.columns = [
    { width: 10 }, { width: 42 }, { width: 22 }, { width: 28 }, { width: 14 }, { width: 28 }
  ];
  pi.getRow(1).height = 70;
  for (let c = 1; c <= 6; c++) setCell(pi, 1, c, '', { fill: CREAM });
  pi.mergeCells('B1:F1');
  setCell(pi, 1, 2, 'Pruebas de Integración — detalle por caso (plantilla PPI) — YogurASO', {
    bold: true, size: 13, fill: CREAM, align: 'center', color: BRAND
  });
  await addLogo(pi, wb);

  let row = 3;
  // Summary table
  setCell(pi, row, 1, 'Número del Caso de Prueba', { bold: true, fill: BRAND, color: 'FFFFFF', align: 'center', size: 10 });
  setCell(pi, row, 2, 'Componente', { bold: true, fill: BRAND, color: 'FFFFFF', align: 'center', size: 10 });
  pi.mergeCells(row, 3, row, 4);
  setCell(pi, row, 3, 'Descripción de lo que se Probará', { bold: true, fill: BRAND, color: 'FFFFFF', align: 'center', size: 10 });
  pi.mergeCells(row, 5, row, 6);
  setCell(pi, row, 5, 'Prerrequisitos', { bold: true, fill: BRAND, color: 'FFFFFF', align: 'center', size: 10 });
  row++;

  integracionDetalle.forEach((c) => {
    setCell(pi, row, 1, c.id, { bold: true, fill: SOFT, align: 'center' });
    setCell(pi, row, 2, c.componente, { size: 10 });
    pi.mergeCells(row, 3, row, 4);
    setCell(pi, row, 3, c.descripcion, { size: 10 });
    setCell(pi, row, 4, '', { size: 10 });
    pi.mergeCells(row, 5, row, 6);
    setCell(pi, row, 5, c.prerreq, { size: 10 });
    setCell(pi, row, 6, '', { size: 10 });
    pi.getRow(row).height = 40;
    row++;
  });

  row += 1;
  setCell(pi, row, 1, 'FICHAS DETALLADAS POR CASO (pasos)', { bold: true, fill: BRAND, color: 'FFFFFF', size: 12 });
  pi.mergeCells(row, 1, row, 6);
  row += 2;

  integracionDetalle.forEach((c) => {
    setCell(pi, row, 1, c.id, { bold: true, fill: SOFT, align: 'center' });
    pi.mergeCells(row, 2, row, 6);
    setCell(pi, row, 2, `${c.descripcion}  |  ${c.componente}`, { bold: true, fill: SOFT, size: 10 });
    row++;

    ['Paso', 'Descripción de pasos a seguir', 'Datos Entrada', 'Salida Esperada', '¿OK?', 'Observaciones']
      .forEach((h, i) => setCell(pi, row, i + 1, h, { bold: true, fill: HEADER, color: 'FFFFFF', align: 'center', size: 10 }));
    row++;

    c.pasos.forEach((p) => {
      setCell(pi, row, 1, p.paso, { align: 'center', fill: GRAY });
      setCell(pi, row, 2, p.desc, { size: 10 });
      setCell(pi, row, 3, p.entrada, { size: 10 });
      setCell(pi, row, 4, p.salida, { size: 10 });
      setCell(pi, row, 5, p.ok, { align: 'center', fill: p.ok === 'Sí' ? OK_GREEN : 'FFFFFF', bold: true });
      setCell(pi, row, 6, p.obs, { size: 10 });
      pi.getRow(row).height = 28;
      row++;
    });
    row += 1;
  });

  setCell(pi, row, 1, 'Nota:', { bold: true, fill: SOFT });
  pi.mergeCells(row, 2, row, 6);
  setCell(pi, row, 2, 'Se insertó una ficha por cada caso de integración <<CAxxx>> definido para YogurASO. Columnas de Resultados (¿OK?/Observaciones) diligenciadas tras ejecución con Postman y Playwright.');

  // ========== HOJA 5: Resumen ==========
  const res = wb.addWorksheet('Resumen', { properties: { tabColor: { argb: 'FFFFC107' } } });
  res.columns = [{ width: 28 }, { width: 18 }, { width: 40 }];
  res.getRow(1).height = 60;
  res.mergeCells('A1:C1');
  setCell(res, 1, 1, 'Resumen ejecutivo de pruebas — YogurASO', { bold: true, size: 14, fill: CREAM, align: 'center', color: BRAND });
  setCell(res, 1, 2, '', { fill: CREAM });
  setCell(res, 1, 3, '', { fill: CREAM });

  const approved = casos.filter((c) => c.resultado === 'Aprobado').length;
  const summary = [
    ['Total casos GFPI', String(casos.length), 'Hoja Casos de Prueba GFPI'],
    ['Aprobados', String(approved), '100% de los diseñados/ejecutados'],
    ['En seguimiento', '0', 'Sin hallazgos abiertos'],
    ['Rechazados', '0', 'N/A'],
    ['Herramientas', 'Postman + Playwright', 'API + UI/E2E'],
    ['Fecha de revisión', fecha, 'AA2-EV01'],
    ['Firma analista', autor, 'Aprobación de ejecución']
  ];
  setCell(res, 3, 1, 'Indicador', { bold: true, fill: BRAND, color: 'FFFFFF', align: 'center' });
  setCell(res, 3, 2, 'Valor', { bold: true, fill: BRAND, color: 'FFFFFF', align: 'center' });
  setCell(res, 3, 3, 'Detalle', { bold: true, fill: BRAND, color: 'FFFFFF', align: 'center' });
  summary.forEach((s, i) => {
    const r = i + 4;
    setCell(res, r, 1, s[0], { bold: true, fill: SOFT });
    setCell(res, r, 2, s[1], { align: 'center', fill: s[0] === 'Aprobados' ? OK_GREEN : GRAY, bold: true });
    setCell(res, r, 3, s[2]);
  });

  await wb.xlsx.writeFile(OUT);
  console.log('OK Excel:', OUT);
  console.log('Size:', fs.statSync(OUT).length);
}

build().catch((e) => {
  console.error(e);
  process.exit(1);
});
