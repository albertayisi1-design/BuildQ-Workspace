import React, { useMemo, useState, useRef } from 'react';
import { useBuild } from '../../context/BuildContext';
import {
  formatCurrency,
  formatPercent,
  calculateProjectHealth,
} from '../../utils/formatters';
import { HealthBadge } from '../common/HealthBadge';
import { exportDashboardToPdf } from '../../utils/dashboardPdfExport';
import { ParametricCostStudio } from '../intelligence/ParametricCostStudio';
import { CostDistributionCard } from '../costs/CostDistributionCard';
import { ProjectAnalyticsCards } from './ProjectAnalyticsCards';
import {
  Building2,
  FolderCheck,
  Activity,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  Percent,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  FileDown,
  Loader2,
  ChevronDown,
  Download,
  Search,
  Sparkles,
  Layers,
  BrainCircuit,
  HardHat,
  Boxes,
  Receipt,
  Camera,
  Calculator,
  Plus,
} from 'lucide-react';
import { CreateProjectModal } from '../projects/CreateProjectModal';
import {
  AddLabourModal,
  AddMaterialModal,
  AddExpenseModal,
  TakePhotoModal,
} from './QuickActionModals';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

interface ExecutiveDashboardProps {
  onSelectProject: (projectId: string) => void;
  onNavigate: (tab: string) => void;
  onOpenNewProject?: () => void;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({
  onSelectProject,
  onNavigate,
  onOpenNewProject,
}) => {
  const { projects, clients, costs, settings, historicalProjects } = useBuild();

  // Primary KPI calculations
  const kpis = useMemo(() => {
    const totalProjects = projects.length;
    const activeProjects = projects.filter((p) => p.status === 'Active').length;
    const completedProjects = projects.filter((p) => p.status === 'Completed').length;
    const planningProjects = projects.filter((p) => p.status === 'Planning').length;

    const totalContractValue = projects.reduce((sum, p) => sum + p.contract_value, 0);
    const totalProjectCost = projects.reduce((sum, p) => sum + (p.actual_cost || 0), 0);
    const totalApprovedBudget = projects.reduce((sum, p) => sum + p.approved_budget, 0);

    const totalProjectedCost = projects.reduce((sum, p) => {
      const actual = p.actual_cost || 0;
      const remaining =
        p.forecast_remaining !== undefined
          ? p.forecast_remaining
          : Math.max(0, p.approved_budget - actual);
      return sum + actual + remaining;
    }, 0);

    const projectedProfit = totalContractValue - totalProjectedCost;
    const portfolioMarginPct =
      totalContractValue > 0 ? (projectedProfit / totalContractValue) * 100 : 0;
    const portfolioBurnRate =
      totalApprovedBudget > 0 ? (totalProjectCost / totalApprovedBudget) * 100 : 0;

    const activeOrPlanning = projects.filter((p) => p.status !== 'Closed');
    const avgProgress =
      activeOrPlanning.length > 0
        ? Math.round(
            activeOrPlanning.reduce((sum, p) => sum + (p.progress || 0), 0) /
              activeOrPlanning.length
          )
        : 0;

    const atRiskCount = projects.filter((p) => {
      const actual = p.actual_cost || 0;
      const forecast =
        actual + Math.max(0, p.forecast_remaining ?? (p.approved_budget - actual));
      const health = calculateProjectHealth(
        p,
        actual,
        forecast,
        settings.amber_threshold_percent,
        settings.red_threshold_percent
      );
      return health === 'RED';
    }).length;

    const defaultContingency = settings.default_contingency_percent || 10;
    const totalContingencyAllocated = totalApprovedBudget * (defaultContingency / 100);

    return {
      totalProjects,
      activeProjects,
      completedProjects,
      planningProjects,
      totalContractValue,
      totalProjectCost,
      totalApprovedBudget,
      totalProjectedCost,
      projectedProfit,
      portfolioMarginPct,
      portfolioBurnRate,
      avgProgress,
      atRiskCount,
      totalContingencyAllocated,
    };
  }, [projects, settings]);

  // Financial Chart Data (Budget vs Actual Cost across top active/relevant projects)
  const financialChartData = useMemo(() => {
    return projects.slice(0, 6).map((p) => ({
      name: p.name.length > 16 ? p.name.substring(0, 15) + '…' : p.name,
      fullName: p.name,
      Budget: p.approved_budget,
      Actual: p.actual_cost || 0,
    }));
  }, [projects]);

  // Planned Progress vs Actual Progress Data
  const progressChartData = useMemo(() => {
    return projects
      .filter((p) => p.status === 'Active' || p.status === 'Completed')
      .slice(0, 6)
      .map((p) => {
        const start = new Date(p.start_date).getTime();
        const end = new Date(p.planned_completion).getTime();
        const now = new Date().getTime();
        let plannedPct = 100;
        if (end > start) {
          plannedPct = Math.min(
            100,
            Math.max(0, Math.round(((now - start) / (end - start)) * 100))
          );
        }
        if (p.status === 'Completed') plannedPct = 100;

        return {
          name: p.name.length > 15 ? p.name.substring(0, 14) + '…' : p.name,
          fullName: p.name,
          Planned: plannedPct,
          Actual: p.progress || 0,
        };
      });
  }, [projects]);

  // Get names of projects at risk for the bento card
  const atRiskProjectNames = useMemo(() => {
    const names = projects
      .filter((p) => {
        const actual = p.actual_cost || 0;
        const forecast =
          actual + Math.max(0, p.forecast_remaining ?? (p.approved_budget - actual));
        const health = calculateProjectHealth(
          p,
          actual,
          forecast,
          settings.amber_threshold_percent,
          settings.red_threshold_percent
        );
        return health === 'RED';
      })
      .map((p) => p.name.split(' ')[0]);
    return names.length > 0 ? names.join(', ') : 'None';
  }, [projects, settings]);

  const dashboardRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfProgress, setPdfProgress] = useState('');
  const [showFormatDropdown, setShowFormatDropdown] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Quick Action Modals State
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [isAddLabourOpen, setIsAddLabourOpen] = useState(false);
  const [isAddMaterialOpen, setIsAddMaterialOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isTakePhotoOpen, setIsTakePhotoOpen] = useState(false);
  const [quickActionToast, setQuickActionToast] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setQuickActionToast(msg);
    setTimeout(() => {
      setQuickActionToast(null);
    }, 4000);
  };

  const handleDownloadPdf = async (format: 'multipage' | 'single' = 'multipage') => {
    if (!dashboardRef.current || isGeneratingPdf) return;
    setIsGeneratingPdf(true);
    setPdfProgress('Initializing...');
    setShowFormatDropdown(false);
    try {
      await exportDashboardToPdf({
        element: dashboardRef.current,
        format,
        reportTitle: 'BuildSuite OS — Executive Dashboard & Portfolio Financial Summary',
        filename: `Executive_Dashboard_Summary_${new Date().toISOString().split('T')[0]}.pdf`,
        onProgress: (status) => setPdfProgress(status),
      });
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 4500);
    } catch (err) {
      console.error('Failed to generate PDF summary:', err);
      alert('Unable to generate PDF summary. Please ensure browser permissions allow canvas capture.');
    } finally {
      setIsGeneratingPdf(false);
      setPdfProgress('');
    }
  };

  return (
    <div id="executive-dashboard-view" ref={dashboardRef} className="space-y-4 pb-10">
      {/* Quick Actions Panel — Removed duplicate Portfolio Overview and Live Data titles */}
      <div
        className="bg-[#0F172A] border border-slate-800 rounded-xl px-3 py-2 text-white shadow-xs flex items-center overflow-x-auto scrollbar-none touch-pan-x"
        data-html2canvas-ignore="true"
      >
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none w-full max-w-full touch-pan-x shrink-0">
          {/* Executive PDF Dropdown Button */}
          <div className="relative">
            <button
              id="btn-download-pdf-brief"
              onClick={() => setShowFormatDropdown(!showFormatDropdown)}
              disabled={isGeneratingPdf}
              className="h-7.5 px-2.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold inline-flex items-center gap-1.5 transition-all border border-slate-700 cursor-pointer shadow-2xs whitespace-nowrap"
              title="Download Executive Summary PDF report"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-3 h-3 text-cyan-400 animate-spin" />
                  <span className="font-mono text-[10px]">{pdfProgress || 'Exporting...'}</span>
                </>
              ) : (
                <>
                  <FileDown className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Executive PDF</span>
                  <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
                </>
              )}
            </button>

            {showFormatDropdown && !isGeneratingPdf && (
              <div className="absolute right-0 mt-1.5 w-56 bg-slate-900 border border-slate-700 rounded-xl shadow-xl z-50 py-1 text-xs text-slate-200">
                <button
                  onClick={() => handleDownloadPdf('multipage')}
                  className="w-full text-left px-3 py-2 hover:bg-slate-800 flex items-start gap-2 cursor-pointer text-slate-200 transition-colors border-b border-slate-800"
                >
                  <FileText className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-white text-xs">Multi-Page Dossier</div>
                    <div className="text-[10px] text-slate-400">Structured A4 portfolio report</div>
                  </div>
                </button>
                <button
                  onClick={() => handleDownloadPdf('single')}
                  className="w-full text-left px-3 py-2 hover:bg-slate-800 flex items-start gap-2 cursor-pointer text-slate-200 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-lime-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-white text-xs">Single Snapshot Page</div>
                    <div className="text-[10px] text-slate-400">Condensed visual scorecard</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          <div className="h-4 w-px bg-slate-800 mx-0.5 hidden sm:block" />

          {/* 1. + New Project (Solid Bright Orange/Amber Button) */}
          <button
            id="btn-banner-new-project"
            onClick={() => {
              if (onOpenNewProject) {
                onOpenNewProject();
              } else {
                setIsCreateProjectOpen(true);
              }
            }}
            className="h-7.5 px-3 rounded-lg bg-[#FF9900] hover:bg-[#F08C00] active:scale-98 text-slate-950 font-bold text-[11px] inline-flex items-center justify-center gap-1 shadow-xs transition-all cursor-pointer whitespace-nowrap"
            title="Create a new construction project"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>New Project</span>
          </button>

          {/* 2. Add Labour (Dark Navy Pill, Yellow Hardhat) */}
          <button
            id="btn-banner-add-labour"
            onClick={() => setIsAddLabourOpen(true)}
            className="h-7.5 px-2.5 rounded-lg bg-[#152033] hover:bg-[#1C2C45] active:scale-98 text-slate-200 hover:text-white font-medium text-[11px] inline-flex items-center justify-center gap-1.5 border border-slate-700/80 hover:border-amber-400/50 shadow-2xs transition-all cursor-pointer whitespace-nowrap"
            title="Log trade labor hours & payroll costs"
          >
            <HardHat className="w-3.5 h-3.5 text-[#F59E0B] shrink-0" />
            <span>Add Labour</span>
          </button>

          {/* 3. Add Material (Dark Navy Pill, Blue Blocks) */}
          <button
            id="btn-banner-add-material"
            onClick={() => setIsAddMaterialOpen(true)}
            className="h-7.5 px-2.5 rounded-lg bg-[#152033] hover:bg-[#1C2C45] active:scale-98 text-slate-200 hover:text-white font-medium text-[11px] inline-flex items-center justify-center gap-1.5 border border-slate-700/80 hover:border-blue-400/50 shadow-2xs transition-all cursor-pointer whitespace-nowrap"
            title="Record material delivery invoices & slips"
          >
            <Boxes className="w-3.5 h-3.5 text-[#3B82F6] shrink-0" />
            <span>Add Material</span>
          </button>

          {/* 4. Add Expense (Dark Navy Pill, Green Receipt) */}
          <button
            id="btn-banner-add-expense"
            onClick={() => setIsAddExpenseOpen(true)}
            className="h-7.5 px-2.5 rounded-lg bg-[#152033] hover:bg-[#1C2C45] active:scale-98 text-slate-200 hover:text-white font-medium text-[11px] inline-flex items-center justify-center gap-1.5 border border-slate-700/80 hover:border-emerald-400/50 shadow-2xs transition-all cursor-pointer whitespace-nowrap"
            title="Log equipment rentals, permits & utilities"
          >
            <Receipt className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
            <span>Add Expense</span>
          </button>

          {/* 5. Take Photo (Dark Navy Pill, Purple Camera) */}
          <button
            id="btn-banner-take-photo"
            onClick={() => setIsTakePhotoOpen(true)}
            className="h-7.5 px-2.5 rounded-lg bg-[#152033] hover:bg-[#1C2C45] active:scale-98 text-slate-200 hover:text-white font-medium text-[11px] inline-flex items-center justify-center gap-1.5 border border-slate-700/80 hover:border-purple-400/50 shadow-2xs transition-all cursor-pointer whitespace-nowrap"
            title="Capture or upload jobsite QA inspection photo"
          >
            <Camera className="w-3.5 h-3.5 text-[#A855F7] shrink-0" />
            <span>Take Photo</span>
          </button>

          {/* 6. Estimate (Dark Navy Pill, Rose/Red Calculator) */}
          <button
            id="btn-banner-estimate"
            onClick={() => {
              onNavigate('intelligence');
              triggerToast('Navigated to Ontario Parametric Cost Benchmark & Estimator');
            }}
            className="h-7.5 px-2.5 rounded-lg bg-[#152033] hover:bg-[#1C2C45] active:scale-98 text-slate-200 hover:text-white font-medium text-[11px] inline-flex items-center justify-center gap-1.5 border border-slate-700/80 hover:border-rose-400/50 shadow-2xs transition-all cursor-pointer whitespace-nowrap"
            title="Launch Parametric Cost Benchmark & Estimator"
          >
            <Calculator className="w-3.5 h-3.5 text-[#F43F5E] shrink-0" />
            <span>Estimate</span>
          </button>
        </div>
      </div>

      {/* Primary & Secondary KPI Cards — Formal Civil Engineering Standards */}
      <div className="space-y-2">
        {/* Primary KPI Row (4 High-Contrast Bento Cards — Compact & Formal) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {/* Card 1: Total Projects */}
          <div id="kpi-total-projects" className="bento-card p-2.5 sm:p-3 flex flex-col justify-between min-h-[66px]">
            <div className="flex items-center justify-between">
              <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Total Projects</span>
              <div className="p-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                <Building2 className="w-3 h-3" />
              </div>
            </div>
            <div>
              <div className="text-base sm:text-lg font-bold text-slate-900 font-mono tracking-tight leading-tight">
                {kpis.totalProjects}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-500 leading-tight">
                <span className="text-slate-800 font-semibold">{kpis.activeProjects} active</span>
                <span>•</span>
                <span>{kpis.planningProjects} planning</span>
                <span>•</span>
                <span className="text-emerald-700 font-semibold">{kpis.completedProjects} done</span>
              </div>
            </div>
            <div className="text-[9px] text-slate-400 font-mono mt-0.5 leading-none">Portfolio volume</div>
          </div>

          {/* Card 2: Total Approved Budget */}
          <div id="kpi-approved-budget" className="bento-card p-2.5 sm:p-3 flex flex-col justify-between min-h-[66px]">
            <div className="flex items-center justify-between">
              <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Approved Budget</span>
              <div className="p-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                <FolderCheck className="w-3 h-3" />
              </div>
            </div>
            <div>
              <div className="text-base sm:text-lg font-bold text-slate-900 font-mono tracking-tight leading-tight">
                {formatCurrency(kpis.totalApprovedBudget)}
              </div>
              <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden mt-1">
                <div
                  className="bg-slate-900 h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, kpis.portfolioBurnRate)}%` }}
                />
              </div>
            </div>
            <div className="flex items-center justify-between text-[9px] text-slate-500 font-mono mt-0.5 leading-none">
              <span>Spent: {formatCurrency(kpis.totalProjectCost)}</span>
              <span>{kpis.portfolioBurnRate.toFixed(1)}%</span>
            </div>
          </div>

          {/* Card 3: Total Contract Value & Profit */}
          <div id="kpi-contract-value" className="bento-card p-2.5 sm:p-3 flex flex-col justify-between min-h-[66px]">
            <div className="flex items-center justify-between">
              <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Contract Value</span>
              <div className="p-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                <DollarSign className="w-3 h-3" />
              </div>
            </div>
            <div>
              <div className="text-base sm:text-lg font-bold text-slate-900 font-mono tracking-tight leading-tight">
                {formatCurrency(kpis.totalContractValue)}
              </div>
              <div className="flex items-center gap-1 mt-0.5 text-[10px] leading-tight">
                <span className="text-emerald-700 font-bold font-mono">
                  +{formatCurrency(kpis.projectedProfit)}
                </span>
                <span className="text-[9px] text-slate-500">({kpis.portfolioMarginPct.toFixed(1)}% margin)</span>
              </div>
            </div>
            <div className="text-[9px] text-slate-400 font-mono mt-0.5 leading-none">Projected profit at completion</div>
          </div>

          {/* Card 4: Average Progress & Health */}
          <div id="kpi-avg-progress" className="bento-card p-2.5 sm:p-3 flex flex-col justify-between min-h-[66px]">
            <div className="flex items-center justify-between">
              <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Avg Progress</span>
              <div className="p-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                <TrendingUp className="w-3 h-3" />
              </div>
            </div>
            <div>
              <div className="text-base sm:text-lg font-bold text-slate-900 font-mono tracking-tight leading-tight">
                {kpis.avgProgress}%
              </div>
              <div className="flex items-center gap-1.5 mt-0.5 text-[10px] leading-tight">
                <span className={kpis.atRiskCount > 0 ? 'text-rose-600 font-bold' : 'text-emerald-700 font-semibold'}>
                  {kpis.atRiskCount} at risk
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-500 font-mono text-[10px]">{atRiskProjectNames}</span>
              </div>
            </div>
            <div className="text-[9px] text-slate-400 font-mono mt-0.5 leading-none">Milestone execution rate</div>
          </div>
        </div>

        {/* Secondary Quick Metrics Row — Formal */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="bento-subbox !p-2 sm:!p-2.5 flex items-center justify-between">
            <div>
              <div className="text-[9px] uppercase font-bold text-slate-500 leading-tight">Spend vs Budget</div>
              <div className="text-xs sm:text-sm font-bold font-mono text-slate-900 leading-tight">{kpis.portfolioBurnRate.toFixed(1)}%</div>
            </div>
            <Activity className="w-3.5 h-3.5 text-slate-600" />
          </div>
          <div className="bento-subbox !p-2 sm:!p-2.5 flex items-center justify-between">
            <div>
              <div className="text-[9px] uppercase font-bold text-slate-500 leading-tight">Gross Margin</div>
              <div className="text-xs sm:text-sm font-bold font-mono text-emerald-700 leading-tight">{kpis.portfolioMarginPct.toFixed(1)}%</div>
            </div>
            <Percent className="w-3.5 h-3.5 text-emerald-700" />
          </div>
          <div className="bento-subbox !p-2 sm:!p-2.5 flex items-center justify-between">
            <div>
              <div className="text-[9px] uppercase font-bold text-slate-500 leading-tight">Contingency Reserved</div>
              <div className="text-xs sm:text-sm font-bold font-mono text-slate-900 leading-tight">{formatCurrency(kpis.totalContingencyAllocated)}</div>
            </div>
            <FolderCheck className="w-3.5 h-3.5 text-slate-600" />
          </div>
          <div className="bento-subbox !p-2 sm:!p-2.5 flex items-center justify-between">
            <div>
              <div className="text-[9px] uppercase font-bold text-slate-500 leading-tight">Variance Threshold</div>
              <div className="text-xs sm:text-sm font-bold font-mono text-amber-700 leading-tight">±{settings.amber_threshold_percent || 5}% / ±{settings.red_threshold_percent || 10}%</div>
            </div>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          </div>
        </div>
      </div>

      {/* Primary Analytical Charts: Financial Variance & Cost Distribution Side-by-Side (Reduced by 30%) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 items-stretch">
        {/* Financial Chart: Budget vs Actual Cost */}
        <div id="chart-financial-variance" className="bento-card p-3.5 sm:p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-100">
              <div>
                <h2 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Financial Variance by Project
                </h2>
                <p className="text-[11px] text-slate-500">
                  Approved contract budget compared with actual costs incurred
                </p>
              </div>
              <span className="text-[9px] font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                {settings.currency} ({settings.currency_symbol})
              </span>
            </div>

            <div className="h-44 sm:h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={financialChartData} margin={{ top: 8, right: 8, left: -14, bottom: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    angle={-12}
                    textAnchor="end"
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(val: any) => formatCurrency(Number(val))}
                    labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      color: '#0f172a',
                      fontSize: '11px',
                      padding: '6px 10px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '6px' }} />
                  <Bar dataKey="Budget" fill="#0F172A" radius={[3, 3, 0, 0]} name="Approved Budget" />
                  <Bar dataKey="Actual" fill="#0284C7" radius={[3, 3, 0, 0]} name="Actual Cost" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick Variance Summary Footer */}
          <div className="mt-2.5 pt-2 border-t border-slate-100 grid grid-cols-3 gap-1.5 text-center">
            <div className="bento-subbox !p-1.5 sm:!p-2">
              <span className="text-[8px] sm:text-[9px] uppercase font-bold text-slate-400 block">Total Budget</span>
              <span className="text-xs font-bold font-mono text-slate-900">{formatCurrency(kpis.totalApprovedBudget)}</span>
            </div>
            <div className="bento-subbox !p-1.5 sm:!p-2">
              <span className="text-[8px] sm:text-[9px] uppercase font-bold text-slate-400 block">Total Incurred</span>
              <span className="text-xs font-bold font-mono text-slate-900">{formatCurrency(kpis.totalProjectCost)}</span>
            </div>
            <div className="bento-subbox !p-1.5 sm:!p-2">
              <span className="text-[8px] sm:text-[9px] uppercase font-bold text-slate-400 block">Net Variance</span>
              <span className={`text-xs font-bold font-mono ${kpis.totalApprovedBudget >= kpis.totalProjectCost ? 'text-emerald-700' : 'text-rose-600'}`}>
                {kpis.totalApprovedBudget >= kpis.totalProjectCost ? '+' : ''}{formatCurrency(kpis.totalApprovedBudget - kpis.totalProjectCost)}
              </span>
            </div>
          </div>
        </div>

        {/* Cost Distribution Graph (Side-by-Side with Financial Variance) */}
        <div id="chart-cost-distribution" className="flex">
          <CostDistributionCard className="w-full h-full" compact />
        </div>
      </div>

      {/* Progress Chart: Planned vs Actual Completion (Full Width Row) */}
      <div className="bento-card p-5 flex flex-col">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Schedule Milestone Execution
            </h2>
            <p className="text-xs text-slate-500">
              Planned schedule execution benchmark vs. verified field completion
            </p>
          </div>
          <span className="text-[10px] font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            0 - 100%
          </span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={progressChartData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: '#64748b' }}
                angle={-15}
                textAnchor="end"
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickFormatter={(val) => `${val}%`}
              />
              <Tooltip
                formatter={(val: any) => `${val}%`}
                labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label}
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  color: '#0f172a',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar dataKey="Planned" fill="#334155" radius={[4, 4, 0, 0]} name="Planned Schedule %" />
              <Bar dataKey="Actual" fill="#059669" radius={[4, 4, 0, 0]} name="Actual Field Progress %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Data Analytics: Project Cost Incurred by Month & Cost per Square Foot Benchmark */}
      <ProjectAnalyticsCards
        onNavigate={onNavigate}
        onSelectProject={onSelectProject}
      />

      {/* Parametric Cost Benchmark */}
      <ParametricCostStudio
        onNavigate={onNavigate}
        onOpenNewProjectWithParams={(params) => {
          if (onOpenNewProject) {
            onOpenNewProject();
          } else {
            onNavigate('projects');
          }
        }}
      />

      {/* Project Performance Ledger Table */}
      <div className="bento-card overflow-hidden flex flex-col">
        <div className="bento-header bg-slate-50/60">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider ">
              Active Project Performance Ledger
            </h2>
            <p className="text-xs text-slate-500">
              Live variance tracking and operational health status across ongoing jobs
            </p>
          </div>
          <button
            data-html2canvas-ignore="true"
            onClick={() => onNavigate('projects')}
            className="text-[10px] text-[#0F172A] hover:text-cyan-600 font-bold uppercase tracking-wider transition-colors cursor-pointer"
          >
            View All Projects ({projects.length}) →
          </button>
        </div>

        <div className="overflow-x-auto touch-pan-x scrollbar-thin">
          <table className="w-full text-left border-collapse min-w-[620px]">
            <thead className="bg-white text-slate-400 uppercase text-[9px] font-bold sticky top-0 border-b border-slate-100">
              <tr>
                <th className="px-3.5 sm:px-6 py-3">Project & Client</th>
                <th className="px-3.5 sm:px-6 py-3 text-right">Budget (Approved)</th>
                <th className="px-3.5 sm:px-6 py-3 text-right">Actual Cost</th>
                <th className="px-3.5 sm:px-6 py-3 text-center">Progress</th>
                <th className="px-3.5 sm:px-6 py-3 text-right">Variance</th>
                <th className="px-3.5 sm:px-6 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-slate-100">
              {projects.map((proj) => {
                const client = clients.find((c) => c.id === proj.client_id);
                const actualCost = proj.actual_cost || 0;
                const variance = proj.approved_budget - actualCost;
                const isUnderBudget = variance >= 0;
                const forecast =
                  actualCost +
                  Math.max(0, proj.forecast_remaining ?? (proj.approved_budget - actualCost));
                const health = calculateProjectHealth(
                  proj,
                  actualCost,
                  forecast,
                  settings.amber_threshold_percent,
                  settings.red_threshold_percent
                );

                return (
                  <tr
                    key={proj.id}
                    id={`project-perf-row-${proj.id}`}
                    onClick={() => onSelectProject(proj.id)}
                    className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                  >
                    <td className="px-3.5 sm:px-6 py-3 sm:py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded bg-slate-100 text-[#0F172A] font-bold flex items-center justify-center text-[10px] font-mono shrink-0">
                          {proj.type.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 group-hover:text-amber-600 transition-colors">
                            {proj.name}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {client?.name || 'Client'} • {proj.location}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3.5 sm:px-6 py-3 sm:py-3.5 text-right font-mono text-slate-600">
                      {formatCurrency(proj.approved_budget)}
                    </td>
                    <td className="px-3.5 sm:px-6 py-3 sm:py-3.5 text-right font-mono font-bold text-[#0F172A]">
                      {formatCurrency(actualCost)}
                    </td>
                    <td className="px-3.5 sm:px-6 py-3 sm:py-3.5">
                      <div className="flex items-center justify-center gap-2">
                        <span className="font-bold text-slate-700 w-8 text-right">
                          {proj.progress || 0}%
                        </span>
                        <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              proj.progress === 100
                                ? 'bg-emerald-500'
                                : (proj.progress || 0) > 50
                                ? 'bg-amber-500'
                                : 'bg-slate-700'
                            }`}
                            style={{ width: `${proj.progress || 0}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-3.5 sm:px-6 py-3 sm:py-3.5 text-right font-mono font-bold">
                      <span className={isUnderBudget ? 'text-emerald-600' : 'text-rose-600'}>
                        {isUnderBudget ? '-' : '+'}
                        {formatCurrency(Math.abs(variance))}
                      </span>
                    </td>
                    <td className="px-3.5 sm:px-6 py-3 sm:py-3.5 text-center">
                      <HealthBadge status={health} size="sm" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating Success Toast (PDF) */}
      {showSuccessToast && (
        <div
          data-html2canvas-ignore="true"
          className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-2xl border border-slate-700 flex items-center gap-3 text-xs animate-in slide-in-from-bottom-3 duration-150"
        >
          <div className="w-7 h-7 rounded-md bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">
            <CheckCircle2 className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="font-bold text-white">
              Executive Dashboard Exported
            </div>
            <div className="text-slate-400 text-[11px]">
              Summary report generated with live portfolio KPIs & charts.
            </div>
          </div>
        </div>
      )}

      {/* Floating Quick Action Success Toast */}
      {quickActionToast && (
        <div
          data-html2canvas-ignore="true"
          className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-3 text-xs animate-in slide-in-from-bottom-5 duration-150"
        >
          <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold shrink-0">
            <CheckCircle2 className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="font-bold text-white ">
              Action Recorded
            </div>
            <div className="text-slate-300 text-[11px]">
              {quickActionToast}
            </div>
          </div>
        </div>
      )}

      {/* Quick Action Modals */}
      <CreateProjectModal
        isOpen={isCreateProjectOpen}
        onClose={() => setIsCreateProjectOpen(false)}
        onSuccess={(id) => {
          setIsCreateProjectOpen(false);
          triggerToast('New project created and initialized successfully.');
          onSelectProject(id);
        }}
      />

      <AddLabourModal
        isOpen={isAddLabourOpen}
        onClose={() => setIsAddLabourOpen(false)}
        onSuccess={(msg) => triggerToast(msg)}
      />

      <AddMaterialModal
        isOpen={isAddMaterialOpen}
        onClose={() => setIsAddMaterialOpen(false)}
        onSuccess={(msg) => triggerToast(msg)}
      />

      <AddExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        onSuccess={(msg) => triggerToast(msg)}
      />

      <TakePhotoModal
        isOpen={isTakePhotoOpen}
        onClose={() => setIsTakePhotoOpen(false)}
        onSuccess={(msg) => triggerToast(msg)}
      />
    </div>
  );
};
