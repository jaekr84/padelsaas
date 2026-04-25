
import { neon } from '@neondatabase/serverless';

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  try {
    const registers = await sql`SELECT * FROM "cash_register" LIMIT 5;`;
    console.log("Cajas (cash_register):", JSON.stringify(registers, null, 2));

    const pms = await sql`SELECT * FROM "payment_methods" LIMIT 5;`;
    console.log("Medios de Pago (payment_methods):", JSON.stringify(pms, null, 2));
    
    const terminals = await sql`SELECT * FROM "terminals" LIMIT 5;`;
    console.log("Terminales (terminals):", JSON.stringify(terminals, null, 2));
  } catch (e) {
    console.error("Error:", e);
  }
}

main();
