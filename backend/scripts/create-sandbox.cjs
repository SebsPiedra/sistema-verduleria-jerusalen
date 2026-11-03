require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const bcrypt = require('bcryptjs');
const db = require('../db').promise();

const email = String(process.env.SANDBOX_EMAIL || 'demo@verduleria.local').trim().toLowerCase();
const password = String(process.env.SANDBOX_PASSWORD || 'DemoVerduleria2026!');

(async () => {
  await db.query(`CREATE TABLE IF NOT EXISTS usuario_seguridad (
    id_usuario BIGINT PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
    two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    two_factor_secret TEXT NULL,
    two_factor_pending_secret TEXT NULL,
    recovery_codes JSONB NOT NULL DEFAULT '[]'::jsonb,
    es_sandbox BOOLEAN NOT NULL DEFAULT FALSE,
    actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);
  let [rows] = await db.query('SELECT id FROM usuarios WHERE LOWER(COALESCE(correo,email)) = LOWER(?) LIMIT 1', [email]);
  let id = rows[0]?.id;
  if (!id) {
    const [nextRows] = await db.query('SELECT COALESCE(MAX(id),0)+1 AS id FROM usuarios');
    id = Number(nextRows[0].id);
    const hash = await bcrypt.hash(password, 12);
    await db.query(
      `INSERT INTO usuarios (id,nombre,correo,email,clave,password,rol)
       VALUES (?,?,?,?,?,?, 'admin')`,
      [id, 'Demostración Verdulería', email, email, hash, hash]
    );
  }
  await db.query(
    `INSERT INTO usuario_seguridad (id_usuario, es_sandbox)
     VALUES (?, TRUE)
     ON CONFLICT (id_usuario) DO UPDATE SET es_sandbox = TRUE, actualizado_en = CURRENT_TIMESTAMP`,
    [id]
  );
  console.log(JSON.stringify({ ok: true, id, email, password: 'configurada por SANDBOX_PASSWORD' }));
  process.exit(0);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
