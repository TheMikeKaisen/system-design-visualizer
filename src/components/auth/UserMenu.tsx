"use client";

import { useState } from "react";
import { signOut }  from "next-auth/react";
import Image        from "next/image";

interface UserMenuProps {
  user: {
    id:     string;
    name?:  string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function UserMenu({ user }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const initials = (user.name ?? user.email ?? "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full focus:outline-none
                   focus-visible:ring-2 focus-visible:ring-primary"
        aria-label="Open user menu"
        aria-expanded={isOpen}
      >
        {user.image ? (
          <Image
            src={user.image}
            alt={user.name ?? "User"}
            width={32}
            height={32}
            className="rounded-full border border-border"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-primary/15 border border-border
                          flex items-center justify-center text-xs font-medium text-primary">
            {initials}
          </div>
        )}
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          {/* Dropdown */}
          <div
            className="absolute right-0 top-10 z-50 w-56 rounded-xl border border-border
                       bg-background shadow-md overflow-hidden"
            role="menu"
          >
            {/* User info */}
            <div className="px-4 py-3 border-b border-border">
              {user.name && (
                <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
              )}
              {user.email && (
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              )}
            </div>

            {/* Actions */}
            <div className="py-1">
              <button
                onClick={() => signOut({ callbackUrl: "/auth/sign-in" })}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm
                           text-foreground hover:bg-accent transition-colors text-left"
                role="menuitem"
              >
                <SignOutIcon />
                Sign out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function SignOutIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
         stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
      <path d="M5 2H3a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h2M9 10l3-3-3-3M12 7H6"/>
    </svg>
  );
}
