require('dotenv').config({ path: '.env.local' });
const db = require('../db');

db.query(
  `SELECT column_name,data_type,is_nullable,column_default
   FROM information_schema.columns
   WHERE table_name='usuarios'
   ORDER BY ordinal_position`,
  [],
  (error, result) => {
    if (error) console.error(error);
    else console.log(JSON.stringify(result?.rows || result, null, 2));
    db.end?.();
  }
);
