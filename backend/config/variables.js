require('dotenv').config();

const obtenerVariables = () => {
  return {
    PORT: process.env.PORT || 3000,
    DATABASE_URL: process.env.DATABASE_URL,

    DB_HOST: process.env.DB_HOST || 'localhost',
    DB_USER: process.env.DB_USER || 'root',
    DB_PASSWORD: process.env.DB_PASSWORD || '',
    DB_NAME: process.env.DB_NAME || 'verduleria_jerusalen',
    DB_PORT: Number(process.env.DB_PORT || 3306),

    JWT_SECRET: process.env.JWT_SECRET || 'verduleria_secreta',

    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:8081',
    SMTP_HOST: process.env.SMTP_HOST || '',
    SMTP_PORT: Number(process.env.SMTP_PORT || 587),
    SMTP_SECURE: String(process.env.SMTP_SECURE || 'false') === 'true',
    SMTP_USER: process.env.SMTP_USER || '',
    SMTP_PASS: process.env.SMTP_PASS || '',
    SMTP_FROM:
      process.env.SMTP_FROM ||
      'Verdulería Jerusalén <no-responder@verduleriajerusalen.com>',

    NOMBRE_SISTEMA: 'Verdulería Jerusalén',
    MONEDA: '₡',
  };
};

module.exports = obtenerVariables;
