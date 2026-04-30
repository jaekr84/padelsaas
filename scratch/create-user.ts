import { db } from "../src/db";
import { users } from "../src/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function createTestUser() {
  const email = "jugador@jugador.com";
  const password = "jugador";
  const name = "Jugador de Prueba";

  try {
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      console.log("User already exists");
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.insert(users).values({
      name,
      email,
      password: hashedPassword,
    });

    console.log("User created successfully");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

createTestUser();
