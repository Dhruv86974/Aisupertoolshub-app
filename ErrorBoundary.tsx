import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RefreshCw, Trash2, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  props: Props;
  state: State;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
    this.props = props;
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught applet error:", error, errorInfo);
  }

  private handleReset = () => {
    localStorage.clear();
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      const isDark = localStorage.getItem('hub_theme') !== 'light';
      return (
        <div className={`min-h-screen flex items-center justify-center p-6 ${isDark ? 'bg-[#030712] text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
          <div className={`max-w-md w-full p-8 rounded-3xl border text-center space-y-6 ${
            isDark ? 'bg-[#0b0f19] border-slate-900' : 'bg-white border-slate-200'
          } shadow-2xl`}>
            <div className="w-16 h-16 mx-auto rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 animate-pulse">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-black uppercase tracking-wider">
                અણધારી ખામી સર્જાઈ છે
              </h1>
              <p className="text-xs text-slate-500 leading-relaxed">
                An unexpected application error occurred. We have isolated the crash to protect your local data from corruption.
              </p>
            </div>

            {this.state.error && (
              <div className={`p-4 rounded-xl text-left overflow-auto text-[10px] font-mono leading-relaxed ${
                isDark ? 'bg-slate-950 text-red-400' : 'bg-red-50/50 text-red-600 border border-red-100'
              } max-h-32`}>
                {this.state.error.toString()}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => window.location.reload()}
                className="py-2.5 px-4 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <RefreshCw className="w-4 h-4" />
                <span>ફરીથી પ્રયાસ કરો</span>
              </button>
              <button
                onClick={this.handleReset}
                className={`py-2.5 px-4 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-2 cursor-pointer active:scale-95 ${
                  isDark ? 'border-slate-800 hover:bg-slate-900 text-slate-300' : 'border-slate-200 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <Trash2 className="w-4 h-4 text-red-500" />
                <span>ડેટા ક્લિયર કરો</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
