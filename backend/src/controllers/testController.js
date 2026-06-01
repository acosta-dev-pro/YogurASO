const getTest = (req, res) => {
    console.log('✅ TEST CONTROLLER FUNCIONA');
    res.json({ 
        mensaje: 'SI FUNCIONA CORRECTAMENTE',
        productos: [
            { id: 1, nombre: 'Yogur de Prueba 1' },
            { id: 2, nombre: 'Yogur de Prueba 2' }
        ]
    });
};

module.exports = { getTest };
