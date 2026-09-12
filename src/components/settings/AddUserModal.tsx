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
}[] = [
  {
    role: 'admin',
    label: 'Admin',
    icon: Shield,
    description: 'Full system governance, user provisioning & security audits',
  },
  {
    role: 'pm',
    label: 'PM (Project Manager)',
    icon: HardHat,
    description: 'Project budgets, WBS milestones, contractor coordination & cost approvals',
  },
  {
    role: 'engineer',
    label: 'Engineer',
    icon: Wrench,
    description: 'Engineering specifications, design reviews, field inspections & technical logs',
  },
  {
    role: 'finance',
    label: 'Finance',
    icon: Calculator,
    description: 'Cost accounting, budget tracking, financial ledger audits & forecasting',
  },
];

export const AddUserModal: React.FC<AddUserModalProps> = ({ isOpen, onClose, onUserCreated }) => {
  const { createUser } = useBuild();
  const { currentUser } = useAuth();

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<CorporateRole>('pm');
  const [department, setDepartment] = useState('Project Operations');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('BuildIQ2026!');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Full name is required.');
      return;
    }

    const cleanUsername = (username || name.split(' ')[0] || email.split('@')[0])
      .toLowerCase()
      .replace(/[^a-z0-9._-]/g, '')
      .trim();

    if (!cleanUsername) {
      setError('A valid username is required for login.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setError('Valid corporate email address is required.');
      return;
    }

    if (!['admin', 'pm', 'engineer', 'finance'].includes(role)) {
      setError('Only Admin, PM, Engineer, and Finance roles can be assigned to corporate users.');
      return;
    }

    try {
      const newUser = createUser({
        name: name.trim(),
        username: cleanUsername,
        email: email.trim().toLowerCase(),
        role,
        department,
        phone: phone.trim() || undefined,
        password: password.trim() || 'password123',
        status,
        created_at: new Date().toISOString(),
        created_by: currentUser?.name || 'System Administrator',
      });

      setSuccess(true);
      if (onUserCreated) {
        onUserCreated(newUser);
      }

      setTimeout(() => {
        setSuccess(false);
        onClose();
        // Reset form
        setName('');
        setUsername('');
        setEmail('');
        setRole('pm');
        setDepartment('Project Operations');
        setPhone('');
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Failed to create user account');
    }
  };

  const getRoleBadge = (r: UserRole) => {
    switch (r) {
      case 'admin':
        return { label: 'Admin', icon: Shield, color: 'border-purple-200 bg-purple-50 text-purple-800' };
      case 'pm':
      case 'project_manager':
        return { label: 'PM', icon: HardHat, color: 'border-cyan-200 bg-cyan-50 text-cyan-800' };
      case 'engineer':
      case 'engineers':
        return { label: 'Engineer', icon: Wrench, color: 'border-indigo-200 bg-indigo-50 text-indigo-800' };
      case 'finance':
        return { label: 'Finance', icon: Calculator, color: 'border-emerald-200 bg-emerald-50 text-emerald-800' };
      default:
        return { label: 'Team Member', icon: Shield, color: 'border-slate-200 bg-slate-50 text-slate-800' };
    }
  };

  return (
    <div
      id="modal-add-user"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden my-8 animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-linear-to-r from-cyan-600 via-teal-600 to-lime-600 p-5 text-white flex items-center justify-between border-b border-cyan-700/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center text-white">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white ">
                Provision New User Account
              </h3>
              <p className="text-xs text-white/90">
                Authorized role assignment &amp; staff credential provisioning
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-emerald-700 font-semibold">
              <Check className="w-4 h-4 shrink-0" />
              <span>User account successfully created and active!</span>
            </div>
          )}

          {/* Full Name, Username & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Full Name *
              </label>
              <div className="relative">
                <UserIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Jordan Tremblay"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-cyan-500 bg-white text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Username (for Login) *
              </label>
              <div className="relative">
                <AtSign className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. jtremblay"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ''))}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-cyan-500 bg-white text-xs font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Corporate Email *
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="j.tremblay@buildiq.ca"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-cyan-500 bg-white text-xs"
                />
              </div>
            </div>
          </div>

          {/* Role Selection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Corporate Role &amp; Security Level *
              </label>
              <span className="text-[10px] font-mono text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200 font-semibold">
                Admin, PM, Engineer, Finance Only
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {CORPORATE_ROLES.map((item) => {
                const Icon = item.icon;
                const isSelected = role === item.role;
                return (
                  <button
                    key={item.role}
                    type="button"
                    onClick={() => setRole(item.role)}
                    className={`p-2.5 rounded-lg border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-cyan-500 bg-cyan-500/10 text-slate-900 ring-2 ring-cyan-500/40 shadow-xs'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-600'
                    }`}
                  >
                    <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${isSelected ? 'text-cyan-600 font-bold' : 'text-slate-400'}`} />
                    <div>
                      <div className="font-bold text-xs flex items-center gap-1.5">
                        <span>{item.label}</span>
                        {isSelected && <Check className="w-3 h-3 text-cyan-600" />}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                        {item.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Department & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Department / Team
              </label>
              <div className="relative">
                <Briefcase className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="e.g. Estimating &amp; Controls"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-500 bg-white text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Contact Phone
              </label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="+1 (416) 555-0188"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-500 bg-white text-xs"
                />
              </div>
            </div>
          </div>

          {/* Status & Default Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Account Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs"
              >
                <option value="active">Active (Immediate Access)</option>
                <option value="inactive">Pending / Inactive</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Temporary Password
              </label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs bg-slate-50"
              />
            </div>
          </div>

          {/* Creator Governance Notice */}
          <div className="p-3 bg-slate-100 rounded-lg text-[11px] text-slate-600">
            <strong>Governance Audit Notice:</strong> Account creation will be permanently timestamped and logged under Administrator{' '}
            <span className="font-semibold text-slate-900">{currentUser?.name || 'System Administrator'}</span>.
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-linear-to-r from-cyan-600 to-lime-600 hover:from-cyan-700 hover:to-lime-700 text-white font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer "
            >
              <UserPlus className="w-4 h-4 text-white" />
              <span>Create User Account</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
