import { redirect } from "next/navigation";
import { getLandingPageAction } from "@/lib/actions/auth-player";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Home() {
  const landingPage = await getLandingPageAction();
  redirect(landingPage);
}
