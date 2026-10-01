import { pool } from './src/config/db.js';
const res = await pool.query(`
  SELECT column_name, data_type 
  FROM information_schema.columns 
  WHERE table_schema='qms' AND table_name='documents'
`);
console.log(res.rows);
process.exit();
