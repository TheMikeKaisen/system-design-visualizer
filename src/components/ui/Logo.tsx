export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Connecting paths */}
      <path 
        d="M11 16h5m0 0V8h5m-5 8v8h5" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        opacity="0.4"
      />
      
      {/* Primary Node (Left) */}
      <rect x="3" y="12" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="2" fill="var(--color-background)" />
      
      {/* Secondary Nodes (Right) */}
      <rect x="21" y="4" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="2" fill="var(--color-background)" opacity="0.85" />
      <rect x="21" y="20" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="2" fill="var(--color-background)" opacity="0.6" />
      
      {/* Accent Router/Node in the middle */}
      <circle cx="16" cy="16" r="3.5" fill="oklch(0.55 0.12 260)" />
      <circle cx="16" cy="16" r="1.5" fill="var(--color-background)" />
    </svg>
  );
}
