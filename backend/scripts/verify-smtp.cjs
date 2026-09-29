const path = require('path');
const nodemailer = require('nodemailer');

const envPath = process.argv[2];
if (envPath) require('dotenv').config({ path: path.resolve(envPath), quiet: true });
else require('dotenv').config({ quiet: true });

const required = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM'];
const missing = required.filter((name) => !process.env[name]);
if (missing.length) throw new Error(`Faltan variables SMTP: ${missing.join(', ')}`);

const transport = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: String(process.env.SMTP_SECURE).toLowerCase() === 'true',
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

transport.verify()
  .then(() => console.log('SMTP_OK: conexión y autenticación verificadas; no se envió correo.'))
  .catch((error) => {
    console.error(`SMTP_ERROR: ${error.message}`);
    process.exitCode = 1;
  });
