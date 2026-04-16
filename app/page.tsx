import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function Home() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  // If authenticated, we could redirect to a default tenant or a selector
  // For now, let's redirect to the new home dashboard
  redirect("/home");
}
