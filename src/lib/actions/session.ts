"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function setActiveCenterAction(centerId: string) {
  const cookieStore = await cookies();
  cookieStore.set("active_center_id", centerId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  
  revalidatePath("/");
  return { success: true };
}
