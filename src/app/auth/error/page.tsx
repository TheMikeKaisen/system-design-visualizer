import Link from "next/link";

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm text-center flex flex-col gap-4">
        <h1 className="text-xl font-medium text-foreground">
          Authentication error
        </h1>
        <p className="text-sm text-muted-foreground">
          Something went wrong during sign-in. This can happen if you denied
          permission or if there was a configuration issue.
        </p>
        <Link
          href="/auth/sign-in"
          className="inline-flex items-center justify-center h-10 px-6
                     rounded-xl bg-primary text-primary-foreground text-sm font-medium
                     hover:bg-primary/90 transition-colors mx-auto"
        >
          Try again
        </Link>
      </div>
    </div>
  );
}
