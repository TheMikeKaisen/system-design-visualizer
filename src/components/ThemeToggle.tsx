"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isLearningPath = pathname?.startsWith("/java") || 
                         pathname?.startsWith("/javascript") || 
                         pathname?.startsWith("/operating-systems") ||
                         pathname?.startsWith("/backend") ||
                         pathname?.startsWith("/frontend");

  if (isLearningPath) {
    return null;
  }

  if (!mounted) {
    return <div className="w-8 h-8 shrink-0" />; // Placeholder
  }

  return (
    <button
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center w-8 h-8 shrink-0"
      aria-label="Toggle theme"
    >
      {resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
