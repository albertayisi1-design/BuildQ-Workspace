import React, { useState } from 'react';
import { User, CorporateRole, UserRole } from '../../types';
import { useBuild } from '../../context/BuildContext';
import { useAuth } from '../../context/AuthContext';
import {
  UserPlus,
  Shield,
  HardHat,
  Calculator,
  X,
  Check,
  AlertCircle,
  Mail,
  User as UserIcon,
  Phone,
  Briefcase,
  Wrench,
  AtSign,
  Lock,
  Copy,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated?: (user: User) => void;
}

const CORPORATE_ROLES: {
  role: CorporateRole;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  tier: string;
}[] = [
  {
    role: 'admin',
    label: 'Administrator',
    icon: Shield,
    description: 'Executive governance, security audits, credential provisioning, and system parameter controls',
    tier: 'Governance',
  },
  {
    role: 'pm',
    label: 'Project Manager (PM)',
    icon: HardHat,
    description: 'Project budgets, WBS baselines, trade contractor coordination, and progress cost approvals',
    tier: 'Operations',
  },
  {
    role: 'engineer',
    label: 'Site Engineer',
    icon: Wrench,
    description: 'Engineering specifications, structural reviews, field inspection diaries, and technical QA/QC',
    tier: 'Technical',
  },
  {
    role: 'finance',
    label: 'Fiscal / Finance Officer',
    icon: Calculator,
    description: 'General ledger reconciliation, cost audit variances, progress invoicing, and holdback approvals',
    tier: 'Fiscal',
  },
];

export const AddUserModal: React.FC<AddUserModalProps> = ({ isOpen, onClose, onUserCreated }) => {
  const { createUser, sendUserVerificationEmail } = useBuild();
  const { currentUser } = useAuth();

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<CorporateRole>('pm');
  const [department, setDepartment] = useState('Project Operations');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('BuildIQ2026!');
  const [sendVerificationLink, setSendVerificationLink] = useState(true);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [dispatchedDetails, setDispatchedDetails] = useState<{
    user: User;
    verificationUrl: string;
    token: string;
  } | null>(null);
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
    setError('');

    if (!name.trim()) {
      setError('Full legal name is required.');
      return;
    }

    const cleanUsername = (username || name.split(' ')[0] || email.split('@')[0])
      .toLowerCase()
      .replace(/[^a-z0-9._-]/g, '')
      .trim();

    if (!cleanUsername) {
      setError('A valid username is required for corporate authentication.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setError('Valid corporate email address is required.');
      return;
    }

    if (!['admin', 'pm', 'engineer', 'finance'].includes(role)) {
      setError('Only certified Admin, PM, Engineer, and Finance roles may be provisioned.');
      return;
    }

    setIsLoading(true);

    try {
      const newUser = createUser({
        name: name.trim(),
        username: cleanUsername,
        email: email.trim().toLowerCase(),
        role,
        department,
        phone: phone.trim() || undefined,
        password: password.trim() || 'BuildIQ2026!',
        status: sendVerificationLink ? 'pending_verification' : 'active',
        email_verified: !sendVerificationLink,
        created_at: new Date().toISOString(),
        created_by: currentUser?.name || 'System Administrator',
      });

      if (onUserCreated) {
        onUserCreated(newUser);
      }

      if (sendVerificationLink) {
        const dispatchResult = await sendUserVerificationEmail(newUser);
        setDispatchedDetails({
          user: newUser,
          verificationUrl: dispatchResult.verificationUrl,
          token: dispatchResult.token,
        });
      } else {
        onClose();
        setName('');
        setUsername('');
        setEmail('');
        setRole('pm');
        setDepartment('Project Operations');
        setPhone('');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create user account');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (dispatchedDetails?.verificationUrl) {
      navigator.clipboard.writeText(dispatchedDetails.verificationUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleFinish = () => {
    setDispatchedDetails(null);
    onClose();
    setName('');
    setUsername('');
    setEmail('');
    setRole('pm');
    setDepartment('Project Operations');
    setPhone('');
  };

  return (
    <div
      id="modal-add-user"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/70 backdrop-blur-xs overflow-y-auto"
      onClick={handleFinish}
    >
      <div
        className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-[360px] overflow-hidden my-4 animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Formal Executive Header */}
        <div className="bg-slate-900 px-3.5 py-2.5 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-200">
              <UserPlus className="w-3.5 h-3.5 text-slate-200" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-white tracking-tight">
                Provision Corporate User
              </h3>
              <p className="text-[10px] text-slate-400">
                Role authorization &amp; credential setup
              </p>
            </div>
          </div>
          <button
            onClick={handleFinish}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Modal Body */}
        {dispatchedDetails ? (
          <div className="p-5 space-y-4 text-xs">
            <div className="text-center py-2">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900">
                Account Provisioned &amp; Email Dispatched!
              </h4>
              <p className="text-xs text-slate-600 mt-0.5 max-w-sm mx-auto">
                An official email link for verification and password configuration has been sent to{' '}
                <strong className="text-slate-900 font-mono">{dispatchedDetails.user.email}</strong>.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Provisioned User:</span>
                <span className="font-bold text-slate-900">{dispatchedDetails.user.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Username:</span>
                <span className="font-mono text-slate-800">@{dispatchedDetails.user.username}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Authorized Role:</span>
                <span className="uppercase font-mono font-bold text-[10px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-800">
                  {dispatchedDetails.user.role}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Verification Status:</span>
                <span className="text-amber-700 font-semibold bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                  Pending User Setup
                </span>
              </div>
            </div>

            {/* Link Box for instant verification / testing */}
            <div className="bg-sky-50 border border-sky-200 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-sky-900">
                  Activation Link (Tokenized):
                </span>
                <span className="text-[10px] text-sky-700">Valid for 48 hours</span>
              </div>
              <div className="p-2 bg-white rounded border border-sky-200 font-mono text-[10px] text-slate-700 break-all select-all">
                {dispatchedDetails.verificationUrl}
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCopyLink}
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
                  href={dispatchedDetails.verificationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs text-[11px]"
                >
                  <span>Open Setup Page</span>
                  <ExternalLink className="w-3 h-3 text-slate-300" />
                </a>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleFinish}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer shadow-sm"
              >
                Done &amp; Return to Directory
              </button>
            </div>
          </div>
        ) : (
          /* Form Body */
          <form onSubmit={handleSubmit} className="p-3 space-y-2 text-[11px]">
            {error && (
              <div className="p-1.5 bg-rose-50 border border-rose-200 rounded-md flex items-center gap-1.5 text-rose-700 text-[10px]">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Name & Corporate Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-semibold text-slate-700 uppercase tracking-wider mb-0.5">
                  Full Legal Name *
                </label>
                <div className="relative">
                  <UserIcon className="w-3 h-3 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. David Vance"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="w-full pl-6 pr-2 py-1 border border-slate-300 rounded-md focus:ring-1 focus:ring-slate-900 focus:border-slate-900 bg-white text-[11px] text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-700 uppercase tracking-wider mb-0.5">
                  Corporate Email *
                </label>
                <div className="relative">
                  <Mail className="w-3 h-3 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="david.vance@buildiq.ca"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-6 pr-2 py-1 border border-slate-300 rounded-md focus:ring-1 focus:ring-slate-900 focus:border-slate-900 bg-white text-[11px] text-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* Username & Department */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-semibold text-slate-700 uppercase tracking-wider mb-0.5">
                  System Username *
                </label>
                <div className="relative">
                  <AtSign className="w-3 h-3 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="david_v"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-6 pr-2 py-1 border border-slate-300 rounded-md focus:ring-1 focus:ring-slate-900 focus:border-slate-900 bg-white font-mono text-[11px] text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-700 uppercase tracking-wider mb-0.5">
                  Department / Unit
                </label>
                <div className="relative">
                  <Briefcase className="w-3 h-3 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Project Operations"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full pl-6 pr-2 py-1 border border-slate-300 rounded-md focus:ring-1 focus:ring-slate-900 focus:border-slate-900 bg-white text-[11px] text-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* Certified Role Selection */}
            <div>
              <label className="block text-[10px] font-semibold text-slate-700 uppercase tracking-wider mb-0.5">
                Authorized Governance Role *
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {CORPORATE_ROLES.map((r) => {
                  const Icon = r.icon;
                  const isSelected = role === r.role;
                  return (
                    <div
                      key={r.role}
                      onClick={() => setRole(r.role)}
                      className={`p-1.5 rounded-md border text-left cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Icon
                            className={`w-3 h-3 ${isSelected ? 'text-sky-400' : 'text-slate-500'}`}
                          />
                          <span className="font-bold text-[11px]">{r.label}</span>
                        </div>
                        <span
                          className={`text-[8px] font-mono px-1 py-0.2 rounded font-bold uppercase ${
                            isSelected
                              ? 'bg-slate-800 text-slate-300'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {r.tier}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Contact Phone */}
            <div>
              <label className="block text-[10px] font-semibold text-slate-700 uppercase tracking-wider mb-0.5">
                Contact Phone
              </label>
              <div className="relative">
                <Phone className="w-3 h-3 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="+1 (416) 555-0188"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-6 pr-2 py-1 border border-slate-300 rounded-md focus:ring-1 focus:ring-slate-900 focus:border-slate-900 bg-white text-[11px]"
                />
              </div>
            </div>

            {/* Email Verification Link Checkbox */}
            <div className="p-2 bg-sky-50/80 border border-sky-200 rounded-md space-y-1">
              <label className="flex items-start gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sendVerificationLink}
                  onChange={(e) => setSendVerificationLink(e.target.checked)}
                  className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                />
                <div>
                  <div className="font-bold text-slate-900 text-[11px] flex items-center gap-1">
                    <Mail className="w-3 h-3 text-sky-700" />
                    <span>Send email link for verification and password setup</span>
                  </div>
                  <p className="text-[10px] text-slate-600 leading-snug">
                    Dispatches an invitation link for corporate email verification and password setting.
                  </p>
                </div>
              </label>
            </div>

            {/* Fallback password if email verification is unticked */}
            {!sendVerificationLink && (
              <div className="p-2 bg-amber-50 border border-amber-200 rounded-md space-y-1">
                <label className="block text-[10px] font-semibold text-amber-900 uppercase tracking-wider">
                  Initial Temporary Password
                </label>
                <div className="relative">
                  <Lock className="w-3 h-3 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-6 pr-2 py-1 border border-amber-300 rounded-md font-mono text-[11px] bg-white text-slate-800"
                  />
                </div>
              </div>
            )}

            {/* Footer Actions */}
            <div className="pt-2 flex items-center justify-end gap-1.5 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="h-7 px-2.5 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer text-[11px]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="h-7 px-3 rounded-md bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-semibold text-[11px] shadow-xs flex items-center gap-1 transition-colors cursor-pointer border border-slate-900 disabled:opacity-60"
              >
                {isLoading ? (
                  <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <UserPlus className="w-3 h-3 text-slate-200" />
                    <span>{sendVerificationLink ? 'Provision & Send Link' : 'Provision User'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
