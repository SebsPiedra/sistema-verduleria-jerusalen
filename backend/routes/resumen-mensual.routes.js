const express = require('express');
const jwt = require('jsonwebtoken');
const { pool, resumen, periodoValido, uuid } = require('../utils/mensual');
const generarPdf = require('../utils/mensual-pdf');
const router = express.Router();
router.use(async (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  const secret = process.env.JWT_SECRET;
  if (!secret) return res.status(503).json({ mensaje: 'Configure JWT_SECRET para habilitar los informes.' });
  let token;
  try {
    token = jwt.verify((req.headers.authorization || '').replace(/^Bearer /i, ''), secret, { algorithms: ['HS256'] });
  } catch { return res.status(401).json({ mensaje: 'Inicie sesión nuevamente como administrador.' }); }
  if (token.tipo !== 'admin' || !Number.isSafeInteger(Number(token.id_usuario))) return res.status(403).json({ mensaje: 'Acceso exclusivo del administrador.' });
  try {
    const { rows } = await pool.query('SELECT id,rol FROM usuarios WHERE id=$1', [token.id_usuario]);
    if (!rows[0] || !['admin','administrador'].includes(String(rows[0].rol).toLowerCase())) return res.status(403).json({ mensaje: 'Acceso exclusivo del administrador.' });
    req.adminId = rows[0].id;
    next();
  } catch (error) { next(error); }
});
async function transaccion(work) {
  const c = await pool.connect();
  try { await c.query('BEGIN ISOLATION LEVEL REPEATABLE READ'); const result = await work(c); await c.query('COMMIT'); return result; }
  catch (e) { await c.query('ROLLBACK'); throw e; }
  finally { c.release(); }
}
router.get('/', async (req,res,next) => {
  try { res.json(await transaccion(c=>resumen(c,req.query.periodo))); } catch(e) { next(e); }
});
router.get('/cortes', async (req,res,next) => {
  try {
    const periodo = periodoValido(req.query.periodo);
    res.json((await pool.query('SELECT id,periodo,creado_en,datos->\'totales\' AS totales FROM cortes_mensuales WHERE periodo=$1 ORDER BY creado_en DESC',[periodo])).rows);
  } catch(e) { next(e); }
});
router.post('/cortes', async (req,res,next) => {
  try {
    const periodo = periodoValido(req.body.periodo);
    const id = req.body.id;
    if (!uuid.test(id || '')) return res.status(400).json({ mensaje: 'Identificador de solicitud inválido.' });
    const datos = await transaccion(async c => {
      const found = (await c.query('SELECT * FROM cortes_mensuales WHERE id=$1',[id])).rows[0];
      if (found) {
        if (found.periodo !== periodo) throw Object.assign(new Error('Identificador ya utilizado.'),{status:409});
        return found;
      }
      const snapshot = await resumen(c,periodo);
      return (await c.query('INSERT INTO cortes_mensuales(id,periodo,creado_por,datos) VALUES($1,$2,$3,$4) RETURNING *',[id,periodo,req.adminId,JSON.stringify(snapshot)])).rows[0];
    });
    res.status(201).json(datos);
  } catch(e) { next(e); }
});
router.get('/cortes/:id', async (req,res,next) => {
  try {
    if (!uuid.test(req.params.id)) return res.status(400).json({mensaje:'Corte inválido.'});
    const row = (await pool.query('SELECT * FROM cortes_mensuales WHERE id=$1',[req.params.id])).rows[0];
    if (!row) return res.status(404).json({mensaje:'No se encontró el corte.'});
    res.json(row);
  } catch(e) { next(e); }
});
router.get('/cortes/:id/pdf', async (req,res,next) => {
  try {
    if (!uuid.test(req.params.id)) return res.status(400).json({mensaje:'Corte inválido.'});
    const row = (await pool.query('SELECT * FROM cortes_mensuales WHERE id=$1',[req.params.id])).rows[0];
    if (!row) return res.status(404).json({mensaje:'No se encontró el corte.'});
    const buffer = await generarPdf(row);
    res.set('Content-Type','application/pdf');
    res.set('Content-Disposition',`attachment; filename="Resumen-${row.periodo}-${row.id.slice(0,8)}.pdf"`);
    res.send(buffer);
  } catch(e) { next(e); }
});
router.post('/gastos', async (req,res,next) => {
  try {
    const { id, fecha, concepto, monto } = req.body;
    const parsed = new Date(fecha+'T12:00:00Z');
    if (!uuid.test(id || '') || !/^20\d\d-\d\d-\d\d$/.test(fecha || '') || !Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0,10)!==fecha ||
      typeof concepto !== 'string' || !concepto.trim() || concepto.trim().length>200 || !/^\d{1,10}(\.\d{1,2})?$/.test(String(monto)) || Number(monto)<=0)
      return res.status(400).json({mensaje:'Ingrese fecha válida, concepto (máximo 200 caracteres) y monto positivo con hasta dos decimales.'});
    const row = (await pool.query(`INSERT INTO gastos_mensuales(id,fecha,concepto,monto,creado_por) VALUES($1,$2,$3,$4,$5)
      ON CONFLICT(id) DO NOTHING RETURNING *`,[id,fecha,concepto.trim(),monto,req.adminId])).rows[0];
    if (!row) return res.status(409).json({mensaje:'Este gasto ya fue recibido. Actualice el resumen.'});
    res.status(201).json(row);
  } catch(e) { next(e); }
});
router.post('/gastos/:id/anular', async (req,res,next) => {
  try {
    if (!uuid.test(req.params.id)) return res.status(400).json({mensaje:'Gasto inválido.'});
    const r = await pool.query('UPDATE gastos_mensuales SET anulado_en=coalesce(anulado_en,now()),anulado_por=coalesce(anulado_por,$2) WHERE id=$1 RETURNING id',[req.params.id,req.adminId]);
    if (!r.rowCount) return res.status(404).json({mensaje:'Gasto no encontrado.'});
    res.json({mensaje:'Gasto anulado. Los cortes anteriores no cambian.'});
  } catch(e) { next(e); }
});
router.use((error,req,res,next) => {
  console.error('Resumen mensual:',error.code === 'MODULE_NOT_FOUND' ? error.message : (error.code || error.message));
  res.status(error.status || (['23505','40001'].includes(error.code)?409:500)).json({mensaje:error.status ? error.message : 'No se pudo completar la operación. Actualice e intente nuevamente.'});
});
module.exports = router;
