import React, { useState, useMemo } from 'react';
import { useBuild } from '../../context/BuildContext';
import { CostCategory, Project } from '../../types';
import {
  formatCurrency,
  formatPercent,
  calculateProjectHealth,
} from '../../utils/formatters';
import { HealthBadge } from '../common/HealthBadge';
import { ProjectDocumentsTab } from './ProjectDocumentsTab';
import { ProjectMilestonesTab } from './ProjectMilestonesTab';
import { ProjectTimeline } from './ProjectTimeline';
import { ProjectGanttChart } from './ProjectGanttChart';
import {
  Building2,
  Calendar,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Edit3,
  Clock,
  MapPin,
  Maximize2,
  Layers,
  ArrowLeft,
  Plus,
  Receipt,
  ClipboardList,
  GitFork,
  Check,
  FolderOpen,
  FileText,
  BarChart2,
  Mail,
  Flag,
} from 'lucide-react';

interface ProjectOverviewProps {
  projectId: string;
  onBack: () => void;
  onNavigateToTab: (tab: string, contextId?: string) => void;
  onOpenAddCost: (projectId: string) => void;
  onOpenAddSiteReport: (projectId: string) => void;
}

export const ProjectOverview: React.FC<ProjectOverviewProps> = ({
  projectId,
  onBack,
  onNavigateToTab,
  onOpenAddCost,
  onOpenAddSiteReport,
}) => {
  const {
    projects,
    clients,
    wbsItems,
    costs,
    siteReports,
    alerts,
    updateProject,
    completeProject,
    settings,
    documents,
    milestones,
  } = useBuild();

  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'milestones' | 'gantt' | 'timeline' | 'documents'>('overview');

  const project = projects.find((p) => p.id === projectId);
  const client = clients.find((c) => c.id === project?.client_id);
  const projectMilestones = useMemo(
    () => milestones.filter((m) => m.project_id === projectId),
    [milestones, projectId]
  );
  const projectDocs = useMemo(
    () => documents.filter((d) => d.project_id === projectId),
    [documents, projectId]
  );
  const projectAlerts = useMemo(
    () => (alerts || []).filter((a) => a.project_id === projectId),
    [alerts, projectId]
  );

  // Remaining forecast cost editor (Section 12)
  const [isEditingForecast, setIsEditingForecast] = useState(false);
  const [forecastRemainingInput, setForecastRemainingInput] = useState(
    project?.forecast_remaining?.toString() || '0'
  );

  if (!project) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <p className="text-slate-600 font-medium">Project not found.</p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 rounded-lg bg-linear-to-r from-cyan-600 to-lime-600 hover:from-cyan-700 hover:to-lime-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer "
        >
          Return to Projects
        </button>
      </div>
    );
  }

  // Costs for this project
  const projectCosts = costs.filter((c) => c.project_id === project.id);
  const actualCost = project.actual_cost || 0;

  // Forecast calculations (Section 12)
  const forecastRemaining =
    project.forecast_remaining !== undefined
      ? project.forecast_remaining
      : Math.max(0, project.approved_budget - actualCost);

  const forecastCost = actualCost + forecastRemaining;
  const budgetCostVariance = project.approved_budget - forecastCost; // Budget - Forecast Cost
  const projectedProfit = project.contract_value - forecastCost; // Contract Value - Forecast Cost
  const projectedMargin =
    project.contract_value > 0 ? (projectedProfit / project.contract_value) * 100 : 0;

  // Health Calculation
  const health = calculateProjectHealth(
    project,
    actualCost,
    forecastCost,
    settings.amber_threshold_percent,
    settings.red_threshold_percent
  );

  // Schedule status evaluation
  const plannedEndDate = new Date(project.planned_completion);
  const now = new Date();
  const scheduleStatus =
    project.status === 'Completed'
      ? 'Completed'
      : now > plannedEndDate && (project.progress || 0) < 100
      ? 'Behind Schedule'
      : (project.progress || 0) >= 90
      ? 'Ahead of Schedule'
      : 'On Schedule';

  // Budget category breakdowns (Section 10)
  // Labour, Materials, Subcontractors, Equipment, Other
  const categories: CostCategory[] = ['Labour', 'Materials', 'Subcontractor', 'Equipment', 'Other'];

  // Realistic baseline weight distribution across categories
  const categoryWeights: Record<CostCategory, number> = {
    Labour: 0.28,
    Materials: 0.45,
    Subcontractor: 0.18,
    Equipment: 0.06,
    Other: 0.03,
  };

  const budgetBreakdown = categories.map((cat) => {
    const catBudget = Math.round(project.approved_budget * categoryWeights[cat]);
    const catActual = projectCosts
      .filter((c) => c.category === cat)
      .reduce((sum, c) => sum + c.amount, 0);
    const catVariance = catBudget - catActual;
    return {
      category: cat,
      budget: catBudget,
      actual: catActual,
      variance: catVariance,
    };
  });

  const handleSaveForecast = () => {
    const val = Math.max(0, Number(forecastRemainingInput));
    updateProject(project.id, { forecast_remaining: val });
    setIsEditingForecast(false);
  };

  const handleComplete = () => {
    if (
      window.confirm(
        'Confirm completion: Mark this project as 100% Completed and archive its final cost, metrics, and duration into the Historical Benchmarks database?'
      )
    ) {
      completeProject(project.id);
    }
  };

  const projectWbs = wbsItems.filter((w) => w.project_id === project.id);
  const projectReports = siteReports.filter((r) => r.project_id === project.id);

  return (
    <div id="project-overview-dashboard" className="space-y-5 pb-12">
      {/* Bento Header & Navigation */}
      <div className="bento-card p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
            title="Back to Projects"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                {project.project_number}
              </span>
              <HealthBadge status={health} size="sm" />
              <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                {project.status}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1 font-sans">
              {project.name}
            </h1>
            <p className="text-xs text-slate-500">
              Client: <strong className="text-slate-700">{client?.name || 'Client'}</strong> • Manager: {project.project_manager} • Location: {project.location}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {project.status === 'Active' && (
            <button
              id="btn-complete-project-header"
              onClick={handleComplete}
              className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Complete & Archive</span>
            </button>
          )}

          <button
            onClick={() => onOpenAddCost(project.id)}
            className="px-3 py-2 rounded-lg bg-linear-to-r from-cyan-500 to-lime-500 hover:from-cyan-600 hover:to-lime-600 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer "
          >
            <Plus className="w-4 h-4" />
            <span>Record Cost</span>
          </button>

          <button
            onClick={() => onOpenAddSiteReport(project.id)}
            className="px-3 py-2 rounded-lg bg-white hover:bg-cyan-50/60 text-cyan-800 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-cyan-300 shadow-xs "
          >
            <ClipboardList className="w-4 h-4 text-cyan-600" />
            <span>Site Report</span>
          </button>
        </div>
      </div>

      {/* Sub-Tab Navigation: Overview & Financials vs Milestones vs Gantt vs Timeline vs Documents */}
      <div className="flex items-center gap-1 border-b border-slate-200">
        <button
          id="tab-btn-project-overview"
          onClick={() => setActiveSubTab('overview')}
          className={`h-10 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer inline-flex items-center gap-2 shrink-0 ${
            activeSubTab === 'overview'
              ? 'border-cyan-500 text-cyan-900 bg-cyan-50/40 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-cyan-700 hover:bg-lime-50/50'
          }`}
        >
          <Layers className="w-4 h-4 text-cyan-600" />
          <span>Overview & Financials</span>
        </button>

        <button
          id="tab-btn-project-milestones"
          onClick={() => setActiveSubTab('milestones')}
          className={`h-10 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer inline-flex items-center gap-2 shrink-0 ${
            activeSubTab === 'milestones'
              ? 'border-cyan-500 text-cyan-900 bg-cyan-50/40 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-cyan-700 hover:bg-lime-50/50'
          }`}
        >
          <Flag className="w-4 h-4 text-amber-600" />
          <span>Milestones & Critical Path</span>
          <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded-full border border-amber-300">
            {projectMilestones.length}
          </span>
        </button>

        <button
          id="tab-btn-project-gantt"
          onClick={() => setActiveSubTab('gantt')}
          className={`h-10 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer inline-flex items-center gap-2 shrink-0 ${
            activeSubTab === 'gantt'
              ? 'border-cyan-500 text-cyan-900 bg-cyan-50/40 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-cyan-700 hover:bg-lime-50/50'
          }`}
        >
          <BarChart2 className="w-4 h-4 text-cyan-600" />
          <span>Gantt Schedule</span>
          <span className="text-[10px] font-mono font-bold bg-cyan-100 text-cyan-800 px-1.5 py-0.2 rounded-full border border-cyan-200">
            {projectWbs.length}
          </span>
        </button>

        <button
          id="tab-btn-project-timeline"
          onClick={() => setActiveSubTab('timeline')}
          className={`h-10 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer inline-flex items-center gap-2 shrink-0 ${
            activeSubTab === 'timeline'
              ? 'border-cyan-500 text-cyan-900 bg-cyan-50/40 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-cyan-700 hover:bg-lime-50/50'
          }`}
        >
          <Clock className="w-4 h-4 text-cyan-600" />
          <span>Chronological Timeline</span>
          <span className="text-[10px] font-mono font-bold bg-cyan-100 text-cyan-800 px-1.5 py-0.2 rounded-full border border-cyan-200">
            {projectCosts.length + projectReports.length + projectDocs.length}
          </span>
        </button>

        <button
          id="tab-btn-project-documents"
          onClick={() => setActiveSubTab('documents')}
          className={`h-10 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer inline-flex items-center gap-2 shrink-0 ${
            activeSubTab === 'documents'
              ? 'border-cyan-500 text-cyan-900 bg-cyan-50/40 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-cyan-700 hover:bg-lime-50/50'
          }`}
        >
          <FolderOpen className="w-4 h-4 text-cyan-600" />
          <span>Documents & Attachments</span>
          <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded-full border border-slate-200">
            {projectDocs.length}
          </span>
        </button>
      </div>

      {/* Conditional Sub-Tab View */}
      {activeSubTab === 'milestones' ? (
        <ProjectMilestonesTab project={project} />
      ) : activeSubTab === 'documents' ? (
        <ProjectDocumentsTab project={project} />
      ) : activeSubTab === 'timeline' ? (
        <ProjectTimeline
          project={project}
          costs={projectCosts}
          siteReports={projectReports}
          documents={projectDocs}
          onNavigateToTab={onNavigateToTab}
          onOpenAddCost={onOpenAddCost}
          onOpenAddSiteReport={onOpenAddSiteReport}
        />
      ) : activeSubTab === 'gantt' ? (
        <ProjectGanttChart
          project={project}
          wbsItems={wbsItems}
          onNavigateToTab={onNavigateToTab}
          compact={false}
        />
      ) : (
        <>
          {/* Top 4 Financial Bento Metric Cards (Contract, Budget, Actual, Forecast Cost) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Contract Value */}
        <div className="bento-card p-4.5 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            Contract Value
          </span>
          <div className="text-xl font-bold text-slate-900 mt-1 font-mono">
            {formatCurrency(project.contract_value)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Agreed Client Price</div>
        </div>

        {/* Approved Budget */}
        <div className="bento-card p-4.5 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            Approved Budget
          </span>
          <div className="text-xl font-bold text-slate-900 mt-1 font-mono">
            {formatCurrency(project.approved_budget)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Approved Project Baseline</div>
        </div>

        {/* Actual Cost */}
        <div className="bento-card p-4.5 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            Actual Cost to Date
          </span>
          <div className="text-xl font-bold text-amber-600 mt-1 font-mono">
            {formatCurrency(actualCost)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {projectCosts.length} verified cost records
          </div>
        </div>

        {/* Forecast Cost (Actual + Remaining) */}
        <div className="bento-card p-4.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Forecast Cost
            </span>
            <button
              onClick={() => {
                setForecastRemainingInput(forecastRemaining.toString());
                setIsEditingForecast(!isEditingForecast);
              }}
              className="text-[10px] text-amber-600 hover:text-amber-700 flex items-center gap-0.5 font-bold cursor-pointer"
            >
              <Edit3 className="w-3 h-3" />
              <span>{isEditingForecast ? 'Cancel' : 'Edit PM Est.'}</span>
            </button>
          </div>

          {isEditingForecast ? (
            <div className="mt-1 flex items-center gap-1.5">
              <input
                type="number"
                value={forecastRemainingInput}
                onChange={(e) => setForecastRemainingInput(e.target.value)}
                className="w-full px-2 py-1 text-xs border border-cyan-400 rounded focus:ring-1 focus:ring-cyan-500 font-mono"
                placeholder="Remaining Est. CAD"
              />
              <button
                onClick={handleSaveForecast}
                className="p-1.5 bg-cyan-600 text-white rounded hover:bg-lime-500 cursor-pointer transition-all"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="text-xl font-bold text-slate-900 mt-1 font-mono">
              {formatCurrency(forecastCost)}
            </div>
          )}

          <div className="text-[10px] text-slate-400 mt-0.5">
            Actual + C${forecastRemaining.toLocaleString()} remaining
          </div>
        </div>
      </div>

      {/* Second Bento Row: Profitability, Margin, Cost Variance, Health & Schedule */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Projected Profit */}
        <div className="bento-card p-4.5 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            Projected Profit
          </span>
          <div
            className={`text-xl font-bold mt-1 font-mono ${
              projectedProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {formatCurrency(projectedProfit)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Contract − Forecast Cost</div>
        </div>

        {/* Projected Margin */}
        <div className="bento-card p-4.5 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            Projected Margin
          </span>
          <div
            className={`text-xl font-bold mt-1 font-mono ${
              projectedMargin >= 10 ? 'text-emerald-600' : projectedMargin >= 0 ? 'text-amber-600' : 'text-rose-600'
            }`}
          >
            {formatPercent(projectedMargin)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Profit ÷ Contract Value</div>
        </div>

        {/* Cost Variance */}
        <div className="bento-card p-4.5 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            Cost Variance
          </span>
          <div
            className={`text-xl font-bold mt-1 font-mono ${
              budgetCostVariance >= 0 ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {budgetCostVariance >= 0 ? '+' : ''}
            {formatCurrency(budgetCostVariance)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Budget − Forecast Cost</div>
        </div>

        {/* Schedule & Health Status */}
        <div className="bento-card p-4.5 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            Schedule & Health
          </span>
          <div className="flex items-center gap-2 mt-1.5">
            <HealthBadge status={health} size="sm" />
            <span className="text-xs font-semibold text-slate-700">{scheduleStatus}</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Planned finish: {project.planned_completion}
          </div>
        </div>
      </div>

      {/* Bento Progress & Specifications Container */}
      <div className="bento-card p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Operational Progress
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-bold text-slate-900 font-mono">
                {project.progress || 0}%
              </span>
              <span className="text-xs text-slate-500">
                Calculated dynamically from {projectWbs.filter((w) => !w.is_phase).length} WBS activity milestones
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-slate-600 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
            <div>
              Area: <strong className="text-slate-900">{project.floor_area} m²</strong>
            </div>
            <div>
              Levels: <strong className="text-slate-900">{project.floors} Floors</strong>
            </div>
            <div>
              Cost/m²: <strong className="text-amber-700">{formatCurrency(actualCost / (project.floor_area || 1))}/m²</strong>
            </div>
          </div>
        </div>

        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              project.progress === 100
                ? 'bg-emerald-500'
                : (project.progress || 0) > 50
                ? 'bg-amber-500'
                : 'bg-sky-500'
            }`}
            style={{ width: `${project.progress || 0}%` }}
          />
        </div>
      </div>

      {/* Interactive Gantt Timeline Visualization */}
      <ProjectGanttChart
        project={project}
        wbsItems={wbsItems}
        onNavigateToTab={onNavigateToTab}
        compact={true}
        onExpandFull={() => setActiveSubTab('gantt')}
      />

      {/* Bento Budget Breakdown Table */}
      <div className="bento-card overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 font-sans">
              Budget Categories & Expenditure Breakdown
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Tracking approved budget allocation, recorded actuals, and category variance
            </p>
          </div>
          <span className="text-xs font-mono font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded">
            CAD (C$)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Cost Category</th>
                <th className="py-3 px-4 text-right">Budget</th>
                <th className="py-3 px-4 text-right">Actual Cost</th>
                <th className="py-3 px-4 text-right">Variance</th>
                <th className="py-3 px-4 text-center">Expenditure %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-xs">
              {budgetBreakdown.map((row) => {
                const isUnder = row.variance >= 0;
                const spendPct = row.budget > 0 ? Math.round((row.actual / row.budget) * 100) : 0;

                return (
                  <tr key={row.category} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-sans font-semibold text-slate-900 text-sm">
                      {row.category}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-600">
                      {formatCurrency(row.budget)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      {formatCurrency(row.actual)}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold">
                      <span className={isUnder ? 'text-emerald-700' : 'text-rose-700'}>
                        {isUnder ? '+' : ''}
                        {formatCurrency(row.variance)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded font-bold text-xs ${
                          spendPct > 100
                            ? 'bg-rose-100 text-rose-800'
                            : spendPct > 75
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {spendPct}%
                      </span>
                    </td>
                  </tr>
                );
              })}
              {/* Total Row */}
              <tr className="bg-slate-50/80 font-bold border-t-2 border-slate-200">
                <td className="py-3.5 px-4 font-sans text-sm text-slate-900">Total Project</td>
                <td className="py-3.5 px-4 text-right text-slate-900">
                  {formatCurrency(project.approved_budget)}
                </td>
                <td className="py-3.5 px-4 text-right text-amber-800">
                  {formatCurrency(actualCost)}
                </td>
                <td className="py-3.5 px-4 text-right">
                  <span
                    className={
                      project.approved_budget - actualCost >= 0
                        ? 'text-emerald-700'
                        : 'text-rose-700'
                    }
                  >
                    {project.approved_budget - actualCost >= 0 ? '+' : ''}
                    {formatCurrency(project.approved_budget - actualCost)}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-center font-sans text-xs">
                  {project.approved_budget > 0
                    ? Math.round((actualCost / project.approved_budget) * 100)
                    : 0}
                  % spent
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Embedded Chronological Activity Timeline */}
      <ProjectTimeline
        project={project}
        costs={projectCosts}
        siteReports={projectReports}
        documents={projectDocs}
        onNavigateToTab={onNavigateToTab}
        onOpenAddCost={onOpenAddCost}
        onOpenAddSiteReport={onOpenAddSiteReport}
      />

      {/* Bento Quick Access to Milestones, WBS, Costs, Site Reports, Documents */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {/* Critical Milestones Bento Card */}
        <div className="bento-card p-5 flex flex-col justify-between hover:border-amber-400/80 hover:shadow-md transition-all">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase text-slate-500">Critical Milestones</span>
              <Flag className="w-4 h-4 text-amber-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-bold text-slate-900 font-mono">
                {projectMilestones.filter((m) => m.status === 'Achieved').length} / {projectMilestones.length}
              </div>
              <span className="text-xs font-bold text-amber-700 font-mono">
                {projectMilestones.length > 0
                  ? Math.round((projectMilestones.filter((m) => m.status === 'Achieved').length / projectMilestones.length) * 100)
                  : 0}%
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {projectMilestones.filter((m) => m.is_critical_path).length} critical path dates controlling handover
            </p>
          </div>
          <button
            id="btn-overview-open-milestones"
            onClick={() => setActiveSubTab('milestones')}
            className="mt-4 text-xs font-semibold text-amber-800 hover:text-amber-900 flex items-center justify-between cursor-pointer pt-2 border-t border-slate-100"
          >
            <span>Track Milestones</span>
            <span>&rarr;</span>
          </button>
        </div>

        {/* WBS Bento Card */}
        <div className="bento-card p-5 flex flex-col justify-between hover:border-amber-400/80 hover:shadow-md transition-all">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase text-slate-500">WBS & Activities</span>
              <GitFork className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-bold text-slate-900 font-mono">
              {projectWbs.filter((w) => !w.is_phase).length}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Active milestones across {projectWbs.filter((w) => w.is_phase).length} construction phases
            </p>
          </div>
          <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => onNavigateToTab('wbs', project.id)}
              className="text-xs font-semibold text-cyan-700 hover:text-cyan-800 flex items-center gap-1 cursor-pointer"
            >
              <span>Manage WBS</span>
              <span>&rarr;</span>
            </button>
            <button
              id="btn-wbs-card-open-gantt"
              onClick={() => setActiveSubTab('gantt')}
              className="text-xs font-semibold text-slate-600 hover:text-cyan-700 flex items-center gap-1 cursor-pointer"
            >
              <span>Gantt Chart</span>
              <BarChart2 className="w-3.5 h-3.5 text-cyan-600" />
            </button>
          </div>
        </div>

        {/* Cost Records Bento Card */}
        <div className="bento-card p-5 flex flex-col justify-between hover:border-amber-400/80 hover:shadow-md transition-all">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase text-slate-500">Cost Records</span>
              <Receipt className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-bold text-slate-900 font-mono">
              {projectCosts.length}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Recorded expenditures totaling {formatCurrency(actualCost)}
            </p>
          </div>
          <button
            onClick={() => onNavigateToTab('costs', project.id)}
            className="mt-4 text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1 cursor-pointer pt-2 border-t border-slate-100"
          >
            <span>View All Cost Records</span>
            <span>&rarr;</span>
          </button>
        </div>

        {/* Site Reports Bento Card */}
        <div className="bento-card p-5 flex flex-col justify-between hover:border-amber-400/80 hover:shadow-md transition-all">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase text-slate-500">Site Reports</span>
              <ClipboardList className="w-4 h-4 text-slate-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-bold text-slate-900 font-mono">
                {projectReports.length}
              </div>
              {projectAlerts.length > 0 && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                  <Mail className="w-3 h-3 text-amber-700" />
                  {projectAlerts.length} PM Alert{projectAlerts.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Supervisory field logs with site photos, delay flags & PM alerts
            </p>
          </div>
          <button
            onClick={() => onNavigateToTab('site_reports', project.id)}
            className="mt-4 text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1 cursor-pointer pt-2 border-t border-slate-100"
          >
            <span>View Site Reports & Photos</span>
            <span>&rarr;</span>
          </button>
        </div>

        {/* Documents & Attachments Bento Card */}
        <div className="bento-card p-5 flex flex-col justify-between hover:border-amber-400/80 hover:shadow-md transition-all">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase text-slate-500">Documents & Files</span>
              <FolderOpen className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-bold text-slate-900 font-mono">
              {projectDocs.length}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Blueprints, executed contracts, municipal permits & specs
            </p>
          </div>
          <button
            onClick={() => setActiveSubTab('documents')}
            className="mt-4 text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1 cursor-pointer pt-2 border-t border-slate-100"
          >
            <span>View Project Documents</span>
            <span>&rarr;</span>
          </button>
        </div>
      </div>
    </>
  )}
    </div>
  );
};
