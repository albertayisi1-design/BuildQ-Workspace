import React, { useState, useMemo } from 'react';
import { useBuild } from '../../context/BuildContext';
import { Project, ProjectMilestone, MilestoneStatus } from '../../types';
import { formatDate } from '../../utils/formatters';
import { DefineMilestoneModal } from './DefineMilestoneModal';
import { RecordMilestoneActualModal } from './RecordMilestoneActualModal';
import {
  Flag,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Search,
  Plus,
  Edit3,
  Trash2,
  Layers,
  User,
  Sparkles,
  TrendingUp,
  AlertCircle,
  FileText,
  SlidersHorizontal,
  ChevronRight,
  ShieldCheck,
  Check,
} from 'lucide-react';

interface ProjectMilestonesTabProps {
  project: Project;
}

export const ProjectMilestonesTab: React.FC<ProjectMilestonesTabProps> = ({ project }) => {
  const { milestones, createMilestone, updateMilestone, deleteMilestone } = useBuild();

  // Modal states
  const [isDefineModalOpen, setIsDefineModalOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<ProjectMilestone | null>(null);
  const [recordActualMilestone, setRecordActualMilestone] = useState<ProjectMilestone | null>(null);

  // Filters and search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'critical' | 'Achieved' | 'In Progress' | 'Pending' | 'Delayed'>('all');
  const [activeView, setActiveView] = useState<'matrix' | 'visual'>('matrix');

  // Milestones for this specific project
  const projectMilestones = useMemo(() => {
    return milestones
      .filter((m) => m.project_id === project.id)
      .sort((a, b) => (a.planned_date > b.planned_date ? 1 : -1));
  }, [milestones, project.id]);

  // Comprehensive Milestone & Critical Path Metrics
  const metrics = useMemo(() => {
    const total = projectMilestones.length;
    const achieved = projectMilestones.filter((m) => m.status === 'Achieved').length;
    const inProgress = projectMilestones.filter((m) => m.status === 'In Progress').length;
    const pending = projectMilestones.filter((m) => m.status === 'Pending').length;
    const delayed = projectMilestones.filter((m) => m.status === 'Delayed').length;

    const criticalPathItems = projectMilestones.filter((m) => m.is_critical_path);
    const criticalAchieved = criticalPathItems.filter((m) => m.status === 'Achieved').length;

    // Calculate critical path net variance (days slippage or ahead on completed & in-progress items)
    const criticalWithVariance = criticalPathItems.filter((m) => (m.variance_days !== undefined && m.variance_days !== 0) || m.status === 'Delayed');
    const netVarianceDays = criticalPathItems.reduce((acc, m) => acc + (m.variance_days || 0), 0);

    // Identify next upcoming critical milestone
    const todayStr = new Date().toISOString().split('T')[0];
    const nextCritical = criticalPathItems.find(
      (m) => m.status !== 'Achieved'
    ) || projectMilestones.find((m) => m.status !== 'Achieved');

    let daysToNext: number | null = null;
    if (nextCritical) {
      const today = new Date().getTime();
      const target = new Date(nextCritical.planned_date).getTime();
      daysToNext = Math.round((target - today) / (1000 * 60 * 60 * 24));
    }

    const completionRate = total > 0 ? Math.round((achieved / total) * 100) : 0;

    return {
      total,
      achieved,
      inProgress,
      pending,
      delayed,
      criticalTotal: criticalPathItems.length,
      criticalAchieved,
      netVarianceDays,
      nextCritical,
      daysToNext,
      completionRate,
      criticalWithVariance: criticalWithVariance.length,
    };
  }, [projectMilestones]);

  // Filtered milestones
  const filteredMilestones = useMemo(() => {
    return projectMilestones.filter((m) => {
      // Status & Critical Path filters
      if (statusFilter === 'critical' && !m.is_critical_path) return false;
      if (statusFilter === 'Achieved' && m.status !== 'Achieved') return false;
      if (statusFilter === 'In Progress' && m.status !== 'In Progress') return false;
      if (statusFilter === 'Pending' && m.status !== 'Pending') return false;
      if (statusFilter === 'Delayed' && m.status !== 'Delayed' && !(m.variance_days && m.variance_days > 0)) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = m.title.toLowerCase().includes(q);
        const matchesCategory = m.category.toLowerCase().includes(q);
        const matchesLead = (m.responsible_party || '').toLowerCase().includes(q);
        const matchesDesc = (m.description || '').toLowerCase().includes(q);
        const matchesNotes = (m.notes || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesCategory && !matchesLead && !matchesDesc && !matchesNotes) {
          return false;
        }
      }

      return true;
    });
  }, [projectMilestones, statusFilter, searchQuery]);

  // Handler to open create modal
  const handleOpenCreate = () => {
    setEditingMilestone(null);
    setIsDefineModalOpen(true);
  };

  // Handler to open edit modal
  const handleOpenEdit = (m: ProjectMilestone) => {
    setEditingMilestone(m);
    setIsDefineModalOpen(true);
  };

  // Handler to save milestone
  const handleSaveMilestone = (data: Omit<ProjectMilestone, 'id' | 'created_at'>, id?: string) => {
    if (id) {
      updateMilestone(id, data);
    } else {
      createMilestone(data);
    }
  };

  // Handler to delete milestone
  const handleDeleteMilestone = (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete the critical path milestone "${title}"?`)) {
      deleteMilestone(id);
    }
  };

  // Handler to record actual completion
  const handleConfirmActual = (id: string, actualDate: string, notes?: string) => {
    updateMilestone(id, {
      actual_date: actualDate,
      status: 'Achieved',
      progress: 100,
      notes,
    });
  };

  // Determine schedule variance pill styling and label
  const renderVariancePill = (m: ProjectMilestone) => {
    const today = new Date().toISOString().split('T')[0];

    // If already achieved
    if (m.status === 'Achieved') {
      const v = m.variance_days || 0;
      if (v === 0) {
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Check className="w-3.5 h-3.5" />
            <span>On Target (0d)</span>
          </span>
        );
      } else if (v > 0) {
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>+{v}d Delay</span>
          </span>
        );
      } else {
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-cyan-50 text-cyan-800 border border-cyan-200">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{Math.abs(v)}d Ahead</span>
          </span>
        );
      }
    }

    // If delayed status
    if (m.status === 'Delayed') {
      const v = m.variance_days || 0;
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          <span>{v > 0 ? `+${v}d Slippage` : 'Schedule At Risk'}</span>
        </span>
      );
    }

    // If pending or in progress, check if overdue relative to today
    if (m.planned_date < today) {
      const p = new Date(m.planned_date).getTime();
      const t = new Date(today).getTime();
      const overdueDays = Math.round((t - p) / (1000 * 60 * 60 * 24));
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">
          <Clock className="w-3.5 h-3.5 text-rose-600" />
          <span>Overdue by {overdueDays}d</span>
        </span>
      );
    }

    // In progress or pending with future planned date
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
        <Clock className="w-3.5 h-3.5 text-slate-400" />
        <span>On Baseline Schedule</span>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Milestone Progress Card */}
        <div className="bento-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Milestones Progress
              </span>
              <div className="w-6 h-6 rounded-md bg-cyan-100 flex items-center justify-center text-cyan-800">
                <Flag className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-bold text-slate-900 font-mono">
                {metrics.achieved} / {metrics.total}
              </div>
              <span className="text-xs font-bold text-cyan-700 font-mono">
                {metrics.completionRate}%
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {metrics.criticalAchieved} of {metrics.criticalTotal} critical path items achieved
            </p>
          </div>
          {/* Visual Progress Bar */}
          <div className="mt-3 w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-cyan-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${metrics.completionRate}%` }}
            />
          </div>
        </div>

        {/* Critical Path Schedule Variance */}
        <div className="bento-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Critical Path Variance
              </span>
              <div className={`w-6 h-6 rounded-md flex items-center justify-center ${
                metrics.netVarianceDays > 0
                  ? 'bg-rose-100 text-rose-700'
                  : 'bg-emerald-100 text-emerald-700'
              }`}>
                {metrics.netVarianceDays > 0 ? (
                  <AlertCircle className="w-3.5 h-3.5" />
                ) : (
                  <ShieldCheck className="w-3.5 h-3.5" />
                )}
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <div className={`text-2xl font-bold font-mono ${
                metrics.netVarianceDays > 0
                  ? 'text-rose-600'
                  : metrics.netVarianceDays < 0
                  ? 'text-cyan-800'
                  : 'text-emerald-700'
              }`}>
                {metrics.netVarianceDays > 0
                  ? `+${metrics.netVarianceDays} Days`
                  : metrics.netVarianceDays < 0
                  ? `${metrics.netVarianceDays} Days`
                  : '0 Days (On Time)'}
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {metrics.netVarianceDays > 0
                ? 'Baseline critical path delay recorded'
                : 'Pacing on or ahead of critical path target'}
            </p>
          </div>
          <div className="mt-3 text-[11px] font-medium text-slate-600">
            {metrics.criticalWithVariance > 0
              ? `${metrics.criticalWithVariance} critical milestone(s) reported variance`
              : 'Zero critical path schedule deviations'}
          </div>
        </div>

        {/* Critical Path Health Breakdown */}
        <div className="bento-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Critical Path Status
              </span>
              <div className="w-6 h-6 rounded-md bg-amber-100 flex items-center justify-center text-amber-700">
                <Layers className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div>
                <span className="text-xl font-bold font-mono text-emerald-700">
                  {metrics.achieved}
                </span>
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Done</span>
              </div>
              <div className="w-px h-7 bg-slate-200" />
              <div>
                <span className="text-xl font-bold font-mono text-cyan-700">
                  {metrics.inProgress}
                </span>
                <span className="text-[10px] text-slate-500 block uppercase font-bold">In-Prog</span>
              </div>
              <div className="w-px h-7 bg-slate-200" />
              <div>
                <span className="text-xl font-bold font-mono text-slate-700">
                  {metrics.pending}
                </span>
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Pending</span>
              </div>
              <div className="w-px h-7 bg-slate-200" />
              <div>
                <span className="text-xl font-bold font-mono text-rose-600">
                  {metrics.delayed}
                </span>
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Delayed</span>
              </div>
            </div>
          </div>
          <div className="mt-3 text-[11px] text-slate-500 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
            <span>{metrics.criticalTotal} items directly control project handover</span>
          </div>
        </div>

        {/* Next Upcoming Target Milestone */}
        <div className="bento-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Next Critical Milestone
              </span>
              <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center text-slate-600">
                <Calendar className="w-3.5 h-3.5" />
              </div>
            </div>
            {metrics.nextCritical ? (
              <div>
                <h4 className="text-sm font-bold text-slate-900 truncate" title={metrics.nextCritical.title}>
                  {metrics.nextCritical.title}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-mono font-bold text-cyan-800">
                    {formatDate(metrics.nextCritical.planned_date)}
                  </span>
                  {metrics.daysToNext !== null && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${
                      metrics.daysToNext < 0
                        ? 'bg-rose-100 text-rose-800'
                        : metrics.daysToNext <= 14
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {metrics.daysToNext < 0
                        ? `${Math.abs(metrics.daysToNext)}d overdue`
                        : `${metrics.daysToNext}d remaining`}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-500 italic mt-2">
                All scheduled milestones achieved!
              </div>
            )}
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">
              Contract End: <strong className="font-mono text-slate-700">{formatDate(project.planned_completion)}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Control Bar: Filters, Search, View Mode, and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
        {/* Search Input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search milestones, phases, or leads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:bg-white transition-colors"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0 ${
              statusFilter === 'all'
                ? 'bg-cyan-100 text-cyan-900'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All ({metrics.total})
          </button>
          <button
            onClick={() => setStatusFilter('critical')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0 inline-flex items-center gap-1 ${
              statusFilter === 'critical'
                ? 'bg-amber-100 text-amber-950 font-bold border border-amber-300'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>Critical Path</span>
            <span className="text-[10px] font-mono px-1 rounded bg-amber-200 text-amber-900">
              {metrics.criticalTotal}
            </span>
          </button>
          <button
            onClick={() => setStatusFilter('Achieved')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0 ${
              statusFilter === 'Achieved'
                ? 'bg-emerald-100 text-emerald-900'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Achieved ({metrics.achieved})
          </button>
          <button
            onClick={() => setStatusFilter('In Progress')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0 ${
              statusFilter === 'In Progress'
                ? 'bg-cyan-100 text-cyan-900'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            In Progress ({metrics.inProgress})
          </button>
          <button
            onClick={() => setStatusFilter('Delayed')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0 ${
              statusFilter === 'Delayed'
                ? 'bg-rose-100 text-rose-900'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Slippage / At Risk ({metrics.delayed})
          </button>
        </div>

        {/* View Switcher & Add Milestone Button */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="bg-slate-100 p-0.5 rounded-lg flex items-center border border-slate-200">
            <button
              onClick={() => setActiveView('matrix')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                activeView === 'matrix'
                  ? 'bg-white text-cyan-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              List View
            </button>
            <button
              onClick={() => setActiveView('visual')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                activeView === 'visual'
                  ? 'bg-white text-cyan-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Schedule Comparison
            </button>
          </div>

          <button
            id="btn-define-milestone"
            onClick={handleOpenCreate}
            className="px-3.5 py-1.5 bg-cyan-700 hover:bg-cyan-800 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Define Milestone</span>
          </button>
        </div>
      </div>

      {/* Visual Planned vs Actual Comparison Mode */}
      {activeView === 'visual' && (
        <div className="bento-card p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Planned vs. Actual Milestone Schedule Baseline
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Horizontal critical path schedule visualizer comparing baseline engineering targets with field achievements.
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-cyan-600 inline-block" />
                <span className="text-slate-600">Planned Target Date</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block" />
                <span className="text-slate-600">Actual Completion Date</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-1.5 bg-rose-400 inline-block rounded" />
                <span className="text-slate-600">Schedule Slippage (Delay)</span>
              </div>
            </div>
          </div>

          {/* Timeline Visual Rows */}
          <div className="space-y-4">
            {filteredMilestones.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No milestones found matching the selected filter.
              </div>
            ) : (
              filteredMilestones.map((m) => {
                // Determine percentage along project lifecycle for visual positioning
                const projStart = new Date(project.start_date).getTime();
                const projEnd = new Date(project.planned_completion).getTime();
                const totalSpan = Math.max(projEnd - projStart, 1000 * 60 * 60 * 24 * 30);

                const plannedTime = new Date(m.planned_date).getTime();
                const plannedPercent = Math.min(Math.max(((plannedTime - projStart) / totalSpan) * 100, 2), 98);

                let actualPercent: number | null = null;
                if (m.actual_date) {
                  const actualTime = new Date(m.actual_date).getTime();
                  actualPercent = Math.min(Math.max(((actualTime - projStart) / totalSpan) * 100, 2), 98);
                }

                const variance = m.variance_days || 0;

                return (
                  <div key={m.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {m.is_critical_path && (
                          <span className="px-1.5 py-0.5 text-[9px] font-extrabold font-mono uppercase bg-amber-100 text-amber-900 border border-amber-300 rounded">
                            Critical Path
                          </span>
                        )}
                        <span className="text-xs font-bold text-slate-900">{m.title}</span>
                        <span className="text-[10px] text-slate-500 font-medium px-2 py-0.5 bg-white border border-slate-200 rounded-full">
                          {m.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        {renderVariancePill(m)}
                        <button
                          onClick={() => handleOpenEdit(m)}
                          className="text-xs text-slate-500 hover:text-cyan-700 font-semibold cursor-pointer"
                        >
                          Edit
                        </button>
                      </div>
                    </div>

                    {/* Visual Comparison Track */}
                    <div className="relative pt-6 pb-4">
                      {/* Base Track */}
                      <div className="h-2 w-full bg-slate-200 rounded-full relative">
                        {/* Connecting slippage/advance line if actual date exists */}
                        {actualPercent !== null && (
                          <div
                            className={`absolute top-0 bottom-0 rounded-full ${
                              variance > 0
                                ? 'bg-rose-400'
                                : variance < 0
                                ? 'bg-cyan-400'
                                : 'bg-emerald-400'
                            }`}
                            style={{
                              left: `${Math.min(plannedPercent, actualPercent)}%`,
                              width: `${Math.max(Math.abs(actualPercent - plannedPercent), 1)}%`,
                            }}
                          />
                        )}

                        {/* Planned Date Marker (Cyan Flag/Dot) */}
                        <div
                          className="absolute -top-1.5 -translate-x-1/2 flex flex-col items-center group cursor-pointer"
                          style={{ left: `${plannedPercent}%` }}
                        >
                          <div className="w-5 h-5 rounded-full bg-cyan-600 border-2 border-white shadow-xs flex items-center justify-center text-white">
                            <span className="w-1.5 h-1.5 rounded-full bg-white" />
                          </div>
                          <span className="absolute -top-5 text-[10px] font-mono font-bold text-cyan-900 bg-cyan-100 px-1.5 py-0.2 rounded border border-cyan-300 whitespace-nowrap">
                            Planned: {formatDate(m.planned_date)}
                          </span>
                        </div>

                        {/* Actual Date Marker (Green/Amber Dot) */}
                        {actualPercent !== null && (
                          <div
                            className="absolute -top-1.5 -translate-x-1/2 flex flex-col items-center group cursor-pointer"
                            style={{ left: `${actualPercent}%` }}
                          >
                            <div className={`w-5 h-5 rounded-full border-2 border-white shadow-xs flex items-center justify-center text-white ${
                              variance > 0 ? 'bg-rose-600' : 'bg-emerald-600'
                            }`}>
                              <Check className="w-3 h-3 text-white stroke-[3]" />
                            </div>
                            <span className={`absolute top-6 text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border whitespace-nowrap ${
                              variance > 0
                                ? 'bg-rose-100 text-rose-900 border-rose-300'
                                : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                            }`}>
                              Actual: {formatDate(m.actual_date)} ({variance > 0 ? `+${variance}d` : `${variance}d`})
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Milestone Register Matrix Table View */}
      {activeView === 'matrix' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Milestone Deliverable</th>
                  <th className="py-3 px-3">Phase / Category</th>
                  <th className="py-3 px-3">Critical Path</th>
                  <th className="py-3 px-3">Planned Date</th>
                  <th className="py-3 px-3">Actual Date</th>
                  <th className="py-3 px-3">Variance</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Responsible Lead</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {filteredMilestones.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      <div className="max-w-xs mx-auto space-y-2">
                        <Flag className="w-8 h-8 text-slate-300 mx-auto" />
                        <p className="font-semibold text-slate-600">No milestones found</p>
                        <p className="text-[11px] text-slate-400">
                          Define critical path dates to track scheduled completion vs actual progress.
                        </p>
                        <button
                          onClick={handleOpenCreate}
                          className="mt-2 px-3 py-1.5 bg-cyan-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                        >
                          + Define Milestone
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredMilestones.map((m) => (
                    <tr
                      key={m.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Milestone Title & Description */}
                      <td className="py-3.5 px-4 font-medium text-slate-900">
                        <div className="font-bold text-slate-900">{m.title}</div>
                        {m.description && (
                          <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1 max-w-sm">
                            {m.description}
                          </div>
                        )}
                        {m.notes && (
                          <div className="text-[10px] text-slate-400 italic mt-0.5 flex items-center gap-1">
                            <FileText className="w-3 h-3 text-slate-400" />
                            <span className="line-clamp-1">{m.notes}</span>
                          </div>
                        )}
                      </td>

                      {/* Phase Category */}
                      <td className="py-3.5 px-3 text-slate-600">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-md text-[11px] font-medium whitespace-nowrap">
                          {m.category}
                        </span>
                      </td>

                      {/* Critical Path Indicator */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {m.is_critical_path ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase font-mono bg-amber-100 text-amber-950 border border-amber-300">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            <span>CRITICAL</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">Standard</span>
                        )}
                      </td>

                      {/* Planned Date */}
                      <td className="py-3.5 px-3 font-mono text-slate-700 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-cyan-600" />
                          <span>{formatDate(m.planned_date)}</span>
                        </div>
                      </td>

                      {/* Actual Completion Date */}
                      <td className="py-3.5 px-3 font-mono whitespace-nowrap">
                        {m.actual_date ? (
                          <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{formatDate(m.actual_date)}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Pending</span>
                        )}
                      </td>

                      {/* Variance vs Planned Target */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {renderVariancePill(m)}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            m.status === 'Achieved'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : m.status === 'In Progress'
                              ? 'bg-cyan-100 text-cyan-800 border border-cyan-300'
                              : m.status === 'Delayed'
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : 'bg-slate-100 text-slate-600 border border-slate-300'
                          }`}
                        >
                          {m.status}
                        </span>
                      </td>

                      {/* Responsible Lead */}
                      <td className="py-3.5 px-3 text-slate-600 whitespace-nowrap">
                        {m.responsible_party ? (
                          <div className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span className="truncate max-w-[140px]">{m.responsible_party}</span>
                          </div>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* If not achieved yet, quick "Record Actual" button */}
                          {m.status !== 'Achieved' && (
                            <button
                              onClick={() => setRecordActualMilestone(m)}
                              title="Record actual completion date & sign-off"
                              className="px-2.5 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Complete</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleOpenEdit(m)}
                            title="Edit milestone details"
                            className="p-1 text-slate-400 hover:text-cyan-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteMilestone(m.id, m.title)}
                            title="Delete milestone"
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Define / Edit Milestone Modal */}
      <DefineMilestoneModal
        isOpen={isDefineModalOpen}
        onClose={() => {
          setIsDefineModalOpen(false);
          setEditingMilestone(null);
        }}
        project={project}
        milestoneToEdit={editingMilestone}
        onSave={handleSaveMilestone}
      />

      {/* Record Actual Completion Modal */}
      <RecordMilestoneActualModal
        isOpen={!!recordActualMilestone}
        onClose={() => setRecordActualMilestone(null)}
        milestone={recordActualMilestone}
        onConfirm={handleConfirmActual}
      />
    </div>
  );
};
