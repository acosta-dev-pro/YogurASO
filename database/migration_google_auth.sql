-- ============================================================
-- Migración: Google Auth + password opcional (PostgreSQL)
-- Ejecutar en yoguraso_db (pgAdmin Query Tool)
-- NO borra datos existentes.
-- ============================================================

ALTER TABLE usuarios
    ALTER COLUMN password DROP NOT NULL;

ALTER TABLE usuarios
    ADD COLUMN IF NOT EXISTS google_id VARCHAR(255);

ALTER TABLE usuarios
    ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(20) DEFAULT 'local';

-- Índice único parcial: solo cuando google_id no es null
CREATE UNIQUE INDEX IF NOT EXISTS idx_usuarios_google_id
    ON usuarios (google_id)
    WHERE google_id IS NOT NULL;

-- Marcar usuarios actuales como local
UPDATE usuarios
SET auth_provider = COALESCE(auth_provider, 'local')
WHERE auth_provider IS NULL OR auth_provider = '';

-- Verificación
SELECT column_name, is_nullable, data_type
FROM information_schema.columns
WHERE table_name = 'usuarios'
  AND column_name IN ('password', 'google_id', 'auth_provider')
ORDER BY column_name;
