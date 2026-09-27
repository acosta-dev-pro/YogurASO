/**
 * Tarea 2 — Fundamentos de Economía (UNAD 105001)
 * Entendiendo la ciencia económica — Word Arial 12, estilo académico.
 */
const {
  Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel,
  Header, Footer, PageNumber, PageBreak, BorderStyle,
} = require('docx');
const fs = require('fs');

const OUT = 'C:/Users/acost/Downloads/Tarea_2_Entendiendo_la_ciencia_economica_Juan_Esteban_Acosta.docx';

function r(text, o = {}) {
  return new TextRun({
    text: String(text ?? ''),
    font: 'Arial',
    size: o.size || 24, // 12pt
    bold: !!o.bold,
    italics: !!o.italics,
  });
}

function p(text, o = {}) {
  return new Paragraph({
    spacing: { after: o.after ?? 200, before: o.before ?? 0, line: 360 },
    alignment: o.align || AlignmentType.JUSTIFIED,
    indent: o.indent,
    children: [r(text, o)],
  });
}

function h(text, level = 1) {
  return new Paragraph({
    heading: level === 1 ? HeadingLevel.HEADING_1 : HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 160 },
    children: [r(text, { bold: true, size: level === 1 ? 28 : 26 })],
  });
}

function center(lines) {
  return lines.map((t) => new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 120 },
    children: [r(t, { size: 24, bold: t.includes('Universidad') || t.includes('TAREA') })],
  }));
}

function bullet(text) {
  return new Paragraph({
    spacing: { after: 120, line: 360 },
    indent: { left: 360 },
    children: [r('•  ' + text)],
  });
}

async function main() {
  const doc = new Document({
    styles: {
      default: {
        document: {
          styles: [{ id: 'Normal', run: { font: 'Arial', size: 24 } }],
        },
      },
      paragraphStyles: [
        {
          id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickStyle: true,
          paragraph: { spacing: { before: 280, after: 160 } },
          run: { font: 'Arial', size: 28, bold: true },
        },
        {
          id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickStyle: true,
          paragraph: { spacing: { before: 240, after: 140 } },
          run: { font: 'Arial', size: 26, bold: true },
        },
      ],
    },
    sections: [{
      properties: {
        page: { margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 } },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [r('Fundamentos de Economía · Tarea 2', { size: 16, italics: true })],
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              r('Página ', { size: 16 }),
              new TextRun({ children: [PageNumber.CURRENT], font: 'Arial', size: 16 }),
            ],
          })],
        }),
      },
      children: [
        // PORTADA
        ...center([
          'Universidad Nacional Abierta y a Distancia — UNAD',
          'Escuela de Ciencias Administrativas, Contables, Económicas y de Negocios — ECACEN',
          'Programa Contaduría Pública',
          'Curso: Fundamentos de Economía (105001)',
          '',
          'TAREA 2',
          'Entendiendo la ciencia económica',
          '',
          'Análisis de principios y conceptos básicos de la economía',
          'a partir de medios audiovisuales y noticias económicas colombianas',
          '',
          'Presentado por:',
          'Juan Esteban Acosta',
          '',
          'Tutor(a) del curso',
          '',
          'Bogotá, Colombia',
          'Septiembre de 2026',
        ]),
        new Paragraph({ children: [new PageBreak()] }),

        h('Introducción'),
        p('Este trabajo reúne tres momentos de la Tarea 2 del curso Fundamentos de Economía. Primero se retoman conceptos básicos del video What is Economics?, presentados en inglés. Después se analiza una noticia audiovisual sobre la crisis del sector arrocero en Colombia, identificando agentes, sector, enfoque micro o macro e impactos cercanos. Por último, se contrastan dos noticias recientes de la economía colombiana: una con enfoque de economía positiva y otra con enfoque normativo. La idea es mostrar que la economía no es solo “números”, sino una ciencia social que ayuda a leer hechos, decisiones y consecuencias en la vida diaria y en el ejercicio profesional.'),

        h('Objetivos'),
        h('Objetivo general', 2),
        p('Explicar los principios básicos de la economía, sus conceptos fundamentales y su relevancia como ciencia social, analizando su incidencia en la comprensión de fenómenos económicos locales.'),
        h('Objetivos específicos', 2),
        bullet('Identificar tres conceptos económicos a partir del video What is Economics? y presentar su definición en inglés.'),
        bullet('Analizar la noticia audiovisual sobre la crisis arrocera colombiana, identificando agentes económicos, sector afectado, enfoque microeconómico o macroeconómico e impacto en el contexto local y profesional.'),
        bullet('Diferenciar economía positiva y economía normativa mediante dos noticias recientes de la economía colombiana, con argumentación clara y sustentada.'),

        h('Desarrollo del trabajo'),

        h('1. Conceptos económicos a partir del video What is Economics?', 2),
        p('Luego de revisar el video Plain Prep. (2013), What is Economics?, se seleccionaron tres conceptos centrales que suelen usarse para explicar de qué se ocupa esta ciencia:'),
        p('1. Scarcity', { bold: true, align: AlignmentType.LEFT, after: 80 }),
        p('Scarcity means that human wants are unlimited, but the resources available to satisfy those wants are limited. Because of scarcity, people and societies must choose how to use land, labor, capital and time.'),
        p('2. Opportunity cost', { bold: true, align: AlignmentType.LEFT, after: 80 }),
        p('Opportunity cost is the value of the next best alternative that is given up when a choice is made. Every decision has a cost in terms of what we do not choose.'),
        p('3. Trade-offs', { bold: true, align: AlignmentType.LEFT, after: 80 }),
        p('Trade-offs are the compromises people face when they decide between alternatives. In economics, choosing more of one thing usually means having less of something else.'),
        p('Estos tres conceptos se conectan: la escasez obliga a elegir; al elegir aparece el costo de oportunidad; y en la práctica eso se ve como un trade-off entre opciones posibles.'),

        h('2. Análisis de la noticia audiovisual: crisis del sector arrocero', 2),
        p('El video indicado en la guía (Celin, 2025) presenta la crisis de los productores de arroz en Colombia. El problema de fondo, según el contexto de la coyuntura reciente del sector, es la caída del precio pagado al cultivador, el alza de costos de producción e insumos, la tensión con la industria molinera y la presión de importaciones, lo que ha llevado a protestas y llamados a paro. A partir de ese contenido se responde lo siguiente.'),

        h('a. Agentes económicos involucrados', 2),
        p('En la noticia intervienen varios agentes. Los productores o cultivadores de arroz actúan como oferentes del grano y buscan un precio que cubra costos y deje margen. La industria molinera y los intermediarios compran el arroz paddy y lo transforman o comercializan; su papel es clave porque concentran la demanda del productor. Los consumidores domésticos demandan arroz como alimento básico y terminan sintiendo cambios de precio o de abastecimiento. El Gobierno nacional (Ministerio de Agricultura y otras entidades) aparece como regulador y mediador, con capacidad de acordar apoyos, compras públicas o medidas de estabilización. También participan gremios como Fedearroz y organizaciones de productores, que agregan la voz del sector y negocian colectivamente. Transportadores y comerciantes completan la cadena cuando hay bloqueos o caídas de movimiento.'),

        h('b. Sector económico afectado', 2),
        p('El sector principalmente afectado es el agropecuario, específicamente la cadena productiva del arroz (producción primaria y su eslabón industrial). Se justifica esta elección porque el conflicto se centra en el precio al productor, los costos de siembra y la relación con molinos e importaciones. Es un asunto del sector real agroalimentario, no de un servicio financiero ni de una industria distinta. Además, el arroz es un bien de la canasta familiar, por lo que la crisis del agro se transmite con facilidad al consumo de los hogares.'),

        h('c. Enfoque: microeconómico o macroeconómico', 2),
        p('La situación tiene un claro núcleo microeconómico: se observa el comportamiento de un mercado particular (oferta y demanda de arroz, precios en puerta de molino, costos de productores y decisiones de siembra). Al mismo tiempo, cuando el paro se extiende, aparecen efectos macroeconómicos: riesgo inflacionario en alimentos, pérdidas logísticas y afectación del empleo rural en varios departamentos. Para esta pregunta, el enfoque principal es microeconómico, porque el punto de partida es el mercado del arroz y las decisiones de agentes específicos; los efectos nacionales son consecuencias que se desprenden de ese mercado.'),

        h('d. Impacto en el contexto local y en el futuro profesional', 2),
        p('En un contexto local (familia, comunidad o ciudad), una crisis arrocera puede tocar el bolsillo si el precio al consumidor sube por escasez temporal, o puede afectar el ingreso de familias rurales cuando el precio al productor se derrumba. En regiones productoras —como zonas del Tolima, Huila, Meta o Casanare— el impacto es directo sobre empleo e ingresos. Desde el campo profesional de Contaduría Pública, este tipo de noticias obliga a leer costos, márgenes, flujo de caja de productores, políticas de precio y efectos contables de una actividad agropecuaria en dificultad. Entender oferta, demanda y políticas públicas ayuda a asesorar mejor a empresas del agro, a leer estados financieros con criterio económico y a no quedarse solo en el registro técnico sin contexto.'),

        h('3. Economía positiva y economía normativa en noticias colombianas recientes', 2),
        p('La economía positiva describe y explica hechos con datos comprobables. La economía normativa formula juicios de valor o recomendaciones sobre cómo “deberían” ser las cosas. A continuación se presentan dos noticias recientes (menores a un año) que ilustran esa diferencia.'),

        h('3.1. Noticia de economía positiva', 2),
        p('Enlace de la fuente:', { bold: true, align: AlignmentType.LEFT, after: 80 }),
        p('https://www.portafolio.co/economia/marco-fiscal-de-media-plazo-gobierno-mantiene-proyeccion-de-crecimiento-pero-aumenta-la-de-inflacion-para-el-496084', { align: AlignmentType.LEFT, size: 20 }),
        p('Portafolio. (12 de junio de 2026). Marco Fiscal de Mediano Plazo: Gobierno mantiene previsión de crecimiento, pero sube la de inflación para el 2026.'),
        p('Resumen (máximo 5 líneas): En la presentación del Marco Fiscal de Mediano Plazo, el Ministerio de Hacienda mantuvo la proyección de crecimiento del PIB en 2,6% para 2026 y elevó la proyección de inflación al 6% (antes 5,8%). También se ajustó el estimado de déficit fiscal. La nota reporta cifras, proyecciones y declaraciones del ministro sobre la hoja de ruta macroeconómica del país.'),
        p('¿Por qué es economía positiva? Porque se centra en describir y explicar lo que se espera que ocurra según datos y proyecciones oficiales: crecimiento, inflación y déficit. No se trata de un “debe ser” moral o político del autor, sino de un reporte de hechos y estimaciones comprobables o contrastables.'),
        p('Impacto nacional, local y profesional: A nivel nacional, estas proyecciones orientan expectativas de hogares, empresas y mercados sobre precios y actividad. En lo local, una inflación cercana al 6% afecta el poder de compra de la canasta familiar y el costo de vivir en la ciudad. En Contaduría, leer inflación y crecimiento ayuda a interpretar presupuestos, reajustes de precios, análisis de costos y decisiones de inversión o financiamiento de clientes y organizaciones.'),

        h('3.2. Noticia de economía normativa', 2),
        p('Enlace de la fuente:', { bold: true, align: AlignmentType.LEFT, after: 80 }),
        p('https://www.larepublica.co/especiales/de-incluir-a-gobernar/las-cuatro-urgencias-economicas-del-proximo-gobierno-4453292', { align: AlignmentType.LEFT, size: 20 }),
        p('La República. (2026). Las cuatro urgencias económicas del próximo gobierno.'),
        p('Resumen (máximo 5 líneas): El artículo plantea que el próximo gobierno debería enfrentar, de manera simultánea, cuatro urgencias: recuperar el equilibrio fiscal, controlar la inflación, aumentar la productividad y reactivar la inversión. Argumenta que el país crece, pero sobre desequilibrios, y que el éxito dependerá de una estrategia coherente entre estabilidad, productividad e inclusión.'),
        p('¿Por qué es economía normativa? Porque no se limita a describir un dato: recomienda qué debería priorizar el próximo gobierno y cómo debería articularse la política económica. Aparecen juicios de valor y orientaciones de política (“hay que”, “deberá”, “el verdadero desafío será…”), típicos del enfoque normativo.'),
        p('Impacto nacional, local y profesional: Nacionalmente, este tipo de debates marca la agenda de reformas, gasto público e inversión. En lo local, las prioridades que gane el debate (ajuste fiscal, productividad, apoyo a mipymes, etc.) pueden traducirse en empleo, impuestos o programas territoriales. Para un contador en formación, entender el lado normativo ayuda a situar las cifras dentro de discusiones de política pública y a argumentar con criterio cuando se analicen reformas tributarias, gasto o inversión.'),

        h('Conclusiones'),
        p('La Tarea 2 permitió ver la economía como ciencia social aplicada a problemas reales. Del video introductorio quedaron claros conceptos como scarcity, opportunity cost y trade-offs, que explican por qué siempre hay que elegir. El caso arrocero mostró agentes, sector agropecuario y un enfoque principalmente microeconómico, con efectos que pueden escalar a lo macro cuando hay paro o presión sobre precios. Las dos noticias colombianas ayudaron a separar lo positivo (describir con datos) de lo normativo (proponer cómo deberían ser las cosas). En conjunto, estos ejercicios fortalecen la lectura económica del entorno y aportan al criterio profesional de quien estudia Contaduría Pública.'),

        h('Referencias'),
        p('Burneo, K. (2016). Principios de economía: versión latinoamericana (2.ª ed.). Ecoe Ediciones.', { align: AlignmentType.LEFT }),
        p('Celin. (2025). Video crisis arroceros [Video]. YouTube. https://youtu.be/xEbXoum3MBk', { align: AlignmentType.LEFT }),
        p('La República. (2026). Las cuatro urgencias económicas del próximo gobierno. https://www.larepublica.co/especiales/de-incluir-a-gobernar/las-cuatro-urgencias-economicas-del-proximo-gobierno-4453292', { align: AlignmentType.LEFT }),
        p('María O’Kean, J. (2015). Economía. McGraw-Hill España.', { align: AlignmentType.LEFT }),
        p('Plain Prep. (2013). What is Economics? [Video]. YouTube. https://www.youtube.com/watch?v=nWPrMmv1Tis', { align: AlignmentType.LEFT }),
        p('Portafolio. (2026, 12 de junio). Marco Fiscal de Mediano Plazo: Gobierno mantiene previsión de crecimiento, pero sube la de inflación para el 2026. https://www.portafolio.co/economia/marco-fiscal-de-media-plazo-gobierno-mantiene-proyeccion-de-crecimiento-pero-aumenta-la-de-inflacion-para-el-496084', { align: AlignmentType.LEFT }),
        p('Semana. (2025). Agricultores están vendiendo el arroz a precios de ruina. Estas son las razones de la crisis. https://www.semana.com/economia/articulo/agricultores-estan-vendiendo-el-arroz-a-precios-de-ruina-estas-son-las-razones-de-la-crisis/202500/', { align: AlignmentType.LEFT }),
      ],
    }],
  });

  const buf = await Packer.toBuffer(doc);
  fs.writeFileSync(OUT, buf);
  console.log('OK', OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
