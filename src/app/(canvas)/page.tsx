import { redirect } from "next/navigation";
import { randomUUID } from "crypto";

export default function CanvasIndexPage() {
  // Create a new random diagram ID and redirect the user there
  const newDiagramId = randomUUID();
  redirect(`/canvas/${newDiagramId}`);
}