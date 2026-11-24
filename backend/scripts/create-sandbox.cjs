require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const bcrypt = require('bcryptjs');
const db = require('../db').promise();

const email = String(process.env.SANDBOX_EMAIL || 'demo@verduleria.local').trim().toLowerCase();
const password = String(process.env.SANDBOX_PASSWORD || 'DemoVerduleria2026!');

(async () => {
  let [rows] = await db.query('SELECT id FROM usuarios WHERE LOWER(COALESCE(correo,email)) = LOWER(?) LIMIT 1', [email]);
  let id = rows[0]?.id;
  if (!id) {
    const hash = await bcrypt.hash(password, 12);
    const [insertados] = await db.query(
      `INSERT INTO usuarios (nombre,correo,email,clave,password,rol)
       VALUES (?,?,?,?,?, 'admin') RETURNING id`,
      ['Demostración Verdulería', email, email, hash, hash]
    );
    id = Number(insertados[0]?.id);
    if (!id) throw new Error('No se obtuvo el identificador de la cuenta demostrativa.');
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
