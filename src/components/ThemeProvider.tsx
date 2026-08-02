"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { usePathname } from "next/navigation";

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  const pathname = usePathname();
  
  const isLearningPath = pathname?.startsWith("/java") || 
                         pathname?.startsWith("/javascript") || 
                         pathname?.startsWith("/operating-systems") ||
                         pathname?.startsWith("/backend") ||
                         pathname?.startsWith("/frontend");

  const themeProps = isLearningPath ? { ...props, forcedTheme: "dark" } : props;

  return <NextThemesProvider {...themeProps}>{children}</NextThemesProvider>;
}
