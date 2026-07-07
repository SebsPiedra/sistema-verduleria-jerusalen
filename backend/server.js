const express = require('express');
const cors = require('cors');

const obtenerVariables = require('./config/variables');

const authRoutes = require('./routes/auth.routes');
const productosRoutes = require('./routes/productos.routes');
const ventasRoutes = require('./routes/ventas.routes');
const desechosRoutes = require('./routes/desechos.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const clientesRoutes = require('./routes/clientes.routes');
const pedidosRoutes = require('./routes/pedidos.routes');
const proveedoresRoutes = require('./routes/proveedores.routes');

const variables = obtenerVariables();

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send(`API de ${variables.NOMBRE_SISTEMA} funcionando correctamente`);
});

app.use('/api/auth', authRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/ventas', ventasRoutes);
app.use('/api/desechos', desechosRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/proveedores', proveedoresRoutes);

app.listen(variables.PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${variables.PORT}`);
});