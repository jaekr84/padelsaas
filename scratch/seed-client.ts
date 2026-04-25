import { db } from "../src/db";
import { users } from "../src/db/schema";
import bcrypt from "bcryptjs";

async function seedClient() {
  const email = "cliente@cliente.com";
  const password = "cliente";
  const name = "CLIENTE DE PRUEBA";

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    await db.insert(users).values({
      name,
      email,
      password: hashedPassword,
    });
    console.log("✅ Usuario cliente creado con éxito");
  } catch (error) {
    console.error("❌ Error al crear el usuario:", error);
  }
  process.exit(0);
}

seedClient();
