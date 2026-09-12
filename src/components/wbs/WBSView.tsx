import React, { useState, useMemo } from 'react';
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
} from 'lucide-react';

interface WBSViewProps {
  selectedProjectId?: string;
  onNavigateToCost?: (projectId: string, wbsId: string) => void;
}

export const WBSView: React.FC<WBSViewProps> = ({
  selectedProjectId,
  onNavigateToCost,
}) => {
  const { projects, wbsItems, updateWBSItem, createWBSItem } = useBuild();

  // Active project selection
  const [activeProjectId, setActiveProjectId] = useState<string>(
    selectedProjectId || projects.find((p) => p.status === 'Active')?.id || projects[0]?.id || ''
  );

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

  const togglePhase = (phaseId: string) => {
    setExpandedPhases((prev) => ({
      ...prev,
      [phaseId]: !prev[phaseId],
    }));
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
    <div id="wbs-activities-view" className="space-y-5 pb-12">
      {/* Bento Top Banner & Selector */}
      <div className="bento-card p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight font-sans">
              Work Breakdown Structure (WBS)
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 uppercase tracking-wider">
              Project &rarr; Phase &rarr; Activity
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Activity progress automatically rolls up to calculate total project completion percentage.
          </p>
        </div>

        {/* Project Selector */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 shrink-0">
            <Building2 className="w-3.5 h-3.5" />
            <span className="font-semibold">Project:</span>
          </div>
          <select
            id="sel-wbs-active-project"
            value={activeProjectId}
            onChange={(e) => setActiveProjectId(e.target.value)}
            className="h-9 px-3 rounded-lg border border-slate-200 text-xs font-medium bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500 max-w-[240px]"
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
            className="h-9 px-3.5 rounded-lg bg-cyan-600 hover:bg-lime-500 text-white font-bold text-xs inline-flex items-center gap-1.5 transition-all shadow-xs cursor-pointer shrink-0 "
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Activity</span>
          </button>
        </div>
      </div>

      {/* Bento Project Roll-up Status Bar */}
      {currentProject && (
        <div className="bento-card p-4.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-500/10 text-amber-800 border border-amber-500/20 flex items-center justify-center font-bold font-mono text-sm">
              {currentProject.progress || 0}%
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 font-sans">
                {currentProject.name} — Overall Progress
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Approved Budget: <strong className="font-mono text-slate-700">{formatCurrency(currentProject.approved_budget)}</strong> • Total Recorded Actual: <strong className="font-mono text-amber-700">{formatCurrency(currentProject.actual_cost || 0)}</strong>
              </div>
            </div>
          </div>

          <div className="w-full md:w-64">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-500">Project Completion</span>
              <span className="font-bold font-mono text-slate-800">{currentProject.progress || 0}%</span>
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

      {/* Bento WBS Hierarchical Phases & Activities Tree */}
      <div className="space-y-3.5">
        {phases.map((phase) => {
          const isExpanded = expandedPhases[phase.id] ?? true;
          const children = projectWbs.filter((w) => w.parent_id === phase.id);

          return (
            <div
              key={phase.id}
              className="bento-card overflow-hidden"
            >
              {/* Phase Header */}
              <div
                onClick={() => togglePhase(phase.id)}
                className="p-3.5 sm:p-4 bg-slate-50/70 hover:bg-slate-100/70 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer transition-colors"
              >
                <div className="flex items-start sm:items-center gap-3">
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
                      <h3 className="font-bold text-sm text-slate-900 font-sans">
                        {phase.name}
                      </h3>
                      {getStatusBadge(phase.status)}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{phase.description}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 text-xs text-right w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
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
                      No individual activities created for this phase yet.
                    </div>
                  ) : (
                    children.map((act) => (
                      <div
                        key={act.id}
                        id={`wbs-row-${act.id}`}
                        className="p-3.5 pl-4 sm:pl-11 hover:bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 transition-colors"
                      >
                        {/* Activity Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-mono font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                              {act.wbs_code}
                            </span>
                            <span className="font-bold text-sm text-slate-900">{act.name}</span>
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
                        <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-5 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 flex-wrap sm:flex-nowrap">
                          <div className="text-left sm:text-right">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">
                              Planned / Actual
                            </span>
                            <div className="font-mono text-xs font-semibold text-slate-900">
                              <span className="text-slate-600">
                                {formatCurrency(act.planned_cost)}
                              </span>
                              <span className="text-slate-300 mx-1">/</span>
                              <span className="text-amber-700">
                                {formatCurrency(act.actual_cost)}
                              </span>
                            </div>
                          </div>

                          {/* Progress Controller */}
                          <div className="w-28 sm:w-32">
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
                  Parent Phase *
                </label>
                <select
                  value={targetPhaseId}
                  onChange={(e) => setTargetPhaseId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                  required
                >
                  {phases.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    WBS Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    placeholder="e.g. 03.04"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Planned Cost (CAD) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newPlannedCost}
                    onChange={(e) => setNewPlannedCost(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Activity Name *
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Parapet Wall Masonry"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Task scope and specifications"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
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
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
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
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-cyan-600 hover:bg-lime-500 text-white font-bold rounded-lg text-xs cursor-pointer transition-all "
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
