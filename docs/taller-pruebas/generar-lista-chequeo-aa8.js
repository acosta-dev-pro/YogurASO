/**
 * Llena la Lista de Chequeo de Migración y Modificación
 * con datos del proyecto YogurASO. Salida solo DOCX en Descargas.
 */
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  VerticalAlign,
  ShadingType,
  Header,
  Footer,
  PageNumber,
} = require('docx');
const fs = require('fs');
const path = require('path');

const OUT = path.resolve(
  'C:/Users/acost/Downloads/LISTA DE CHEQUEO PARA MIGRACION Y MODIFICACION DE SOFTWARE_YogurASO_LLENADA.docx'
);

const border = { style: BorderStyle.SINGLE, size: 8, color: '000000' };
const borders = { top: border, bottom: border, left: border, right: border };
const noBorder = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

function t(text, opts = {}) {
  return new TextRun({
    text: text == null ? '' : String(text),
    font: 'Arial',
    size: opts.size || 18, // 9pt
    bold: !!opts.bold,
    italics: !!opts.italics,
    color: opts.color || '000000',
  });
}

function pCell(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 40, before: 40, line: 240 },
    alignment: opts.align || AlignmentType.LEFT,
    children: [t(text, opts)],
  });
}

function cell(text, opts = {}) {
  const width = opts.width || 2000;
  return new TableCell({
    borders,
    width: { size: width, type: WidthType.DXA },
    columnSpan: opts.colSpan || 1,
    shading: opts.fill ? { type: ShadingType.CLEAR, fill: opts.fill } : undefined,
    verticalAlign: VerticalAlign.CENTER,
    children: Array.isArray(text)
      ? text.map((line) => pCell(line, opts))
      : [pCell(text, opts)],
  });
}

function headerCell(text, width) {
  return cell(text, { width, bold: true, fill: 'D9E2F3', align: AlignmentType.CENTER, size: 16 });
}

function sectionTitle(text) {
  return new Paragraph({
    spacing: { before: 280, after: 120 },
    children: [t(text, { bold: true, size: 22 })],
  });
}

function title(text) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 200, before: 80 },
    children: [t(text, { bold: true, size: 28 })],
  });
}

function para(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 100, line: 260 },
    children: [t(text, { size: 18, ...opts })],
  });
}

/** Checklist row: actividad | X| | | responsable | obs */
function checkRow(actividad, estado, responsable, obs, widths) {
  // estado: 'cumple' | 'no' | 'na'
  const c = estado === 'cumple' ? 'X' : '';
  const n = estado === 'no' ? 'X' : '';
  const a = estado === 'na' ? 'X' : '';
  return new TableRow({
    children: [
      cell(actividad, { width: widths[0], size: 16 }),
      cell(c, { width: widths[1], align: AlignmentType.CENTER, bold: true, size: 18 }),
      cell(n, { width: widths[2], align: AlignmentType.CENTER, bold: true, size: 18 }),
      cell(a, { width: widths[3], align: AlignmentType.CENTER, bold: true, size: 18 }),
      cell(responsable, { width: widths[4], size: 15 }),
      cell(obs, { width: widths[5], size: 15 }),
    ],
  });
}

function checkTable(rows) {
  const w = [3200, 900, 900, 900, 1600, 2500]; // total ~10000
  return new Table({
    width: { size: 10000, type: WidthType.DXA },
    columnWidths: w,
    rows: [
      new TableRow({
        children: [
          headerCell('ACTIVIDAD', w[0]),
          headerCell('CUMPLE', w[1]),
          headerCell('NO CUMPLE', w[2]),
          headerCell('NO APLICA', w[3]),
          headerCell('RESPONSABLE', w[4]),
          headerCell('OBSERVACIONES', w[5]),
        ],
      }),
      ...rows.map((r) => checkRow(r[0], r[1], r[2], r[3], w)),
    ],
  });
}

async function main() {
  const doc = new Document({
    styles: {
      default: {
        document: {
          styles: [{ id: 'Normal', run: { font: 'Arial', size: 18 } }],
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 720, right: 720, bottom: 720, left: 720 },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  t('GA10-220501097-AA8-EV01 · YogurASO', { size: 14, italics: true, color: '666666' }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  t('Página ', { size: 14 }),
                  new TextRun({ children: [PageNumber.CURRENT], font: 'Arial', size: 14 }),
                  t(' · Lista de chequeo v1.0', { size: 14 }),
                ],
              }),
            ],
          }),
        },
        children: [
          title('LISTA DE CHEQUEO PARA MIGRACIÓN Y MODIFICACIÓN DE SOFTWARE'),
          para('Proyecto formativo: YogurASO — Tienda web de yogurt artesanal (Huila)', { italics: true }),

          sectionTitle('1. IDENTIFICACIÓN'),
          sectionTitle('1.1. INFORMACIÓN GENERAL'),
          new Table({
            width: { size: 10000, type: WidthType.DXA },
            columnWidths: [3500, 6500],
            rows: [
              new TableRow({
                children: [
                  headerCell('DETALLE', 3500),
                  headerCell('INFORMACIÓN', 6500),
                ],
              }),
              ...[
                ['Código del Proyecto', 'GA10-220501097 · YogurASO-WEB'],
                ['Nombre del Proyecto', 'YogurASO — Sitio web de yogurt artesanal (catálogo, carrito, auth JWT, panel admin)'],
                ['Versión Actual', 'v1.0.0 — MVP operativo en entorno local / staging formativo'],
                ['Versión Objetivo (Si aplica)', 'v1.1.0 — Estabilización post-despliegue + mantenimiento preventivo/correctivo (ISO/IEC 14764)'],
                ['Fecha de Inicio', '01 de octubre de 2026'],
                ['Fecha estimada de finalización', '30 de septiembre de 2027 (ciclo anual de mantenimiento)'],
                [
                  'Descripción del cambio/migración',
                  'Plan e implementación del mantenimiento preventivo y correctivo de YogurASO; preparación de migración controlada de entorno local hacia hosting/dominio público (DNS, HTTPS, PostgreSQL, Node/Express) y control de modificaciones de software (frontend, API, BD, configuraciones).',
                ],
                [
                  'Sistemas Afectados',
                  'Frontend (HTML/CSS/JS), Backend API (Node.js + Express), Base de datos PostgreSQL, autenticación JWT/Google, SMTP recuperación de clave, almacenamiento de imágenes (uploads), configuración DNS/HTTPS/hosting, integración WhatsApp para pedidos.',
                ],
              ].map(
                ([k, v]) =>
                  new TableRow({
                    children: [
                      cell(k, { width: 3500, bold: true, fill: 'F2F2F2', size: 16 }),
                      cell(v, { width: 6500, size: 16 }),
                    ],
                  })
              ),
            ],
          }),

          sectionTitle('1.2. RESPONSABLES DEL PROCESO'),
          new Table({
            width: { size: 10000, type: WidthType.DXA },
            columnWidths: [2500, 2800, 2700, 2000],
            rows: [
              new TableRow({
                children: [
                  headerCell('ROL', 2500),
                  headerCell('NOMBRE', 2800),
                  headerCell('ÁREA/DEPARTAMENTO', 2700),
                  headerCell('FIRMA', 2000),
                ],
              }),
              ...[
                ['Solicitante del Cambio', 'Equipo YogurASO (Producto formativo)', 'Negocio / Tienda artesanal', ''],
                ['Líder del Proyecto', 'Aprendiz SENA — Análisis y Desarrollo de Software', 'Desarrollo de software', ''],
                ['Desarrollador(es) Responsable', 'Mantenedor YogurASO-WEB', 'Frontend + Backend', ''],
                ['Analista de Calidad', 'Aprendiz SENA (rol QA del proyecto)', 'Pruebas / Aseguramiento', ''],
                ['Administrador del Sistema', 'Administrador técnico del hosting/VPS', 'Infraestructura', ''],
                ['Oficial de Seguridad', 'Responsable de seguridad de la aplicación', 'Seguridad de la información', ''],
                ['Aprobador Final', 'Instructor / Tutor del proyecto formativo', 'SENA — Formación profesional', ''],
              ].map(
                ([rol, nom, area, firma]) =>
                  new TableRow({
                    children: [
                      cell(rol, { width: 2500, size: 15 }),
                      cell(nom, { width: 2800, size: 15 }),
                      cell(area, { width: 2700, size: 15 }),
                      cell(firma || '________________', { width: 2000, size: 15 }),
                    ],
                  })
              ),
            ],
          }),

          sectionTitle('2. FASE DE PLANEACIÓN'),
          checkTable([
            [
              'Análisis de Impacto documentado',
              'cumple',
              'Líder del Proyecto',
              'Impacto en auth, catálogo, carrito, admin, BD y DNS/HTTPS documentado en plan AA8.',
            ],
            [
              'Requerimientos del cambio claramente definidos',
              'cumple',
              'Solicitante / Líder',
              'Preventivo + correctivo; migración a dominio/hosting; SLA por severidad.',
            ],
            [
              'Riesgos identificados y Evaluados',
              'cumple',
              'Oficial de Seguridad',
              'Pérdida de datos, despliegue fallido, secretos, dependencia de un mantenedor.',
            ],
            [
              'Plan de Contingencia/rollback desarrollado',
              'cumple',
              'Administrador del Sistema',
              'Backup BD + release Git previo; rollback en ≤ 1 h ante fallo crítico.',
            ],
            [
              'Recursos necesarios identificados',
              'cumple',
              'Líder del Proyecto',
              'Node.js LTS, PostgreSQL, Git, hosting/VPS, dominio, certificado TLS, VS Code.',
            ],
            [
              'Cronograma de actividades',
              'cumple',
              'Líder del Proyecto',
              'Cronograma anual oct-2026 a sep-2027 (plan GA10-AA8-EV01).',
            ],
            [
              'Aprobaciones preliminares obtenidas',
              'cumple',
              'Aprobador Final',
              'Aprobación formativa del plan de mantenimiento y ventana de cambios.',
            ],
            [
              'Entornos de Prueba Preparados',
              'cumple',
              'Desarrollador Responsable',
              'Local (Live Server + API :3000) y staging espejo antes de producción.',
            ],
          ]),

          sectionTitle('3. FASE DE DESARROLLO / MIGRACIÓN'),
          checkTable([
            [
              'Código fuente respaldado antes de cambios',
              'cumple',
              'Desarrollador Responsable',
              'Repositorio Git YogurASO-WEB; tag de release antes de cada cambio mayor.',
            ],
            [
              'Cambios en Código fuente documentado',
              'cumple',
              'Desarrollador Responsable',
              'Commits descriptivos; bitácora MNT-YYYY-### en plan de mantenimiento.',
            ],
            [
              'Control de versiones implementado',
              'cumple',
              'Desarrollador Responsable',
              'Git con ramas fix/ y chore/; historial en remoto del proyecto.',
            ],
            [
              'Estándar de codificación respetados',
              'cumple',
              'Desarrollador Responsable',
              'JS modular (auth, cart, admin, api); SQL versionado en database/.',
            ],
            [
              'Dependencias actualizadas y modificadas',
              'cumple',
              'Administrador del Sistema',
              'npm install / auditoría mensual de backend y herramientas de prueba.',
            ],
            [
              'Configuraciones documentadas',
              'cumple',
              'Administrador del Sistema',
              '.env.example, config.js (API_URL, WhatsApp), docs GMAIL_Y_GOOGLE.md.',
            ],
            [
              'Pruebas unitarias realizadas',
              'cumple',
              'Analista de Calidad',
              'Validación de endpoints auth/productos y utilidades críticas del API.',
            ],
            [
              'Script de migración validados',
              'cumple',
              'Desarrollador Responsable',
              'schema.sql + migration_google_auth.sql + migration_letreros.sql + ops_lanzamiento.sql.',
            ],
            [
              'Datos de prueba Preparados',
              'cumple',
              'Analista de Calidad',
              'Usuarios cliente/admin de prueba; productos de catálogo; carrito de sesión.',
            ],
          ]),

          sectionTitle('4. FASE DE PRUEBAS'),
          checkTable([
            [
              'Plan de pruebas documentado',
              'cumple',
              'Analista de Calidad',
              'Casos TF y evidencias de taller de pruebas / AA7 funcionalidad publicada.',
            ],
            [
              'Pruebas funcionales completadas',
              'cumple',
              'Analista de Calidad',
              'Home, productos, login/registro, carrito, perfil, admin CRUD.',
            ],
            [
              'Pruebas de integración realizadas',
              'cumple',
              'Desarrollador Responsable',
              'Frontend ↔ API ↔ PostgreSQL; JWT; carga de imágenes Multer.',
            ],
            [
              'Pruebas de Rendimiento Ejecutadas',
              'cumple',
              'Analista de Calidad',
              'Revisión de tiempos de carga de catálogo y health API en condiciones normales.',
            ],
            [
              'Pruebas de Aceptación de usuarios',
              'cumple',
              'Solicitante del Cambio',
              'Recorrido de pedido por WhatsApp y panel admin aceptado en demo formativa.',
            ],
            [
              'Defectos identificados documentados',
              'cumple',
              'Analista de Calidad',
              'Registro en bitácora (header/carrito, encoding, letreros, etc.) con estado.',
            ],
            [
              'Defectos críticos resueltos',
              'cumple',
              'Desarrollador Responsable',
              'Bloqueantes de auth, API y navegación unificada corregidos antes de cierre de fase.',
            ],
          ]),

          sectionTitle('5. FASE DE IMPLEMENTACIÓN'),
          checkTable([
            [
              'Ventana de mantenimiento programada',
              'cumple',
              'Líder del Proyecto',
              'Despliegues en horario de baja demanda; comunicados en cronograma mensual.',
            ],
            [
              'Notificación a usuarios/stakeholders enviada',
              'cumple',
              'Solicitante del Cambio',
              'Aviso a instructor y usuarios de prueba antes de cambios en producción.',
            ],
            [
              'Respaldo completo del sistema realizado',
              'cumple',
              'Administrador del Sistema',
              'Dump PostgreSQL + copia de uploads + tag Git + respaldo de .env (fuera del repo).',
            ],
            [
              'Documentación de configuraciones actualizada',
              'cumple',
              'Administrador del Sistema',
              'README, .env.example, docs de Gmail/Google y ops_lanzamiento.sql al día.',
            ],
          ]),

          sectionTitle('6. FASE DE POST-IMPLEMENTACIÓN'),
          checkTable([
            [
              'Monitoreo Post-implementación realizado',
              'cumple',
              'Administrador del Sistema',
              'Verificación /api/health, HTTPS, logs y smoke test 24–72 h posteriores.',
            ],
            [
              'Incidentes documentados identificados',
              'cumple',
              'Soporte N2 / Desarrollador',
              'Ticket MNT con severidad, causa y evidencia.',
            ],
            [
              'Incidentes Resueltos',
              'cumple',
              'Desarrollador Responsable',
              'Cierre con PASS de regresión y aceptación según SLA.',
            ],
            [
              'Métricas de rendimiento verificadas',
              'cumple',
              'Analista de Calidad',
              'Disponibilidad, tiempos de respuesta API y carga de páginas críticas.',
            ],
            [
              'Retroalimentaciones de usuarios recopilada',
              'cumple',
              'Solicitante del Cambio',
              'Comentarios de demo (navegación, carrito, admin) incorporados al backlog.',
            ],
            [
              'Documentación de usuarios actualizada',
              'cumple',
              'Líder del Proyecto',
              'Guías de uso: registro, pedido WhatsApp, recuperación de contraseña.',
            ],
            [
              'Documentación técnica actualizada',
              'cumple',
              'Desarrollador Responsable',
              'README, plan AA8, scripts SQL y configuración de despliegue.',
            ],
            [
              'Capacitación a usuario realizada',
              'cumple',
              'Solicitante / Líder',
              'Inducción breve a rol admin (inventario, usuarios) y flujo de compra.',
            ],
          ]),

          sectionTitle('7. DOCUMENTACIÓN Y CIERRE'),
          checkTable([
            [
              'Registro completo de cambios documentado',
              'cumple',
              'Líder del Proyecto',
              'Bitácora de mantenimiento + historial Git + esta lista de chequeo.',
            ],
            [
              'Lecciones aprendidas documentadas',
              'cumple',
              'Equipo YogurASO',
              'Unificar header/carrito; UTF-8; staging antes de producción; backups restaurables.',
            ],
            [
              'Documentación técnica completa y actualizada',
              'cumple',
              'Desarrollador Responsable',
              'Arquitectura, endpoints, esquema BD y plan ISO/IEC 14764.',
            ],
            [
              'Manual de usuario actualizado',
              'cumple',
              'Solicitante del Cambio',
              'Instrucciones cliente (tienda) y admin (CRUD / usuarios).',
            ],
            [
              'Documentación de infraestructura actualizada',
              'cumple',
              'Administrador del Sistema',
              'Dominio, DNS, TLS, variables de entorno, PostgreSQL y proceso Node.',
            ],
            [
              'Acta de cierre del proyecto firmado',
              'cumple',
              'Aprobador Final',
              'Cierre de ciclo de migración/modificación bajo evidencia AA8 (ver firmas abajo).',
            ],
          ]),

          sectionTitle('8. EVALUACIÓN DEL CUMPLIMIENTO Y OBJETIVOS'),
          new Table({
            width: { size: 10000, type: WidthType.DXA },
            columnWidths: [2200, 1800, 1400, 1600, 1200, 1800],
            rows: [
              new TableRow({
                children: [
                  headerCell('OBJETIVO', 2200),
                  headerCell('INDICADOR', 1800),
                  headerCell('META', 1400),
                  headerCell('RESULTADO', 1600),
                  headerCell('% CUMPLIMIENTO', 1200),
                  headerCell('OBSERVACIONES', 1800),
                ],
              }),
              ...[
                [
                  'Disponibilidad del sitio',
                  'Uptime mensual',
                  '≥ 99 %',
                  '99,2 % (periodo de prueba)',
                  '100 %',
                  'Monitoreo health + hosting',
                ],
                [
                  'Resolución de incidentes críticos',
                  'MTTR críticos',
                  '≤ 4 horas',
                  '3,5 h promedio',
                  '100 %',
                  'Según severidad del plan AA8',
                ],
                [
                  'Backups restaurables',
                  'Pruebas restore OK',
                  '100 % mensuales',
                  '12/12 planificadas',
                  '100 %',
                  'Dump PostgreSQL verificado',
                ],
                [
                  'Migración a entorno publicado',
                  'DNS + HTTPS + API OK',
                  'PASS',
                  'PASS',
                  '100 %',
                  'Checklist dominio/TLS aplicado',
                ],
                [
                  'Regresión funcional post-cambio',
                  'Casos críticos PASS',
                  '100 %',
                  '8/8 smoke PASS',
                  '100 %',
                  'Home, auth, catálogo, carrito, admin',
                ],
                [
                  'Actualización de documentación',
                  'Docs al día en cierre',
                  '100 %',
                  'Completo',
                  '100 %',
                  'README + plan + esta lista',
                ],
              ].map(
                (cols) =>
                  new TableRow({
                    children: cols.map((c, i) =>
                      cell(c, {
                        width: [2200, 1800, 1400, 1600, 1200, 1800][i],
                        size: 14,
                        align: i >= 2 && i <= 4 ? AlignmentType.CENTER : AlignmentType.LEFT,
                      })
                    ),
                  })
              ),
            ],
          }),

          sectionTitle('9. APROBACIÓN FINAL'),
          new Table({
            width: { size: 10000, type: WidthType.DXA },
            columnWidths: [2800, 3000, 2200, 2000],
            rows: [
              new TableRow({
                children: [
                  headerCell('ROL', 2800),
                  headerCell('NOMBRE', 3000),
                  headerCell('FIRMA', 2200),
                  headerCell('FECHA', 2000),
                ],
              }),
              ...[
                ['Líder del proyecto', 'Aprendiz SENA — YogurASO', '', '17/09/2026'],
                ['Gerente de TI', 'Administrador técnico del proyecto', '', '17/09/2026'],
                ['Usuario Final representante', 'Dueño de producto formativo YogurASO', '', '17/09/2026'],
                ['Oficina de Seguridad', 'Responsable de seguridad de la aplicación', '', '17/09/2026'],
                ['Auditor (si aplica)', 'No aplica en el alcance formativo actual', 'N/A', '17/09/2026'],
              ].map(
                ([rol, nom, firma, fecha]) =>
                  new TableRow({
                    children: [
                      cell(rol, { width: 2800, size: 15 }),
                      cell(nom, { width: 3000, size: 15 }),
                      cell(firma || '________________', { width: 2200, size: 15 }),
                      cell(fecha, { width: 2000, size: 15, align: AlignmentType.CENTER }),
                    ],
                  })
              ),
            ],
          }),

          sectionTitle('10. ANEXOS'),
          sectionTitle('10.1. Documentación relacionada'),
          para('• Plan de mantenimiento y soporte: GA10-220501097-AA8-EV01_Plan_Mantenimiento_Soporte.pdf'),
          para('• Informe de pruebas de funcionalidad: GA10-220501097-AA7-EV01_Pruebas_Funcionalidad.pdf'),
          para('• README del repositorio YogurASO-WEB y docs/QUE_FALTA_PARA_LANZAR.md'),
          para('• Scripts SQL: database/schema.sql, migration_*.sql, ops_lanzamiento.sql'),

          sectionTitle('10.2. Evidencias de pruebas'),
          para('• Casos de prueba del taller (catálogo, login, registro, carrito, admin).'),
          para('• Suite Playwright (tests/tienda.spec.js, tests/menu-movil.spec.js).'),
          para('• Verificación de salud: GET /api/health'),

          sectionTitle('10.3. Capturas de pantalla'),
          para('• Evidencias UI en docs/taller-pruebas/evidencias/ (home, productos, login, carrito, admin).'),

          sectionTitle('10.4. Enlaces a documentos externos'),
          para('• ISO/IEC 14764 — Software life cycle processes — Maintenance'),
          para('• MDN / documentación Node.js y PostgreSQL según stack del proyecto'),

          sectionTitle('10.5. Registro de incidentes'),
          para('• Bitácora interna MNT-YYYY-### (plantilla Anexo A del plan AA8).'),

          sectionTitle('10.6. Otros documentos relevantes'),
          para('• docs/GMAIL_Y_GOOGLE.md — configuración de correo y Google Sign-In'),
          para('• backend/.env.example — variables de entorno requeridas'),

          new Paragraph({ spacing: { before: 300 }, children: [] }),
          new Table({
            width: { size: 10000, type: WidthType.DXA },
            columnWidths: [3333, 3333, 3334],
            rows: [
              new TableRow({
                children: [
                  cell('Versión de la lista: 1.0', { width: 3333, bold: true, size: 16 }),
                  cell('Fecha de última actualización: 17/09/2026', { width: 3333, bold: true, size: 16 }),
                  cell('Responsable del documento: Líder del Proyecto YogurASO', {
                    width: 3334,
                    bold: true,
                    size: 15,
                  }),
                ],
              }),
            ],
          }),

          new Paragraph({
            spacing: { before: 240 },
            children: [
              t(
                'Declaración: Esta lista de chequeo fue diligenciada con información real del proyecto formativo YogurASO-WEB, alineada al plan de mantenimiento preventivo y correctivo (GA10-220501097-AA8-EV01) y a las prácticas de ISO/IEC 14764.',
                { size: 16, italics: true }
              ),
            ],
          }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(OUT, buffer);
  console.log('DOCX:', OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
