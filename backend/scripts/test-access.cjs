const assert=require('node:assert/strict');const path=require('path');const {randomUUID}=require('node:crypto');
require('dotenv').config({path:path.join(__dirname,'../.vercel/monthly-test.env'),quiet:true});
assert.equal(new URL(process.env.DATABASE_URL).hostname,'ep-fancy-hat-ax2dcn2i-pooler.c-4.us-east-2.aws.neon.tech');
process.env.JWT_SECRET=randomUUID();const app=require('../server');const {pool}=require('../utils/mensual');const jwt=require('jsonwebtoken');const db=require('../db');
app.get('/__transaction-test',async(req,res)=>{try{
  await new Promise((resolve,reject)=>db.beginTransaction(e=>e?reject(e):resolve()));
  const first=(await db.query('SELECT pg_backend_pid() AS pid, txid_current() AS tx'))[0];
  await new Promise(r=>setTimeout(r,100));
  const second=(await db.query('SELECT pg_backend_pid() AS pid, txid_current() AS tx'))[0];
  await new Promise((resolve,reject)=>db.rollback(e=>e?reject(e):resolve()));
  res.json({first,second});
}catch(e){res.status(500).json({error:e.message});}});
const server=app.listen(3099,'127.0.0.1');
(async()=>{
  const admin=(await pool.query("SELECT id FROM usuarios WHERE lower(rol)='admin' LIMIT 1")).rows[0];
  const client=(await pool.query("SELECT id_cliente FROM clientes WHERE lower(coalesce(estado,'Activo'))='activo' LIMIT 1")).rows[0];assert.ok(client);
  const adminToken=jwt.sign({tipo:'admin',id_usuario:admin.id},process.env.JWT_SECRET,{expiresIn:'5m'});
  const clientToken=jwt.sign({tipo:'cliente',id_cliente:client.id_cliente},process.env.JWT_SECRET,{expiresIn:'5m'});
  const request=(route,token,method='GET',body)=>fetch('http://127.0.0.1:3099/api'+route,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:body?JSON.stringify(body):undefined});
  for(const route of ['/ventas','/clientes','/pedidos','/desechos','/proveedores','/dashboard/resumen']){
    assert.equal((await request(route)).status,401,route+' anonymous');
    assert.equal((await request(route,clientToken)).status,403,route+' client');
    assert.equal((await request(route,adminToken)).status,200,route+' admin');
  }
  assert.equal((await request('/productos')).status,200);
  assert.equal((await request('/productos',null,'POST',{})).status,401);
  assert.equal((await request('/pedidos/cliente/'+client.id_cliente,clientToken)).status,200);
  assert.equal((await request('/pedidos/cliente/'+(Number(client.id_cliente)+100000),clientToken)).status,403);
  assert.equal((await request('/pedidos',clientToken,'POST',{id_cliente:Number(client.id_cliente)+1})).status,403);
  assert.equal((await request('/pedidos',clientToken,'POST',{id_cliente:client.id_cliente,productos:[],tipo_entrega:'Retiro en tienda'})).status,400);
  const pairs=await Promise.all([1,2,3].map(()=>fetch('http://127.0.0.1:3099/__transaction-test').then(r=>r.json())));
  for(const pair of pairs){assert.deepEqual(pair.first,pair.second);assert.ok(pair.first?.tx);}
  assert.equal(new Set(pairs.map(p=>p.first.tx)).size,3);
  console.log('PASS: 6 admin modules; anonymous and client denied; own orders allowed; cross-account denied; invalid order rejected; 3 concurrent transactions isolated.');
})().then(()=>{server.close();process.exit(0);}).catch(e=>{console.error(e);server.close();process.exit(1);});
