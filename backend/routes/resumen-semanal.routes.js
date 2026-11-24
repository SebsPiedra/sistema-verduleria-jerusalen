const express = require('express');
const jwt = require('jsonwebtoken');
const { pool, resumenSemanal } = require('../utils/semanal');
const generarPdfSemanal = require('../utils/semanal-pdf');

const router = express.Router();

router.use(async (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  try {
    const token = jwt.verify((req.headers.authorization || '').replace(/^Bearer /i, ''), process.env.JWT_SECRET, { algorithms: ['HS256'] });
    if (token.tipo !== 'admin' || !Number.isSafeInteger(Number(token.id_usuario))) {
      return res.status(403).json({ mensaje: 'Acceso exclusivo del administrador.' });
    }
    const { rows } = await pool.query('SELECT rol FROM usuarios WHERE id=$1', [token.id_usuario]);
    if (!rows[0] || !['admin', 'administrador'].includes(String(rows[0].rol).toLowerCase())) {
      return res.status(403).json({ mensaje: 'Acceso exclusivo del administrador.' });
    }
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ mensaje: 'Inicie sesión nuevamente como administrador.' });
    }
    next(error);
  }
});

router.get('/', async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ');
    const result = await resumenSemanal(client, req.query.fecha);
    await client.query('COMMIT');
    res.json(result);
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
});

router.get('/pdf', async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ');
    const report = await resumenSemanal(client, req.query.fecha);
    await client.query('COMMIT');
    const buffer = await generarPdfSemanal(report);
    res.set('Content-Type', 'application/pdf');
    res.set('Content-Disposition', `attachment; filename="Resumen-semanal-${report.inicio}-${report.fin}.pdf"`);
    res.send(buffer);
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    next(error);
  } finally {
    client.release();
  }
});

router.use((error, req, res, next) => {
  console.error('Resumen semanal:', error.code || error.message);
  res.status(error.status || 500).json({ mensaje: error.status ? error.message : 'No se pudo calcular el resumen semanal.' });
});

module.exports = router;
