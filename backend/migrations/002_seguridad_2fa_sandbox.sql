CREATE TABLE IF NOT EXISTS usuario_seguridad (
  id_usuario BIGINT PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
  two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  two_factor_secret TEXT NULL,
  two_factor_pending_secret TEXT NULL,
  recovery_codes JSONB NOT NULL DEFAULT '[]'::jsonb,
  es_sandbox BOOLEAN NOT NULL DEFAULT FALSE,
  actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_usuario_seguridad_sandbox
  ON usuario_seguridad (es_sandbox)
  WHERE es_sandbox = TRUE;
