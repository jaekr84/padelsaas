import { db } from "./src/db";
import { bookings, courts, users } from "./src/db/schema";
import { eq } from "drizzle-orm";

async function seedBooking() {
  const firstCourt = await db.query.courts.findFirst();
  const firstUser = await db.query.users.findFirst();

  if (!firstCourt || !firstUser) {
    console.log("No court or user found to seed booking.");
    return;
  }

  // Set booking for today at 10:00 - 11:30
  const start = new Date();
  start.setHours(10, 0, 0, 0);
  
  const end = new Date();
  end.setHours(11, 30, 0, 0);

  await db.insert(bookings).values({
    courtId: firstCourt.id,
    userId: firstUser.id,
    startTime: start,
    endTime: end,
    status: "confirmed",
  });

  console.log("Seeded a booking for 10:00 - 11:30 today!");
}

seedBooking().catch(console.error);
