"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { localStoragePersistence } from "@/lib/persistence/localStoragePersistence";
import { nanoid } from "nanoid";

/**
 * Runs client-side to check localStorage for the last opened diagram.
 * Redirects to that diagram or creates a fresh one.
 * Shows a blank screen for ~1 frame — acceptable UX tradeoff.
 */
export default function ResolvePage() {
  const router = useRouter();

  useEffect(() => {
    const lastId = localStoragePersistence.getLastOpenedId();
    if (lastId && localStoragePersistence.exists(lastId)) {
      router.replace(`/canvas/${lastId}`);
    } else {
      router.replace(`/canvas/${nanoid()}`);
    }
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}
