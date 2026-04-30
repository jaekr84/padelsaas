import { Pool } from '@neondatabase/serverless';

async function testQuery() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL || "" });
  const client = await pool.connect();
  try {
    const id = "270e08dd-9912-4e10-87db-98ff48a866da";
    const res = await client.query('select "id", "court_id", "user_id", "customer_id", "guest_name", "price", "type", "start_time", "end_time", "status", "payment_status", "payment_preference_id", "amount_paid", "created_at" from "booking" "bookings" where "bookings"."id" = $1 limit 1', [id]);
    console.log("Query result:", res.rows);
  } catch (err: any) {
    console.error("Query failed with error:");
    console.error(err.message);
    if (err.detail) console.error("Detail:", err.detail);
    if (err.hint) console.error("Hint:", err.hint);
  } finally {
    client.release();
    await pool.end();
  }
}

testQuery().catch(console.error);
