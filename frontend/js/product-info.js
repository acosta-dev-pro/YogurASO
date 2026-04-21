/* product-info.js — Datos detallados y naturales de cada sabor de YogurASO.
   Ingredientes 100% artesanales, conservación y valores nutricionales. */
window.YOG_INFO = {
    marcarPendientes: false,

    presentaciones: ['500 ml', '1 Litro'],

    vidaUtilCerradoDias: 25,
    vidaUtilAbiertoDias: 5,
    temperatura: '2 °C a 4 °C (Siempre en nevera)',

    ingredientesBase: [
        'Leche entera pasteurizada',
        'Cultivos lácticos vivos (L. bulgaricus, S. thermophilus)',
        'Azúcar puro de caña'
    ],

    sellosEtiqueta: ['100% natural', 'Sin colorantes artificiales', 'Alto en proteína', 'Con probióticos vivos'],
    sellosConfirmados: true,

    materialEnvase: 'Envase PET grado alimentario 100% reciclable',
    selloSeguridad: true,

    infoNutricional: 'Porción 200 ml · 140 kcal · Proteína 6.2g · Grasa 3.5g · Calcio 210 mg (20% VD) · Probióticos vivos',

    sabores: {
        fresa: {
            ingredientes: ['Leche entera pasteurizada', 'Trozos de fresa natural seleccionada', 'Cultivos lácticos vivos', 'Azúcar puro de caña'],
            nota: 'Con trocitos reales de fresa dulce y fresca.',
            nutricion: 'Porción 200 ml: 142 kcal · Proteína 6.2g · Calcio 20% VD · Probióticos activos'
        },
        pina: {
            ingredientes: ['Leche entera pasteurizada', 'Trozos de piña oro miel natural', 'Cultivos lácticos vivos', 'Azúcar puro de caña'],
            nota: 'Con trozos de piña oro miel tropical jugosa.',
            nutricion: 'Porción 200 ml: 138 kcal · Proteína 6.0g · Calcio 20% VD · Probióticos activos'
        },
        mora: {
            ingredientes: ['Leche entera pasteurizada', 'Pulpa de mora silvestre campesina', 'Cultivos lácticos vivos', 'Azúcar puro de caña'],
            nota: 'El sabor clásico del campo con mora silvestre seleccionada.',
            nutricion: 'Porción 200 ml: 140 kcal · Proteína 6.1g · Calcio 20% VD · Probióticos activos'
        },
        melocoton: {
            ingredientes: ['Leche entera pasteurizada', 'Pulpa y trocitos de melocotón madurado', 'Cultivos lácticos vivos', 'Azúcar puro de caña'],
            nota: 'Suavidad frutal irresistible con trocitos de melocotón.',
            nutricion: 'Porción 200 ml: 145 kcal · Proteína 6.0g · Calcio 20% VD · Probióticos activos'
        },
        'frutos-rojos': {
            ingredientes: ['Leche entera pasteurizada', 'Trozos de fresa, mora silvestre y arándanos frescos', 'Cultivos lácticos vivos', 'Azúcar puro de caña'],
            nota: 'Mezcla silvestre antioxidante y naturalmente deliciosa.',
            nutricion: 'Porción 200 ml: 144 kcal · Proteína 6.3g · Calcio 21% VD · Probióticos activos'
        },
        cafe: {
            ingredientes: ['Leche entera pasteurizada', 'Extracto de café especial tostado 100% colombiano', 'Cultivos lácticos vivos', 'Azúcar puro de caña'],
            nota: 'Auténtico sabor a café de origen con cremosidad única.',
            nutricion: 'Porción 200 ml: 148 kcal · Proteína 6.5g · Calcio 20% VD · Probióticos activos'
        },
        guanabana: {
            ingredientes: ['Leche entera pasteurizada', 'Pulpa de guanábana fresca seleccionada', 'Cultivos lácticos vivos', 'Azúcar puro de caña'],
            nota: 'Exótica textura y aroma característico de guanábana de cosecha.',
            nutricion: 'Porción 200 ml: 140 kcal · Proteína 6.0g · Calcio 20% VD · Probióticos activos'
        },
        mango: {
            ingredientes: ['Leche entera pasteurizada', 'Pulpa de mango madurado al sol', 'Cultivos lácticos vivos', 'Azúcar puro de caña'],
            nota: 'Dulzura natural y frescura de mango criollo maduro.',
            nutricion: 'Porción 200 ml: 142 kcal · Proteína 6.0g · Calcio 20% VD · Probióticos activos'
        }
    }
};
