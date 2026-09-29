const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
require('dotenv').config({path:path.join(__dirname,'../.vercel/monthly-test.env'),quiet:true});
// Guard against accidentally creating fixtures in the real business database.
assert.equal(new URL(process.env.DATABASE_URL).hostname,'ep-fancy-hat-ax2dcn2i-pooler.c-4.us-east-2.aws.neon.tech');
process.env.JWT_SECRET=randomUUID()+randomUUID();
const {pool,resumen}=require('../utils/mensual');
const app=require('../server');
const jwt=require('jsonwebtoken');
const server=app.listen(3097,'127.0.0.1');
(async()=>{
  const admin=(await pool.query("SELECT id FROM usuarios WHERE rol='admin' LIMIT 1")).rows[0].id;
  const token=jwt.sign({id_usuario:admin,tipo:'admin'},process.env.JWT_SECRET,{expiresIn:'1h'});
  const headers={Authorization:'Bearer '+token,'Content-Type':'application/json'};
  const request=(route,method='GET',body)=>fetch('http://127.0.0.1:3097/api/resumen-mensual'+route,{method,headers,body:body?JSON.stringify(body):undefined});
  assert.equal((await fetch('http://127.0.0.1:3097/api/resumen-mensual?periodo=2098-02')).status,401);
  const clientToken=jwt.sign({id_usuario:admin,tipo:'cliente'},process.env.JWT_SECRET);
  assert.equal((await fetch('http://127.0.0.1:3097/api/resumen-mensual?periodo=2098-02',{headers:{Authorization:'Bearer '+clientToken}})).status,403);
  assert.equal((await request('?periodo=2098-13')).status,400);
  assert.equal((await request('/gastos','POST',{id:randomUUID(),fecha:'2098-99-99',concepto:'Prueba',monto:1})).status,400);
  const c=await pool.connect();
  try {
    await c.query('BEGIN');
    const p=(await c.query('SELECT id_producto FROM productos LIMIT 1')).rows[0].id_producto;
    await c.query('UPDATE productos SET precio_compra=20 WHERE id_producto=$1',[p]);
    await c.query("INSERT INTO ventas(id_venta,total,estado,fecha_venta) VALUES(-90301,100,'Completada','2097-02-28 23:59:59'),(-90302,999,'Cancelada','2097-02-15'),(-90303,999,'Completada','2097-03-01')");
    await c.query('INSERT INTO detalle_ventas(id_detalle,id_venta,id_producto,cantidad,precio_unitario,subtotal) VALUES(-90301,-90301,$1,2,50,100)',[p]);
    await c.query("INSERT INTO pedidos(id_pedido,id_venta,total,estado,fecha_pedido) VALUES(-90301,-90301,100,'Entregado','2097-02-28')");
    await c.query("INSERT INTO desechos(id_desecho,id_producto,cantidad,perdida_total,fecha_desecho) VALUES(-90301,$1,1,5,'2097-02-28')",[p]);
    await c.query("INSERT INTO gastos_mensuales(id,fecha,concepto,monto,creado_por) VALUES($1,'2097-02-28','Prueba aislada',10,$2)",[randomUUID(),admin]);
    await c.query('UPDATE productos SET precio_compra=70 WHERE id_producto=$1',[p]);
    const r=await resumen(c,'2097-02');
    assert.equal(r.totales.ingresos,10000);assert.equal(r.totales.costo,4000);assert.equal(r.totales.perdidas,500);assert.equal(r.totales.gastos,1000);assert.equal(r.totales.ganancia,4500);assert.equal(r.totales.ventas,1);assert.equal(r.totales.pedidos,1);assert.equal(r.totales.costos_estimados,0);
    console.log('PASS: month boundaries, canceled sale exclusion, linked order not doubled, captured historical cost, profit arithmetic.');
  } finally {await c.query('ROLLBACK');c.release();}
  const gastoId=randomUUID();
  assert.equal((await request('/gastos','POST',{id:gastoId,fecha:'2098-02-02',concepto:'Prueba de gasto mensual',monto:'12.34'})).status,201);
  assert.equal((await request('/gastos','POST',{id:gastoId,fecha:'2098-02-02',concepto:'Prueba de gasto mensual',monto:'12.34'})).status,409);
  const cutId=randomUUID();const saved=await request('/cortes','POST',{id:cutId,periodo:'2098-02'});assert.equal(saved.status,201);const before=await saved.json();
  assert.equal((await request('/cortes','POST',{id:cutId,periodo:'2098-02'})).status,201);
  assert.equal((await request('/gastos/'+gastoId+'/anular','POST',{})).status,200);
  const after=await (await request('/cortes/'+cutId)).json();assert.deepEqual(after.datos,before.datos);
  const live=await (await request('?periodo=2098-02')).json();assert.equal(before.datos.totales.gastos-live.totales.gastos,1234);
  const pdf=await request('/cortes/'+cutId+'/pdf');assert.equal(pdf.status,200);const bytes=Buffer.from(await pdf.arrayBuffer());assert.equal(bytes.subarray(0,4).toString(),'%PDF');
  fs.writeFileSync(path.join(__dirname,'../.vercel/monthly-test.pdf'),bytes);
  console.log('PASS: authentication, validation, duplicate prevention, stored cuts unchanged after annulment, PDF response.');
  if(process.argv.includes('--serve')) {
    const express=require('express');const ui=express();
    ui.get('/__test-session',(req,res)=>res.type('html').send(`<script>localStorage.setItem('token',${JSON.stringify(token)});localStorage.setItem('usuario',JSON.stringify({nombre:'Administrador de prueba',rol:'admin'}));location.replace('/resumen-mensual')</script>`));
    ui.use(express.static(path.join(__dirname,'../../frontend/dist'),{extensions:['html']}));
    ui.use((req,res)=>res.sendFile(path.join(__dirname,'../../frontend/dist/index.html')));
    ui.listen(3098,'127.0.0.1');console.log('Isolated test UI: http://127.0.0.1:3098/__test-session');
  } else { server.close(); await pool.end(); process.exit(0); }
})().catch(e=>{console.error(e);server.close();pool.end().finally(()=>process.exit(1));});
