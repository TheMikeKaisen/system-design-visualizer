const CURSOR_COLORS = [
  "#7F77DD", "#1D9E75", "#D85A30", "#D4537E",
  "#378ADD", "#639922", "#BA7517", "#E24B4A",
];

const ADJECTIVES = ["Swift", "Calm", "Bold", "Bright", "Quiet", "Sharp"];
const NOUNS      = ["Fox", "Owl", "Bear", "Wolf", "Hawk", "Lynx"];

function randomGuestName(): string {
  const a = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const n = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  return `${a} ${n}`;
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function safeLocalStorage(fn: () => string | null): string | null {
  try { return fn(); } catch { return null; }
}

export interface UserIdentity {
  name: string;
  /** Hex color — deterministic from name so it's stable across reconnects */
  color: string;
}

const LS_NAME_KEY = "sysvis:userName";

export function getUserIdentity(): UserIdentity {
  let name = safeLocalStorage(() => localStorage.getItem(LS_NAME_KEY)) ?? "";
  if (!name) {
    name = randomGuestName();
    try { localStorage.setItem(LS_NAME_KEY, name); } catch { /**/ }
  }
  const color = CURSOR_COLORS[hashString(name) % CURSOR_COLORS.length];
  return { name, color };
}

export function setUserName(name: string): void {
  const trimmed = name.trim();
  if (!trimmed) return;
  try { localStorage.setItem(LS_NAME_KEY, trimmed); } catch { /**/ }
}
