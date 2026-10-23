require('dotenv').config();

const normalizarDatabaseUrl = (valor) => {
  if (!valor) return '';

  try {
    const url = new URL(valor);
    url.searchParams.set('sslmode', 'verify-full');
    return url.toString();
  } catch {
    return valor;
  }
};

const obtenerVariables = () => {
  return {
    PORT: process.env.PORT || 3000,
    DATABASE_URL: normalizarDatabaseUrl(process.env.DATABASE_URL),

    DB_HOST: process.env.DB_HOST || 'localhost',
    DB_USER: process.env.DB_USER || 'root',
    DB_PASSWORD: process.env.DB_PASSWORD || '',
    DB_NAME: process.env.DB_NAME || 'verduleria_jerusalen',
    DB_PORT: Number(process.env.DB_PORT || 3306),

    JWT_SECRET: process.env.JWT_SECRET || '',

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
    DB_POOL_MAX: Number(process.env.DB_POOL_MAX || 5),
    DB_CONNECTION_TIMEOUT_MS: Number(process.env.DB_CONNECTION_TIMEOUT_MS || 10000),
    DB_IDLE_TIMEOUT_MS: Number(process.env.DB_IDLE_TIMEOUT_MS || 10000),
    DB_STATEMENT_TIMEOUT_MS: Number(process.env.DB_STATEMENT_TIMEOUT_MS || 20000),
  };
};

module.exports = obtenerVariables;
