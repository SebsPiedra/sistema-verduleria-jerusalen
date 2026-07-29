const nodemailer = require('nodemailer');
const obtenerVariables = require('../config/variables');

const variables = obtenerVariables();
let transportador = null;

const obtenerTransportador = () => {
  if (!variables.SMTP_HOST || !variables.SMTP_USER || !variables.SMTP_PASS) {
    throw new Error(
      'El correo SMTP no está configurado. Defina SMTP_HOST, SMTP_USER y SMTP_PASS.'
    );
  }

  if (!transportador) {
    transportador = nodemailer.createTransport({
      host: variables.SMTP_HOST,
      port: variables.SMTP_PORT,
      secure: variables.SMTP_SECURE,
      auth: {
        user: variables.SMTP_USER,
        pass: variables.SMTP_PASS,
      },
    });
  }

  return transportador;
};

const escaparHtml = (valor) =>
  String(valor || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const enviarCorreoRecuperacion = async ({
  correo,
  nombre,
  enlace,
  minutosVigencia,
}) => {
  const nombreSeguro = escaparHtml(nombre || 'cliente');
  const enlaceSeguro = escaparHtml(enlace);

  return obtenerTransportador().sendMail({
    from: variables.SMTP_FROM,
    to: correo,
    subject: 'Recuperación de contraseña - Verdulería Jerusalén',
    text:
      `Hola ${nombre || 'cliente'}.\n\n` +
      'Recibimos una solicitud para cambiar su contraseña.\n' +
      `Abra este enlace: ${enlace}\n\n` +
      `El enlace vence en ${minutosVigencia} minutos y solo puede utilizarse una vez.\n` +
      'Si usted no solicitó el cambio, ignore este mensaje.',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#263326">
        <div style="background:#145a2a;padding:22px;text-align:center;color:#fff">
          <div style="font-size:13px;letter-spacing:3px">VERDULERÍA</div>
          <div style="font-size:28px;font-weight:bold">JERUSALÉN</div>
        </div>
        <div style="padding:26px;border:1px solid #e6dfca">
          <h2 style="color:#145a2a">Recuperación de contraseña</h2>
          <p>Hola ${nombreSeguro}.</p>
          <p>Recibimos una solicitud para cambiar la contraseña de su cuenta.</p>
          <p style="text-align:center;margin:28px 0">
            <a href="${enlaceSeguro}"
              style="background:#f58220;color:#fff;text-decoration:none;padding:14px 22px;border-radius:10px;font-weight:bold">
              Crear contraseña nueva
            </a>
          </p>
          <p>Este enlace vence en <b>${minutosVigencia} minutos</b> y solamente puede utilizarse una vez.</p>
          <p style="color:#666;font-size:13px">
            Si usted no solicitó este cambio, ignore el mensaje. Su contraseña actual seguirá funcionando.
          </p>
        </div>
      </div>
    `,
  });
};

module.exports = { enviarCorreoRecuperacion };
