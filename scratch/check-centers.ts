
import { neon } from '@neondatabase/serverless';

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  try {
    const tenants = await sql`SELECT id, name FROM "tenant";`;
    console.log("Tenants:", JSON.stringify(tenants, null, 2));

    const centers = await sql`SELECT id, name FROM "center";`;
    console.log("Centers:", JSON.stringify(centers, null, 2));
  } catch (e) {
    console.error("Error:", e);
  }
}

main();
