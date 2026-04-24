import { db } from "../src/db";
import { bookings } from "../src/db/schema";

async function main() {
  try {
    console.log("Deleting all reservations (bookings)...");
    const result = await db.delete(bookings).returning();
    console.log(`Deleted ${result.length} reservations successfully.`);
  } catch (error) {
    console.error("Error deleting reservations:", error);
  } finally {
    process.exit(0);
  }
}

main();
