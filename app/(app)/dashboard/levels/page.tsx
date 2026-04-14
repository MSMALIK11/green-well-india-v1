import { redirect } from "next/navigation";

export default function LevelsRedirectPage() {
  redirect("/dashboard/team?tab=levels");
}
