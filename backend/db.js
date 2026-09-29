const { Pool } = require('pg');
const obtenerVariables = require('./config/variables');

const variables = obtenerVariables();

const pool = new Pool({
  connectionString: variables.DATABASE_URL,
  ssl: {
    rejectUnauthorized: true
  }
});

const { AsyncLocalStorage } = require('node:async_hooks');
const transactionScope = new AsyncLocalStorage();
const transactionState = () => transactionScope.getStore() || { client: null };
// Each HTTP request owns its connection; concurrent sales cannot share a transaction.
const requestScope = (req, res, next) => transactionScope.run({ client: null }, () => {
  const state = transactionScope.getStore();
  res.once('finish', () => {
    if (state.client) {
      const client = state.client; state.client = null;
      client.query('ROLLBACK').catch(() => {}).finally(() => client.release());
    }
  });
  next();
});

const convertirPlaceholders = (sql) => {
  let contador = 0;

  return sql.replace(/\?/g, () => {
    contador += 1;
    return `$${contador}`;
  });
};

const prepararConsulta = (sql) => {
  let consulta = sql.trim();

  // Quita comillas invertidas de MySQL si alguna consulta las usa
  consulta = consulta.replace(/`/g, '');

  // Convierte funciones de MySQL a PostgreSQL
  consulta = consulta.replace(/\bIFNULL\s*\(/gi, 'COALESCE(');
  consulta = consulta.replace(/\bCURDATE\s*\(\s*\)/gi, 'CURRENT_DATE');

  consulta = consulta.replace(
    /DATE_ADD\s*\(\s*CURRENT_DATE\s*,\s*INTERVAL\s+(\d+)\s+DAY\s*\)/gi,
    "(CURRENT_DATE + INTERVAL '$1 days')"
  );

  consulta = consulta.replace(
    /DATE_SUB\s*\(\s*CURRENT_DATE\s*,\s*INTERVAL\s+(\d+)\s+DAY\s*\)/gi,
    "(CURRENT_DATE - INTERVAL '$1 days')"
  );

  consulta = consulta.replace(
    /\bDATEDIFF\s*\(\s*([^,]+)\s*,\s*([^)]+)\s*\)/gi,
    '($1::date - $2::date)'
  );

  consulta = consulta.replace(
    /\bMONTH\s*\(\s*([^)]+)\s*\)/gi,
    'EXTRACT(MONTH FROM $1)'
  );

  consulta = consulta.replace(
    /\bYEAR\s*\(\s*([^)]+)\s*\)/gi,
    'EXTRACT(YEAR FROM $1)'
  );

  // Si es INSERT y no tiene RETURNING, PostgreSQL ocupa RETURNING para devolver el ID
  if (
    consulta.toUpperCase().startsWith('INSERT') &&
    !consulta.toUpperCase().includes('RETURNING')
  ) {
    consulta = consulta.replace(/;$/, '') + ' RETURNING *';
  }

  return convertirPlaceholders(consulta);
};

const obtenerInsertId = (fila) => {
  if (!fila) return null;

  if (fila.id) return fila.id;
  if (fila.id_usuario) return fila.id_usuario;
  if (fila.id_producto) return fila.id_producto;
  if (fila.id_venta) return fila.id_venta;
  if (fila.id_detalle) return fila.id_detalle;
  if (fila.id_categoria) return fila.id_categoria;
  if (fila.id_proveedor) return fila.id_proveedor;
  if (fila.id_cliente) return fila.id_cliente;
  if (fila.id_desecho) return fila.id_desecho;
  if (fila.id_pedido) return fila.id_pedido;
  if (fila.id_detalle_pedido) return fila.id_detalle_pedido;

  const campoId = Object.keys(fila).find((campo) => campo.startsWith('id_'));
  return campoId ? fila[campoId] : null;
};

const formatearRespuesta = (resultado) => {
  const filas = resultado.rows || [];

  filas.affectedRows = resultado.rowCount || 0;
  filas.insertId = obtenerInsertId(filas[0]);

  return filas;
};

const ejecutarConsulta = (sql, params, callback) => {
  if (typeof params === 'function') {
    callback = params;
    params = [];
  }

  const consultaPostgres = prepararConsulta(sql);
  const valores = params || [];
  const ejecutor = transactionState().client || pool;

  if (callback) {
    callback = AsyncLocalStorage.bind(callback);
    ejecutor.query(consultaPostgres, valores, (error, resultado) => {
      if (error) {
        console.error('Error en consulta PostgreSQL:', error.message);
        callback(error, null);
        return;
      }

      callback(null, formatearRespuesta(resultado));
    });

    return;
  }

  return ejecutor
    .query(consultaPostgres, valores)
    .then((resultado) => formatearRespuesta(resultado));
};

const conexion = {
  connect: (callback) => {
    pool.query('SELECT NOW()', (error) => {
      if (error) {
        console.error('Error al conectar con Neon PostgreSQL:', error.message);

        if (callback) {
          callback(error);
        }

        return;
      }

      console.log('Conexión exitosa a Neon PostgreSQL');

      if (callback) {
        callback(null);
      }
    });
  },

  query: ejecutarConsulta,

  execute: ejecutarConsulta,

  beginTransaction: (callback) => {
    if (!transactionScope.getStore()) return callback(new Error('Transaction requires request scope'));
    if (transactionState().client) return callback(new Error('Transaction already active'));
    const state = transactionState();
    callback = AsyncLocalStorage.bind(callback);
    pool.connect((error, client) => {
      if (error) {
        console.error('Error al iniciar transacción:', error.message);

        if (callback) {
          callback(error);
        }

        return;
      }

      state.client = client;

      client.query('BEGIN', (errorBegin) => {
        if (errorBegin) {
          console.error('Error en BEGIN:', errorBegin.message);
          client.release();
          state.client = null;

          if (callback) {
            callback(errorBegin);
          }

          return;
        }

        // Legacy IDs use MAX + 1 across sales, orders and details. Serialize these
        // transactions until that schema can be migrated to database sequences.
        client.query('SELECT pg_advisory_xact_lock(20260904)', (lockError) => {
          if (lockError) {
            client.query('ROLLBACK', () => { client.release(); state.client = null; callback(lockError); });
          } else if (callback) callback(null);
        });
      });
    });
  },

  commit: (callback) => {
    const state = transactionState();
    if (callback) callback = AsyncLocalStorage.bind(callback);
    if (!transactionState().client) {
      if (callback) {
        callback(null);
      }

      return;
    }

    const client = state.client;
    client.query('COMMIT', (error) => {
      if (error) {
        console.error('Error en COMMIT:', error.message);

        if (callback) {
          callback(error);
        }

        return;
      }

      client.release();
      state.client = null;

      if (callback) {
        callback(null);
      }
    });
  },

  rollback: (callback) => {
    const state = transactionState();
    if (callback) callback = AsyncLocalStorage.bind(callback);
    if (!transactionState().client) {
      if (callback) {
        callback(null);
      }

      return;
    }

    const client = state.client;
    client.query('ROLLBACK', (error) => {
      if (error) {
        console.error('Error en ROLLBACK:', error.message);
      }

      client.release();
      state.client = null;

      if (callback) {
        callback(error || null);
      }
    });
  },

  promise: () => {
    return {
      query: async (sql, params = []) => {
        const filas = await ejecutarConsulta(sql, params);
        return [filas];
      },

      execute: async (sql, params = []) => {
        const filas = await ejecutarConsulta(sql, params);
        return [filas];
      }
    };
  }
};

module.exports = conexion;
module.exports.conexion = conexion;
module.exports.db = conexion;
module.exports.query = conexion.query;
module.exports.execute = conexion.execute;
module.exports.beginTransaction = conexion.beginTransaction;
module.exports.commit = conexion.commit;
module.exports.rollback = conexion.rollback;
module.exports.promise = conexion.promise;
module.exports.requestScope = requestScope;
