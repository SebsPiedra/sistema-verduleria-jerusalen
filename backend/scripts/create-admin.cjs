const readline = require('readline');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });
const db = require('../db');

const ask = (prompt) => new Promise((resolve) => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.question(prompt, (answer) => { rl.close(); resolve(answer); });
});

const query = (sql, params = []) => new Promise((resolve, reject) => {
  db.query(sql, params, (error, result) => error ? reject(error) : resolve(result));
});

const rows = (result) => Array.isArray(result) ? result : (result?.rows || []);

(async () => {
  const correo = String(await ask('Correo del administrador: ')).trim().toLowerCase();
  const clave = String(await ask('Contraseña temporal: '));
  const nombre = String(await ask('Nombre visible: ')).trim() || 'Administrador';

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) throw new Error('Correo inválido.');
  if (clave.length < 8 || !/[a-z]/.test(clave) || !/[A-Z]/.test(clave) || !/\d/.test(clave)) {
    throw new Error('La contraseña no cumple los requisitos mínimos.');
  }

  const existente = rows(await query(
    'SELECT id FROM usuarios WHERE LOWER(COALESCE(correo,email)) = LOWER(?) LIMIT 1',
    [correo]
  ))[0];
  if (existente) throw new Error('Ya existe una cuenta con ese correo.');

  const siguiente = rows(await query('SELECT COALESCE(MAX(id), 0) + 1 AS id FROM usuarios'))[0];
  const hash = await bcrypt.hash(clave, 12);
  await query(
    `INSERT INTO usuarios (id,nombre,correo,email,clave,password,rol,estado)
     VALUES (?,?,?,?,?,?,?,?)`,
    [Number(siguiente.id), nombre, correo, correo, hash, hash, 'admin', 'Activo']
  );

  const creado = rows(await query(
    'SELECT id,nombre,COALESCE(correo,email) AS correo,rol,estado FROM usuarios WHERE id=?',
    [Number(siguiente.id)]
  ))[0];
  console.log(JSON.stringify({ ok: true, usuario: creado }));
  db.end?.();
})().catch((error) => {
  console.error(JSON.stringify({ ok: false, error: error.message }));
  db.end?.();
  process.exitCode = 1;
});
