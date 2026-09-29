const assert=require('node:assert/strict');const path=require('path');const {randomUUID}=require('node:crypto');
require('dotenv').config({path:path.join(__dirname,'../.vercel/monthly-test.env'),quiet:true});
assert.equal(new URL(process.env.DATABASE_URL).hostname,'ep-fancy-hat-ax2dcn2i-pooler.c-4.us-east-2.aws.neon.tech');
process.env.JWT_SECRET=randomUUID();
const app=require('../server');const {pool}=require('../utils/mensual');const jwt=require('jsonwebtoken');const express=require('express');
const ui=express();
ui.get('/__review/:role',async(req,res)=>{
  const client=req.params.role==='client';
  const user=(await pool.query(client?"SELECT id_cliente,nombre,direccion FROM clientes WHERE lower(coalesce(estado,'Activo'))='activo' LIMIT 1":"SELECT id AS id_usuario,nombre,rol FROM usuarios WHERE lower(rol)='admin' LIMIT 1")).rows[0];
  if(!user)return res.status(404).send('Test account missing');
  const token=jwt.sign({...user,tipo:client?'cliente':'admin'},process.env.JWT_SECRET,{expiresIn:'1h'});
  res.type('html').send(`<script>['token','usuario','token_cliente','cliente','carrito','carrito_cliente'].forEach(k=>localStorage.removeItem(k));localStorage.setItem(${JSON.stringify(client?'token_cliente':'token')},${JSON.stringify(token)});localStorage.setItem(${JSON.stringify(client?'cliente':'usuario')},${JSON.stringify(JSON.stringify(user))});location.replace(${JSON.stringify(client?'/cliente-home':'/home')});</script>`);
});
ui.use(express.static(path.join(__dirname,'../../frontend/dist'),{extensions:['html']}));
app.listen(3097,'127.0.0.1');ui.listen(3098,'127.0.0.1');console.log('Isolated review: http://127.0.0.1:3098/__review/admin or /__review/client');
