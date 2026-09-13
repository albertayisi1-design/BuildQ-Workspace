import React, { useState, useMemo, useEffect } from 'react';
import { useBuild } from '../../context/BuildContext';
import { ActivityStatus, WBSItem } from '../../types';
import { formatCurrency, formatPercent } from '../../utils/formatters';
import {
  GitFork,
  Plus,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  FolderTree,
  Calendar,
  X,
  Building2,
  BarChart2,
  DollarSign,
  Maximize2,
  Minimize2,
  Filter,
} from 'lucide-react';
import { ProjectGanttChart } from '../projects/ProjectGanttChart';

interface WBSViewProps {
  selectedProjectId?: string;
  onNavigateToCost?: (projectId: string, wbsId: string) => void;
  onNavigate?: (tab: string, projectId?: string) => void;
}

export const WBSView: React.FC<WBSViewProps> = ({
  selectedProjectId,
  onNavigateToCost,
  onNavigate,
}) => {
  const { projects, wbsItems, updateWBSItem, createWBSItem } = useBuild();

  // Active project selection
  const [activeProjectId, setActiveProjectId] = useState<string>(
    selectedProjectId || projects.find((p) => p.status === 'Active')?.id || projects[0]?.id || ''
  );

  useEffect(() => {
    if (selectedProjectId) {
      setActiveProjectId(selectedProjectId);
    }
  }, [selectedProjectId]);

  const [statusFilter, setStatusFilter] = useState<'ALL' | ActivityStatus>('ALL');
  const [viewMode, setViewMode] = useState<'tree' | 'gantt' | 'costs'>('tree');

  const [expandedPhases, setExpandedPhases] = useState<Record<string, boolean>>({
    wbs_phase_1: true,
    wbs_phase_2: true,
    wbs_phase_3: true,
    wbs_phase_4: true,
    wbs_phase_5: true,
  });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [targetPhaseId, setTargetPhaseId] = useState<string>('');
  const [newCode, setNewCode] = useState('03.04');
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPlannedCost, setNewPlannedCost] = useState(50000);
  const [newStartDate, setNewStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [newEndDate, setNewEndDate] = useState(
    new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  );

  const currentProject = projects.find((p) => p.id === activeProjectId);

  // Group items by phases and activities
  const projectWbs = useMemo(() => {
    return wbsItems.filter((w) => w.project_id === activeProjectId);
  }, [wbsItems, activeProjectId]);

  const phases = useMemo(() => {
    return projectWbs.filter((w) => w.is_phase);
  }, [projectWbs]);

  const allActivities = useMemo(() => {
    return projectWbs.filter((w) => !w.is_phase);
  }, [projectWbs]);

  // Tab count metrics
  const counts = useMemo(
    () => ({
      all: allActivities.length,
      inProgress: allActivities.filter((w) => w.status === 'In Progress').length,
      completed: allActivities.filter((w) => w.status === 'Completed').length,
      delayed: allActivities.filter((w) => w.status === 'Delayed').length,
      notStarted: allActivities.filter((w) => w.status === 'Not Started').length,
    }),
    [allActivities]
  );

  const togglePhase = (phaseId: string) => {
    setExpandedPhases((prev) => ({
      ...prev,
      [phaseId]: !prev[phaseId],
    }));
  };

  const handleToggleAllPhases = (expand: boolean) => {
    const next: Record<string, boolean> = {};
    phases.forEach((p) => {
      next[p.id] = expand;
    });
    setExpandedPhases(next);
  };

  const handleUpdateProgress = (itemId: string, newProgress: number) => {
    const clamped = Math.min(100, Math.max(0, newProgress));
    let newStatus: ActivityStatus = 'In Progress';
    if (clamped === 100) newStatus = 'Completed';
    else if (clamped === 0) newStatus = 'Not Started';

    updateWBSItem(itemId, {
      progress: clamped,
      status: newStatus,
    });
  };

  const handleUpdateStatus = (itemId: string, newStatus: ActivityStatus) => {
    const updates: Partial<WBSItem> = { status: newStatus };
    if (newStatus === 'Completed') {
      updates.progress = 100;
    } else if (newStatus === 'Not Started') {
      updates.progress = 0;
    }
    updateWBSItem(itemId, updates);
  };

  const handleCreateActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProjectId) return;

    createWBSItem({
      project_id: activeProjectId,
      parent_id: targetPhaseId || null,
      is_phase: false,
      wbs_code: newCode,
      name: newName,
      description: newDesc,
      start_date: newStartDate,
      end_date: newEndDate,
      planned_cost: Number(newPlannedCost),
      progress: 0,
      status: 'Not Started',
    });

    setIsAddModalOpen(false);
    setNewName('');
    setNewDesc('');
  };

  const getStatusBadge = (status: ActivityStatus) => {
    const map = {
      Completed: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      'In Progress': 'bg-amber-50 text-amber-800 border-amber-200',
      Delayed: 'bg-rose-50 text-rose-800 border-rose-200',
      'Not Started': 'bg-slate-100 text-slate-600 border-slate-200',
    };
    return (
      <span
        className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${
          map[status] || map['Not Started']
        }`}
      >
        {status}
      </span>
    );
  };

  return (
    <div id="wbs-activities-view" className="space-y-4 pb-12">
      {/* Reduced WBS Panel (by 50%) with All Tabs Fitted Inside */}
      <div id="wbs-top-banner" className="bento-card p-2.5 sm:py-3 sm:px-4 space-y-2.5">
        {/* Compact Header Row: Title, Badge, Project Selector & Add Button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <div className="flex items-center gap-1.5">
              <FolderTree className="w-4 h-4 text-cyan-700 shrink-0" />
              <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight font-sans">
                Work Breakdown Structure (WBS)
              </h1>
            </div>
            <span className="px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-bold bg-amber-100 text-amber-900 uppercase tracking-wider shrink-0 border border-amber-200">
              Project &rarr; Phase &rarr; Activity
            </span>
            {currentProject && (
              <span className="hidden lg:inline-flex items-center text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 shrink-0">
                {counts.all} Activities • {currentProject.progress || 0}% Done
              </span>
            )}
          </div>

          {/* Project Selector & Add Button (50% More Compact) */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1 text-xs text-slate-600 shrink-0">
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              <span className="font-semibold hidden sm:inline">Project:</span>
            </div>
            <select
              id="sel-wbs-active-project"
              value={activeProjectId}
              onChange={(e) => setActiveProjectId(e.target.value)}
              className="h-8 px-2.5 rounded-lg border border-slate-200 text-xs font-medium bg-slate-50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-cyan-500 max-w-[190px] sm:max-w-[240px] truncate"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.status})
                </option>
              ))}
            </select>

            <button
              id="btn-add-wbs-activity"
              onClick={() => {
                setTargetPhaseId(phases[0]?.id || '');
                setIsAddModalOpen(true);
              }}
              className="h-8 px-3 rounded-lg bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-xs inline-flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Activity</span>
            </button>
          </div>
        </div>

        {/* Fitted Tabs Row: Fitted Completely Inside the Panel */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
          {/* Left: Project Quick Tabs & Status Filter Tabs */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Project Module Navigation Tabs */}
            {onNavigate && currentProject && (
              <div className="flex items-center gap-1 border-r border-slate-200 pr-2 mr-1 shrink-0">
                <button
                  type="button"
                  className="px-2 py-1 rounded text-xs font-bold bg-slate-900 text-white shadow-2xs shrink-0 cursor-default"
                >
                  WBS
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('projects', currentProject.id)}
                  className="px-2 py-1 rounded text-xs font-semibold text-slate-600 hover:text-cyan-800 hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
                >
                  Overview
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('projects', currentProject.id)}
                  className="px-2 py-1 rounded text-xs font-semibold text-slate-600 hover:text-cyan-800 hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
                >
                  Milestones
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('costs', currentProject.id)}
                  className="px-2 py-1 rounded text-xs font-semibold text-slate-600 hover:text-cyan-800 hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
                >
                  Costs
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('site_reports', currentProject.id)}
                  className="px-2 py-1 rounded text-xs font-semibold text-slate-600 hover:text-cyan-800 hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
                >
                  Site Reports
                </button>
              </div>
            )}

            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                id="wbs-tab-status-all"
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                  statusFilter === 'ALL'
                    ? 'bg-amber-500 text-white font-bold shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                All ({counts.all})
              </button>
              <button
                id="wbs-tab-status-in-progress"
                type="button"
                onClick={() => setStatusFilter('In Progress')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                  statusFilter === 'In Progress'
                    ? 'bg-amber-100 text-amber-900 font-bold border border-amber-300'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                In Progress ({counts.inProgress})
              </button>
              <button
                id="wbs-tab-status-completed"
                type="button"
                onClick={() => setStatusFilter('Completed')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                  statusFilter === 'Completed'
                    ? 'bg-emerald-100 text-emerald-900 font-bold border border-emerald-300'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                Completed ({counts.completed})
              </button>
              <button
                id="wbs-tab-status-delayed"
                type="button"
                onClick={() => setStatusFilter('Delayed')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                  statusFilter === 'Delayed'
                    ? 'bg-rose-100 text-rose-900 font-bold border border-rose-300'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                Delayed ({counts.delayed})
              </button>
              <button
                id="wbs-tab-status-not-started"
                type="button"
                onClick={() => setStatusFilter('Not Started')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                  statusFilter === 'Not Started'
                    ? 'bg-slate-200 text-slate-900 font-bold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                Not Started ({counts.notStarted})
              </button>
            </div>
          </div>

          {/* Right: View Mode Tabs Fitted in Panel */}
          <div className="flex items-center gap-2 shrink-0 pl-2">
            {viewMode === 'tree' && (
              <div className="hidden sm:flex items-center gap-1 text-[11px] text-slate-500">
                <button
                  type="button"
                  onClick={() => handleToggleAllPhases(true)}
                  className="hover:text-slate-900 px-1 py-0.5 rounded hover:bg-slate-100 cursor-pointer"
                >
                  Expand All
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => handleToggleAllPhases(false)}
                  className="hover:text-slate-900 px-1 py-0.5 rounded hover:bg-slate-100 cursor-pointer"
                >
                  Collapse
                </button>
              </div>
            )}

            <div className="bg-slate-100 p-0.5 rounded-lg flex items-center border border-slate-200 shrink-0">
              <button
                id="wbs-tab-view-tree"
                type="button"
                onClick={() => setViewMode('tree')}
                className={`px-2 py-0.5 text-xs font-semibold rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                  viewMode === 'tree'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="WBS Hierarchical Tree"
              >
                <FolderTree className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tree</span>
              </button>
              <button
                id="wbs-tab-view-gantt"
                type="button"
                onClick={() => setViewMode('gantt')}
                className={`px-2 py-0.5 text-xs font-semibold rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                  viewMode === 'gantt'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Interactive Gantt Timeline"
              >
                <BarChart2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Gantt</span>
              </button>
              <button
                id="wbs-tab-view-costs"
                type="button"
                onClick={() => setViewMode('costs')}
                className={`px-2 py-0.5 text-xs font-semibold rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                  viewMode === 'costs'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Phase Cost Rollup"
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Rollup</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bento Project Roll-up Status Bar (Compact) */}
      {currentProject && (
        <div className="bento-card p-3 sm:py-2.5 sm:px-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-amber-500/10 text-amber-900 border border-amber-500/20 flex items-center justify-center font-bold font-mono text-xs shrink-0">
              {currentProject.progress || 0}%
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-slate-900 font-sans">
                {currentProject.name} — Overall Progress
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Approved Budget:{' '}
                <strong className="font-mono text-slate-700">
                  {formatCurrency(currentProject.approved_budget)}
                </strong>{' '}
                • Recorded Actual:{' '}
                <strong className="font-mono text-amber-800">
                  {formatCurrency(currentProject.actual_cost || 0)}
                </strong>
              </div>
            </div>
          </div>

          <div className="w-full md:w-56 shrink-0">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-500 text-[11px]">Completion</span>
              <span className="font-bold font-mono text-slate-800 text-xs">
                {currentProject.progress || 0}%
              </span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  currentProject.progress === 100
                    ? 'bg-emerald-500'
                    : (currentProject.progress || 0) > 50
                    ? 'bg-amber-500'
                    : 'bg-sky-500'
                }`}
                style={{ width: `${currentProject.progress || 0}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* View 1: Tree Hierarchy */}
      {viewMode === 'tree' && (
        <div className="space-y-3">
          {phases.map((phase) => {
            const isExpanded = expandedPhases[phase.id] ?? true;
            const allPhaseChildren = projectWbs.filter((w) => w.parent_id === phase.id);
            const children =
              statusFilter === 'ALL'
                ? allPhaseChildren
                : allPhaseChildren.filter((w) => w.status === statusFilter);

            return (
              <div key={phase.id} className="bento-card overflow-hidden">
                {/* Phase Header */}
                <div
                  onClick={() => togglePhase(phase.id)}
                  className="p-3 sm:p-3.5 bg-slate-50/70 hover:bg-slate-100/70 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 cursor-pointer transition-colors"
                >
                  <div className="flex items-start sm:items-center gap-2.5">
                    <button className="text-slate-500 hover:text-slate-900 mt-0.5 sm:mt-0">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-slate-600" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-600" />
                      )}
                    </button>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono font-bold bg-amber-500/15 text-amber-900 px-2 py-0.5 rounded border border-amber-500/30">
                          Phase {phase.phase_code || phase.wbs_code}
                        </span>
                        <h3 className="font-bold text-xs sm:text-sm text-slate-900 font-sans">
                          {phase.name}
                        </h3>
                        {getStatusBadge(phase.status)}
                        {statusFilter !== 'ALL' && (
                          <span className="text-[10px] text-slate-500 font-mono">
                            ({children.length} of {allPhaseChildren.length} matching)
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{phase.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-5 text-xs text-right w-full sm:w-auto pt-1.5 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Planned</span>
                      <span className="font-mono font-bold text-slate-700">
                        {formatCurrency(phase.planned_cost)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Actual</span>
                      <span className="font-mono font-bold text-slate-900">
                        {formatCurrency(phase.actual_cost)}
                      </span>
                    </div>
                    <div className="w-20 sm:w-24 text-right">
                      <span className="font-bold font-mono text-slate-800">{phase.progress}%</span>
                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mt-1">
                        <div
                          className="h-full bg-amber-500 rounded-full"
                          style={{ width: `${phase.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Phase Activities List */}
                {isExpanded && (
                  <div className="divide-y divide-slate-100">
                    {children.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400 italic">
                        {statusFilter === 'ALL'
                          ? 'No individual activities created for this phase yet.'
                          : `No activities in this phase with status "${statusFilter}".`}
                      </div>
                    ) : (
                      children.map((act) => (
                        <div
                          key={act.id}
                          id={`wbs-row-${act.id}`}
                          className="p-3 pl-4 sm:pl-10 hover:bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-4 transition-colors"
                        >
                          {/* Activity Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-mono font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                {act.wbs_code}
                              </span>
                              <span className="font-bold text-xs sm:text-sm text-slate-900">{act.name}</span>
                              {getStatusBadge(act.status)}
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">{act.description}</p>
                            <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1 font-mono">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {act.start_date} &rarr; {act.end_date}
                              </span>
                            </div>
                          </div>

                          {/* Financials & Progress Slider */}
                          <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 w-full sm:w-auto pt-1.5 sm:pt-0 border-t sm:border-t-0 border-slate-100 flex-wrap sm:flex-nowrap">
                            <div className="text-left sm:text-right">
                              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                                Planned / Actual
                              </span>
                              <div className="font-mono text-xs font-semibold text-slate-900">
                                <span className="text-slate-600">
                                  {formatCurrency(act.planned_cost)}
                                </span>
                                <span className="text-slate-300 mx-1">/</span>
                                <span className="text-amber-800">
                                  {formatCurrency(act.actual_cost)}
                                </span>
                              </div>
                            </div>

                            {/* Progress Controller */}
                            <div className="w-24 sm:w-28">
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span className="text-[10px] text-slate-500">Progress</span>
                                <span className="font-bold font-mono text-slate-800 text-xs">
                                  {act.progress}%
                                </span>
                              </div>
                              <input
                                type="range"
                                min="0"
                                max="100"
                                step="5"
                                value={act.progress}
                                onChange={(e) =>
                                  handleUpdateProgress(act.id, Number(e.target.value))
                                }
                                className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                                title="Slide to update activity progress"
                              />
                            </div>

                            {/* Status select dropdown */}
                            <select
                              value={act.status}
                              onChange={(e) =>
                                handleUpdateStatus(act.id, e.target.value as ActivityStatus)
                              }
                              className="text-xs border border-slate-200 rounded-md px-2 py-1 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500 shrink-0"
                            >
                              <option value="Not Started">Not Started</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Completed">Completed</option>
                              <option value="Delayed">Delayed</option>
                            </select>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* View 2: Gantt Chart View */}
      {viewMode === 'gantt' && currentProject && (
        <div className="bento-card p-4 sm:p-5">
          <ProjectGanttChart
            project={currentProject}
            wbsItems={projectWbs}
            onNavigateToTab={onNavigate}
          />
        </div>
      )}

      {/* View 3: Phase Cost Rollup Matrix */}
      {viewMode === 'costs' && currentProject && (
        <div className="bento-card p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                WBS Phase Cost Rollup Matrix
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Financial rollup analyzing planned budgets against posted actual expenses across all WBS phases.
              </p>
            </div>
            {onNavigateToCost && (
              <button
                type="button"
                onClick={() => onNavigateToCost(currentProject.id, phases[0]?.id || '')}
                className="h-8 px-3 rounded-lg bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-xs inline-flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Record Expense</span>
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">WBS Code</th>
                  <th className="py-2.5 px-3">Phase / Package</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-right">Planned Budget</th>
                  <th className="py-2.5 px-3 text-right">Actual Cost</th>
                  <th className="py-2.5 px-3 text-right">Variance</th>
                  <th className="py-2.5 px-3 text-right">Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {phases.map((phase) => {
                  const variance = phase.planned_cost - phase.actual_cost;
                  const isOverBudget = variance < 0;

                  return (
                    <tr key={phase.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-700">
                        {phase.phase_code || phase.wbs_code}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        {phase.name}
                        <div className="text-[10px] text-slate-400 font-normal">{phase.description}</div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {getStatusBadge(phase.status)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-700">
                        {formatCurrency(phase.planned_cost)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(phase.actual_cost)}
                      </td>
                      <td
                        className={`py-2.5 px-3 text-right font-mono font-bold ${
                          isOverBudget ? 'text-rose-600' : 'text-emerald-700'
                        }`}
                      >
                        {isOverBudget ? `(${formatCurrency(Math.abs(variance))})` : `+${formatCurrency(variance)}`}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">
                        {phase.progress}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Activity Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 font-display">
                Add WBS Activity
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateActivity} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Parent Phase
                </label>
                <select
                  value={targetPhaseId}
                  onChange={(e) => setTargetPhaseId(e.target.value)}
                  className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  {phases.map((ph) => (
                    <option key={ph.id} value={ph.id}>
                      Phase {ph.phase_code || ph.wbs_code}: {ph.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    WBS Code
                  </label>
                  <input
                    type="text"
                    required
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    placeholder="e.g. 02.04"
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Planned Cost (C$)
                  </label>
                  <input
                    type="number"
                    required
                    value={newPlannedCost}
                    onChange={(e) => setNewPlannedCost(Number(e.target.value))}
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Activity Name
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Reinforcement steel inspection & rebar tying"
                  className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description & Notes
                </label>
                <textarea
                  rows={2}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Scope details and contractor specifications..."
                  className="w-full p-3 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={newEndDate}
                    onChange={(e) => setNewEndDate(e.target.value)}
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-cyan-700 hover:bg-cyan-800 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Save Activity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
