// Read-only production verification. Never logs tokens, customer rows or secrets.
const assert = require('node:assert/strict');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
require('dotenv').config({path:path.join(__dirname,'../.env'),quiet:true});
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const pool = new Pool({connectionString:process.env.DATABASE_URL,ssl:{rejectUnauthorized:true}});
const deployment = process.argv[2];
assert.match(deployment || '',/^https:\/\/backend-verduleria[-a-z0-9.]*\.vercel\.app$/);
const cli = path.join(process.env.APPDATA,'npm/node_modules/vercel/dist/vc.js');
function read(route,token) {
  const args=[cli,'curl',route,'--deployment',deployment,'--','--silent','--show-error','--max-time','40'];
  if(token) args.push('-H','Authorization: Bearer '+token);
  const result=spawnSync(process.execPath,args,{cwd:path.join(__dirname,'..'),encoding:'utf8',timeout:60000,windowsHide:true});
  if(result.status!==0) throw new Error('Falló la consulta de verificación (sin revelar credenciales).');
  try{return JSON.parse(result.stdout);}catch{throw new Error('La respuesta no fue JSON.');}
}
(async()=>{
  const admin=(await pool.query("SELECT id FROM usuarios WHERE lower(rol)='admin' LIMIT 1")).rows[0];
  assert.ok(admin);
  const token=jwt.sign({tipo:'admin',id_usuario:admin.id},process.env.JWT_SECRET,{expiresIn:'5m'});
  const unauth=read('/api/resumen-mensual?periodo=2026-09');
  assert.match(unauth.mensaje,/sesi[oó]n/i);
  const result=read('/api/resumen-mensual?periodo=2026-09',token);
  assert.equal(result.periodo,'2026-09',result.mensaje || 'Período incorrecto');
  assert.ok(Array.isArray(result.ventas));
  assert.ok(Number.isSafeInteger(result.totales.ganancia));
  const cuts=read('/api/resumen-mensual/cortes?periodo=2026-09',token);
  assert.ok(Array.isArray(cuts));
  for(const route of ['/api/ventas','/api/clientes','/api/pedidos']) {
    assert.match(read(route).mensaje,/sesi[oó]n/i);
    assert.ok(Array.isArray(read(route,token)),route);
  }
  console.log(JSON.stringify({status:'PASS',adminAccess:true,anonymousBlocked:true,realDatabase:true,monthlyReport:true,savedCuts:true,productCount:result.inventario.length}));
})().catch(e=>{console.error(e.message);process.exitCode=1;}).finally(()=>pool.end());
