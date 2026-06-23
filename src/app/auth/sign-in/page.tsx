import { signIn } from "@/lib/auth/auth";
import { env }    from "@/lib/env";

interface Props {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}

export default async function SignInPage({ searchParams }: Props) {
  const { callbackUrl, error } = await searchParams;

  const providers: Array<{
    id: string; label: string; icon: React.ReactNode; available: boolean;
  }> = [
    {
      id:        "github",
      label:     "Continue with GitHub",
      icon:      <GithubIcon />,
      available: !!(env.AUTH_GITHUB_ID && env.AUTH_GITHUB_SECRET),
    },
    {
      id:        "google",
      label:     "Continue with Google",
      icon:      <GoogleIcon />,
      available: !!(env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET),
    },
  ];

  const availableProviders = providers.filter((p) => p.available);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <LogoIcon />
          <span className="text-lg font-medium text-foreground">sysvis</span>
        </div>

        <div className="border border-border rounded-2xl bg-background p-8 flex flex-col gap-6">
          <div>
            <h1 className="text-xl font-medium text-foreground">Sign in</h1>
            <p className="text-sm text-muted-foreground mt-1">
              to continue to your diagrams
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div
              className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3"
              role="alert"
            >
              <p className="text-sm text-destructive">
                {error === "OAuthAccountNotLinked"
                  ? "This email is already associated with another sign-in method."
                  : "Authentication failed. Please try again."}
              </p>
            </div>
          )}

          {/* OAuth buttons */}
          <div className="flex flex-col gap-3">
            {availableProviders.map((provider) => (
              <form
                key={provider.id}
                action={async () => {
                  "use server";
                  await signIn(provider.id, {
                    redirectTo: callbackUrl ?? "/canvas",
                  });
                }}
              >
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-3 h-11
                             border border-border rounded-xl bg-background
                             text-sm font-medium text-foreground
                             hover:bg-accent transition-colors"
                >
                  {provider.icon}
                  {provider.label}
                </button>
              </form>
            ))}

            {availableProviders.length === 0 && (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">
                  No OAuth providers configured.
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Set AUTH_GITHUB_ID / AUTH_GOOGLE_ID in your .env.local
                </p>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[11px] text-muted-foreground/50">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Guest access */}
          <a
            href={callbackUrl ?? "/canvas"}
            className="flex items-center justify-center gap-2 h-11 rounded-xl
                       border border-dashed border-border text-sm text-muted-foreground
                       hover:text-foreground hover:border-border/80 transition-colors"
          >
            <GuestIcon />
            Continue as guest
          </a>

          <p className="text-[11px] text-muted-foreground/60 text-center">
            By continuing, you agree to our terms of service and privacy policy.
          </p>
        </div>
      </div>
    </div>
  );
}

function LogoIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 20 20" fill="none">
      <rect x="1" y="1" width="8" height="8" rx="2" fill="currentColor" opacity={0.8}/>
      <rect x="11" y="1" width="8" height="8" rx="2" fill="currentColor" opacity={0.4}/>
      <rect x="1" y="11" width="8" height="8" rx="2" fill="currentColor" opacity={0.4}/>
      <rect x="11" y="11" width="8" height="8" rx="2" fill="currentColor" opacity={0.8}/>
    </svg>
  );
}

function GithubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12Z"/>
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62Z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z" fill="#EA4335"/>
    </svg>
  );
}

function GuestIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none"
         stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="5.5" r="2.5"/>
      <path d="M2.5 14c0-3.038 2.462-5.5 5.5-5.5s5.5 2.462 5.5 5.5"/>
    </svg>
  );
}
