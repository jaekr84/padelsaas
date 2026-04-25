
import { neon } from '@neondatabase/serverless';

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  console.log("Listando todas las tablas en Neon...");
  try {
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    console.log(JSON.stringify(tables, null, 2));
  } catch (e) {
    console.error("Error:", e);
  }
}

main();
