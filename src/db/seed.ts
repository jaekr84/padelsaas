import { db } from "./index";
import { tenants, centers, courts, users, members } from "./schema";
import bcrypt from "bcryptjs";

async function main() {
  console.log("Seeding database...");

  // Create a default tenant
  const [newTenant] = await db
    .insert(tenants)
    .values({
      name: "Padel Center Pro",
      slug: "padel-pro",
    })
    .onConflictDoUpdate({
      target: tenants.slug,
      set: { name: "Padel Center Pro" },
    })
    .returning();

  console.log(`Created tenant: ${newTenant.name} (${newTenant.slug})`);

  // Create demo user
  const hashedPassword = await bcrypt.hash("demo", 10);
  const [demoUser] = await db
    .insert(users)
    .values({
      name: "Demo User",
      email: "demo@demo.com",
      password: hashedPassword,
    })
    .onConflictDoUpdate({
      target: users.email,
      set: { password: hashedPassword },
    })
    .returning();

  console.log(`Created user: ${demoUser.email}`);

  // Link user to tenant
  await db
    .insert(members)
    .values({
      userId: demoUser.id,
      tenantId: newTenant.id,
      role: "admin",
    })
    .onConflictDoNothing();

  // Create a center for that tenant
  const [newCenter] = await db
    .insert(centers)
    .values({
      tenantId: newTenant.id,
      name: "Sede Central",
      address: "Calle Falsa 123, Buenos Aires",
    })
    .returning();

  console.log(`Created center: ${newCenter.name}`);

  // Create some courts
  await db.insert(courts).values([
    {
      centerId: newCenter.id,
      name: "Cancha 1 - Panorámica",
    },
    {
      centerId: newCenter.id,
      name: "Cancha 2",
    },
    {
      centerId: newCenter.id,
      name: "Cancha 3 - Exterior",
    },
  ]);

  console.log("Seeding completed!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Seeding failed:");
  console.error(err);
  process.exit(1);
});
