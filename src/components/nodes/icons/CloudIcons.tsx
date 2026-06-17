interface IconProps { size?: number }

// ─── AWS ────────────────────────────────────────────────────────────

export function AwsIcon({ size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path d="M6 11.5C6 12.88 7.34 14 9 14s3-1.12 3-2.5c0-1.04-.72-1.94-1.8-2.35L8 8.5C7.12 8.18 6.5 7.38 6.5 6.5 6.5 5.12 7.62 4 9 4s2.5 1.12 2.5 2.5" stroke="#FF9900" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M9 2v2M9 14v2" stroke="#FF9900" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M4 15.5C5.5 17 7.62 18 10 18c4.42 0 8-3.58 8-8" stroke="#232F3E" strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M16.5 10 18 8.5l1.5 1.5" stroke="#232F3E" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function AwsEc2Icon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <rect x="2" y="2" width="12" height="12" rx="2" fill="#ED7100" opacity={0.15}/>
      <rect x="2" y="2" width="12" height="12" rx="2" stroke="#ED7100" strokeWidth="1.2"/>
      <rect x="5" y="5" width="6" height="6" rx="1" fill="#ED7100" opacity={0.6}/>
    </svg>
  );
}

export function AwsRdsIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <ellipse cx="8" cy="5" rx="5" ry="2" fill="#2E73B8" opacity={0.2} stroke="#2E73B8" strokeWidth="1.2"/>
      <path d="M3 5v6c0 1.1 2.24 2 5 2s5-.9 5-2V5" stroke="#2E73B8" strokeWidth="1.2"/>
      <path d="M3 8c0 1.1 2.24 2 5 2s5-.9 5-2" stroke="#2E73B8" strokeWidth="1.2"/>
    </svg>
  );
}

export function AwsElastiCacheIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <rect x="2" y="4" width="12" height="3.5" rx="1" fill="#C7131F" opacity={0.2} stroke="#C7131F" strokeWidth="1.2"/>
      <rect x="2" y="8.5" width="12" height="3.5" rx="1" fill="#C7131F" opacity={0.2} stroke="#C7131F" strokeWidth="1.2"/>
      <circle cx="5" cy="5.75" r="0.8" fill="#C7131F"/>
      <circle cx="5" cy="10.25" r="0.8" fill="#C7131F"/>
    </svg>
  );
}

export function AwsCloudFrontIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke="#8C4FFF" strokeWidth="1.2"/>
      <path d="M8 2c-1.5 1-2.5 3-2.5 6s1 5 2.5 6" stroke="#8C4FFF" strokeWidth="1.2"/>
      <path d="M8 2c1.5 1 2.5 3 2.5 6s-1 5-2.5 6" stroke="#8C4FFF" strokeWidth="1.2"/>
      <path d="M2 8h12" stroke="#8C4FFF" strokeWidth="1.2"/>
    </svg>
  );
}

export function AwsLambdaIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <rect x="2" y="2" width="12" height="12" rx="2" fill="#FF9900" opacity={0.15} stroke="#FF9900" strokeWidth="1.2"/>
      <path d="M5 12L7.5 6 8.5 8.5 10 6 13 12" stroke="#FF9900" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function AwsSqsIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <rect x="2" y="4" width="12" height="8" rx="1.5" stroke="#FF4F00" strokeWidth="1.2"/>
      <path d="M5 7h6M5 9.5h4" stroke="#FF4F00" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}

// ─── GCP ────────────────────────────────────────────────────────────

export function GcpCloudRunIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M4 12V4l7 4-7 4z" fill="#4285F4" opacity={0.3} stroke="#4285F4" strokeWidth="1.2" strokeLinejoin="round"/>
    </svg>
  );
}

export function GcpCloudSqlIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <ellipse cx="8" cy="5" rx="5" ry="2" fill="#34A853" opacity={0.2} stroke="#34A853" strokeWidth="1.2"/>
      <path d="M3 5v6c0 1.1 2.24 2 5 2s5-.9 5-2V5" stroke="#34A853" strokeWidth="1.2"/>
      <path d="M3 8c0 1.1 2.24 2 5 2s5-.9 5-2" stroke="#34A853" strokeWidth="1.2"/>
    </svg>
  );
}

export function GcpCloudStorageIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M8 2L13 5v6L8 14 3 11V5L8 2z" fill="#FBBC04" opacity={0.2} stroke="#FBBC04" strokeWidth="1.2" strokeLinejoin="round"/>
      <path d="M8 2v12M3 5l5 3 5-3" stroke="#FBBC04" strokeWidth="1.2"/>
    </svg>
  );
}

export function GcpPubSubIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="2.5" fill="#4285F4" opacity={0.3} stroke="#4285F4" strokeWidth="1.2"/>
      <circle cx="3" cy="5" r="1.5" stroke="#4285F4" strokeWidth="1.2"/>
      <circle cx="13" cy="5" r="1.5" stroke="#4285F4" strokeWidth="1.2"/>
      <circle cx="3" cy="11" r="1.5" stroke="#4285F4" strokeWidth="1.2"/>
      <circle cx="13" cy="11" r="1.5" stroke="#4285F4" strokeWidth="1.2"/>
      <path d="M5.5 8 L5.5 8" stroke="#4285F4" strokeWidth="1" strokeLinecap="round"/>
      <path d="M4 6l4 2M12 6l-4 2M4 10l4-2M12 10l-4-2" stroke="#4285F4" strokeWidth="0.9"/>
    </svg>
  );
}

export function GcpCloudCdnIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke="#34A853" strokeWidth="1.2"/>
      <path d="M8 2c-2 1.5-3 3.5-3 6s1 4.5 3 6" stroke="#34A853" strokeWidth="1.2"/>
      <path d="M8 2c2 1.5 3 3.5 3 6s-1 4.5-3 6" stroke="#34A853" strokeWidth="1.2"/>
      <path d="M2.5 7h11" stroke="#34A853" strokeWidth="1.2"/>
    </svg>
  );
}

export function GcpCloudFunctionIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <rect x="2" y="2" width="12" height="12" rx="2" fill="#FBBC04" opacity={0.15} stroke="#FBBC04" strokeWidth="1.2"/>
      <path d="M6 12l1.5-4.5L9 9l1.5-5" stroke="#FBBC04" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ─── Azure ───────────────────────────────────────────────────────────

export function AzureVmIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <rect x="2" y="3" width="12" height="8" rx="1.5" fill="#0078D4" opacity={0.15} stroke="#0078D4" strokeWidth="1.2"/>
      <rect x="4" y="5" width="8" height="4" rx="1" fill="#0078D4" opacity={0.25}/>
      <path d="M5 13h6M8 11v2" stroke="#0078D4" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}

export function AzureSqlIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <ellipse cx="8" cy="5" rx="5" ry="2" fill="#0078D4" opacity={0.2} stroke="#0078D4" strokeWidth="1.2"/>
      <path d="M3 5v6c0 1.1 2.24 2 5 2s5-.9 5-2V5" stroke="#0078D4" strokeWidth="1.2"/>
      <path d="M3 8c0 1.1 2.24 2 5 2s5-.9 5-2" stroke="#0078D4" strokeWidth="1.2"/>
    </svg>
  );
}

export function AzureBlobIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M8 2L13 5v6L8 14 3 11V5L8 2z" fill="#0078D4" opacity={0.15} stroke="#0078D4" strokeWidth="1.2" strokeLinejoin="round"/>
      <circle cx="8" cy="8" r="2" fill="#0078D4" opacity={0.4}/>
    </svg>
  );
}

export function AzureServiceBusIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <rect x="2" y="4.5" width="12" height="7" rx="1.5" stroke="#0078D4" strokeWidth="1.2"/>
      <path d="M5 7.5h6M5 10h4" stroke="#0078D4" strokeWidth="1.2" strokeLinecap="round"/>
      <circle cx="11" cy="10" r="1.5" fill="#0078D4" opacity={0.5}/>
    </svg>
  );
}

export function AzureCdnIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke="#0078D4" strokeWidth="1.2"/>
      <path d="M8 2c-2 1.5-3 3.5-3 6s1 4.5 3 6" stroke="#0078D4" strokeWidth="1.2"/>
      <path d="M8 2c2 1.5 3 3.5 3 6s-1 4.5-3 6" stroke="#0078D4" strokeWidth="1.2"/>
      <path d="M2.5 7h11" stroke="#0078D4" strokeWidth="1.2"/>
    </svg>
  );
}

export function AzureFunctionIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <rect x="2" y="2" width="12" height="12" rx="2" fill="#0078D4" opacity={0.15} stroke="#0078D4" strokeWidth="1.2"/>
      <path d="M9 3.5L7 8h3L6 12.5" stroke="#0078D4" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ─── API Gateway ─────────────────────────────────────────────────────

export function ApiGatewayIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <rect x="1" y="5" width="6" height="6" rx="1.5" stroke="#7F77DD" strokeWidth="1.2"/>
      <rect x="9" y="5" width="6" height="6" rx="1.5" stroke="#7F77DD" strokeWidth="1.2"/>
      <path d="M7 8h2" stroke="#7F77DD" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M4 3.5v1M4 11.5v1M12 3.5v1M12 11.5v1" stroke="#7F77DD" strokeWidth="1" strokeLinecap="round" opacity={0.5}/>
    </svg>
  );
}
