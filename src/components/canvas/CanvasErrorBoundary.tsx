"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}


export class CanvasErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // In production: send to my error tracking (Sentry, etc.)
    console.error("[CanvasErrorBoundary] Caught error:", error, info);
  }

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;

    return (
      this.props.fallback ?? (
        <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-8">
          <p className="text-muted-foreground text-sm max-w-md">
            The canvas failed to initialize. This is usually caused by WebGL
            not being available in your browser, or a graphics driver issue.
          </p>
          <p className="text-xs text-muted-foreground/60 font-mono">
            {this.state.error?.message}
          </p>
          <button
            className="text-sm underline"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Try again
          </button>
        </div>
      )
    );
  }
}