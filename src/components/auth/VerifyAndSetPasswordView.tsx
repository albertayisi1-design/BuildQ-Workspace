import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useBuild } from '../../context/BuildContext';
import { db } from '../../services/db';
import { User } from '../../types';
import { LogicaLogo } from '../common/LogicaLogo';
import {
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  User as UserIcon,
  Mail,
  Building2,
  Check,
  RefreshCw,
} from 'lucide-react';

interface VerifyAndSetPasswordViewProps {
  initialToken?: string;
  initialEmail?: string;
  onComplete?: () => void;
  onCancel?: () => void;
}

export const VerifyAndSetPasswordView: React.FC<VerifyAndSetPasswordViewProps> = ({
  initialToken,
  initialEmail,
  onComplete,
  onCancel,
}) => {
  const { loginWithCredentials } = useAuth();
  const { verifyUserAndSetPassword, sendUserVerificationEmail } = useBuild();

  // Extract from query params if not provided
  const [token, setToken] = useState<string>(() => {
    if (initialToken) return initialToken;
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('token') || params.get('oobCode') || '';
    }
    return '';
  });

  const [email, setEmail] = useState<string>(() => {
    if (initialEmail) return initialEmail;
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('email') || '';
    }
    return '';
  });

  const [targetUser, setTargetUser] = useState<User | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Locate target user based on token or email
  useEffect(() => {
    const users = db.getUsers();
    let found: User | undefined;

    if (token) {
      found = users.find((u) => u.verification_token === token);
    }
    if (!found && email) {
      found = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    }

    if (found) {
      setTargetUser(found);
      if (!email && found.email) {
        setEmail(found.email);
      }
    } else if (token || email) {
      setError('The verification link token is invalid, expired, or has already been used.');
    }
  }, [token, email]);

  const handleResendLink = async () => {
    if (!targetUser && !email) {
      setError('Please provide a valid corporate email address.');
      return;
    }

    setIsResending(true);
    setError(null);
    setResendSuccess(null);

    try {
      const userToResend = targetUser || db.getUserByEmail(email);
      if (!userToResend) {
        throw new Error(`No account found matching email "${email}".`);
      }

      const res = await sendUserVerificationEmail(userToResend);
      setToken(res.token);
      setTargetUser(userToResend);
      setResendSuccess(`A new verification link has been sent to ${userToResend.email}.`);
      setTimeout(() => setResendSuccess(null), 5000);
    } catch (err: any) {
      setError(err?.message || 'Failed to dispatch verification email link.');
    } finally {
      setIsResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password) {
      setError('Please choose a secure corporate password.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters in length for corporate compliance.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setIsLoading(true);

    try {
      const tokenOrEmail = token || (targetUser?.email || email);
      const res = await verifyUserAndSetPassword(tokenOrEmail, password);

      if (!res.success) {
        throw new Error(res.error || 'Failed to verify account and save password.');
      }

      setSuccess(true);

      // Clean URL params cleanly
      if (typeof window !== 'undefined' && window.history && window.history.replaceState) {
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      }

      // Automatically sign in with credentials
      setTimeout(() => {
        const userEmail = res.user?.email || email || targetUser?.email || '';
        loginWithCredentials(userEmail, password);
        if (onComplete) {
          onComplete();
        }
      }, 1000);
    } catch (err: any) {
      setError(err?.message || 'An error occurred while setting your password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 flex flex-col justify-center py-6 px-4 text-slate-900 relative">
      <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:20px_20px] opacity-30 pointer-events-none" />

      <div className="w-full max-w-md mx-auto relative z-10">
        <div
          id="verify-set-password-card"
          className="bg-white rounded-xl border border-slate-200/90 shadow-xl overflow-hidden"
        >
          {/* Executive IAM Banner */}
          <div className="bg-slate-900 px-5 py-4 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  Verify Email &amp; Set Password
                </h1>
                <p className="text-[11px] text-slate-400">
                  BuildIQ Enterprise Access Governance
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold bg-slate-800 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded">
              SECURE
            </span>
          </div>

          <div className="p-5">
            {success ? (
              <div className="text-center py-6 space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h2 className="text-base font-bold text-slate-900">
                  Account Verified &amp; Password Configured!
                </h2>
                <p className="text-xs text-slate-600 max-w-xs mx-auto">
                  Your corporate credentials have been authenticated. Connecting you to your authorized BuildIQ workspace...
                </p>
                <div className="pt-2 flex justify-center">
                  <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                </div>
              </div>
            ) : (
              <>
                {/* Account Details Capsule */}
                {targetUser ? (
                  <div className="mb-4 bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">User Profile:</span>
                      <span className="font-bold text-slate-900">{targetUser.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Corporate Email:</span>
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-slate-800">{targetUser.email}</span>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-1 rounded">
                          Verified
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Authorized Role:</span>
                      <span className="uppercase font-mono font-bold text-[10px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-800">
                        {targetUser.role}
                      </span>
                    </div>
                    {targetUser.department && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Department:</span>
                        <span className="text-slate-700">{targetUser.department}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mb-4 p-3 rounded-lg bg-sky-50 border border-sky-200 text-xs text-sky-900">
                    <p className="font-medium">
                      Enter your corporate email and choose your password to complete registration.
                    </p>
                  </div>
                )}

                {/* Notifications & Error messages */}
                {error && (
                  <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold">Verification Notice</div>
                      <p className="text-[11px] mt-0.5">{error}</p>
                    </div>
                  </div>
                )}

                {resendSuccess && (
                  <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                    <Check className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>{resendSuccess}</span>
                  </div>
                )}

                {/* Password Configuration Form */}
                <form onSubmit={handleSubmit} className="space-y-3 text-xs">
                  {!targetUser && (
                    <div>
                      <label
                        htmlFor="input-verify-email"
                        className="block text-[11px] font-semibold text-slate-700 mb-1"
                      >
                        Corporate Email Address
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                          <Mail className="w-3.5 h-3.5" />
                        </div>
                        <input
                          id="input-verify-email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="name@company.com"
                          className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-slate-800"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label
                      htmlFor="input-new-password"
                      className="block text-[11px] font-semibold text-slate-700 mb-1"
                    >
                      New Corporate Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-3.5 h-3.5" />
                      </div>
                      <input
                        id="input-new-password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        autoComplete="new-password"
                        className="w-full pl-8 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-slate-800 font-mono"
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

                  <div>
                    <label
                      htmlFor="input-confirm-password"
                      className="block text-[11px] font-semibold text-slate-700 mb-1"
                    >
                      Confirm Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-3.5 h-3.5" />
                      </div>
                      <input
                        id="input-confirm-password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••••••"
                        autoComplete="new-password"
                        className="w-full pl-8 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-slate-800 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                        title={showConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-3.5 h-3.5" />
                        ) : (
                          <Eye className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Password requirement hints */}
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80 space-y-1 text-[10px] text-slate-600">
                    <div className="font-semibold text-slate-700">Password Requirements:</div>
                    <div className="flex items-center gap-1.5">
                      <span className={password.length >= 8 ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                        {password.length >= 8 ? '✓' : '•'}
                      </span>
                      <span>At least 8 characters</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={password && password === confirmPassword ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                        {password && password === confirmPassword ? '✓' : '•'}
                      </span>
                      <span>Passwords match</span>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    id="btn-confirm-set-password"
                    type="submit"
                    disabled={isLoading}
                    className="w-full mt-2 py-2 px-4 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-bold text-xs rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {isLoading ? (
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Activate Account &amp; Sign In</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </form>

                {/* Secondary Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={handleResendLink}
                    disabled={isResending}
                    className="text-[11px] text-sky-700 hover:text-sky-900 font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${isResending ? 'animate-spin' : ''}`} />
                    <span>Resend Setup Email</span>
                  </button>

                  {onCancel && (
                    <button
                      type="button"
                      onClick={onCancel}
                      className="text-[11px] text-slate-500 hover:text-slate-800 cursor-pointer"
                    >
                      Return to Sign In
                    </button>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-100 flex justify-center">
            <LogicaLogo variant="compact" size="xs" isDark={false} />
          </div>
        </div>
      </div>
    </div>
  );
};
