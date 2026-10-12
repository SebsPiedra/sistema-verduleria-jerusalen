const express = require('express');
const { pool } = require('../utils/mensual');
const router = express.Router();

async function preparar() {
  await pool.query(`CREATE TABLE IF NOT EXISTS configuracion_sistema (clave VARCHAR(80) PRIMARY KEY, valor NUMERIC(14,2) NOT NULL, actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now())`);
  await pool.query(`INSERT INTO configuracion_sistema(clave,valor) VALUES ('umbral_envio_gratis',15000),('costo_envio_base',1500) ON CONFLICT (clave) DO NOTHING`);
}

router.get('/envio', async (_req,res) => {
  try {
    await preparar();
    const {rows}=await pool.query("SELECT clave,valor FROM configuracion_sistema WHERE clave IN ('umbral_envio_gratis','costo_envio_base')");
    const valores=Object.fromEntries(rows.map(r=>[r.clave,Number(r.valor)]));
    res.json({umbral_envio_gratis:valores.umbral_envio_gratis??15000,costo_envio_base:valores.costo_envio_base??1500});
  } catch(error) { console.error(error); res.status(500).json({mensaje:'No se pudo cargar la configuración de envío.'}); }
});

router.put('/envio', async (req,res) => {
  const umbral=Number(req.body?.umbral_envio_gratis);
  const costo=Number(req.body?.costo_envio_base);
  if(!Number.isFinite(umbral)||umbral<0||!Number.isFinite(costo)||costo<0)return res.status(400).json({mensaje:'Ingrese montos válidos.'});
  try {
    await preparar();
    await pool.query(`INSERT INTO configuracion_sistema(clave,valor,actualizado_en) VALUES ('umbral_envio_gratis',$1,now()),('costo_envio_base',$2,now()) ON CONFLICT (clave) DO UPDATE SET valor=EXCLUDED.valor,actualizado_en=now()`,[umbral,costo]);
    res.json({mensaje:'Tarifa de envío actualizada.',umbral_envio_gratis:umbral,costo_envio_base:costo});
  } catch(error){console.error(error);res.status(500).json({mensaje:'No se pudo guardar la configuración.'});}
});

module.exports=router;
