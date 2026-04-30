import { Pool } from '@neondatabase/serverless';

async function checkSchema() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL || "" });
  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'booking';
    `);
    console.log("Columns in 'booking' table:");
    console.table(res.rows);
  } finally {
    client.release();
    await pool.end();
  }
}

checkSchema().catch(console.error);
