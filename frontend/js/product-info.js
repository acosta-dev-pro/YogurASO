/* product-info.js — DATOS DEL PRODUCTO que el dueño debe confirmar.
   Todo lo que está en null todavía no lo sabemos: la web muestra un texto general y seguro en su lugar
   (por ejemplo "revisa la fecha impresa en el envase"). Cuando tengas el dato real, escríbelo aquí y
   aparece solo en la ficha de cada sabor y en las secciones de conservación y empaque.
   No inventar cifras: vida útil, temperaturas, ingredientes y presentaciones deben venir del negocio. */
window.YOG_INFO = {
    // Muestra una etiqueta discreta "Por confirmar" junto a los datos que aún faltan (ficha y preguntas).
    // Ponlo en false cuando ya no quieras que se vea en la web publicada.
    marcarPendientes: true,

    // Presentaciones que se ven en las fotos (botella de 500 ml). Agrega otras si existen: '1 litro', '250 ml'...
    presentaciones: ['500 ml'],

    // Días que dura cerrado y refrigerado. Ej.: 21. null = mostrar "revisa la fecha impresa en el envase".
    vidaUtilCerradoDias: null,
    // Días que dura una vez abierto. Ej.: 3. null = texto general.
    vidaUtilAbiertoDias: null,
    // Rango de nevera recomendado. Ej.: '2 °C a 6 °C'. null = "en la nevera".
    temperatura: null,

    // Ingredientes base comunes a todos los sabores. Ej.: ['Leche entera', 'Cultivos lácteos', 'Azúcar'].
    ingredientesBase: null,

    // Sellos que aparecen impresos en la etiqueta de las fotos. Confirmar que son correctos y que se pueden publicar.
    sellosEtiqueta: ['100% natural', 'Sin colorantes', 'Alto en proteína'],
    // Cambia a true cuando confirmes que esos sellos son correctos y publicables.
    sellosConfirmados: false,

    // Material del envase. Ej.: 'PET reciclable' o 'PEAD'. null = no se menciona el material.
    materialEnvase: null,
    // ¿Tapa con sello de seguridad? true / false / null (no se menciona).
    selloSeguridad: null,

    // Pasos reales de elaboración (si quieres reemplazar los textos generales del proceso). Ej.:
    // [{ titulo: 'Recibimos la leche', texto: '...' }, ...]. null = textos generales.
    proceso: null,

    // Puntos de venta o distribuidores. Ej.: [{ nombre: 'Tienda X', ciudad: 'Neiva', direccion: '...' }]
    puntosDeVenta: null,

    // Datos por sabor (opcional). Ej.: fresa: { ingredientes: [...], nota: 'Con trozos de fresa' }
    sabores: {
        fresa: {}, pina: {}, mora: {}, melocoton: {}, 'frutos-rojos': {}, cafe: {}, guanabana: {}, mango: {}
    }
};
