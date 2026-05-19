/**
 * admin/state.js — Estado compartido del panel de administración.
 * Un único objeto mutable: los módulos lo importan y lo modifican (state.products = [...]),
 * lo que evita variables globales sueltas y mantiene un solo origen de verdad.
 */

export const state = {
    /** id del producto en edición (null = creando uno nuevo) */
    editandoId: null,
    /** Catálogo completo (activos e inactivos) tal como lo ve el panel */
    products: [],
    users: [],
    questions: [],
    /** true mientras se guarda el formulario (evita envíos dobles) */
    guardando: false,
    /** Orden actual de la tabla de inventario */
    sortKey: 'id',
    sortDir: 'asc'
};

/** ids de productos seleccionados en la tabla (acciones masivas) */
export const selectedIds = new Set();
