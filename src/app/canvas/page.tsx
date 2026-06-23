import { redirect } from "next/navigation";

export default function CanvasIndexPage() {
  // Redirect to the client-side resolver to load the last opened diagram
  redirect("/canvas/resolve");
}