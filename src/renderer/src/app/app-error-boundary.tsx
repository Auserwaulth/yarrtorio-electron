import { APP_NAME } from "@shared/constants";
import type { ErrorInfo, ReactNode } from "react";
import { Component } from "react";

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  error: Error | null;
}

export class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  override state: AppErrorBoundaryState = {
    error: null,
  };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("Renderer crashed:", error, errorInfo);
  }

  override render() {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <div className="bg-base-200 flex min-h-screen items-center justify-center px-6">
        <div className="border-base-300 bg-base-100 w-full max-w-xl rounded-3xl border p-6 shadow-2xl">
          <div className="space-y-2">
            <p className="text-error text-sm font-semibold">Renderer error</p>
            <h1 className="text-2xl font-black">{APP_NAME}</h1>
            <p className="text-base-content/70 text-sm leading-6">
              Something went wrong in the app UI. You can reload the window and
              continue, or share the error below if this keeps happening.
            </p>
          </div>

          <div className="bg-base-200 mt-5 rounded-2xl border p-4">
            <p className="font-mono text-sm wrap-break-word">
              {this.state.error.message || "Unknown renderer error."}
            </p>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              className="btn btn-primary"
              type="button"
              onClick={() => window.location.reload()}
            >
              Reload app
            </button>
          </div>
        </div>
      </div>
    );
  }
}
