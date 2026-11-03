const readline = require('readline');

const ask = (rl, prompt) => new Promise((resolve) => rl.question(prompt, resolve));

(async () => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const correo = String(await ask(rl, 'Correo: ')).trim();
  const clave = String(await ask(rl, 'Contraseña: '));
  rl.close();

  const response = await fetch('https://backend-verduleria.vercel.app/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correo, clave }),
  });
  const body = await response.json().catch(() => ({}));
  console.log(JSON.stringify({
    status: response.status,
    ok: response.ok,
    rol: body?.usuario?.rol || null,
    correo: body?.usuario?.correo || null,
  }));
  if (!response.ok) process.exitCode = 1;
})().catch((error) => {
  console.error(JSON.stringify({ ok: false, error: error.message }));
  process.exitCode = 1;
});
