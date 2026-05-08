-- =============================================
-- YOGURASO - ESQUEMA DE BASE DE DATOS
-- PostgreSQL
-- =============================================

-- Eliminar tablas en orden inverso
DROP TABLE IF EXISTS detalles_pedido CASCADE;
DROP TABLE IF EXISTS pedidos CASCADE;
DROP TABLE IF EXISTS carrito_items CASCADE;
DROP TABLE IF EXISTS carrito CASCADE;
DROP TABLE IF EXISTS productos CASCADE;
DROP TABLE IF EXISTS tokens_recuperacion CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;

-- =============================================
-- TABLA: usuarios
-- =============================================
CREATE TABLE usuarios (
    id          SERIAL PRIMARY KEY,
    nombre      VARCHAR(100) NOT NULL,
    apellido    VARCHAR(100) NOT NULL,
    email       VARCHAR(255) UNIQUE NOT NULL,
    password    VARCHAR(255) NOT NULL,
    telefono    VARCHAR(20),
    rol         VARCHAR(20) DEFAULT 'cliente' CHECK (rol IN ('cliente', 'admin')),
    activo      BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMP DEFAULT NOW(),
    updated_at  TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- TABLA: tokens_recuperacion
-- =============================================
CREATE TABLE tokens_recuperacion (
    id          SERIAL PRIMARY KEY,
    usuario_id  INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    token       VARCHAR(255) UNIQUE NOT NULL,
    usado       BOOLEAN DEFAULT FALSE,
    expira_en   TIMESTAMP NOT NULL,
    created_at  TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- TABLA: productos
-- =============================================
CREATE TABLE productos (
    id              SERIAL PRIMARY KEY,
    nombre          VARCHAR(150) NOT NULL,
    descripcion     TEXT,
    precio          NUMERIC(10,2) NOT NULL CHECK (precio >= 0),
    stock           INT DEFAULT 0 CHECK (stock >= 0),
    imagen_url      VARCHAR(500),
    categoria       VARCHAR(80) DEFAULT 'Yogur',
    activo          BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- TABLA: carrito
-- =============================================
CREATE TABLE carrito (
    id          SERIAL PRIMARY KEY,
    usuario_id  INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    created_at  TIMESTAMP DEFAULT NOW(),
    updated_at  TIMESTAMP DEFAULT NOW(),
    UNIQUE(usuario_id)
);

-- =============================================
-- TABLA: carrito_items
-- =============================================
CREATE TABLE carrito_items (
    id          SERIAL PRIMARY KEY,
    carrito_id  INT NOT NULL REFERENCES carrito(id) ON DELETE CASCADE,
    producto_id INT NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    cantidad    INT NOT NULL DEFAULT 1 CHECK (cantidad > 0),
    created_at  TIMESTAMP DEFAULT NOW(),
    updated_at  TIMESTAMP DEFAULT NOW(),
    UNIQUE(carrito_id, producto_id)
);

-- =============================================
-- TABLA: pedidos
-- =============================================
CREATE TABLE pedidos (
    id                  SERIAL PRIMARY KEY,
    usuario_id          INT NOT NULL REFERENCES usuarios(id),
    numero_pedido       VARCHAR(30) UNIQUE NOT NULL,
    estado              VARCHAR(30) DEFAULT 'pendiente'
                        CHECK (estado IN ('pendiente', 'en_proceso', 'enviado', 'completado', 'cancelado')),
    nombre_envio        VARCHAR(200),
    email_envio         VARCHAR(255),
    telefono_envio      VARCHAR(30),
    direccion           TEXT,
    ciudad              VARCHAR(100),
    codigo_postal       VARCHAR(20),
    subtotal            NUMERIC(12,2) NOT NULL,
    costo_envio         NUMERIC(10,2) DEFAULT 5000,
    total               NUMERIC(12,2) NOT NULL,
    metodo_pago         VARCHAR(50),
    estado_pago         VARCHAR(30) DEFAULT 'pendiente'
                        CHECK (estado_pago IN ('pendiente', 'pagado', 'fallido', 'reembolsado')),
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- TABLA: detalles_pedido
-- =============================================
CREATE TABLE detalles_pedido (
    id              SERIAL PRIMARY KEY,
    pedido_id       INT NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
    producto_id     INT REFERENCES productos(id) ON DELETE SET NULL,
    nombre_producto VARCHAR(150) NOT NULL,
    precio_unitario NUMERIC(10,2) NOT NULL,
    cantidad        INT NOT NULL CHECK (cantidad > 0),
    subtotal        NUMERIC(12,2) NOT NULL
);

-- =============================================
-- ÍNDICES
-- =============================================
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_pedidos_usuario ON pedidos(usuario_id);
CREATE INDEX idx_pedidos_estado ON pedidos(estado);
CREATE INDEX idx_carrito_items_carrito ON carrito_items(carrito_id);

-- =============================================
-- DATOS INICIALES - Productos
-- =============================================
INSERT INTO productos (nombre, descripcion, precio, stock, imagen_url, categoria) VALUES
('Fresa Natural',    'Yogur natural con trozos reales de fresa fresca.',         5500, 50, 'https://i.ibb.co/BH7B6G99/Fresa.png',      'Con Frutas'),
('Piña Tropical',   'Yogur fresco con sabor tropical de piña natural.',          5500, 50, 'https://i.ibb.co/rRDHmrkm/Pi-a.png',       'Con Frutas'),
('Mora Silvestre',  'Yogur dulce y ligeramente ácido de mora silvestre.',        5500, 50, 'https://i.ibb.co/MxMprvdq/Mora.png',       'Con Frutas'),
('Melocotón',       'Yogur delicado, suave y aromático de melocotón.',           5500, 50, 'https://i.ibb.co/HpDChbkb/Melocoton.png',  'Con Frutas'),
('Natural Clásico', 'Yogur puro sin saborizantes, alto en proteína.',            4800, 60, '',                                          'Natural'),
('Griego Cremoso',  'Yogur griego espeso y cremoso, bajo en azúcar.',            6200, 40, '',                                          'Griego'),
('Sin Lactosa',     'Yogur especial para intolerantes a la lactosa.',            6500, 30, '',                                          'Sin Lactosa');

-- =============================================
-- USUARIO ADMIN (contraseña: password)
-- =============================================
INSERT INTO usuarios (nombre, apellido, email, password, rol) VALUES
('Admin', 'YogurASO', 'admin@yoguraso.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');

-- =============================================
-- FUNCIÓN PARA UPDATED_AT
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_productos_updated_at BEFORE UPDATE ON productos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_carrito_updated_at BEFORE UPDATE ON carrito FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_carrito_items_updated_at BEFORE UPDATE ON carrito_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pedidos_updated_at BEFORE UPDATE ON pedidos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();