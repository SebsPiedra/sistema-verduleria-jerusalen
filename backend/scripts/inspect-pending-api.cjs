const readline = require('readline');
const ask = (rl, prompt) => new Promise((resolve) => rl.question(prompt, resolve));

(async () => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const correo = String(await ask(rl, 'Correo: ')).trim();
  const clave = String(await ask(rl, 'Contraseña: '));
  rl.close();

  const base = 'https://backend-verduleria.vercel.app/api';
  const login = await fetch(`${base}/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correo, clave }),
  });
  const loginBody = await login.json();
  if (!login.ok) throw new Error(`Login ${login.status}`);

  const response = await fetch(`${base}/pedidos`, {
    headers: { Authorization: `Bearer ${loginBody.token}` },
  });
  const body = await response.json();
  const pedidos = Array.isArray(body) ? body : (body.pedidos || body.data || []);
  console.log(JSON.stringify({
    status: response.status,
    pendientes: pedidos
      .filter((pedido) => String(pedido.estado || 'Pendiente').toLowerCase() === 'pendiente')
      .map((pedido) => ({
        id: pedido.id_pedido,
        detalles: Array.isArray(pedido.detalles) ? pedido.detalles.length : null,
        cantidad_productos: pedido.cantidad_productos,
      })),
  }));
})().catch((error) => {
  console.error(JSON.stringify({ ok: false, error: error.message }));
  process.exitCode = 1;
});
