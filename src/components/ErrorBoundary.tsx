import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 bg-zinc-950 text-white p-8 flex flex-col items-center justify-center font-sans z-[9999]">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Oups ! Une erreur est survenue.</h1>
          <p className="text-muted-foreground mb-6 text-center max-w-md">
            L'application a rencontré un problème inattendu. Veuillez rafraîchir la page.
          </p>
          <div className="bg-zinc-900 border border-border p-4 rounded-md w-full max-w-2xl overflow-auto max-h-64 mb-6">
            <code className="text-xs text-red-400 whitespace-pre-wrap">
              {this.state.error?.toString()}
              <br /><br />
              {this.state.error?.stack}
            </code>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="bg-primary text-primary-foreground px-6 py-2 rounded-md font-bold hover:bg-primary/90 transition-colors"
          >
            Rafraîchir
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
