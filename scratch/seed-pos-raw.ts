
import { neon } from '@neondatabase/serverless';

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  console.log("Insertando datos precargados en Neon...");
  
  try {
    // Buscar el tenant
    const tenants = await sql`SELECT id FROM "tenant" LIMIT 1;`;
    if (tenants.length === 0) {
      console.error("No hay tenants.");
      return;
    }
    const tenantId = tenants[0].id;

    // Insertar Terminal si no existe
    await sql`
      INSERT INTO "terminals" (id, tenant_id, name, is_active, created_at)
      VALUES (gen_random_uuid(), ${tenantId}, 'CAJA 1', true, now())
      ON CONFLICT DO NOTHING;
    `;

    // Insertar Medios de Pago si no existen
    const methods = [
      { name: 'EFECTIVO', type: 'cash' },
      { name: 'TRANSFERENCIA', type: 'transfer' },
      { name: 'MERCADO PAGO', type: 'other' }
    ];

    for (const m of methods) {
      await sql`
        INSERT INTO "payment_methods" (id, tenant_id, name, type, is_active, created_at)
        VALUES (gen_random_uuid(), ${tenantId}, ${m.name}, ${m.type}, true, now())
        ON CONFLICT DO NOTHING;
      `;
    }

    console.log("Datos insertados correctamente.");
  } catch (e) {
    console.error("Error:", e);
  }
}

main();
