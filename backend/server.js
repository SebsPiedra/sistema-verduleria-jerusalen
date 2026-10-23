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

if (process.env.NODE_ENV === 'production') {
  const faltantes = ['DATABASE_URL', 'JWT_SECRET'].filter((nombre) => !process.env[nombre]);
  if (faltantes.length > 0) {
    throw new Error(`Faltan variables obligatorias: ${faltantes.join(', ')}`);
  }
}

const app = express();

const origenesPermitidos = new Set([
  variables.FRONTEND_URL,
  'https://frontend-verduleria.vercel.app',
  'http://localhost:8081',
].filter(Boolean).map((origen) => origen.replace(/\/$/, '')));

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || origenesPermitidos.has(origin.replace(/\/$/, ''))) {
      callback(null, true);
      return;
    }

    callback(new Error('Origen no permitido por CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
}));
app.use(express.json({ limit: '1mb' }));
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

app.get('/', (req, res) => {
  res.send(`API de ${variables.NOMBRE_SISTEMA} funcionando correctamente`);
});

app.get(['/health', '/api/health'], async (req, res) => {
  try {
    await require('./db').promise().query('SELECT 1 AS ok');
    res.status(200).json({
      estado: 'saludable',
      api: 'disponible',
      baseDatos: 'disponible',
      fecha: new Date().toISOString(),
    });
  } catch (error) {
    console.error(JSON.stringify({
      level: 'error',
      message: 'health_check_failed',
      error: error.message,
    }));
    res.status(503).json({
      estado: 'no_disponible',
      api: 'disponible',
      baseDatos: 'no_disponible',
    });
  }
});

app.use('/api', require('./middleware/access'));

app.use('/api/auth', authRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/ventas', ventasRoutes);
app.use('/api/facturas', facturasRoutes);
app.use('/api/desechos', desechosRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/proveedores', proveedoresRoutes);
app.use('/api/configuracion', require('./routes/configuracion.routes'));
app.use('/api/resumen-mensual', require('./routes/resumen-mensual.routes'));

app.use((req, res) => {
  res.status(404).json({ mensaje: 'Ruta no encontrada.' });
});

app.use((error, req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  const requestId = res.getHeader('x-request-id');
  const status = error.message === 'Origen no permitido por CORS' ? 403 : 500;
  console.error(JSON.stringify({
    level: 'error',
    message: 'request_failed',
    requestId,
    method: req.method,
    route: req.originalUrl.split('?')[0],
    error: error.message,
  }));
  res.status(status).json({
    mensaje: status === 403 ? error.message : 'Ocurrió un error interno.',
    requestId,
  });
});


if (require.main === module) {
  if (!variables.DATABASE_URL || !variables.JWT_SECRET) {
    throw new Error('Faltan DATABASE_URL o JWT_SECRET. El servidor no puede iniciar de forma segura.');
  }

  app.listen(variables.PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${variables.PORT}`);
  });
}

module.exports = app;
module.exports.default = app;
