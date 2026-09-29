const express = require('express');
const cors = require('cors');
const { randomUUID } = require('crypto');

const obtenerVariables = require('./config/variables');

const authRoutes = require('./routes/auth.routes');
const productosRoutes = require('./routes/productos.routes');
const ventasRoutes = require('./routes/ventas.routes');
const facturasRoutes = require('./routes/facturas.routes');
const desechosRoutes = require('./routes/desechos.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const clientesRoutes = require('./routes/clientes.routes');
const pedidosRoutes = require('./routes/pedidos.routes');
const proveedoresRoutes = require('./routes/proveedores.routes');

const variables = obtenerVariables();

const app = express();

app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  const inicio = Date.now();
  const requestId = req.headers['x-vercel-id'] || req.headers['x-request-id'] || randomUUID();
  res.setHeader('x-request-id', requestId);

  res.on('finish', () => {
    const evento = {
      level: res.statusCode >= 500 ? 'error' : 'info',
      message: 'request_completed',
      requestId,
      method: req.method,
      route: req.originalUrl.split('?')[0],
      status: res.statusCode,
      durationMs: Date.now() - inicio,
    };

    const escribir = res.statusCode >= 500 ? console.error : console.log;
    escribir(JSON.stringify(evento));
  });

  next();
});
app.use(require('./db').requestScope);
app.use('/api', require('./middleware/access'));

app.get('/', (req, res) => {
  res.send(`API de ${variables.NOMBRE_SISTEMA} funcionando correctamente`);
});

app.use('/api/auth', authRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/ventas', ventasRoutes);
app.use('/api/facturas', facturasRoutes);
app.use('/api/desechos', desechosRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/proveedores', proveedoresRoutes);
app.use('/api/resumen-mensual', require('./routes/resumen-mensual.routes'));


if (require.main === module) {
  app.listen(variables.PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${variables.PORT}`);
  });
}

module.exports = app;
module.exports.default = app;
