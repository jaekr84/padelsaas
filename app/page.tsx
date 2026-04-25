import { redirect } from "next/navigation";
import { getLandingPageAction } from "@/lib/actions/auth-player";

export default async function Home() {
  const landingPage = await getLandingPageAction();
  redirect(landingPage);
}
