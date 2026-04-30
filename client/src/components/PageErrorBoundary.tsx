import { Component, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Mail } from "lucide-react";

interface Props {
  children: ReactNode;
  pageName?: string;
}
interface State {
  hasError: boolean;
  errorId: string;
}

function genId() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export class PageErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorId: "" };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true, errorId: genId() };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    // Log to console in all environments so server logs capture it
    console.error("[CCHUB PageError]", error?.message, info?.componentStack?.slice(0, 400));
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-orange-50 border-2 border-orange-200 flex items-center justify-center mx-auto mb-5">
            <AlertTriangle className="w-8 h-8 text-orange-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">
            This page ran into a problem
          </h2>
          <p className="text-sm text-slate-500 max-w-md leading-relaxed mb-1">
            Something unexpected happened while loading
            {this.props.pageName ? ` ${this.props.pageName}` : " this section"}.
            Your data is safe — this is a display error only.
          </p>
          <p className="text-xs text-slate-400 mb-6">
            Error reference: <span className="font-mono font-semibold">{this.state.errorId}</span>
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => { this.setState({ hasError: false, errorId: "" }); window.location.reload(); }}
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Reload page
            </button>
            <a
              href="mailto:team@corecompliancehub.com"
              className="inline-flex items-center gap-2 border border-slate-300 text-slate-600 hover:text-slate-800 hover:border-slate-400 font-medium px-5 py-2.5 rounded-lg transition-colors text-sm"
            >
              <Mail className="w-4 h-4" />
              Contact support
            </a>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
