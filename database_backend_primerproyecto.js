/**
 * Configuración de conexión a la base de datos MySQL
 * @description Este módulo maneja la conexión a MySQL usando mysql2 con promesas
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

/**
 * Configuración de la conexión a la base de datos
 * @type {Object}
 */
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'SpvVsebas12345#',
    database: process.env.DB_NAME || 'usuarios_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

/**
 * Pool de conexiones a la base de datos
 * @type {mysql.Pool}
 */
const pool = mysql.createPool(dbConfig);

/**
 * Función para probar la conexión a la base de datos
 * @returns {Promise<boolean>} True si la conexión es exitosa
 */
const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Conexión a MySQL establecida correctamente');
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ Error al conectar con MySQL:', error.message);
        return false;
    }
};

/**
 * Función para cerrar todas las conexiones del pool
 * @returns {Promise<void>}
 */
const closePool = async () => {
    try {
        await pool.end();
        console.log('🔌 Pool de conexiones cerrado');
    } catch (error) {
        console.error('❌ Error al cerrar el pool:', error.message);
    }
};

/**
 * Función para obtener una conexión del pool
 * @returns {Promise<mysql.Connection>} Conexión a la base de datos
 */
const getConnection = async () => {
    try {
        return await pool.getConnection();
    } catch (error) {
        console.error('❌ Error al obtener conexión del pool:', error.message);
        throw error;
    }
};

module.exports = {
    pool,
    testConnection,
    closePool,
    getConnection
};