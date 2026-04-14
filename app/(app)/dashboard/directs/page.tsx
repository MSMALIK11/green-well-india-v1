import { redirect } from "next/navigation";

export default function DirectsRedirectPage() {
  redirect("/dashboard/team?tab=directs");
}
