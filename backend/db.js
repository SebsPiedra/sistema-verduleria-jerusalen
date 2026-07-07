const mysql = require('mysql2');
const obtenerVariables = require('./config/variables');

const variables = obtenerVariables();

const conexion = mysql.createConnection({
  host: variables.DB_HOST,
  user: variables.DB_USER,
  password: variables.DB_PASSWORD,
  database: variables.DB_NAME,
  port: variables.DB_PORT
});

conexion.connect((error) => {
  if (error) {
    console.error('Error al conectar con MySQL:', error);
    return;
  }

  console.log('Conexión exitosa a MySQL');
});

module.exports = conexion;