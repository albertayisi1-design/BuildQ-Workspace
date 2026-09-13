import React, { useState } from 'react';
import { useBuild } from '../../context/BuildContext';
import { CorporateRole, User } from '../../types';
import { db } from '../../services/db';
import {
  UserPlus,
  Shield,
  HardHat,
  Wrench,
  Calculator,
  X,
  CheckCircle2,
  AlertCircle,
  Mail,
  User as UserIcon,
  Phone,
  Copy,
  Check,
  ExternalLink,
  ArrowRight,
} from 'lucide-react';

interface RequestAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (user: User) => void;
}

const ROLES: { role: CorporateRole; label: string; icon: React.ComponentType<{ className?: string }>; description: string }[] = [
  {
    role: 'pm',
    label: 'Project Manager (PM)',
    icon: HardHat,
    description: 'Field execution, project ledgers, milestone tracking, and daily reports',
  },
  {
    role: 'engineer',
    label: 'Site Engineer',
    icon: Wrench,
    description: 'Field inspection diaries, site QA/QC, structural reviews, and technical logs',
  },
  {
    role: 'finance',
    label: 'Fiscal / Finance Officer',
    icon: Calculator,
    description: 'Cost accounting, budget variances, progress invoicing, and contractor draw audits',
  },
  {
    role: 'admin',
    label: 'Corporate Administrator',
    icon: Shield,
    description: 'System administration, user access provisioning, and security governance',
  },
];

export const RequestAccessModal: React.FC<RequestAccessModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { createUser, sendUserVerificationEmail } = useBuild();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<CorporateRole>('pm');
  const [department, setDepartment] = useState('Project Operations');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdUser, setCreatedUser] = useState<User | null>(null);
  const [verificationUrl, setVerificationUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleNameChange = (val: string) => {
    setName(val);
    if (!username) {
      const generated = val
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .slice(0, 20);
      setUsername(generated);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please provide your full legal name.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setError('Please provide a valid corporate email address.');
      return;
    }

    const cleanUsername = (username || name.split(' ')[0] || email.split('@')[0])
      .toLowerCase()
      .replace(/[^a-z0-9._-]/g, '')
      .trim();

    setIsLoading(true);

    try {
      // Check if user already exists
      const existing = db.getUserByEmail(email.trim());
      let userRecord: User;

      if (existing) {
        userRecord = existing;
      } else {
        userRecord = createUser({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          username: cleanUsername,
          role,
          department,
          phone: phone.trim() || undefined,
          status: 'pending_verification',
          email_verified: false,
          created_at: new Date().toISOString(),
          created_by: 'Self-Service Request',
        });
      }

      // Dispatch verification & password setup email link
      const emailResult = await sendUserVerificationEmail(userRecord);

      setCreatedUser(userRecord);
      setVerificationUrl(emailResult.verificationUrl);

      if (onSuccess) {
        onSuccess(userRecord);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to submit user request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (verificationUrl) {
      navigator.clipboard.writeText(verificationUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <div
      id="modal-request-access"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-900 p-4 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400 shrink-0">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Request Corporate Workspace Access
              </h3>
              <p className="text-[11px] text-slate-400">
                Self-service account provisioning with email verification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 text-xs">
          {createdUser ? (
            /* Success confirmation with verification link copy & open */
            <div className="space-y-4">
              <div className="text-center py-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2.5">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-slate-900">
                  Verification Email Dispatched!
                </h4>
                <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
                  We have sent an official verification and password-setting link to{' '}
                  <strong className="text-slate-900 font-mono">{createdUser.email}</strong>.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Applicant:</span>
                  <span className="font-bold text-slate-800">{createdUser.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Requested Role:</span>
                  <span className="font-mono font-bold text-slate-800 uppercase">{createdUser.role}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Verification Status:</span>
                  <span className="text-amber-700 font-medium bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                    Email Link Dispatched
                  </span>
                </div>
              </div>

              {/* Direct Link Preview Box */}
              <div className="bg-sky-50/70 border border-sky-200 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-sky-900">
                    Verification &amp; Password Setup Link:
                  </span>
                  <span className="text-[10px] text-sky-700">Token valid 48h</span>
                </div>
                <div className="p-2 bg-white rounded border border-sky-200 font-mono text-[10px] text-slate-700 break-all select-all">
                  {verificationUrl}
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex-1 py-1.5 px-3 bg-white hover:bg-slate-50 text-slate-800 font-semibold rounded border border-slate-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs text-[11px]"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700 font-bold">Link Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        <span>Copy Setup Link</span>
                      </>
                    )}
                  </button>

                  <a
                    href={verificationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs text-[11px]"
                  >
                    <span>Open Link Now</span>
                    <ExternalLink className="w-3 h-3 text-slate-300" />
                  </a>
                </div>
              </div>

              <p className="text-[10px] text-slate-500 text-center leading-relaxed">
                Click the link in your inbox or use the button above to configure your password and sign in immediately.
              </p>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-lg text-xs transition-colors cursor-pointer border border-slate-300"
                >
                  Done &amp; Return to Sign In
                </button>
              </div>
            </div>
          ) : (
            /* Request Form */
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-700 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="input-req-name"
                    className="block text-[11px] font-semibold text-slate-700 mb-1"
                  >
                    Full Legal Name *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                      <UserIcon className="w-3.5 h-3.5" />
                    </div>
                    <input
                      id="input-req-name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="e.g. Jordan Mitchell"
                      className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="input-req-email"
                    className="block text-[11px] font-semibold text-slate-700 mb-1"
                  >
                    Corporate Email *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-3.5 h-3.5" />
                    </div>
                    <input
                      id="input-req-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="jordan.mitchell@buildiq.ca"
                      className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-slate-800"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="input-req-username"
                    className="block text-[11px] font-semibold text-slate-700 mb-1"
                  >
                    Desired Username
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                      <span className="text-xs font-mono">@</span>
                    </div>
                    <input
                      id="input-req-username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="jordan_m"
                      className="w-full pl-7 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-slate-800 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="input-req-department"
                    className="block text-[11px] font-semibold text-slate-700 mb-1"
                  >
                    Department
                  </label>
                  <input
                    id="input-req-department"
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="Project Operations"
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-slate-800"
                  />
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1.5">
                  Requested Functional Role *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ROLES.map((r) => {
                    const Icon = r.icon;
                    const isSelected = role === r.role;
                    return (
                      <div
                        key={r.role}
                        onClick={() => setRole(r.role)}
                        className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-sky-50/70 border-sky-600 ring-1 ring-sky-600/30'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${
                              isSelected ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <span className="font-bold text-slate-900 text-xs">{r.label}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1 leading-tight line-clamp-2">
                          {r.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Justification Notes */}
              <div>
                <label
                  htmlFor="input-req-notes"
                  className="block text-[11px] font-semibold text-slate-700 mb-1"
                >
                  Access Justification &amp; Project References (Optional)
                </label>
                <textarea
                  id="input-req-notes"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Assigned to Riverside Condos superstructure package as Site Engineer."
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-slate-800 resize-none"
                />
              </div>

              {/* Informational callout regarding automated email dispatch */}
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 flex items-start gap-2 text-[11px]">
                <Mail className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                <p>
                  Upon submission, an official email link will be dispatched to your email address for instant verification and password configuration.
                </p>
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  id="btn-submit-request-access"
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-bold text-xs rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  {isLoading ? (
                    <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Send Verification Link</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
