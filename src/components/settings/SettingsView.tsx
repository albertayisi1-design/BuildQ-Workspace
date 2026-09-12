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
  } = useBuild();
  const { currentUser, switchRole } = useAuth();

  const [activeSubTab, setActiveSubTab] = useState<'system' | 'users' | 'android' | 'audit'>('users');
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isAndroidModalOpen, setIsAndroidModalOpen] = useState(false);

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
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleResetData = () => {
    if (
      window.confirm(
        'Reset all project data, costs, WBS activities, users, and site logs to factory demonstration seed data?'
      )
    ) {
      resetToSeedData();
      alert('Application database successfully restored to default PoC seed state.');
    }
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
      setAndroidDownloadMessage(`Downloaded ${res.fileName} (${res.size})`);
      setTimeout(() => setAndroidDownloadMessage(null), 4000);
    } finally {
      setDownloadingApk(false);
    }
  };

  const handleDownloadProjectZipDirect = async () => {
    setDownloadingZip(true);
    try {
      const res = await downloadAndroidProjectZip();
      setAndroidDownloadMessage(`Downloaded ${res.fileName} (${res.size})`);
      setTimeout(() => setAndroidDownloadMessage(null), 4000);
    } finally {
      setDownloadingZip(false);
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
            <Shield className="w-3 h-3 text-purple-600" />
            Admin
          </span>
        );
      case 'pm':
      case 'project_manager':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-cyan-100 text-cyan-900 border border-cyan-300">
            <HardHat className="w-3 h-3 text-cyan-700" />
            PM
          </span>
        );
      case 'engineer':
      case 'engineers':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-900 border border-indigo-300">
            <Wrench className="w-3 h-3 text-indigo-700" />
            Engineer
          </span>
        );
      case 'finance':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
            <Calculator className="w-3 h-3 text-emerald-700" />
            Finance
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
            <Shield className="w-3 h-3 text-slate-600" />
            Corporate Member
          </span>
        );
    }
  };

  return (
    <div id="settings-view" className="space-y-6 pb-16">
      {/* Top Banner & Header */}
      <div className="bento-card p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight ">
              System Governance &amp; Administration
            </h1>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-linear-to-r from-cyan-50 to-lime-50 text-cyan-800 border border-cyan-200 uppercase tracking-wider font-mono">
              Admin Console
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Account provisioning governance, client onboarding, RBAC security matrix, and Android mobile app distribution.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsAndroidModalOpen(true)}
            className="px-3.5 py-2 rounded-lg bg-linear-to-r from-cyan-500 to-lime-500 hover:from-cyan-600 hover:to-lime-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer "
            title="Download or Install Android App"
          >
            <Smartphone className="w-4 h-4 text-white" />
            <span>Android App Hub</span>
          </button>
          <button
            onClick={handleResetData}
            className="px-3 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Reset database to initial seed state"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
            <span className="hidden sm:inline">Reset Seed Data</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center border-b border-slate-200 overflow-x-auto gap-2 text-xs font-semibold">
        <button
          onClick={() => setActiveSubTab('users')}
          className={`pb-3 px-3 flex items-center gap-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeSubTab === 'users'
              ? 'border-cyan-600 text-cyan-800 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User Accounts &amp; RBAC</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-600 border border-slate-200">
            {users.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('android')}
          className={`pb-3 px-3 flex items-center gap-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeSubTab === 'android'
              ? 'border-cyan-600 text-cyan-800 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Smartphone className="w-4 h-4 text-cyan-600" />
          <span>Android App &amp; APK Download</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-lime-50 text-lime-700 font-mono font-bold border border-lime-200">
            v1.0.4
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('system')}
          className={`pb-3 px-3 flex items-center gap-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeSubTab === 'system'
              ? 'border-cyan-600 text-cyan-800 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>System &amp; Financials</span>
        </button>

        <button
          onClick={() => setActiveSubTab('audit')}
          className={`pb-3 px-3 flex items-center gap-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeSubTab === 'audit'
              ? 'border-cyan-600 text-cyan-800 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Governance Audit Logs</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-600 border border-slate-200">
            {systemAuditLogs.length}
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUBTAB 1: USER ACCOUNTS & RBAC PROVISIONING                                */}
      {/* ========================================================================= */}
      {activeSubTab === 'users' && (
        <div className="space-y-6">
          {/* Who is Responsible for User Accounts? Governance Blueprint Card */}
          <div className="bento-card p-6 bg-white text-slate-900 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <div className="flex items-center gap-2 text-cyan-700 font-mono text-xs font-bold uppercase tracking-wider">
                  <Shield className="w-4 h-4" />
                  Accountability &amp; Authority Framework
                </div>
                <h2 className="text-lg font-bold text-slate-900 mt-1 ">
                  Who is Responsible for Creating User Accounts?
                </h2>
                <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                  Under BuildIQ's corporate security policy, the <strong>System Administrator</strong> (<code className="text-cyan-700 bg-cyan-50 px-1 py-0.5 rounded border border-cyan-200 font-mono">admin</code> role) holds sole authoritative responsibility and accountability for provisioning user accounts, assigning RBAC permissions, and enforcing credential access.
                </p>
              </div>

              <button
                id="btn-open-create-user-modal"
                onClick={() => setIsAddUserOpen(true)}
                className="px-4 py-2.5 bg-linear-to-r from-cyan-500 to-lime-500 hover:from-cyan-600 hover:to-lime-600 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer shrink-0 "
              >
                <UserPlus className="w-4 h-4 text-white" />
                <span>+ Create User Account</span>
              </button>
            </div>

            {/* RACI Matrix & Roles Breakdown - Corporate Roles Only */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-5">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-purple-600" />
                      Admin
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-50 text-purple-700 border border-purple-200 uppercase font-mono">
                      Governance
                    </span>
                  </div>
                  <ul className="text-[11px] text-slate-600 mt-2 space-y-1 list-disc list-inside">
                    <li>Staff user provisioning &amp; credential setup</li>
                    <li>Corporate role assignment &amp; RBAC rules</li>
                    <li>Security audit logs &amp; system parameters</li>
                  </ul>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <HardHat className="w-3.5 h-3.5 text-cyan-600" />
                      PM
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200 uppercase font-mono">
                      Operations
                    </span>
                  </div>
                  <ul className="text-[11px] text-slate-600 mt-2 space-y-1 list-disc list-inside">
                    <li>Project budgets, timelines &amp; WBS milestones</li>
                    <li>Subcontractor contracts &amp; task progress</li>
                    <li>Project cost approvals &amp; site oversight</li>
                  </ul>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Wrench className="w-3.5 h-3.5 text-indigo-600" />
                      Engineers
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase font-mono">
                      Technical
                    </span>
                  </div>
                  <ul className="text-[11px] text-slate-600 mt-2 space-y-1 list-disc list-inside">
                    <li>Engineering specs &amp; drawing reviews</li>
                    <li>Technical field inspection logs &amp; WBS metrics</li>
                    <li>Safety, quality compliance &amp; field observations</li>
                  </ul>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Calculator className="w-3.5 h-3.5 text-emerald-600" />
                      Finance
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase font-mono">
                      Fiscal
                    </span>
                  </div>
                  <ul className="text-[11px] text-slate-600 mt-2 space-y-1 list-disc list-inside">
                    <li>General ledger entries &amp; cost auditing</li>
                    <li>Budget tracking, variances &amp; forecasting</li>
                    <li>Invoicing, cash flow &amp; fiscal audits</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* How User Accounts Are Created - Step-by-Step Guide */}
          <div className="bento-card p-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <HelpCircle className="w-4 h-4 text-amber-600" />
              <h3 className="font-bold text-slate-900 text-sm font-sans">
                How User Accounts Are Created &amp; Provisioned (Standard Operating Procedure)
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="w-6 h-6 rounded-full bg-linear-to-br from-cyan-500 to-lime-500 text-white font-bold flex items-center justify-center text-xs mb-2 shadow-xs">
                  1
                </div>
                <div className="font-bold text-slate-900">Initiate Provisioning</div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Administrator opens this User Accounts console and clicks <strong>+ Create User Account</strong>.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="w-6 h-6 rounded-full bg-linear-to-br from-cyan-500 to-lime-500 text-white font-bold flex items-center justify-center text-xs mb-2 shadow-xs">
                  2
                </div>
                <div className="font-bold text-slate-900">Specify Identity &amp; Role</div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Enter official name, corporate email (<code className="text-slate-700">@buildiq.ca</code>), department, and select RBAC permission level.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="w-6 h-6 rounded-full bg-linear-to-br from-cyan-500 to-lime-500 text-white font-bold flex items-center justify-center text-xs mb-2 shadow-xs">
                  3
                </div>
                <div className="font-bold text-slate-900">Configure Security</div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Assign initial temporary password and mark account as <strong>Active</strong> for immediate access.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="w-6 h-6 rounded-full bg-linear-to-br from-cyan-500 to-lime-500 text-white font-bold flex items-center justify-center text-xs mb-2 shadow-xs">
                  4
                </div>
                <div className="font-bold text-slate-900">Audit Logging</div>
                <p className="text-[11px] text-slate-500 mt-1">
                  System logs timestamp, admin creator identity, and stores user in local and Firestore persistence.
                </p>
              </div>
            </div>
          </div>

          {/* Interactive User Accounts Directory */}
          <div className="bento-card p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-600" />
                <h3 className="font-bold text-slate-900 text-sm ">
                  Active User Directory ({filteredUsers.length})
                </h3>
              </div>

              {/* Search & Role Filter */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search name, username, email..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 text-slate-900 focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 w-56 transition-colors placeholder-slate-400 font-mono"
                  />
                </div>

                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 text-slate-800 focus:border-cyan-500 transition-colors font-medium"
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="pm">PM (Project Managers)</option>
                  <option value="engineer">Engineers</option>
                  <option value="finance">Finance</option>
                </select>

                <button
                  onClick={() => setIsAddUserOpen(true)}
                  className="px-3 py-1.5 bg-linear-to-r from-cyan-500 to-lime-500 hover:from-cyan-600 hover:to-lime-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs "
                >
                  <UserPlus className="w-3.5 h-3.5 text-white" />
                  <span>Add User</span>
                </button>
              </div>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-3">User &amp; Username</th>
                    <th className="p-3">Corporate Role</th>
                    <th className="p-3">Department</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Created By</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((u) => {
                    const isCurrent = currentUser?.id === u.id || currentUser?.email === u.email;
                    const displayUsername = u.username || u.email.split('@')[0];
                    return (
                      <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-linear-to-br from-cyan-500 to-lime-500 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                              {u.name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                <span>{u.name}</span>
                                <span className="text-[11px] font-mono font-bold text-cyan-700 bg-cyan-50 px-1.5 py-0.2 rounded border border-cyan-200 flex items-center gap-0.5">
                                  <AtSign className="w-2.5 h-2.5 text-cyan-500" />
                                  {displayUsername}
                                </span>
                                {isCurrent && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-lime-100 text-lime-800 uppercase font-mono">
                                    Current Session
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500 font-mono">{u.email}</div>
                            </div>
                          </div>
                        </td>

                        <td className="p-3">
                          {currentUser?.role === 'admin' && !isCurrent ? (
                            <div className="flex items-center gap-1.5">
                              <select
                                value={u.role === 'project_manager' ? 'pm' : (u.role === 'engineers' ? 'engineer' : u.role)}
                                onChange={(e) => {
                                  updateUser(u.id, { role: e.target.value as UserRole });
                                }}
                                className="px-2 py-1 border border-slate-200 rounded-lg text-xs font-semibold bg-white text-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all cursor-pointer shadow-2xs hover:border-cyan-400"
                                title="Reassign corporate role (Admin, PM, Engineer, Finance)"
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

                        <td className="p-3 text-slate-600 font-medium">
                          {u.department || 'Operations'}
                        </td>

                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              u.status === 'active'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {u.status}
                          </span>
                        </td>

                        <td className="p-3 text-slate-500 text-[11px]">
                          {u.created_by || 'System Admin'}
                        </td>

                        <td className="p-3 text-right space-x-2">
                          {!isCurrent ? (
                            <button
                              type="button"
                              onClick={() => switchRole(u.role)}
                              className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-semibold transition-colors cursor-pointer"
                              title="Simulate this user in the application"
                            >
                              Simulate User
                            </button>
                          ) : (
                            <span className="text-[11px] text-emerald-600 font-bold">Active</span>
                          )}

                          {u.id !== 'usr_admin' && (
                            <button
                              onClick={() => {
                                if (window.confirm(`Decommission user account: ${u.name}?`)) {
                                  deleteUser(u.id);
                                }
                              }}
                              className="text-rose-600 hover:text-rose-800 text-[11px] font-medium transition-colors cursor-pointer"
                            >
                              Remove
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
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
        <div className="space-y-6">
          {/* Download Notification Alert */}
          {androidDownloadMessage && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800 text-xs font-semibold animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{androidDownloadMessage}</span>
            </div>
          )}

          {/* Hero Android Banner */}
          <div className="bento-card p-6 bg-linear-to-r from-cyan-600 via-teal-600 to-lime-600 text-white rounded-2xl border border-cyan-700/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-md">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center text-white shrink-0 shadow-inner">
                <Smartphone className="w-7 h-7 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold tracking-tight text-white ">
                    BuildIQ for Android Mobile &amp; Tablet
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-xs font-mono font-bold border border-white/30">
                    Release v{ANDROID_CONFIG.versionName}
                  </span>
                </div>
                <p className="text-xs text-white/90 mt-1 max-w-xl leading-relaxed">
                  Deploy BuildIQ directly onto Android phones and tablets for jobsite tracking, field site diaries, offline receipts camera capture, and real-time WBS cost management.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                id="btn-trigger-apk-download"
                onClick={handleDownloadApkDirect}
                disabled={downloadingApk}
                className="px-4 py-2.5 bg-white hover:bg-slate-50 text-cyan-950 font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 "
              >
                <Download className="w-4 h-4 text-cyan-700" />
                <span>{downloadingApk ? 'Building APK...' : 'Download Android APK (.apk)'}</span>
              </button>
            </div>
          </div>

          {/* 3 Download Methods Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Card 1: Direct Android PWA Install */}
            <div className="bento-card p-5 flex flex-col justify-between space-y-4 border-2 border-cyan-500/30 bg-cyan-50/20">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 rounded bg-linear-to-r from-cyan-500 to-lime-500 text-white text-[10px] font-bold uppercase tracking-wider font-mono">
                    Instant
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">WebAPK</span>
                </div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5 ">
                  <Zap className="w-4 h-4 text-cyan-600" />
                  1-Click Android WebAPK
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Adds BuildIQ to your Android home screen and app launcher. Runs fullscreen in standalone mode with background sync and zero store fees.
                </p>
              </div>

              <div className="pt-3 border-t border-cyan-100">
                <button
                  onClick={() => setIsAndroidModalOpen(true)}
                  className="w-full bg-linear-to-r from-cyan-500 to-lime-500 hover:from-cyan-600 hover:to-lime-600 text-white font-bold py-2 px-3 rounded-lg text-xs shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer "
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Install / Add to Home Screen</span>
                </button>
              </div>
            </div>

            {/* Card 2: Download Standalone Release APK */}
            <div className="bento-card p-5 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-wider font-mono border border-slate-200">
                    Sideload
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">BuildIQ.apk</span>
                </div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5 ">
                  <Download className="w-4 h-4 text-slate-700" />
                  Download Android APK
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Direct Android package file (<code className="text-slate-700 font-mono">.apk</code>) ready to sideload via USB, corporate MDM deployment, or phone file manager.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <button
                  onClick={handleDownloadApkDirect}
                  disabled={downloadingApk}
                  className="w-full bg-linear-to-r from-cyan-600 to-lime-600 hover:from-cyan-700 hover:to-lime-700 text-white font-bold py-2 px-3 rounded-lg text-xs shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 "
                >
                  <Download className="w-3.5 h-3.5 text-white" />
                  <span>{downloadingApk ? 'Generating...' : 'Download BuildIQ.apk'}</span>
                </button>
              </div>
            </div>

            {/* Card 3: Android Studio Source Project */}
            <div className="bento-card p-5 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 rounded bg-cyan-50 text-cyan-700 text-[10px] font-bold uppercase tracking-wider font-mono border border-cyan-200">
                    Developers
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">Gradle .ZIP</span>
                </div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5 ">
                  <FolderTree className="w-4 h-4 text-cyan-600" />
                  Android Studio Project
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Complete Gradle project with `AndroidManifest.xml`, Kotlin `MainActivity.kt`, and `assetlinks.json` ready for Play Store compilation.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <button
                  onClick={handleDownloadProjectZipDirect}
                  disabled={downloadingZip}
                  className="w-full bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-semibold py-2 px-3 rounded-lg text-xs shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 "
                >
                  <Download className="w-3.5 h-3.5 text-slate-600" />
                  <span>{downloadingZip ? 'Packaging...' : 'Download Project Zip'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* QR Code & Sideloading Instructions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* QR Code Scanner */}
            <div className="bento-card p-5 flex flex-col items-center justify-center text-center space-y-3">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-amber-600" />
                Scan to Install on Android
              </h4>
              <div
                className="w-36 h-36 flex items-center justify-center"
                dangerouslySetInnerHTML={{
                  __html: generateQrCodeSvg(typeof window !== 'undefined' ? window.location.origin : ANDROID_CONFIG.appUrl, 140),
                }}
              />
              <p className="text-[11px] text-slate-500 max-w-xs">
                Open your Android phone camera or barcode scanner and point it here to launch BuildIQ instantly.
              </p>
            </div>

            {/* Sideloading & Installation Instructions */}
            <div className="bento-card p-5 lg:col-span-2 space-y-3">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
                <HelpCircle className="w-4 h-4 text-slate-600" />
                How to Install the APK on Your Android Device
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-900">Step 1: Download</div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Click <strong>Download BuildIQ.apk</strong> above to save the installer file directly to your device or computer.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-900">Step 2: Allow Sideload</div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    If prompted with <em>Install unknown apps</em>, tap <strong>Settings</strong> and switch on <strong>Allow from this source</strong>.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-900">Step 3: Launch App</div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Tap <strong>Install</strong>. Once finished, launch BuildIQ from your Android App Drawer or Home Screen!
                  </p>
                </div>
              </div>

              <div className="mt-3 p-3 bg-slate-100 rounded-lg text-[11px] text-slate-600 flex items-center justify-between">
                <span>Android Package: <code className="font-mono text-slate-800 font-bold">{ANDROID_CONFIG.packageName}</code></span>
                <span>Target SDK: 34 (Android 14/15)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 4: SYSTEM & FINANCIAL STANDARDS                                     */}
      {/* ========================================================================= */}
      {activeSubTab === 'system' && (
        <form onSubmit={handleSaveSettings} className="space-y-5">
          {/* Company & Financial Parameters */}
          <div className="bento-card p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Building2 className="w-4 h-4 text-amber-600" />
              <h3 className="font-bold text-slate-900 text-sm font-sans">
                Organization &amp; Financial Standards
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Company Name
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-amber-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Primary Currency
                </label>
                <input
                  type="text"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-amber-500 font-mono bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Currency Symbol
                </label>
                <input
                  type="text"
                  value={currencySymbol}
                  onChange={(e) => setCurrencySymbol(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-amber-500 font-mono bg-white"
                />
              </div>
            </div>
          </div>

          {/* Cost Variance Warning Thresholds */}
          <div className="bento-card p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <h3 className="font-bold text-slate-900 text-sm font-sans">
                Cost Variance Health Thresholds
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Amber (Attention Required) %
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={amberThreshold}
                    onChange={(e) => setAmberThreshold(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-amber-500 font-mono bg-white"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                    %
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Triggers when cost overrun exceeds this %</p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Red (At Risk) %
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="2"
                    max="100"
                    value={redThreshold}
                    onChange={(e) => setRedThreshold(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-amber-500 font-mono bg-white"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                    %
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Severe budget breach indicator</p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Default Contingency Buffer %
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={defaultContingency}
                    onChange={(e) => setDefaultContingency(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-amber-500 font-mono bg-white"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                    %
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Default markup in intelligence estimations</p>
              </div>
            </div>
          </div>

          {/* WBS Master Template Preview */}
          <div className="bento-card p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <FolderTree className="w-4 h-4 text-amber-600" />
              <h3 className="font-bold text-slate-900 text-sm font-sans">
                Standard Canadian Construction WBS Master Hierarchy
              </h3>
            </div>
            <div className="text-xs text-slate-600 space-y-1.5 font-mono bento-subbox p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>01 &mdash; Preliminaries (Mobilization, Permitting, Site Establishment)</div>
              <div>02 &mdash; Substructure &amp; Foundation (Excavation, Shoring, Footings, Slab-on-Grade)</div>
              <div>03 &mdash; Superstructure (Cast-in-Place Concrete, Steel Framing, Floor Slabs)</div>
              <div>04 &mdash; Building Envelope &amp; Glazing (Curtain Wall, Masonry, Roofing)</div>
              <div>05 &mdash; Interior Finishes (Drywall, Painting, Flooring, Millwork)</div>
              <div>06 &mdash; Mechanical, Electrical &amp; Plumbing (HVAC, Electrical, Fire Protection)</div>
            </div>
          </div>

          {/* Save button */}
          <div className="flex items-center justify-end gap-3 pt-2">
            {isSaved && (
              <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                Configuration saved successfully!
              </span>
            )}
            <button
              type="submit"
              className="px-5 py-2.5 bg-linear-to-r from-cyan-500 to-lime-500 hover:from-cyan-600 hover:to-lime-600 text-white font-bold text-xs rounded-lg shadow-xs flex items-center gap-1.5 transition-all cursor-pointer "
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save System Configuration</span>
            </button>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 4: GOVERNANCE AUDIT TRAIL                                          */}
      {/* ========================================================================= */}
      {activeSubTab === 'audit' && (
        <div className="bento-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-cyan-600" />
              <h3 className="font-bold text-slate-900 text-sm ">
                User &amp; System Governance Audit Trail ({systemAuditLogs.length})
              </h3>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">Immutable Compliance Log</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Responsible User</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Entity Type</th>
                  <th className="p-3">Audit Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {systemAuditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-400 font-sans">
                      No system governance events recorded yet.
                    </td>
                  </tr>
                ) : (
                  systemAuditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/60">
                      <td className="p-3 text-slate-500">{new Date(log.timestamp).toLocaleString()}</td>
                      <td className="p-3 font-bold text-slate-800 font-sans">{log.user_name}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-bold">
                          {log.action}
                        </span>
                      </td>
                      <td className="p-3 uppercase text-[10px] text-slate-500">{log.entity}</td>
                      <td className="p-3 font-sans text-slate-700">{log.details}</td>
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
    </div>
  );
};
