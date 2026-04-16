"use server";

import { db } from "@/db";
import { members, users } from "@/db/schema";
import { auth } from "@/auth";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import bcrypt from "bcrypt";

export async function getTenantMembersAction() {
  const session = await auth();
  if (!session?.user?.id || !session.user.tenantId) throw new Error("Unauthorized");

  // Get all members for this tenant, including user details
  const tenantMembers = await db.query.members.findMany({
    where: eq(members.tenantId, session.user.tenantId),
    with: {
      user: true,
      center: true,
    },
    orderBy: (members, { desc }) => [desc(members.createdAt)],
  });

  return tenantMembers;
}

export async function createUserAction(data: {
  name: string;
  email: string;
  role: string;
  centerId?: string;
}) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    throw new Error("Unauthorized: Only admins can create users");
  }

  const tenantId = session.user.tenantId;

  // Check if user already exists
  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, data.email),
  });

  let userId: string;

  if (existingUser) {
    userId = existingUser.id;
    // Check if already a member of this tenant
    const existingMember = await db.query.members.findFirst({
      where: and(
        eq(members.userId, userId),
        eq(members.tenantId, tenantId)
      ),
    });
    if (existingMember) throw new Error("User is already a member of this club");
  } else {
    // Create new user record with default password (for demo purposes)
    const hashedPassword = await bcrypt.hash("pass123", 10);
    const [newUser] = await db.insert(users).values({
      name: data.name,
      email: data.email,
      password: hashedPassword,
    }).returning();
    userId = newUser.id;
  }

  // Create membership
  await db.insert(members).values({
    userId,
    tenantId,
    centerId: data.centerId,
    role: data.role,
  });

  revalidatePath("/users");
  return { success: true };
}

export async function updateMemberRoleAction(id: string, role: string) {
  const session = await auth();
  if (session?.user?.role !== "admin") throw new Error("Unauthorized");

  await db.update(members).set({ role }).where(eq(members.id, id));

  revalidatePath("/users");
  return { success: true };
}

export async function deleteMemberAction(id: string) {
  const session = await auth();
  if (session?.user?.role !== "admin") throw new Error("Unauthorized");

  // Prevent self-deletion if needed
  const memberToDelete = await db.query.members.findFirst({
    where: eq(members.id, id),
  });

  if (memberToDelete?.userId === session.user.id) {
    throw new Error("Cannot delete yourself");
  }

  await db.delete(members).where(eq(members.id, id));

  revalidatePath("/users");
  return { success: true };
}

export async function getCurrentUserAction() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  });

  return user;
}

export async function updateUserProfileAction(data: { name: string; email: string }) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await db
    .update(users)
    .set({
      name: data.name,
      email: data.email,
    })
    .where(eq(users.id, session.user.id));

  revalidatePath("/account");
  revalidatePath("/home"); // Update sidebar/nav info
  return { success: true };
}

export async function updateUserPasswordAction(password: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const hashedPassword = await bcrypt.hash(password, 10);

  await db
    .update(users)
    .set({
      password: hashedPassword,
    })
    .where(eq(users.id, session.user.id));

  return { success: true };
}
