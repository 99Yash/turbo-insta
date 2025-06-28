"use client";

import * as React from "react";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error details
    console.error("[ErrorBoundary] Caught an error:", error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Render custom fallback UI or default error UI
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent
            error={this.state.error}
            resetError={this.resetError}
          />
        );
      }

      // Default error UI
      return (
        <Card className="mx-auto max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">
              Something went wrong
            </CardTitle>
            <CardDescription>
              We encountered an error while loading this part of the app.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {this.state.error && (
              <details className="text-sm text-muted-foreground">
                <summary className="cursor-pointer">Technical details</summary>
                <pre className="mt-2 overflow-auto rounded bg-muted p-2 text-xs">
                  {this.state.error.message}
                </pre>
              </details>
            )}
            <Button onClick={this.resetError} className="w-full">
              Try again
            </Button>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

/**
 * Simple fallback component for loading-related errors
 */
export function LoadingErrorFallback({
  resetError,
}: {
  resetError: () => void;
}) {
  return (
    <div className="flex h-full w-full items-center justify-center p-8">
      <Card className="max-w-sm">
        <CardHeader>
          <CardTitle className="text-sm">Loading...</CardTitle>
          <CardDescription className="text-xs">
            Please wait while we set up your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="h-2 w-full animate-pulse rounded bg-muted" />
          <Button
            variant="outline"
            size="sm"
            onClick={resetError}
            className="w-full text-xs"
          >
            Refresh
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
