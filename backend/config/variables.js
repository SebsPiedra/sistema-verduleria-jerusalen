require('dotenv').config();

const obtenerVariables = () => {
  return {
    PORT: process.env.PORT || 3000,

    DB_HOST: process.env.DB_HOST || 'localhost',
    DB_USER: process.env.DB_USER || 'root',
    DB_PASSWORD: process.env.DB_PASSWORD || '',
    DB_NAME: process.env.DB_NAME || 'verduleria_jerusalen',
    DB_PORT: Number(process.env.DB_PORT || 3306),

    JWT_SECRET: process.env.JWT_SECRET || 'verduleria_secreta',

    NOMBRE_SISTEMA: 'Verdulería Jerusalén',
    MONEDA: '₡',
  };
};

module.exports = obtenerVariables;