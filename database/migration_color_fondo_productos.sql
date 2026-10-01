ALTER TABLE productos
    ADD COLUMN IF NOT EXISTS color_fondo VARCHAR(7) NOT NULL DEFAULT '#FFF8F4';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'productos_color_fondo_hex_check'
          AND conrelid = 'productos'::regclass
    ) THEN
        ALTER TABLE productos
            ADD CONSTRAINT productos_color_fondo_hex_check
            CHECK (color_fondo ~ '^#[0-9A-Fa-f]{6}$');
    END IF;
END;
$$;