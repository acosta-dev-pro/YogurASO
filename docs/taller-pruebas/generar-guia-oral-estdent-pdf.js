/**
 * PDF guía oral — Plan de Negocio EstDent System
 * Para leer en clase: hojas, fórmulas, gráficos, de dónde sale cada dato.
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const PDF_OUT = path.resolve(
  'C:/Users/acost/Downloads/Guia_Oral_Plan_Negocio_EstDent_System.pdf'
);
const HTML_OUT = path.resolve(
  'C:/Users/acost/Downloads/Guia_Oral_Plan_Negocio_EstDent_System.html'
);

function buildHtml() {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Guía oral — Plan de Negocio EstDent System</title>
<style>
  @page { size: letter; margin: 1.8cm 2cm; }
  * { box-sizing: border-box; }
  body {
    font-family: "Segoe UI", "Calibri", Arial, sans-serif;
    font-size: 11pt;
    line-height: 1.45;
    color: #1a1a1a;
    margin: 0;
    background: #fff;
  }
  .page { max-width: 17.5cm; margin: 0 auto; }
  .cover {
    min-height: 23cm;
    border: 2px solid #0d5c63;
    padding: 40px 36px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    page-break-after: always;
    background: linear-gradient(180deg, #f4fbfb 0%, #fff 45%);
  }
  .cover .brand {
    font-size: 28pt;
    font-weight: 800;
    color: #0d5c63;
    letter-spacing: -0.5px;
    margin: 0 0 8px;
  }
  .cover h1 {
    font-size: 16pt;
    margin: 12px 0 8px;
    color: #222;
    line-height: 1.3;
  }
  .cover .meta { font-size: 11pt; color: #444; margin: 4px 0; }
  .cover .box {
    border-left: 4px solid #0d5c63;
    background: #eef8f8;
    padding: 12px 14px;
    margin-top: 24px;
    font-size: 10.5pt;
  }
  h2 {
    font-size: 13pt;
    color: #0d5c63;
    border-bottom: 2px solid #0d5c63;
    padding-bottom: 4px;
    margin: 22px 0 10px;
    page-break-after: avoid;
  }
  h3 {
    font-size: 11.5pt;
    color: #1a4a4e;
    margin: 16px 0 6px;
    page-break-after: avoid;
  }
  p { margin: 0 0 8px; text-align: justify; }
  .speak {
    background: #fff8e6;
    border: 1px solid #e6d4a0;
    padding: 10px 12px;
    margin: 8px 0 12px;
    font-size: 10.5pt;
    border-radius: 4px;
  }
  .speak strong { color: #7a5a00; }
  .formula {
    font-family: Consolas, "Courier New", monospace;
    background: #f0f4f5;
    border: 1px solid #c5d4d6;
    padding: 2px 6px;
    font-size: 10pt;
    white-space: nowrap;
  }
  .block-f {
    font-family: Consolas, "Courier New", monospace;
    background: #f0f4f5;
    border: 1px solid #c5d4d6;
    padding: 8px 10px;
    margin: 8px 0 12px;
    font-size: 10pt;
    line-height: 1.5;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 8px 0 14px;
    font-size: 10pt;
  }
  th, td {
    border: 1px solid #9bb;
    padding: 5px 7px;
    text-align: left;
    vertical-align: top;
  }
  th { background: #0d5c63; color: #fff; font-weight: 600; }
  tr:nth-child(even) td { background: #f4fafa; }
  .num { text-align: right; white-space: nowrap; }
  ul { margin: 4px 0 10px; padding-left: 18px; }
  li { margin-bottom: 4px; }
  .chip {
    display: inline-block;
    background: #0d5c63;
    color: #fff;
    font-size: 9pt;
    padding: 2px 8px;
    border-radius: 10px;
    margin-right: 4px;
  }
  .section-break { page-break-before: always; }
  .footer-note {
    margin-top: 20px;
    font-size: 9.5pt;
    color: #555;
    border-top: 1px solid #ccc;
    padding-top: 8px;
  }
  .ok { color: #0a6; font-weight: 700; }
</style>
</head>
<body>
<div class="page">

<!-- PORTADA -->
<section class="cover">
  <div>
    <div class="brand">EstDent System</div>
    <div class="meta">Software odontológico · Modelo por suscripción</div>
    <h1>Guía oral para explicar el Plan de Negocio en Excel</h1>
    <p class="meta"><strong>Programa:</strong> Análisis y Desarrollo de Software</p>
    <p class="meta"><strong>Ficha:</strong> 3145644</p>
    <p class="meta"><strong>Aprendiz:</strong> Juan Esteban Acosta</p>
    <p class="meta"><strong>Archivo Excel:</strong> Plan_Negocio_EstDent_COMPLETO.xlsm</p>
    <div class="box">
      <strong>Cómo usar este PDF en clase:</strong>
      Léelo como si estuvieras hablando. Cada bloque amarillo es
      “lo que dices en voz alta”. Las tablas y fórmulas son el respaldo
      si el profesor pregunta “¿de dónde salió ese número?” o
      “¿esa gráfica de dónde sale?”.
    </div>
  </div>
  <div>
    <p class="meta"><strong>Contiene:</strong> explicación hoja por hoja · fórmulas ·
    datos · gráficos · nómina · Cursor AI · respuesta ante el profesor</p>
  </div>
</section>

<!-- 1. APERTURA -->
<h2>1. Cómo abro la exposición (30 segundos)</h2>
<div class="speak">
  <strong>Digo:</strong>
  “Buenos días. Voy a explicar el plan de negocio de <strong>EstDent System</strong>,
  un software para consultorios odontológicos. El modelo es por
  <strong>suscripción mensual</strong>: el cliente paga para usar el sistema y nosotros
  mantenemos la plataforma, la infraestructura y el soporte.
  En el Excel usamos la plantilla del SENA. Las hojas están conectadas con fórmulas:
  lo que pongo en Mercado afecta Ventas, Costos, Utilidad y Nómina.
  No inventamos cifras enormes: es un emprendimiento que está arrancando.”
</div>

<h3>Idea central del negocio</h3>
<p>
EstDent no es “vender un programa una sola vez”. Es un <strong>SaaS</strong>
(software como servicio): planes Básico, Profesional y Clínica, más
configuración inicial y automatizaciones personalizadas.
</p>

<table>
  <tr><th>Producto / servicio</th><th class="num">Precio</th><th>Tipo</th></tr>
  <tr><td>EstDent Básico</td><td class="num">$79.000</td><td>Suscripción / mes</td></tr>
  <tr><td>EstDent Profesional (principal)</td><td class="num">$129.000</td><td>Suscripción / mes</td></tr>
  <tr><td>EstDent Clínica</td><td class="num">$199.000</td><td>Suscripción / mes</td></tr>
  <tr><td>Configuración inicial</td><td class="num">$250.000</td><td>Pago único</td></tr>
  <tr><td>Automatización personalizada</td><td class="num">$350.000</td><td>Desde / por proyecto</td></tr>
</table>

<div class="speak">
  <strong>Si preguntan “¿por qué esos precios?”:</strong>
  “Los ubicamos con referencias públicas del mercado odontológico en Colombia:
  NovusOral alrededor de $50.000/mes por profesional, DentaraOS desde unos $129.000/mes
  y NacarOS con plan Pro cerca de $46.400/mes. Nuestro punto medio y producto estrella
  es EstDent Profesional a $129.000.”
</div>

<!-- 2. CADENA -->
<h2 class="section-break">2. La cadena del Excel (cómo se conecta todo)</h2>
<p>Esto es lo más importante para que no parezca que “pegamos números al azar”:</p>
<table>
  <tr><th>Hoja</th><th>Pregunta que responde</th><th>Qué alimenta después</th></tr>
  <tr><td>1. Inversiones</td><td>¿Qué necesito para arrancar?</td><td>Total inversión → arranque, seguros, etc.</td></tr>
  <tr><td>2. Mercado</td><td>¿Qué vendo y a qué precio?</td><td>Precios → DI, Ventas en pesos, Resumen</td></tr>
  <tr><td>3. Proyección Ventas</td><td>¿Cuántas unidades por mes?</td><td>Años 2–5 con ×1,055 · Gráficos</td></tr>
  <tr><td>4. Costos Variables</td><td>¿Cuánto me cuesta cada unidad?</td><td>Costo unitario → utilidad bruta</td></tr>
  <tr><td>5. Resumen</td><td>¿Ventas − costos = utilidad bruta?</td><td>PyG, flujo, etc.</td></tr>
  <tr><td>6. Nómina</td><td>¿Cuánto cuesta el personal?</td><td>Gastos admin / costos fijos</td></tr>
  <tr><td>Gráficos Ventas</td><td>¿Cómo se ve la proyección?</td><td>Lee datos de la hoja 3</td></tr>
</table>

<div class="speak">
  <strong>Digo:</strong>
  “Si cambio un precio en Mercado, el Excel recalcula ventas en pesos.
  Si cambio unidades del mes 1, cambian totales, promedios y también las gráficas,
  porque las gráficas están enlazadas a esas celdas.”
</div>

<!-- 3. INVERSIONES -->
<h2>3. Hoja 1 — Inversiones</h2>
<p>
Aquí no va el gasto mensual. Va lo que necesitamos <strong>para comenzar</strong>:
equipos, muebles, oficina. La plantilla multiplica cantidad × precio y suma subtotales.
</p>

<h3>Datos que digité (celdas amarillas)</h3>
<table>
  <tr><th>Ítem</th><th class="num">Cant.</th><th class="num">Precio</th><th>Para qué</th></tr>
  <tr><td>Portátil desarrollo</td><td class="num">1</td><td class="num">$3.500.000</td><td>Programar EstDent</td></tr>
  <tr><td>Portátil apoyo</td><td class="num">1</td><td class="num">$2.500.000</td><td>Apoyo técnico / admin</td></tr>
  <tr><td>Monitor, UPS, periféricos, disco</td><td class="num">—</td><td class="num">varios</td><td>Estación de trabajo</td></tr>
  <tr><td>Software / herramientas base</td><td class="num">1</td><td class="num">$900.000</td><td>Licencias iniciales</td></tr>
  <tr><td>Escritorios, sillas, archivador, SST</td><td class="num">—</td><td class="num">varios</td><td>Puesto de trabajo</td></tr>
  <tr><td>Impresora + router/red</td><td class="num">—</td><td class="num">varios</td><td>Oficina</td></tr>
</table>

<p><span class="ok">Total inversión ≈ $12.680.000 COP</span></p>

<h3>Fórmulas que debo mostrar al hacer clic</h3>
<div class="block-f">
E10 → =+C10*D10&nbsp;&nbsp;&nbsp;// cantidad × precio<br>
E21 → =SUM(E10:E20)&nbsp;&nbsp;// subtotal maquinaria<br>
D7&nbsp; → =+E21*0.04&nbsp;&nbsp;&nbsp;// adecuaciones = 4% de maquinaria<br>
E41 → =+E8+E21+E32+E40&nbsp;// TOTAL inversión
</div>

<div class="speak">
  <strong>Digo al tocar E10:</strong>
  “Esta celda no tiene el total pegado. Tiene la fórmula cantidad por precio.
  Si cambio el precio del portátil, el total de la fila y el total de inversión
  se recalculan solos.”
</div>

<div class="speak">
  <strong>Si preguntan por el 4% de adecuaciones:</strong>
  “La plantilla ya trae que las adecuaciones locativas son el 4% del subtotal
  de maquinaria. No lo inventamos: es <span class="formula">=E21*0.04</span>.”
</div>

<!-- 4. MERCADO -->
<h2 class="section-break">4. Hoja 2 — Mercado</h2>
<p>
Aquí van los <strong>5 productos</strong> (la plantilla obliga cinco) y
<strong>3 competidores</strong> con precios para comparar.
</p>

<h3>Competidores (lo que puse)</h3>
<table>
  <tr><th>Competidor</th><th>Ubicación</th><th>Idea clave</th></tr>
  <tr><td>NovusOral</td><td>Colombia / online</td><td>≈ $50.000/mes por profesional</td></tr>
  <tr><td>DentaraOS</td><td>Colombia / online</td><td>Planes desde ≈ $129.000/mes</td></tr>
  <tr><td>NacarOS</td><td>Colombia / online</td><td>Plan Pro ≈ $46.400/mes</td></tr>
</table>

<h3>Fórmulas de comparación de precio</h3>
<div class="block-f">
F18 → =IFERROR(AVERAGE(C18:E18);0)&nbsp;&nbsp;// promedio de 3 precios competencia<br>
Luego la plantilla compara ese promedio con nuestro precio B18 / B5
y escribe si estamos por encima, igual o por debajo.
</div>

<div class="speak">
  <strong>Digo:</strong>
  “En las columnas C, D y E puse precios de referencia del mercado.
  La columna F saca el <strong>promedio</strong> con AVERAGE.
  Así el Excel mismo me dice cómo quedamos frente a la competencia.”
</div>

<h3>¿Por qué suben los precios en años 2 a 5?</h3>
<p>
En la hoja <strong>DI</strong> la plantilla aplica un incremento de aproximadamente
<strong>6,69%</strong> (<span class="formula">DI!B7 = 0,0669</span>):
</p>
<div class="block-f">
Precio año 2 = Precio año 1 + (Precio año 1 × 0,0669)<br>
Ejemplo: 129.000 × 1,0669 ≈ 137.632
</div>
<div class="speak">
  <strong>Digo:</strong>
  “No estoy afirmando que el precio será exactamente ese.
  Es una proyección financiera que contempla inflación y evolución del servicio.”
</div>

<!-- 5. VENTAS -->
<h2>5. Hoja 3 — Proyección de ventas (unidades)</h2>
<p>
Aquí digito <strong>cuántas unidades</strong> espero vender cada mes del año 1.
Una “unidad” = un cliente/suscripción o un servicio vendido (no “descargas”).
</p>

<table>
  <tr><th>Producto</th><th class="num">Unidades año 1</th><th>Lógica</th></tr>
  <tr><td>Básico</td><td class="num">50</td><td>Arranque lento, consultorios pequeños</td></tr>
  <tr><td>Profesional</td><td class="num">105</td><td>Producto principal</td></tr>
  <tr><td>Clínica</td><td class="num">28</td><td>Menos volumen, más ticket</td></tr>
  <tr><td>Configuración</td><td class="num">25</td><td>Casi un setup por cliente nuevo</td></tr>
  <tr><td>Automatización</td><td class="num">17</td><td>Proyectos puntuales</td></tr>
  <tr><td><strong>Total</strong></td><td class="num"><strong>225</strong></td><td>Emprendimiento realista</td></tr>
</table>

<h3>Fórmulas clave</h3>
<div class="block-f">
N7&nbsp; → =+SUM(B7:M7)&nbsp;&nbsp;&nbsp;&nbsp;// total año 1 del producto 1<br>
O7&nbsp; → promedio mensual&nbsp;&nbsp;// AVERAGE de los 12 meses<br>
B12 → =SUM(B7:B11)&nbsp;&nbsp;&nbsp;&nbsp;// total de unidades del mes 1<br>
<br>
Año 2 en adelante (la plantilla ya lo trae):<br>
B16 → =+B7*1.055&nbsp;&nbsp;&nbsp;&nbsp;// crecimiento ≈ 5,5% sobre el año anterior
</div>

<div class="speak">
  <strong>Digo:</strong>
  “En el mes 1 no pongo 100 clientes. Empiezo con pocas unidades y voy subiendo.
  Los años 2 a 5 no los digité a mano: la plantilla multiplica por 1,055.
  Eso es crecimiento proyectado del 5,5%.”
</div>

<p><span class="ok">Ventas año 1 ≈ $35.267.000</span> (unidades × precio de cada producto)</p>

<!-- 6. GRAFICOS -->
<h2 class="section-break">6. ¿De dónde salen los gráficos?</h2>
<p>
La hoja <strong>Gráficos Ventas</strong> trae <span class="chip">5 gráficos</span>.
No los dibujé aparte: la plantilla ya los tiene enlazados a la proyección.
</p>

<table>
  <tr><th>Qué muestra la gráfica</th><th>De dónde lee los datos</th></tr>
  <tr>
    <td>Ventas en unidades por mes (año 1)</td>
    <td>Hoja <strong>3. Proyección Ventas</strong>, filas de meses B7:M11 y totales</td>
  </tr>
  <tr>
    <td>Comparación entre años / tendencias</td>
    <td>Bloques año 2–5 que salen de ×1,055 sobre el año 1</td>
  </tr>
  <tr>
    <td>Ventas en pesos</td>
    <td>Hoja <strong>Ventas Pesos Mes</strong>: precio (Mercado/DI) × unidades (hoja 3)</td>
  </tr>
</table>

<div class="block-f">
Ejemplo de celda en Ventas Pesos Mes:<br>
B7 → =+'2. Mercado'!$B$5 * '3. Proyección Ventas'!B7<br>
O sea: precio del Básico × unidades del mes 1
</div>

<div class="speak">
  <strong>Digo frente a una gráfica:</strong>
  “Esta gráfica no es decorativa. Si yo cambio las unidades del mes 6 en la hoja 3,
  la barra o la línea de la gráfica cambia, porque está leyendo esas celdas.
  Por eso primero llenamos datos y después miramos gráficos.”
</div>

<div class="speak">
  <strong>Si preguntan “¿quién hizo la gráfica?”:</strong>
  “La trae la plantilla pedagógica del SENA. Nosotros alimentamos los datos;
  Excel actualiza el gráfico automáticamente.”
</div>

<!-- 7. COSTOS VAR -->
<h2>7. Hoja 4 — Costos variables</h2>
<p>
Como EstDent es software, la “materia prima” son <strong>recursos tecnológicos
por cliente</strong>: nube, almacenamiento, mensajería, APIs, soporte variable.
</p>

<table>
  <tr><th>Producto</th><th class="num">Costo unitario año 1</th><th>Composición ejemplo</th></tr>
  <tr><td>Básico</td><td class="num">$15.500</td><td>nube 8.000 + backup 2.500 + correo 2.000 + otros 3.000</td></tr>
  <tr><td>Profesional</td><td class="num">$21.000</td><td>nube 10.000 + backup 3.500 + APIs 3.000 + otros 4.500</td></tr>
  <tr><td>Clínica</td><td class="num">$29.000</td><td>más capacidad y soporte</td></tr>
  <tr><td>Configuración</td><td class="num">$49.000</td><td>horas de setup + capacitación</td></tr>
  <tr><td>Automatización</td><td class="num">$88.000</td><td>desarrollo + API + pruebas</td></tr>
</table>

<div class="block-f">
H9&nbsp; → =+$B$9*C9&nbsp;&nbsp;// cantidad requerida × valor unitario<br>
C19 → =SUM(C9:C18)&nbsp;// costo unitario total del producto 1<br>
Años 2–5 del costo: (C9*DI!$B$7)+C9&nbsp;// sube con el mismo % de la plantilla
</div>

<div class="speak">
  <strong>Digo:</strong>
  “No podemos decir que cada cliente cuesta $0. Hay que alojar el sistema,
  guardar datos y dar soporte. El costo variable sube cuando hay más clientes,
  pero sigue siendo menor que el precio de venta para dejar margen bruto.”
</div>

<p>
Ejemplo oral rápido: cliente Profesional paga <strong>$129.000</strong>,
nos cuesta ≈ <strong>$21.000</strong> → utilidad bruta unitaria ≈ <strong>$108.000</strong>
(aún faltan nómina, publicidad, internet, Cursor, impuestos…).
</p>

<p><span class="ok">Costos variables año 1 ≈ $6.513.000</span> ·
<span class="ok">Utilidad bruta ≈ $28.754.000</span></p>

<!-- 8. RESUMEN -->
<h2 class="section-break">8. Hoja 5 — Resumen ventas y costos</h2>
<p>Esta hoja casi no se digita: <strong>consolida con fórmulas</strong>.</p>
<div class="block-f">
B7&nbsp; → =SUM('3. Proyección Ventas'!B7:M7)&nbsp;// unidades año 1 producto 1<br>
B17 → =DI!E3&nbsp;&nbsp;// precio año 1 desde DI (que viene de Mercado)<br>
B27 → costo variable unitario desde hoja 4<br>
B47 → =B7*B17&nbsp;&nbsp;// ventas en pesos = unidades × precio<br>
B57 → =B7*B27&nbsp;&nbsp;// costos variables en pesos<br>
B67 → =B47-B57&nbsp;// utilidad bruta en pesos<br>
B77 → =1-B27/B17&nbsp;// margen bruto %
</div>

<div class="speak">
  <strong>Digo:</strong>
  “Aquí se ve la foto completa del año 1 al 5.
  Utilidad bruta no es lo que ‘me gano yo’. Todavía hay que restar nómina,
  costos fijos, gastos y demás. Por eso existen las hojas siguientes.”
</div>

<!-- 9. NOMINA -->
<h2>9. Hoja 6 — Nómina</h2>
<table>
  <tr><th>Cargo</th><th>Tipo</th><th class="num">Valor mes</th></tr>
  <tr><td>Emprendedor / Administración</td><td>Contrato (plantilla calcula prestaciones)</td><td class="num">$1.750.905 (SMMLV 2026)</td></tr>
  <tr><td>Desarrollo y mantenimiento EstDent</td><td>Prestación de servicios</td><td class="num">$1.500.000</td></tr>
  <tr><td>Contador Público</td><td>Prestación (fórmula de la plantilla)</td><td class="num">$500.000</td></tr>
  <tr><td>Asesoría comercial</td><td>Prestación de servicios</td><td class="num">$800.000</td></tr>
</table>

<div class="block-f">
D6 → =+C6*$D$5&nbsp;&nbsp;// salud 12,5%<br>
E6 → =+C6*$E$5&nbsp;&nbsp;// pensión 16%<br>
F6 → auxilio transporte si aplica (fórmula con DI)<br>
M6 → =SUM(C6:L6)&nbsp;// total nómina del mes del emprendedor<br>
N6 → =+M6*$N$5&nbsp;&nbsp;// ×12 = año<br>
B23 → =+IF('2. Mercado'!B5&gt;0;500000;0)&nbsp;// contador automático
</div>

<div class="speak">
  <strong>Digo:</strong>
  “El salario del emprendedor no es solo $1.750.905. La plantilla suma salud,
  pensión, parafiscales, cesantías, prima, ARL, vacaciones…
  Por eso el costo empresa es mayor que el salario base.
  Desarrollador y comercial van por prestación porque estamos arrancando:
  no contratamos una nómina enorme desde el día uno.”
</div>

<!-- 10. CURSOR Y GASTOS -->
<h2>10. Cursor AI, costos fijos y gastos</h2>
<table>
  <tr><th>Rubro</th><th class="num">Valor</th><th>Dónde está</th></tr>
  <tr><td>Suscripción Cursor AI</td><td class="num">$70.000 / mes</td><td>7. Costos Fijos → B26</td></tr>
  <tr><td>Cursor en el año (fórmula plantilla)</td><td class="num">$840.000</td><td>=B26*12</td></tr>
  <tr><td>Internet y datos</td><td class="num">$90.000 / mes</td><td>8. Gastos B40</td></tr>
  <tr><td>Publicidad Facebook</td><td class="num">$250.000 / mes</td><td>8. Gastos B49</td></tr>
  <tr><td>Posicionamiento web</td><td class="num">$180.000 / mes</td><td>8. Gastos B50</td></tr>
</table>

<div class="speak">
  <strong>Digo sobre Cursor:</strong>
  “Incluimos una herramienta de IA para desarrollo, Cursor, a $70.000 mensuales.
  Es un costo fijo de operación tecnológica: nos ayuda a construir y mantener
  EstDent más rápido. Al año la plantilla lo proyecta con =B26*12 → $840.000.”
</div>

<!-- 11. FORMULARIO RAPIDO -->
<h2 class="section-break">11. Fórmulas que me pueden preguntar (repaso rápido)</h2>
<table>
  <tr><th>Fórmula</th><th>Significado</th><th>Ejemplo</th></tr>
  <tr><td><span class="formula">=SUMA(B7:M7)</span> / SUM</td><td>Sumar un rango</td><td>Total unidades del año</td></tr>
  <tr><td><span class="formula">=C10*D10</span></td><td>Multiplicar</td><td>1 equipo × $3.500.000</td></tr>
  <tr><td><span class="formula">=PROMEDIO(...)</span> / AVERAGE</td><td>Promedio</td><td>Precio mercado competencia</td></tr>
  <tr><td><span class="formula">=B7*1.055</span></td><td>Crecimiento 5,5%</td><td>Ventas año 2</td></tr>
  <tr><td><span class="formula">=B47-B57</span></td><td>Resta</td><td>Utilidad bruta</td></tr>
  <tr><td><span class="formula">=1-B27/B17</span></td><td>Margen %</td><td>Qué % queda después del costo</td></tr>
</table>

<p>
Nota: en Excel en español a veces ves <strong>SUMA</strong> y <strong>PROMEDIO</strong>;
en el archivo la plantilla guarda <strong>SUM</strong> y <strong>AVERAGE</strong>.
Es lo mismo; Excel las traduce según el idioma.
</p>

<!-- 12. CIERRE -->
<h2>12. Cierre oral (si piden el modelo de negocio completo)</h2>
<div class="speak">
  <strong>Digo:</strong>
  “EstDent System es un software dirigido a consultorios odontológicos pequeños
  y medianos. Funciona por suscripción mensual, con planes según el tamaño del
  consultorio. La diferencia es que no solo organizamos información: buscamos
  automatizar tareas repetitivas.
  Los ingresos vienen de suscripciones, configuración inicial y automatizaciones.
  Los costos principales son infraestructura en la nube, soporte, herramientas
  como Cursor, y un equipo pequeño: emprendedor, desarrollador freelance,
  contador y apoyo comercial.
  En el Excel proyectamos crecimiento moderado: 225 unidades el primer año y
  cerca de $35 millones en ventas, con costos variables alrededor de $6,5 millones.
  No asumimos cientos de clientes el primer mes. A medida que crecen los clientes
  crecen algunos costos, pero el margen bruto permite cubrir nómina y operación.”
</div>

<h3>Números para memorizar (tarjeta mental)</h3>
<table>
  <tr><th>Concepto</th><th class="num">Valor</th></tr>
  <tr><td>Inversión inicial</td><td class="num">≈ $12,7 millones</td></tr>
  <tr><td>Unidades año 1</td><td class="num">225</td></tr>
  <tr><td>Ventas año 1</td><td class="num">≈ $35,3 millones</td></tr>
  <tr><td>Costos variables año 1</td><td class="num">≈ $6,5 millones</td></tr>
  <tr><td>Utilidad bruta año 1</td><td class="num">≈ $28,8 millones</td></tr>
  <tr><td>Producto estrella</td><td class="num">Profesional $129.000</td></tr>
  <tr><td>Cursor AI</td><td class="num">$70.000 / mes</td></tr>
  <tr><td>Gráficos en plantilla</td><td class="num">5 (hoja Gráficos Ventas)</td></tr>
</table>

<div class="footer-note">
  Documento de apoyo oral — Plan de Negocio EstDent System — Ficha 3145644.
  Los valores son supuestos de planeación del escenario financiero, con referencias
  de mercado y costos de operación. Abrir el Excel
  <em>Plan_Negocio_EstDent_COMPLETO.xlsm</em> mientras se explica.
</div>

</div>
</body>
</html>`;
}

async function main() {
  const html = buildHtml();
  fs.writeFileSync(HTML_OUT, html, 'utf8');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('file:///' + HTML_OUT.replace(/\\/g, '/'), {
    waitUntil: 'load',
  });
  await page.pdf({
    path: PDF_OUT,
    format: 'Letter',
    printBackground: true,
    margin: { top: '1.4cm', bottom: '1.4cm', left: '1.4cm', right: '1.4cm' },
  });
  await browser.close();

  console.log('OK PDF:', PDF_OUT);
  console.log('OK HTML:', HTML_OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
