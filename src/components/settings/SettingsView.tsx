import React, { useState, useMemo } from 'react';
import { useBuild } from '../../context/BuildContext';
import { useAuth } from '../../context/AuthContext';
import { User, UserRole } from '../../types';
import { AddUserModal } from './AddUserModal';
import { AndroidAppModal } from '../common/AndroidAppModal';
import {
  Settings,
  Building2,
  DollarSign,
  AlertTriangle,
  RotateCcw,
  Users,
  Shield,
  Save,
  Check,
  FolderTree,
  UserPlus,
  Search,
  Filter,
  CheckCircle2,
  Smartphone,
  Download,
  QrCode,
  ExternalLink,
  History,
  Lock,
  ArrowRight,
  HardHat,
  ClipboardList,
  Calculator,
  Mail,
  Phone,
  HelpCircle,
  Briefcase,
  Layers,
  Zap,
  Wrench,
  AtSign,
  BadgeCheck,
  FileSpreadsheet,
  Cpu,
  Key,
  Calendar,
  X,
} from 'lucide-react';
import {
  downloadAndroidApk,
  downloadAndroidProjectZip,
  generateQrCodeSvg,
  ANDROID_CONFIG,
} from '../../utils/androidPackageGenerator';

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    resetToSeedData,
    users,
    projects,
    auditLogs,
    updateUser,
    deleteUser,
    sendUserVerificationEmail,
  } = useBuild();
  const { currentUser, switchRole } = useAuth();

  const [activeSubTab, setActiveSubTab] = useState<'users' | 'android' | 'system' | 'audit'>('users');
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isAndroidModalOpen, setIsAndroidModalOpen] = useState(false);
  const [userToRevoke, setUserToRevoke] = useState<User | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [actionToast, setActionToast] = useState<{ message: string; type: 'success' | 'warning' } | null>(null);

  // Form states for System Settings
  const [companyName, setCompanyName] = useState(settings.company_name);
  const [currency, setCurrency] = useState(settings.currency);
  const [currencySymbol, setCurrencySymbol] = useState(settings.currency_symbol);
  const [amberThreshold, setAmberThreshold] = useState(settings.amber_threshold_percent);
  const [redThreshold, setRedThreshold] = useState(settings.red_threshold_percent);
  const [defaultContingency, setDefaultContingency] = useState(settings.default_contingency_percent);
  const [isSaved, setIsSaved] = useState(false);

  // Search & Filter states
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all');

  // Android Download states
  const [downloadingApk, setDownloadingApk] = useState(false);
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [androidDownloadMessage, setAndroidDownloadMessage] = useState<string | null>(null);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      company_name: companyName,
      currency,
      currency_symbol: currencySymbol,
      amber_threshold_percent: Number(amberThreshold),
      red_threshold_percent: Number(redThreshold),
      default_contingency_percent: Number(defaultContingency),
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleResetData = () => {
    setIsResetConfirmOpen(true);
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
        (u.username && u.username.toLowerCase().includes(userSearch.toLowerCase())) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
        (u.department && u.department.toLowerCase().includes(userSearch.toLowerCase()));
      const matchRole =
        userRoleFilter === 'all' ||
        u.role === userRoleFilter ||
        (userRoleFilter === 'pm' && (u.role === 'pm' || u.role === 'project_manager')) ||
        (userRoleFilter === 'project_manager' && (u.role === 'pm' || u.role === 'project_manager')) ||
        (userRoleFilter === 'engineer' && (u.role === 'engineer' || u.role === 'engineers'));
      return matchSearch && matchRole;
    });
  }, [users, userSearch, userRoleFilter]);

  const systemAuditLogs = useMemo(() => {
    return auditLogs.filter((log) => log.entity === 'user' || log.entity === 'auth' || log.entity === 'settings');
  }, [auditLogs]);

  const handleDownloadApkDirect = async () => {
    setDownloadingApk(true);
    try {
      const res = await downloadAndroidApk();
      setAndroidDownloadMessage(`Verified package compiled: ${res.fileName} (${res.size})`);
      setTimeout(() => setAndroidDownloadMessage(null), 5000);
    } finally {
      setDownloadingApk(false);
    }
  };

  const handleDownloadProjectZipDirect = async () => {
    setDownloadingZip(true);
    try {
      const res = await downloadAndroidProjectZip();
      setAndroidDownloadMessage(`Source archive generated: ${res.fileName} (${res.size})`);
      setTimeout(() => setAndroidDownloadMessage(null), 5000);
    } finally {
      setDownloadingZip(false);
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-slate-900 text-white border border-slate-900 shadow-2xs">
            <Shield className="w-3 h-3 text-slate-300" />
            Administrator
          </span>
        );
      case 'pm':
      case 'project_manager':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-cyan-50 text-cyan-900 border border-cyan-200">
            <HardHat className="w-3 h-3 text-cyan-700" />
            Project Manager
          </span>
        );
      case 'engineer':
      case 'engineers':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-900 border border-indigo-200">
            <Wrench className="w-3 h-3 text-indigo-700" />
            Site Engineer
          </span>
        );
      case 'finance':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-900 border border-emerald-200">
            <Calculator className="w-3 h-3 text-emerald-700" />
            Fiscal Officer
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <Shield className="w-3 h-3 text-slate-500" />
            Corporate Staff
          </span>
        );
    }
  };

  return (
    <div id="settings-view" className="space-y-5 pb-16 max-w-7xl mx-auto">
      {/* Action Notification Toast */}
      {actionToast && (
        <div
          id="settings-action-toast"
          className={`px-4 py-2.5 rounded-lg border text-xs font-semibold flex items-center justify-between gap-3 shadow-xs animate-in fade-in slide-in-from-top-2 duration-200 ${
            actionToast.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-amber-50 text-amber-800 border-amber-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionToast.message}</span>
          </div>
          <button
            onClick={() => setActionToast(null)}
            className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Formal Top Administrative Header - Reduced by 45% for high-density executive layout */}
      <div className="bg-white border border-slate-200 rounded-lg p-2.5 sm:px-3.5 sm:py-2.5 shadow-2xs space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <div className="w-5 h-5 rounded-md bg-slate-900 text-white flex items-center justify-center shrink-0">
                <Settings className="w-3 h-3 text-slate-200" />
              </div>
              <h1 className="text-xs sm:text-[13px] font-bold text-slate-900 tracking-tight">
                System Governance &amp; Administration
              </h1>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[8.5px] font-semibold bg-slate-100 text-slate-700 border border-slate-300 uppercase tracking-wider font-mono">
                <Shield className="w-2 h-2 text-slate-600" />
                Executive Console
              </span>
            </div>
            <p className="text-[10.5px] text-slate-500 max-w-2xl leading-tight truncate sm:whitespace-normal">
              Authoritative management for identity provisioning, role-based access control (RBAC), mobile enterprise deployment, and Canadian construction financial compliance standards.
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              id="btn-header-open-android"
              onClick={() => setIsAndroidModalOpen(true)}
              className="h-6 px-2 rounded-md bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white text-[10.5px] font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer border border-slate-900"
              title="Open Mobile Enterprise Distribution Hub"
            >
              <Smartphone className="w-3 h-3 text-slate-300" />
              <span>Mobile Field Hub</span>
            </button>
            <button
              id="btn-header-reset-seed"
              onClick={handleResetData}
              className="h-6 px-2 rounded-md bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 text-[10.5px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              title="Revert environment data to factory demonstration baseline"
            >
              <RotateCcw className="w-2.5 h-2.5 text-rose-600" />
              <span className="hidden sm:inline">Reset Demo Data</span>
            </button>
          </div>
        </div>

        {/* Modernized Formal Sub-Navigation Bar - Compact 45% footprint */}
        <div className="border-t border-slate-200/80 pt-1.5 flex items-center gap-1 overflow-x-auto text-[11px] font-medium no-scrollbar">
          <button
            id="tab-btn-users"
            onClick={() => setActiveSubTab('users')}
            className={`h-6 px-2 rounded-md flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap text-[11px] ${
              activeSubTab === 'users'
                ? 'bg-slate-900 text-white font-semibold shadow-2xs'
                : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
            }`}
          >
            <Users className={`w-3 h-3 ${activeSubTab === 'users' ? 'text-cyan-400' : 'text-slate-400'}`} />
            <span>Identity &amp; Access (RBAC)</span>
            <span
              className={`px-1 py-0 rounded text-[9px] font-mono font-bold ${
                activeSubTab === 'users'
                  ? 'bg-slate-800 text-cyan-300'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {users.length}
            </span>
          </button>

          <button
            id="tab-btn-android"
            onClick={() => setActiveSubTab('android')}
            className={`h-6 px-2 rounded-md flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap text-[11px] ${
              activeSubTab === 'android'
                ? 'bg-slate-900 text-white font-semibold shadow-2xs'
                : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
            }`}
          >
            <Smartphone className={`w-3 h-3 ${activeSubTab === 'android' ? 'text-emerald-400' : 'text-slate-400'}`} />
            <span>Mobile Operations &amp; MDM</span>
            <span
              className={`px-1 py-0 rounded text-[9px] font-mono font-bold ${
                activeSubTab === 'android'
                  ? 'bg-slate-800 text-emerald-300'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              }`}
            >
              v1.0.4
            </span>
          </button>

          <button
            id="tab-btn-system"
            onClick={() => setActiveSubTab('system')}
            className={`h-6 px-2 rounded-md flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap text-[11px] ${
              activeSubTab === 'system'
                ? 'bg-slate-900 text-white font-semibold shadow-2xs'
                : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
            }`}
          >
            <Building2 className={`w-3 h-3 ${activeSubTab === 'system' ? 'text-amber-400' : 'text-slate-400'}`} />
            <span>Entity &amp; Fiscal Standards</span>
          </button>

          <button
            id="tab-btn-audit"
            onClick={() => setActiveSubTab('audit')}
            className={`h-6 px-2 rounded-md flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap text-[11px] ${
              activeSubTab === 'audit'
                ? 'bg-slate-900 text-white font-semibold shadow-2xs'
                : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
            }`}
          >
            <History className={`w-3 h-3 ${activeSubTab === 'audit' ? 'text-indigo-400' : 'text-slate-400'}`} />
            <span>Governance Audit Trail</span>
            <span
              className={`px-1 py-0 rounded text-[9px] font-mono font-bold ${
                activeSubTab === 'audit'
                  ? 'bg-slate-800 text-indigo-300'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {systemAuditLogs.length}
            </span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUBTAB 1: USER ACCOUNTS & RBAC PROVISIONING                                */}
      {/* ========================================================================= */}
      {activeSubTab === 'users' && (
        <div className="space-y-5">
          {/* Formal Governance & Authority Framework Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-slate-500 font-mono text-[11px] font-semibold uppercase tracking-wider">
                  <Shield className="w-3.5 h-3.5 text-slate-700" />
                  Corporate Delegation &amp; Security Policy
                </div>
                <h2 className="text-base font-bold text-slate-900">
                  Identity Provisioning &amp; Role-Based Authorization
                </h2>
                <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
                  In accordance with enterprise governance, the <strong>System Administrator</strong> maintains exclusive authority to provision user credentials, assign corporate RBAC tiers, and decommission departed personnel.
                </p>
              </div>

              <button
                id="btn-open-create-user-modal"
                onClick={() => setIsAddUserOpen(true)}
                className="h-9 px-4 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-semibold text-xs rounded-lg shadow-xs flex items-center gap-2 transition-colors cursor-pointer shrink-0 border border-slate-900"
              >
                <UserPlus className="w-4 h-4 text-slate-200" />
                <span>+ Provision User Account</span>
              </button>
            </div>

            {/* Formal RACI Matrix by Role */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/90 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-slate-900" />
                      Administrator
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-slate-200 text-slate-800 uppercase font-mono">
                      Governance
                    </span>
                  </div>
                  <ul className="text-[11px] text-slate-600 mt-2.5 space-y-1.5">
                    <li className="flex items-start gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                      <span>Staff account issuance &amp; credential control</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                      <span>Security audit log compliance reviews</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                      <span>System parameters &amp; database resets</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/90 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <HardHat className="w-3.5 h-3.5 text-cyan-700" />
                      Project Manager
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-cyan-100 text-cyan-900 uppercase font-mono">
                      Operations
                    </span>
                  </div>
                  <ul className="text-[11px] text-slate-600 mt-2.5 space-y-1.5">
                    <li className="flex items-start gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                      <span>Approved budget &amp; contingency allocations</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                      <span>WBS milestones &amp; trade contract sign-off</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                      <span>Field diaries &amp; contractor progress billing</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/90 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Wrench className="w-3.5 h-3.5 text-indigo-700" />
                      Site Engineers
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-indigo-100 text-indigo-900 uppercase font-mono">
                      Technical
                    </span>
                  </div>
                  <ul className="text-[11px] text-slate-600 mt-2.5 space-y-1.5">
                    <li className="flex items-start gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                      <span>Engineering drawings &amp; structural reviews</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                      <span>Quality verification &amp; field testing reports</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                      <span>Safety notices &amp; technical deficiency logs</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/90 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Calculator className="w-3.5 h-3.5 text-emerald-700" />
                      Finance &amp; Audit
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-100 text-emerald-900 uppercase font-mono">
                      Fiscal
                    </span>
                  </div>
                  <ul className="text-[11px] text-slate-600 mt-2.5 space-y-1.5">
                    <li className="flex items-start gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                      <span>General ledger cost reconciliation</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                      <span>Budget variance &amp; committed cost audits</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                      <span>Statutory holdback &amp; invoice payment approvals</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive User Accounts Directory */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-700" />
                  <span>Authorized Personnel Directory</span>
                  <span className="text-xs font-normal text-slate-500 font-mono">
                    ({filteredUsers.length} active records)
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Corporate directory verified under BuildIQ identity governance policies.
                </p>
              </div>

              {/* Search & Role Filter */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search name, handle, email..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 focus:ring-1 focus:ring-slate-900 focus:border-slate-900 w-52 transition-colors placeholder-slate-400 font-mono"
                  />
                  {userSearch && (
                    <button
                      onClick={() => setUserSearch('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-800 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors font-medium cursor-pointer"
                >
                  <option value="all">All Corporate Roles</option>
                  <option value="admin">Administrator</option>
                  <option value="pm">Project Manager</option>
                  <option value="engineer">Site Engineer</option>
                  <option value="finance">Finance Officer</option>
                </select>

                <button
                  onClick={() => setIsAddUserOpen(true)}
                  className="h-7.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                >
                  <UserPlus className="w-3.5 h-3.5 text-slate-300" />
                  <span>New User</span>
                </button>
              </div>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">User &amp; Corporate Identity</th>
                    <th className="py-3 px-4">Role Assignment</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Security Status</th>
                    <th className="py-3 px-4">Authorized By</th>
                    <th className="py-3 px-4 text-right">Access Controls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                        No user records found matching "{userSearch}".
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const isCurrent = currentUser?.id === u.id || currentUser?.email === u.email;
                      const displayUsername = u.username || u.email.split('@')[0];
                      return (
                        <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs font-mono">
                                {u.name.charAt(0)}
                              </div>
                              <div>
                                <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                                  <span>{u.name}</span>
                                  <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200 flex items-center gap-0.5">
                                    <AtSign className="w-2.5 h-2.5 text-slate-400" />
                                    {displayUsername}
                                  </span>
                                  {isCurrent && (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase font-mono">
                                      Active Session
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-500 font-mono mt-0.5">{u.email}</div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            {currentUser?.role === 'admin' && !isCurrent ? (
                              <div className="flex items-center gap-1.5">
                                <select
                                  value={u.role === 'project_manager' ? 'pm' : (u.role === 'engineers' ? 'engineer' : u.role)}
                                  onChange={(e) => {
                                    updateUser(u.id, { role: e.target.value as UserRole });
                                  }}
                                  className="px-2 py-1 border border-slate-300 rounded-md text-xs font-semibold bg-white text-slate-800 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors cursor-pointer shadow-2xs hover:border-slate-400"
                                  title="Reassign corporate RBAC tier"
                                >
                                  <option value="admin">Admin</option>
                                  <option value="pm">PM</option>
                                  <option value="engineer">Engineer</option>
                                  <option value="finance">Finance</option>
                                </select>
                              </div>
                            ) : (
                              getRoleBadge(u.role)
                            )}
                          </td>

                          <td className="py-3 px-4 text-slate-700 font-medium">
                            {u.department || 'Project Controls'}
                          </td>

                          <td className="py-3 px-4">
                            <div className="flex flex-col gap-1">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase w-fit ${
                                  u.status === 'active'
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    u.status === 'active' ? 'bg-emerald-600' : 'bg-slate-400'
                                  }`}
                                />
                                {u.status}
                              </span>
                              {u.email_verified ? (
                                <span className="text-[10px] text-emerald-700 font-medium flex items-center gap-0.5">
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span>Email Verified</span>
                                </span>
                              ) : (
                                <span className="text-[10px] text-amber-700 font-medium flex items-center gap-0.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                  <span>Setup Pending</span>
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-3 px-4 text-slate-500 text-[11px] font-mono">
                            {u.created_by || 'System Administrator'}
                          </td>

                          <td className="py-3 px-4 text-right space-x-1.5">
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  const res = await sendUserVerificationEmail(u);
                                  setActionToast({
                                    message: `Verification & password setup email link dispatched to ${u.name} (${u.email})!`,
                                    type: 'success',
                                  });
                                  setTimeout(() => setActionToast(null), 6000);
                                } catch (err: any) {
                                  setActionToast({
                                    message: `Failed to dispatch setup link: ${err?.message || 'Error'}`,
                                    type: 'warning',
                                  });
                                  setTimeout(() => setActionToast(null), 6000);
                                }
                              }}
                              className="px-2 py-1 rounded-md bg-sky-50 hover:bg-sky-100 text-sky-800 text-[11px] font-semibold transition-colors cursor-pointer border border-sky-200 inline-flex items-center gap-1"
                              title={`Send verification & password setting email link to ${u.email}`}
                            >
                              <Mail className="w-3 h-3 text-sky-700" />
                              <span>Send Setup Link</span>
                            </button>

                            {!isCurrent ? (
                              <button
                                type="button"
                                onClick={() => switchRole(u.role)}
                                className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-semibold transition-colors cursor-pointer border border-slate-200"
                                title="Assume this role perspective for audit and operational review"
                              >
                                Simulate Role
                              </button>
                            ) : (
                              <span className="text-[11px] text-emerald-700 font-semibold px-2 py-0.5">Logged In</span>
                            )}

                            {u.id === 'usr_admin' ? (
                              <span
                                className="px-2 py-1 text-slate-400 text-[10px] font-mono italic select-none"
                                title="Root system administrator cannot be decommissioned"
                              >
                                Protected
                              </span>
                            ) : (
                              <button
                                id={`btn-revoke-user-${u.id}`}
                                onClick={() => setUserToRevoke(u)}
                                className="px-2 py-1 rounded-md text-rose-700 hover:bg-rose-50 hover:text-rose-800 text-[11px] font-semibold transition-colors cursor-pointer border border-transparent hover:border-rose-200"
                                title={`Revoke credentials for ${u.name}`}
                              >
                                Revoke
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 2: ANDROID APP & APK DOWNLOAD CENTER                               */}
      {/* ========================================================================= */}
      {activeSubTab === 'android' && (
        <div className="space-y-5">
          {/* Download Notification Alert */}
          {androidDownloadMessage && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-3 text-emerald-900 text-xs font-semibold animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{androidDownloadMessage}</span>
            </div>
          )}

          {/* Formal Executive Enterprise Android Banner */}
          <div className="bg-slate-900 text-white rounded-xl border border-slate-800 p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400 shrink-0 shadow-inner">
                <Smartphone className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-base sm:text-lg font-bold tracking-tight text-white">
                    BuildIQ Mobile Field Operations Suite
                  </h2>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono font-semibold border border-slate-700">
                    Android Enterprise v{ANDROID_CONFIG.versionName}
                  </span>
                </div>
                <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                  Field engineering deployment package designed for jobsite supervisors, resident engineers, and site accountants. Features offline receipt capture, GPS daily logs, and real-time WBS cost synchronizations.
                </p>
                <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono pt-1">
                  <span>Target SDK: 34 (Android 14/15)</span>
                  <span>•</span>
                  <span>Package: {ANDROID_CONFIG.packageName}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                id="btn-trigger-apk-download"
                onClick={handleDownloadApkDirect}
                disabled={downloadingApk}
                className="h-9 px-4 bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-950 font-semibold text-xs rounded-lg shadow-sm flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4 h-4 text-slate-800" />
                <span>{downloadingApk ? 'Compiling APK...' : 'Download Release APK'}</span>
              </button>
            </div>
          </div>

          {/* 3 Enterprise Distribution Channels Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card 1: Managed WebAPK */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between space-y-4 shadow-xs">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold uppercase font-mono border border-slate-200">
                    Direct PWA
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">Zero-Install</span>
                </div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Zap className="w-4 h-4 text-slate-700" />
                  <span>Managed WebAPK Launcher</span>
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Deploys instantly to Android home screen and application launcher with native fullscreen execution, background service workers, and automatic hotfix sync.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <button
                  onClick={() => setIsAndroidModalOpen(true)}
                  className="w-full h-8.5 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-semibold rounded-lg text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Smartphone className="w-3.5 h-3.5 text-slate-300" />
                  <span>Install / Add to Home Screen</span>
                </button>
              </div>
            </div>

            {/* Card 2: Enterprise Sideload APK */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between space-y-4 shadow-xs">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold uppercase font-mono border border-slate-200">
                    Standalone
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">BuildIQ.apk</span>
                </div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Download className="w-4 h-4 text-slate-700" />
                  <span>Sideload Enterprise APK</span>
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Compiled Android Package (<code className="text-slate-700 font-mono">.apk</code>) ready for distribution across corporate Mobile Device Management (MDM) platforms or USB field loading.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <button
                  onClick={handleDownloadApkDirect}
                  disabled={downloadingApk}
                  className="w-full h-8.5 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-semibold rounded-lg text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5 text-slate-300" />
                  <span>{downloadingApk ? 'Generating Package...' : 'Download BuildIQ.apk'}</span>
                </button>
              </div>
            </div>

            {/* Card 3: Android Studio Developer Project */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between space-y-4 shadow-xs">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold uppercase font-mono border border-slate-200">
                    Full Source
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">Gradle .ZIP</span>
                </div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <FolderTree className="w-4 h-4 text-slate-700" />
                  <span>Android Studio Project Bundle</span>
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Complete Gradle repository with Kotlin <code className="text-slate-700 font-mono">MainActivity.kt</code>, Android Manifest, and Digital Asset Links for Google Play Store or private tenant signing.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <button
                  onClick={handleDownloadProjectZipDirect}
                  disabled={downloadingZip}
                  className="w-full h-8.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-semibold rounded-lg text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5 text-slate-600" />
                  <span>{downloadingZip ? 'Packaging Source...' : 'Download Gradle Bundle'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* QR Enrollment Station & Compliance Protocol */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Formal QR Enrollment Station */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col items-center justify-center text-center space-y-3 shadow-xs">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-slate-700" />
                <span>Field Device Enrollment Station</span>
              </h4>
              <div
                className="w-36 h-36 flex items-center justify-center p-2 bg-white border border-slate-200 rounded-lg shadow-2xs"
                dangerouslySetInnerHTML={{
                  __html: generateQrCodeSvg(typeof window !== 'undefined' ? window.location.origin : ANDROID_CONFIG.appUrl, 130),
                }}
              />
              <p className="text-[11px] text-slate-500 max-w-xs leading-relaxed">
                Scan with any company Android tablet or phone camera to launch authenticated field workspace immediately.
              </p>
            </div>

            {/* Sideloading Compliance Protocol */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 lg:col-span-2 space-y-3 shadow-xs">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
                <HelpCircle className="w-4 h-4 text-slate-700" />
                <span>Enterprise Android Deployment Protocol</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded bg-slate-900 text-white font-mono text-[10px] flex items-center justify-center">1</span>
                    <span>Download Package</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Retrieve <code className="font-mono text-slate-800">BuildIQ.apk</code> from this console directly to local device storage.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded bg-slate-900 text-white font-mono text-[10px] flex items-center justify-center">2</span>
                    <span>Security Authorization</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    When prompted by Android Package Installer, enable <em>Install Unknown Apps</em> for your corporate browser or file manager.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded bg-slate-900 text-white font-mono text-[10px] flex items-center justify-center">3</span>
                    <span>Launch &amp; Authenticate</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Tap Install. Once verified, launch BuildIQ from your Android App Drawer and log in using assigned corporate credentials.
                  </p>
                </div>
              </div>

              <div className="mt-3 p-3 bg-slate-50 rounded-lg text-[11px] text-slate-600 flex items-center justify-between border border-slate-200 font-mono">
                <span>Application ID: <strong className="text-slate-900">{ANDROID_CONFIG.packageName}</strong></span>
                <span>Minimum OS: Android 8.0+ (Oreo)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 3: SYSTEM & FINANCIAL STANDARDS                                     */}
      {/* ========================================================================= */}
      {activeSubTab === 'system' && (
        <form onSubmit={handleSaveSettings} className="space-y-2.5">
          {/* Corporate Profile & Fiscal Ledger Parameters */}
          <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-3.5 shadow-xs space-y-2">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <Building2 className="w-4 h-4 text-slate-700" />
              <div>
                <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
                  Corporate Entity Profile &amp; Financial Base Currency
                </h3>
                <p className="text-[10px] text-slate-500">
                  Primary corporate nomenclature and currency representation for construction estimates.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] font-semibold text-slate-700 mb-0.5 uppercase tracking-wider">
                  Corporate Legal Name
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-2 py-1 rounded-md border border-slate-300 text-xs text-slate-900 focus:ring-1 focus:ring-slate-900 focus:border-slate-900 bg-white"
                  placeholder="e.g. BuildIQ Corp."
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-700 mb-0.5 uppercase tracking-wider">
                  Reporting Currency (ISO)
                </label>
                <input
                  type="text"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-2 py-1 rounded-md border border-slate-300 text-xs text-slate-900 focus:ring-1 focus:ring-slate-900 focus:border-slate-900 font-mono bg-white uppercase"
                  placeholder="e.g. CAD, USD"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-700 mb-0.5 uppercase tracking-wider">
                  Currency Symbol
                </label>
                <input
                  type="text"
                  value={currencySymbol}
                  onChange={(e) => setCurrencySymbol(e.target.value)}
                  className="w-full px-2 py-1 rounded-md border border-slate-300 text-xs text-slate-900 focus:ring-1 focus:ring-slate-900 focus:border-slate-900 font-mono bg-white"
                  placeholder="e.g. $, £"
                />
              </div>
            </div>
          </div>

          {/* Cost Variance Risk Thresholds */}
          <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-3.5 shadow-xs space-y-2">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <AlertTriangle className="w-4 h-4 text-slate-700" />
              <div>
                <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
                  Earned Value &amp; Cost Variance Governance Thresholds
                </h3>
                <p className="text-[10px] text-slate-500">
                  Statistical tolerance bands governing automated warnings and cost health escalations.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="p-2 bg-amber-50/50 rounded-lg border border-amber-200/80 space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] font-bold text-amber-900 uppercase tracking-wider">
                    Amber Warning %
                  </label>
                  <span className="text-[9px] font-mono text-amber-800 font-bold bg-amber-100 px-1 py-0.2 rounded">
                    Attention
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={amberThreshold}
                    onChange={(e) => setAmberThreshold(Number(e.target.value))}
                    className="w-full pl-2 pr-6 py-1 rounded-md border border-amber-300 text-xs focus:ring-1 focus:ring-amber-600 font-mono bg-white text-slate-900"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 font-mono">
                    %
                  </span>
                </div>
                <p className="text-[9px] text-amber-800 leading-normal">
                  Early warning state when cost overruns reach this percentage.
                </p>
              </div>

              <div className="p-2 bg-rose-50/50 rounded-lg border border-rose-200/80 space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] font-bold text-rose-900 uppercase tracking-wider">
                    Red Critical %
                  </label>
                  <span className="text-[9px] font-mono text-rose-800 font-bold bg-rose-100 px-1 py-0.2 rounded">
                    Severe Risk
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min="2"
                    max="100"
                    value={redThreshold}
                    onChange={(e) => setRedThreshold(Number(e.target.value))}
                    className="w-full pl-2 pr-6 py-1 rounded-md border border-rose-300 text-xs focus:ring-1 focus:ring-rose-600 font-mono bg-white text-slate-900"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 font-mono">
                    %
                  </span>
                </div>
                <p className="text-[9px] text-rose-800 leading-normal">
                  Flags severe budget breach requiring steering committee escalation.
                </p>
              </div>

              <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] font-bold text-slate-800 uppercase tracking-wider">
                    Contingency Buffer %
                  </label>
                  <span className="text-[9px] font-mono text-slate-700 font-bold bg-slate-200 px-1 py-0.2 rounded">
                    Baseline
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={defaultContingency}
                    onChange={(e) => setDefaultContingency(Number(e.target.value))}
                    className="w-full pl-2 pr-6 py-1 rounded-md border border-slate-300 text-xs focus:ring-1 focus:ring-slate-900 font-mono bg-white text-slate-900"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 font-mono">
                    %
                  </span>
                </div>
                <p className="text-[9px] text-slate-600 leading-normal">
                  Default contractual contingency reserve provisioned on new budgets.
                </p>
              </div>
            </div>
          </div>

          {/* Master WBS Hierarchy */}
          <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-3.5 shadow-xs space-y-2">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <FolderTree className="w-4 h-4 text-slate-700" />
              <div>
                <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
                  Standard Construction WBS Hierarchy
                </h3>
                <p className="text-[10px] text-slate-500">
                  National master specification standard for classifying work breakdown structures.
                </p>
              </div>
            </div>
            <div className="text-[11px] text-slate-700 space-y-1 font-mono p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-start gap-2">
                <span className="font-bold text-slate-900 shrink-0">DIV 01:</span>
                <span>General Requirements &amp; Preliminaries</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-slate-900 shrink-0">DIV 02:</span>
                <span>Substructure &amp; Deep Foundations</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-slate-900 shrink-0">DIV 03:</span>
                <span>Superstructure &amp; Framing</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-slate-900 shrink-0">DIV 04:</span>
                <span>Building Envelope &amp; Thermal Enclosure</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-slate-900 shrink-0">DIV 05:</span>
                <span>Interior Architecture &amp; Finishes</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-slate-900 shrink-0">DIV 06:</span>
                <span>Mechanical, Electrical &amp; Plumbing</span>
              </div>
            </div>
          </div>

          {/* Formal Save Action Bar */}
          <div className="flex items-center justify-end gap-2 pt-1">
            {isSaved && (
              <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Configuration changes committed.</span>
              </span>
            )}
            <button
              type="submit"
              className="h-7.5 px-3.5 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-semibold text-xs rounded-md shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-900"
            >
              <Save className="w-3.5 h-3.5 text-slate-200" />
              <span>Save System Configuration</span>
            </button>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 4: GOVERNANCE AUDIT TRAIL                                          */}
      {/* ========================================================================= */}
      {activeSubTab === 'audit' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
                <History className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Immutable Governance Audit Trail ({systemAuditLogs.length})
                </h3>
                <p className="text-[11px] text-slate-500">
                  Cryptographically referenced chronological record of identity provisioning, RBAC modifications, and system configuration events.
                </p>
              </div>
            </div>
            <span className="text-[10px] text-slate-500 font-mono bg-slate-100 px-2 py-1 rounded border border-slate-200 uppercase font-semibold">
              Compliance Ledger
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Event Timestamp (UTC)</th>
                  <th className="py-3 px-4">Responsible Actor</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Target Domain</th>
                  <th className="py-3 px-4">Event Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {systemAuditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                      No system administrative events recorded in the compliance ledger.
                    </td>
                  </tr>
                ) : (
                  systemAuditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/60 font-sans">
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString('en-CA', {
                          year: 'numeric',
                          month: 'short',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {log.user_name}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 uppercase text-[10px] font-mono text-slate-500 font-bold">
                        {log.entity}
                      </td>
                      <td className="py-3 px-4 text-slate-600 text-[11px]">
                        {log.details}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      <AddUserModal
        isOpen={isAddUserOpen}
        onClose={() => setIsAddUserOpen(false)}
      />

      {/* Android Download & Installation Hub Modal */}
      <AndroidAppModal
        isOpen={isAndroidModalOpen}
        onClose={() => setIsAndroidModalOpen(false)}
      />

      {/* Revoke User Credentials In-App Confirmation Modal */}
      {userToRevoke && (
        <div
          id="modal-revoke-user"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2"
          onClick={() => setUserToRevoke(null)}
        >
          <div
            className="bg-white border border-slate-200 rounded-xl shadow-2xl max-w-[360px] w-full p-3.5 space-y-2.5 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                  Revoke User Credentials
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Decommission user account and terminate access.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 space-y-1 text-[11px]">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">User Name:</span>
                <span className="font-bold text-slate-900">{userToRevoke.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Email:</span>
                <span className="font-mono text-slate-700">{userToRevoke.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Role:</span>
                <span className="uppercase font-mono font-bold text-slate-800 text-[10px] bg-slate-200 px-1 py-0.2 rounded">
                  {userToRevoke.role}
                </span>
              </div>
            </div>

            <p className="text-[10px] text-rose-700 bg-rose-50 border border-rose-200 rounded-md p-2 leading-relaxed">
              <strong>Notice:</strong> User record will be purged and authentication tokens invalidated immediately.
            </p>

            <div className="flex items-center justify-end gap-1.5 pt-1.5 border-t border-slate-100">
              <button
                id="btn-cancel-revoke-user"
                type="button"
                onClick={() => setUserToRevoke(null)}
                className="px-2.5 py-1 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-revoke-user"
                type="button"
                onClick={() => {
                  const target = userToRevoke;
                  deleteUser(target.id);
                  if (currentUser?.id === target.id) {
                    switchRole('admin');
                  }
                  setUserToRevoke(null);
                  setActionToast({
                    message: `User credentials for ${target.name} (${target.email}) have been revoked and removed from directory.`,
                    type: 'success',
                  });
                  setTimeout(() => setActionToast(null), 5000);
                }}
                className="px-3 py-1 rounded-md bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs flex items-center gap-1"
              >
                <AlertTriangle className="w-3 h-3" />
                <span>Confirm Revoke</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Demonstration Database Confirmation Modal */}
      {isResetConfirmOpen && (
        <div
          id="modal-reset-demo"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2"
          onClick={() => setIsResetConfirmOpen(false)}
        >
          <div
            className="bg-white border border-slate-200 rounded-xl shadow-2xl max-w-[360px] w-full p-3.5 space-y-2.5 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <RotateCcw className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                  Reset Demonstration Database
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Revert all active project ledgers, field diaries, WBS baselines, and users to certified baseline.
                </p>
              </div>
            </div>

            <p className="text-[10px] text-slate-600 bg-slate-50 border border-slate-200 rounded-md p-2 leading-relaxed">
              All custom added users, field logs, and uploaded documents will be cleared and reset to factory defaults.
            </p>

            <div className="flex items-center justify-end gap-1.5 pt-1.5 border-t border-slate-100">
              <button
                id="btn-cancel-reset-demo"
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-2.5 py-1 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-reset-demo"
                type="button"
                onClick={() => {
                  resetToSeedData();
                  setIsResetConfirmOpen(false);
                  setActionToast({
                    message: 'Demonstration environment successfully restored to certified factory seed baseline.',
                    type: 'success',
                  });
                  setTimeout(() => setActionToast(null), 5000);
                }}
                className="px-3 py-1 rounded-md bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Confirm Reset</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
