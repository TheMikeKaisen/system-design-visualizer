
export function LoadBar({ load, color }: { load: number; color: string }) {
  return (
    <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl overflow-hidden bg-muted">
      <div
        className={`h-full transition-all duration-500 ${color}`}
        style={{ width: `${Math.min(load * 100, 100)}%` }}
      />
    </div>
  );
}

// Icon components (inline SVG, same style as NodePalette)
export function LBIcon({ className }: { className?: string }) {
  return <svg viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"><circle cx="8" cy="4" r="2"/><circle cx="3" cy="12" r="2"/><circle cx="13" cy="12" r="2"/><path d="M8 6v2M8 8L3 10M8 8l5 2"/></svg>;
}
export function DbIcon({ className }: { className?: string }) {
  return <svg viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"><ellipse cx="8" cy="4.5" rx="5" ry="2"/><path d="M3 4.5v7c0 1.1 2.24 2 5 2s5-.9 5-2v-7"/><path d="M3 8c0 1.1 2.24 2 5 2s5-.9 5-2"/></svg>;
}
export function S3Icon({ className }: { className?: string }) {
  return <svg viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"><path d="M8 2L14 5v6L8 14 2 11V5L8 2z"/><path d="M8 2v12M2 5l6 3 6-3"/></svg>;
}
export function CacheIcon({ className }: { className?: string }) {
  return <svg viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"><rect x="2" y="3" width="12" height="4" rx="1"/><rect x="2" y="9" width="12" height="4" rx="1"/><path d="M5 5h.01M5 11h.01"/></svg>;
}
export function MqIcon({ className }: { className?: string }) {
  return <svg viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"><path d="M2 4h12M2 8h8M2 12h10"/></svg>;
}