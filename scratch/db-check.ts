import "dotenv/config";
import "dotenv/config";
import { db } from "../src/db";
import { centers, members, users } from "../src/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  const allCenters = await db.select().from(centers);
  console.log("Centers:", JSON.stringify(allCenters, null, 2));
  
  const allMembers = await db.select().from(members);
  console.log("Members:", JSON.stringify(allMembers, null, 2));

  const allUsers = await db.select().from(users);
  console.log("Users:", JSON.stringify(allUsers, null, 2));
}

main().catch(console.error);
