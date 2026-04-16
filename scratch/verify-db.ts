import { db } from "../src/db";
import { centers } from "../src/db/schema";
import { eq } from "drizzle-orm";

async function checkDb() {
  const allCenters = await db.select().from(centers);
  console.log("ALL CENTERS:", JSON.stringify(allCenters, null, 2));
}

checkDb().catch(console.error);
