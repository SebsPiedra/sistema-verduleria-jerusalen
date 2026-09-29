const jwt = require('jsonwebtoken');
const { pool } = require('../utils/mensual');

module.exports = async function access(req, res, next) {
  const path = req.path.replace(/\/+$/, '') || '/';
  if (req.method === 'OPTIONS' || path.startsWith('/auth/') ||
      (req.method === 'POST' && ['/clientes/login','/clientes/registrar'].includes(path)) ||
      (req.method === 'GET' && path === '/productos')) return next();
  res.set('Cache-Control', 'no-store');
  if (!process.env.JWT_SECRET) return res.status(503).json({mensaje:'Servicio de sesión no disponible.'});
  let token;
  try { token = jwt.verify((req.headers.authorization || '').replace(/^Bearer /i,''), process.env.JWT_SECRET, {algorithms:['HS256']}); }
  catch { return res.status(401).json({mensaje:'Tu sesión venció. Vuelve a ingresar.'}); }
  try {
    if(token.tipo === 'admin') {
      const id = Number(token.id_usuario);
      if(!Number.isSafeInteger(id) || id<=0) return res.status(403).json({mensaje:'Acceso no permitido.'});
      const {rows}=await pool.query('SELECT rol FROM usuarios WHERE id=$1',[id]);
      if(rows[0] && ['admin','administrador'].includes(String(rows[0].rol).toLowerCase())) return next();
    }
    if(token.tipo === 'cliente') {
      const id=Number(token.id_cliente);
      if(!Number.isSafeInteger(id) || id<=0) return res.status(403).json({mensaje:'Acceso no permitido.'});
      const {rows}=await pool.query("SELECT id_cliente FROM clientes WHERE id_cliente=$1 AND lower(coalesce(estado,'Activo'))='activo'",[id]);
      if(!rows.length)return res.status(403).json({mensaje:'Esta cuenta no está activa.'});
      if(req.method==='POST' && path==='/pedidos') {
        if(Number(req.body.id_cliente)!==id)return res.status(403).json({mensaje:'Solo puedes realizar pedidos con tu cuenta.'});
        return next();
      }
      if(req.method==='GET' && path===`/pedidos/cliente/${id}`)return next();
      const match=path.match(/^\/pedidos\/(\d+)$/);
      if(req.method==='GET' && match) {
        const result=await pool.query('SELECT id_pedido FROM pedidos WHERE id_pedido=$1 AND id_cliente=$2',[match[1],id]);
        if(!result.rows.length)return res.status(404).json({mensaje:'Pedido no encontrado.'});
        return next();
      }
    }
    return res.status(403).json({mensaje:'No tienes permiso para esta operación.'});
  } catch(error) { console.error('Validación de acceso:',error.code || 'error');return res.status(503).json({mensaje:'No se pudo verificar la sesión. Intenta nuevamente.'}); }
};
