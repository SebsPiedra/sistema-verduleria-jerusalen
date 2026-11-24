-- Infraestructura que antes se creaba durante las solicitudes HTTP.

CREATE TABLE IF NOT EXISTS recuperacion_password (
  id_recuperacion BIGSERIAL PRIMARY KEY,
  tipo_cuenta VARCHAR(20) NOT NULL,
  id_cuenta BIGINT NOT NULL,
  token_hash VARCHAR(64) NOT NULL UNIQUE,
  fecha_expiracion TIMESTAMP NOT NULL,
  fecha_uso TIMESTAMP NULL,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_recuperacion_password_cuenta
  ON recuperacion_password (tipo_cuenta, id_cuenta);

CREATE TABLE IF NOT EXISTS usuario_seguridad (
  id_usuario BIGINT PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
  two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  two_factor_secret TEXT NULL,
  two_factor_pending_secret TEXT NULL,
  recovery_codes JSONB NOT NULL DEFAULT '[]'::jsonb,
  es_sandbox BOOLEAN NOT NULL DEFAULT FALSE,
  otp_hash VARCHAR(64) NULL,
  otp_expires_at TIMESTAMP NULL,
  otp_attempts INTEGER NOT NULL DEFAULT 0,
  actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE usuario_seguridad ADD COLUMN IF NOT EXISTS otp_hash VARCHAR(64) NULL;
ALTER TABLE usuario_seguridad ADD COLUMN IF NOT EXISTS otp_expires_at TIMESTAMP NULL;
ALTER TABLE usuario_seguridad ADD COLUMN IF NOT EXISTS otp_attempts INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_usuario_seguridad_sandbox
  ON usuario_seguridad (es_sandbox) WHERE es_sandbox = TRUE;

CREATE TABLE IF NOT EXISTS verificacion_acceso (
  tipo_cuenta VARCHAR(20) NOT NULL,
  id_cuenta BIGINT NOT NULL,
  requiere_verificacion BOOLEAN NOT NULL DEFAULT TRUE,
  correo_verificado_en TIMESTAMP NULL,
  ultimo_acceso TIMESTAMP NULL,
  otp_hash VARCHAR(64) NULL,
  otp_expires_at TIMESTAMP NULL,
  otp_attempts INTEGER NOT NULL DEFAULT 0,
  actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (tipo_cuenta, id_cuenta)
);

CREATE TABLE IF NOT EXISTS dispositivos_notificacion (
  id BIGSERIAL PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  plataforma VARCHAR(20) NOT NULL,
  tipo_usuario VARCHAR(20) NOT NULL,
  id_usuario BIGINT NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS configuracion_sistema (
  clave VARCHAR(80) PRIMARY KEY,
  valor NUMERIC(14,2) NOT NULL,
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO configuracion_sistema (clave, valor) VALUES
  ('umbral_envio_gratis', 15000),
  ('costo_envio_base', 1500)
ON CONFLICT (clave) DO NOTHING;

ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS subtotal_productos NUMERIC(14,2) NOT NULL DEFAULT 0;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS costo_envio NUMERIC(14,2) NOT NULL DEFAULT 0;

