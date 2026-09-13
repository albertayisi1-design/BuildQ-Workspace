import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useBuild } from '../../context/BuildContext';
import { db } from '../../services/db';
import { LogicaLogo } from '../common/LogicaLogo';
import {
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  User as UserIcon,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface LoginViewProps {
  onOpenVerify?: (token?: string, email?: string) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onOpenVerify }) => {
  const { loginWithCredentials, signInWithGoogle } = useAuth();
  const { sendUserVerificationEmail } = useBuild();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isResetDispatching, setIsResetDispatching] = useState(false);

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setIsGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error('Google sign in error:', err);
      setErrorMessage(err?.message || 'Google authentication failed. Please try again.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);

    const cleanIdentifier = identifier.trim();
    if (!cleanIdentifier) {
      setErrorMessage('Please enter your email or username.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const res = loginWithCredentials(cleanIdentifier, password || 'password123');
      setIsLoading(false);
      if (!res.success) {
        setErrorMessage(res.error || 'Invalid credentials. Please verify your email/username and password.');
      }
    }, 250);
  };

  const handleForgotPassword = async () => {
    setErrorMessage(null);
    setInfoMessage(null);

    const cleanIdentifier = identifier.trim();
    if (!cleanIdentifier) {
      setErrorMessage('Please enter your email above to receive a password setup link.');
      return;
    }

    setIsResetDispatching(true);
    try {
      const existingUser = db.getUserByEmail(cleanIdentifier) || db.getUserByUsername(cleanIdentifier);
      if (!existingUser) {
        throw new Error(`No account found matching "${cleanIdentifier}". Please contact your administrator to provision your account.`);
      }

      await sendUserVerificationEmail(existingUser);
      setInfoMessage(`Verification and password setup link dispatched to ${existingUser.email}. Please check your inbox.`);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to dispatch password setup email.');
    } finally {
      setIsResetDispatching(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 flex flex-col justify-center py-4 sm:py-6 px-4 text-slate-900 relative">
      {/* Subtle modern background texture */}
      <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:20px_20px] opacity-30 pointer-events-none" />

      <div className="w-full max-w-[360px] mx-auto relative z-10">
        {/* Focused Formal Login Form Card */}
        <div
          id="workspace-sign-in-card"
          className="bg-white rounded-xl border border-slate-200/90 p-4 sm:p-5 shadow-md shadow-slate-200/40"
        >
          <div className="mb-4 text-center">
            <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              BuildIQ Enterprise Workspace
            </h1>
          </div>

          {errorMessage && (
            <div className="mb-2.5 p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {infoMessage && (
            <div className="mb-2.5 p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-1.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span>{infoMessage}</span>
            </div>
          )}

          {/* Primary Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label
                htmlFor="input-login-identifier"
                className="sr-only"
              >
                Email or username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                  <UserIcon className="w-3.5 h-3.5" />
                </div>
                <input
                  id="input-login-identifier"
                  type="text"
                  autoComplete="username"
                  aria-label="Email or username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Email or username"
                  className="w-full pl-8 pr-2.5 py-2 bg-slate-50/70 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-800 focus:ring-2 focus:ring-slate-100 transition-colors"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="input-login-password"
                className="sr-only"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-3.5 h-3.5" />
                </div>
                <input
                  id="input-login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  aria-label="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full pl-8 pr-8 py-2 bg-slate-50/70 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-800 focus:ring-2 focus:ring-slate-100 transition-colors font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Reset Link */}
            <div className="flex items-center justify-between pt-0.5">
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3 h-3 rounded text-slate-900 border-slate-300 focus:ring-slate-800 cursor-pointer accent-slate-900"
                />
                <span className="text-[10px] sm:text-[11px] text-slate-600">Remember this device</span>
              </label>

              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={isResetDispatching}
                className="text-[11px] text-sky-700 hover:text-sky-900 transition-colors cursor-pointer font-medium disabled:opacity-50"
                title="Send password setup link to the email specified above"
              >
                {isResetDispatching ? 'Sending link...' : 'Forgot password?'}
              </button>
            </div>

            {/* Submit Action */}
            <button
              id="btn-submit-login"
              type="submit"
              disabled={isLoading}
              className="w-full mt-1 py-2 px-3 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-bold text-xs sm:text-sm rounded-lg shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              {isLoading ? (
                <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In to Workspace</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
                </>
              )}
            </button>
          </form>

          {/* Clean Divider */}
          <div className="relative my-3">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-white text-slate-400 text-[10px]">
                or continue with
              </span>
            </div>
          </div>

          {/* Single Sign-On (Google) */}
          <button
            id="btn-sign-in-google"
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading}
            className="w-full py-1.5 px-3 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-800 font-semibold text-xs sm:text-sm rounded-lg shadow-2xs border border-slate-200 hover:border-slate-300 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isGoogleLoading ? (
              <span className="inline-block w-3.5 h-3.5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Sign in with Google</span>
              </>
            )}
          </button>

          {/* Demo Credentials Quick-Select */}
          <div className="mt-3 pt-2.5 border-t border-slate-100">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                Demo Accounts
              </span>
              <span className="text-[9px] font-mono text-slate-400">
                pwd: password123
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                id="btn-demo-login-admin"
                onClick={() => {
                  setIdentifier('admin');
                  setPassword('password123');
                }}
                className="px-2 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-[10px] font-medium text-slate-700 text-left transition-colors cursor-pointer"
              >
                <span className="font-bold text-slate-900 block">Admin</span>
                <span className="text-[9px] text-slate-400 font-mono">admin</span>
              </button>
              <button
                type="button"
                id="btn-demo-login-pm"
                onClick={() => {
                  setIdentifier('pm');
                  setPassword('password123');
                }}
                className="px-2 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-[10px] font-medium text-slate-700 text-left transition-colors cursor-pointer"
              >
                <span className="font-bold text-slate-900 block">Project Mgr</span>
                <span className="text-[9px] text-slate-400 font-mono">pm</span>
              </button>
              <button
                type="button"
                id="btn-demo-login-eng"
                onClick={() => {
                  setIdentifier('engineer');
                  setPassword('password123');
                }}
                className="px-2 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-[10px] font-medium text-slate-700 text-left transition-colors cursor-pointer"
              >
                <span className="font-bold text-slate-900 block">Engineer</span>
                <span className="text-[9px] text-slate-400 font-mono">engineer</span>
              </button>
              <button
                type="button"
                id="btn-demo-login-fin"
                onClick={() => {
                  setIdentifier('finance');
                  setPassword('password123');
                }}
                className="px-2 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-[10px] font-medium text-slate-700 text-left transition-colors cursor-pointer"
              >
                <span className="font-bold text-slate-900 block">Finance</span>
                <span className="text-[9px] text-slate-400 font-mono">finance</span>
              </button>
            </div>
          </div>

          {/* Embedded Logica Softworks Banner */}
          <div className="mt-3 pt-2 border-t border-slate-100 w-full flex flex-col items-center justify-center">
            <LogicaLogo variant="full" size="sm" isDark={false} />
            <p className="text-[9px] font-mono text-slate-400 tracking-wider uppercase mt-0.5">
              Enterprise Solution
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
