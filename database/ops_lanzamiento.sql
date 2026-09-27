-- ============================================================
-- YogurASO — SQL de operaciones / verificación (PostgreSQL)
-- NO uses phpMyAdmin (eso es MySQL). Usa pgAdmin, DBeaver o psql.
--
-- La tabla tokens_recuperacion YA existe en schema.sql.
-- Este archivo es para verificar y operaciones manuales de lanzamiento.
-- ============================================================

-- 1) Verificar que existan las tablas clave
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'usuarios',
    'productos',
    'tokens_recuperacion',
    'carrito',
    'carrito_items',
    'pedidos',
    'detalles_pedido'
  )
ORDER BY table_name;

-- 2) Ver estructura de tokens de recuperación
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'tokens_recuperacion'
ORDER BY ordinal_position;

-- 3) Listar usuarios (sin mostrar hash completo)
SELECT id, nombre, apellido, email, rol, activo, created_at
FROM usuarios
ORDER BY id;

-- 4) Tokens de recuperación vigentes (no usados y no vencidos)
SELECT t.id, u.email, t.usado, t.expira_en, t.created_at
FROM tokens_recuperacion t
JOIN usuarios u ON u.id = t.usuario_id
WHERE t.usado = false AND t.expira_en > NOW()
ORDER BY t.created_at DESC;

-- 5) Invalidar password del admin (DESARROLLO / emergencia)
--    Genera el hash con: node database/generar_hash_password.js "TuNuevaClaveSegura"
--    Luego pega el hash abajo y ejecuta el UPDATE.
--
-- UPDATE usuarios
-- SET password = '$2a$10$PEGAR_AQUI_EL_HASH_GENERADO',
--     updated_at = NOW()
-- WHERE email = 'admin@yoguraso.com';

-- 6) Desactivar un usuario manualmente
-- UPDATE usuarios SET activo = false, updated_at = NOW() WHERE email = 'cliente@ejemplo.com';

-- 7) Soft-delete de producto (equivalente a DELETE en API actual)
-- UPDATE productos SET activo = false, updated_at = NOW() WHERE id = 1;

-- 8) Reactivar producto
-- UPDATE productos SET activo = true, updated_at = NOW() WHERE id = 1;

-- 9) Limpiar tokens vencidos o ya usados (mantenimiento)
-- DELETE FROM tokens_recuperacion WHERE usado = true OR expira_en < NOW();
