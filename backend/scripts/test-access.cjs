const assert=require('node:assert/strict');const {randomUUID}=require('node:crypto');
require('./test-env.cjs');
process.env.JWT_SECRET=randomUUID();const app=require('../server');const {pool}=require('../utils/mensual');const jwt=require('jsonwebtoken');
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
  const productoExistente=(await pool.query("SELECT nombre,cantidad,precio_compra,precio_venta,stock_minimo,unidad_medida FROM productos WHERE lower(coalesce(estado,'Activo'))='activo' LIMIT 1")).rows[0];
  assert.ok(productoExistente);
  assert.equal((await request('/productos',adminToken,'POST',{
    ...productoExistente,
    nombre:'  '+productoExistente.nombre.toUpperCase()+'  '
  })).status,409,'duplicate product name');
  assert.equal((await request('/pedidos/cliente/'+client.id_cliente,clientToken)).status,200);
  assert.equal((await request('/pedidos/cliente/'+(Number(client.id_cliente)+100000),clientToken)).status,403);
  assert.equal((await request('/pedidos',clientToken,'POST',{id_cliente:Number(client.id_cliente)+1})).status,403);
  assert.equal((await request('/pedidos',clientToken,'POST',{id_cliente:client.id_cliente,productos:[],tipo_entrega:'Retiro en tienda'})).status,400);
  assert.equal((await request('/pedidos',clientToken,'POST',{id_cliente:client.id_cliente,productos:[{id_producto:1,cantidad:1}],metodo_pago:'Efectivo',direccion_entrega:'Dirección suficientemente detallada'})).status,400);
  assert.equal((await request('/pedidos',clientToken,'POST',{id_cliente:client.id_cliente,productos:[{id_producto:1,cantidad:1}],tipo_entrega:'Retiro en tienda'})).status,400);
  assert.equal((await request('/pedidos',clientToken,'POST',{id_cliente:client.id_cliente,productos:[{id_producto:1,cantidad:1}],tipo_entrega:'Entrega',metodo_pago:'Efectivo',direccion_entrega:'Muy corta'})).status,400);
  const sequenceValues=await Promise.all([1,2,3].map(()=>pool.query("SELECT nextval('ventas_id_venta_seq') AS id").then(r=>Number(r.rows[0].id))));
  assert.equal(new Set(sequenceValues).size,3);
  console.log('PASS: access controls, mandatory delivery and payment fields, detailed address validation, and concurrent sequence allocation verified.');
})().then(()=>{server.close();process.exit(0);}).catch(e=>{console.error(e);server.close();process.exit(1);});
