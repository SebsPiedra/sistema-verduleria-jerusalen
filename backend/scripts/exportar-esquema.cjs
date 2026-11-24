const fs = require('node:fs');
const path = require('node:path');
const { Pool } = require('pg');

require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('Falta DATABASE_URL_UNPOOLED o DATABASE_URL en backend/.env.local');
}

const outputPath = path.join(__dirname, '..', 'database', 'schema.sql');
const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: true },
  max: 1,
});

const quoteIdent = (value) => `"${String(value).replace(/"/g, '""')}"`;

async function exportar() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN READ ONLY');

    const { rows: extensions } = await client.query(`
      SELECT extname
      FROM pg_extension
      WHERE extname <> 'plpgsql'
      ORDER BY extname
    `);

    const { rows: enums } = await client.query(`
      SELECT n.nspname AS schema_name, t.typname AS type_name,
             array_agg(e.enumlabel ORDER BY e.enumsortorder) AS labels
      FROM pg_type t
      JOIN pg_enum e ON e.enumtypid = t.oid
      JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
      GROUP BY n.nspname, t.typname
      ORDER BY n.nspname, t.typname
    `);

    const { rows: sequences } = await client.query(`
      SELECT schemaname AS schema_name, sequencename AS sequence_name,
             data_type, start_value, min_value, max_value, increment_by, cycle
      FROM pg_sequences
      WHERE schemaname = 'public'
      ORDER BY sequencename
    `);

    const { rows: tables } = await client.query(`
      SELECT c.oid, n.nspname AS schema_name, c.relname AS table_name
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE c.relkind = 'r' AND n.nspname = 'public'
      ORDER BY c.relname
    `);

    const { rows: columns } = await client.query(`
      SELECT c.oid AS table_oid, a.attnum, a.attname AS column_name,
             pg_catalog.format_type(a.atttypid, a.atttypmod) AS data_type,
             a.attnotnull AS not_null,
             pg_get_expr(ad.adbin, ad.adrelid) AS default_value,
             a.attidentity AS identity_kind,
             a.attgenerated AS generated_kind
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      JOIN pg_attribute a ON a.attrelid = c.oid
      LEFT JOIN pg_attrdef ad ON ad.adrelid = c.oid AND ad.adnum = a.attnum
      WHERE c.relkind = 'r' AND n.nspname = 'public'
        AND a.attnum > 0 AND NOT a.attisdropped
      ORDER BY c.relname, a.attnum
    `);

    const { rows: constraints } = await client.query(`
      SELECT con.oid, con.conrelid AS table_oid, con.contype,
             con.conname AS constraint_name,
             pg_get_constraintdef(con.oid, true) AS definition
      FROM pg_constraint con
      JOIN pg_class c ON c.oid = con.conrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
      ORDER BY CASE con.contype
        WHEN 'p' THEN 1 WHEN 'u' THEN 2 WHEN 'c' THEN 3 WHEN 'f' THEN 4 ELSE 5 END,
        c.relname, con.conname
    `);

    const { rows: indexes } = await client.query(`
      SELECT i.indexrelid, i.indrelid AS table_oid,
             pg_get_indexdef(i.indexrelid) AS definition
      FROM pg_index i
      JOIN pg_class t ON t.oid = i.indrelid
      JOIN pg_namespace n ON n.oid = t.relnamespace
      LEFT JOIN pg_constraint con ON con.conindid = i.indexrelid
      WHERE n.nspname = 'public' AND con.oid IS NULL
      ORDER BY t.relname, i.indexrelid::regclass::text
    `);

    const lines = [
      '-- Esquema actual de Verdulería Jerusalén',
      '-- Generado automáticamente desde Neon PostgreSQL.',
      '-- Contiene únicamente estructura: no incluye datos ni credenciales.',
      '',
      'BEGIN;',
      "SET client_encoding = 'UTF8';",
      "SET search_path = public, pg_catalog;",
      '',
    ];

    for (const extension of extensions) {
      lines.push(`CREATE EXTENSION IF NOT EXISTS ${quoteIdent(extension.extname)};`);
    }
    if (extensions.length) lines.push('');

    for (const item of enums) {
      const labels = item.labels.map((label) => `'${label.replace(/'/g, "''")}'`).join(', ');
      lines.push(`CREATE TYPE ${quoteIdent(item.schema_name)}.${quoteIdent(item.type_name)} AS ENUM (${labels});`);
    }
    if (enums.length) lines.push('');

    for (const sequence of sequences) {
      lines.push(
        `CREATE SEQUENCE ${quoteIdent(sequence.schema_name)}.${quoteIdent(sequence.sequence_name)}`,
        `  AS ${sequence.data_type}`,
        `  INCREMENT BY ${sequence.increment_by}`,
        `  MINVALUE ${sequence.min_value}`,
        `  MAXVALUE ${sequence.max_value}`,
        `  START WITH ${sequence.start_value}`,
        `  ${sequence.cycle ? 'CYCLE' : 'NO CYCLE'};`,
        ''
      );
    }

    for (const table of tables) {
      const tableColumns = columns.filter((column) => column.table_oid === table.oid);
      const definitions = tableColumns.map((column) => {
        let definition = `  ${quoteIdent(column.column_name)} ${column.data_type}`;
        if (column.generated_kind === 's') {
          definition += ` GENERATED ALWAYS AS (${column.default_value}) STORED`;
        } else if (column.identity_kind === 'a') {
          definition += ' GENERATED ALWAYS AS IDENTITY';
        } else if (column.identity_kind === 'd') {
          definition += ' GENERATED BY DEFAULT AS IDENTITY';
        } else if (column.default_value) {
          definition += ` DEFAULT ${column.default_value}`;
        }
        if (column.not_null) definition += ' NOT NULL';
        return definition;
      });
      lines.push(
        `CREATE TABLE ${quoteIdent(table.schema_name)}.${quoteIdent(table.table_name)} (`,
        definitions.join(',\n'),
        ');',
        ''
      );
    }

    for (const constraint of constraints) {
      const table = tables.find((item) => item.oid === constraint.table_oid);
      if (!table) continue;
      lines.push(
        `ALTER TABLE ONLY ${quoteIdent(table.schema_name)}.${quoteIdent(table.table_name)}`,
        `  ADD CONSTRAINT ${quoteIdent(constraint.constraint_name)} ${constraint.definition};`
      );
    }
    if (constraints.length) lines.push('');

    for (const index of indexes) {
      lines.push(`${index.definition};`);
    }
    if (indexes.length) lines.push('');

    lines.push('COMMIT;', '');
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, lines.join('\n'), 'utf8');
    await client.query('ROLLBACK');

    console.log(JSON.stringify({
      output: outputPath,
      tables: tables.length,
      columns: columns.length,
      constraints: constraints.length,
      indexes: indexes.length,
      sequences: sequences.length,
    }));
  } finally {
    client.release();
    await pool.end();
  }
}

exportar().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
