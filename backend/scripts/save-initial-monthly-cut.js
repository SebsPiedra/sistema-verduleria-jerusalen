// Creates a real, retained current-month snapshot; does not create financial fixtures.
const path = require('node:path');
const assert = require('node:assert/strict');
const {randomUUID}=require('node:crypto');
require('dotenv').config({path:path.join(__dirname,'../.env'),quiet:true});
const {Pool}=require('pg');
const jwt=require('jsonwebtoken');
const pool=new Pool({connectionString:process.env.DATABASE_URL,ssl:{rejectUnauthorized:true}});
(async()=>{
  const admin=(await pool.query("SELECT id FROM usuarios WHERE lower(rol)='admin' LIMIT 1")).rows[0];
  const token=jwt.sign({tipo:'admin',id_usuario:admin.id},process.env.JWT_SECRET,{expiresIn:'5m'});
  const headers={Authorization:'Bearer '+token,'Content-Type':'application/json'};
  const base='https://backend-verduleria.vercel.app/api/resumen-mensual';
  const periodo=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Costa_Rica',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()).slice(0,7);
  const listed=await fetch(base+'/cortes?periodo='+periodo,{headers});assert.equal(listed.status,200);
  const cuts=await listed.json();let id=cuts[0]?.id;
  if(!id){id=randomUUID();const saved=await fetch(base+'/cortes',{method:'POST',headers,body:JSON.stringify({id,periodo})});assert.equal(saved.status,201);}
  const pdf=await fetch(base+'/cortes/'+id+'/pdf',{headers});assert.equal(pdf.status,200);
  assert.match(pdf.headers.get('content-type'),/application\/pdf/);
  const buffer=Buffer.from(await pdf.arrayBuffer());assert.equal(buffer.subarray(0,4).toString(),'%PDF');
  console.log(JSON.stringify({status:'PASS',periodo,cutId:id,realSnapshotRetained:true,pdfBytes:buffer.length}));
})().catch(e=>{console.error('Verificación de corte:',e.message);process.exitCode=1;}).finally(()=>pool.end());
