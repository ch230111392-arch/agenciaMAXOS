-- Crear base de datos
CREATE DATABASE agencia_viajes;

-- Usar la base de datos
USE agencia_viajes;

-- =========================
-- TABLA USUARIOS
-- =========================
CREATE TABLE usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    usuario VARCHAR(50) NOT NULL,
    contrasena VARCHAR(100) NOT NULL,
    correo VARCHAR(100) NOT NULL UNIQUE
);

-- =========================
-- TABLA CLIENTES
-- =========================
CREATE TABLE clientes (
    id_cliente INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    telefono VARCHAR(20),
    activo BOOLEAN DEFAULT TRUE
);

-- =========================
-- TABLA PROVEEDORES
-- =========================
CREATE TABLE proveedores (
    id_proveedor INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    tipo VARCHAR(50),
    comision DECIMAL(5,2),
    activo BOOLEAN DEFAULT TRUE
);

-- =========================
-- TABLA COTIZACIONES
-- =========================
CREATE TABLE cotizaciones (
    id_cotizacion INT AUTO_INCREMENT PRIMARY KEY,
    id_cliente INT NOT NULL,
    id_proveedor INT,
    destino VARCHAR(100),
    precio DECIMAL(10,2),
    fecha DATE,
    estatus VARCHAR(50),
    activo BOOLEAN DEFAULT TRUE,
    
    FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente),
    FOREIGN KEY (id_proveedor) REFERENCES proveedores(id_proveedor)
);

-- =========================
-- TABLA RESERVAS
-- =========================
CREATE TABLE reservas (
    id_reserva INT AUTO_INCREMENT PRIMARY KEY,
    id_cliente INT NOT NULL,
    id_cotizacion INT,
    tipo VARCHAR(50),
    monto_total DECIMAL(10,2),
    tipo_pago VARCHAR(50),
    fecha DATE,
    comision DECIMAL(10,2),
    activo BOOLEAN DEFAULT TRUE,
    
    FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente),
    FOREIGN KEY (id_cotizacion) REFERENCES cotizaciones(id_cotizacion)
);

-- =========================
-- TABLA PAGOS
-- =========================
CREATE TABLE pagos (
    id_pago INT AUTO_INCREMENT PRIMARY KEY,
    id_reserva INT NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    tipo_pago VARCHAR(50),
    fecha DATE,
    estatus VARCHAR(50),
    
    FOREIGN KEY (id_reserva) REFERENCES reservas(id_reserva)
);