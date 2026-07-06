"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CanvasIndexPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to the client-side resolver to load the last opened diagram
    router.replace("/canvas/resolve");
  }, [router]);

  return null;
}