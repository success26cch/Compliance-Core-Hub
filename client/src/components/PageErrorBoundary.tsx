import { Component, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Copy, CheckCircle2 } from "lucide-react";

interface Props {
  children: ReactNode;
  pageName?: string;
}
interface State {
  hasError: boolean;
  errorMessage: string;
  errorStack: string;
  copied: boolean;
}

export class PageErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: "", errorStack: "", copied: false };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      errorMessage: error?.message ?? "Unknown error",
      errorStack: error?.stack ?? "",
    };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error("[CCHUB] Page crash —", error?.message, info?.componentStack?.slice(0, 600));
  }

  handleCopy = () => {
    const text = [
      `Page: ${this.props.pageName ?? "unknown"}`,
      `Error: ${this.state.errorMessage}`,
      `Stack: ${this.state.errorStack}`,
    ].join("\n\n");
    navigator.clipboard.writeText(text).then(() => {
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2500);
    }).catch(() => {});
  };

  render() {
    if (this.state.hasError) {
      const { pageName } = this.props;
      const { errorMessage, copied } = this.state;

      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-orange-50 border-2 border-orange-200 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-7 h-7 text-orange-500" />
          </div>

          <h2 className="text-xl font-bold text-slate-800 mb-1">
            Something went wrong
            {pageName ? ` on ${pageName}` : ""}
          </h2>
          <p className="text-sm text-slate-500 max-w-sm leading-relaxed mb-4">
            A display error occurred. Your saved data is not affected.
            Reload the page — if the problem persists, copy the error details below and share them to get it fixed.
          </p>

          {errorMessage && (
            <div className="w-full max-w-md bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 mb-5 text-left">
              <p className="text-xs font-mono text-slate-600 break-all leading-relaxed">{errorMessage}</p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <button
              onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Reload page
            </button>
            <button
              onClick={this.handleCopy}
              className="inline-flex items-center gap-2 border border-slate-300 text-slate-600 hover:text-slate-800 hover:border-slate-400 font-medium px-5 py-2.5 rounded-lg transition-colors text-sm"
            >
              {copied
                ? <><CheckCircle2 className="w-4 h-4 text-green-500" /> Copied!</>
                : <><Copy className="w-4 h-4" /> Copy error details</>
              }
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
