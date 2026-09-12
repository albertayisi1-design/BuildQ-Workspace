import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  Cell,
  CartesianGrid,
} from 'recharts';
import { Project, WBSItem } from '../../types';
import { formatCurrency, formatPercent } from '../../utils/formatters';
import {
  Calendar,
  Clock,
  Flag,
  CheckCircle2,
  AlertCircle,
  Layers,
  Sparkles,
  Filter,
  Maximize2,
  ArrowRight,
  TrendingUp,
  Target,
  BarChart2,
  Check,
} from 'lucide-react';

interface ProjectGanttChartProps {
  project: Project;
  wbsItems: WBSItem[];
  onNavigateToTab?: (tab: string, contextId?: string) => void;
  compact?: boolean;
  onExpandFull?: () => void;
}

type ViewMode = 'phases' | 'all' | 'milestones';

interface GanttBarItem {
  id: string;
  wbs_code: string;
  name: string;
  displayName: string;
  is_phase: boolean;
  phase_code?: string;
  start_date: string;
  end_date: string;
  progress: number;
  status: string;
  planned_cost: number;
  actual_cost: number;
  offsetDays: number;
  durationDays: number;
  completedDays: number;
  remainingDays: number;
  isMilestone: boolean;
  phaseColor: string;
  statusColor: string;
  remainingColor: string;
}

const PHASE_COLORS: Record<string, { solid: string; light: string; border: string }> = {
  '01': { solid: '#0891b2', light: '#cffafe', border: '#06b6d4' }, // Cyan
  '02': { solid: '#d97706', light: '#fef3c7', border: '#f59e0b' }, // Amber
  '03': { solid: '#4f46e5', light: '#e0e7ff', border: '#6366f1' }, // Indigo
  '04': { solid: '#7c3aed', light: '#ede9fe', border: '#8b5cf6' }, // Purple
  '05': { solid: '#059669', light: '#d1fae5', border: '#10b981' }, // Emerald
  default: { solid: '#0284c7', light: '#e0f2fe', border: '#38bdf8' }, // Sky
};

export const ProjectGanttChart: React.FC<ProjectGanttChartProps> = ({
  project,
  wbsItems,
  onNavigateToTab,
  compact = false,
  onExpandFull,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>(compact ? 'phases' : 'phases');
  const [selectedPhaseFilter, setSelectedPhaseFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');

  // Filter items for this project
  const projectWbs = useMemo(
    () => wbsItems.filter((w) => w.project_id === project.id),
    [wbsItems, project.id]
  );

  const phases = useMemo(
    () => projectWbs.filter((w) => w.is_phase).sort((a, b) => a.wbs_code.localeCompare(b.wbs_code)),
    [projectWbs]
  );

  // Determine timeline baseline dates
  const { baseStart, baseEnd, totalSpanDays, todayOffsetDays } = useMemo(() => {
    let minTime = new Date(project.start_date).getTime();
    let maxTime = new Date(project.planned_completion).getTime();

    projectWbs.forEach((item) => {
      if (item.start_date) {
        const s = new Date(item.start_date).getTime();
        if (!isNaN(s) && s < minTime) minTime = s;
      }
      if (item.end_date) {
        const e = new Date(item.end_date).getTime();
        if (!isNaN(e) && e > maxTime) maxTime = e;
      }
    });

    // Add 7 days padding at the end for visual breathing room
    maxTime += 7 * 86400000;

    const span = Math.max(1, Math.round((maxTime - minTime) / 86400000));
    const today = new Date().getTime();
    const todayOffset = Math.round((today - minTime) / 86400000);

    return {
      baseStart: minTime,
      baseEnd: maxTime,
      totalSpanDays: span,
      todayOffsetDays: todayOffset,
    };
  }, [project, projectWbs]);

  // Construct Gantt bar data items
  const allGanttItems: GanttBarItem[] = useMemo(() => {
    return projectWbs.map((item) => {
      const itemStart = new Date(item.start_date).getTime();
      const itemEnd = new Date(item.end_date).getTime();

      const offset = Math.max(0, Math.round((itemStart - baseStart) / 86400000));
      const dur = Math.max(1, Math.round((itemEnd - itemStart) / 86400000));
      const prog = Math.min(100, Math.max(0, item.progress || 0));
      const completed = Math.round(dur * (prog / 100));
      const remaining = Math.max(0, dur - completed);

      // Extract phase code
      const phaseCode = item.is_phase
        ? item.phase_code || item.wbs_code.slice(0, 2)
        : item.wbs_code.split('.')[0] || 'default';
      const colorScheme = PHASE_COLORS[phaseCode] || PHASE_COLORS.default;

      // Status color for solid progress
      let statusCol = colorScheme.solid;
      if (item.status === 'Completed') {
        statusCol = '#059669'; // Emerald
      } else if (item.status === 'Delayed') {
        statusCol = '#e11d48'; // Rose
      } else if (item.status === 'In Progress') {
        statusCol = colorScheme.solid;
      }

      // Check if this activity is a key milestone
      const isMilestone =
        !item.is_phase &&
        (dur <= 7 ||
          item.name.toLowerCase().includes('milestone') ||
          item.name.toLowerCase().includes('pour') ||
          item.name.toLowerCase().includes('curing') ||
          item.name.toLowerCase().includes('slab') ||
          item.name.toLowerCase().includes('safety') ||
          item.name.toLowerCase().includes('establishment'));

      const prefix = item.is_phase ? `[${item.wbs_code}] ` : `  ${item.wbs_code} `;
      const displayName = `${prefix}${item.name}`;

      return {
        id: item.id,
        wbs_code: item.wbs_code,
        name: item.name,
        displayName,
        is_phase: item.is_phase,
        phase_code: phaseCode,
        start_date: item.start_date,
        end_date: item.end_date,
        progress: prog,
        status: item.status,
        planned_cost: item.planned_cost,
        actual_cost: item.actual_cost,
        offsetDays: offset,
        durationDays: dur,
        completedDays: completed,
        remainingDays: remaining,
        isMilestone,
        phaseColor: colorScheme.solid,
        statusColor: statusCol,
        remainingColor: '#e2e8f0',
      };
    });
  }, [projectWbs, baseStart]);

  // Filter items based on active view mode and filter dropdowns
  const displayedItems = useMemo(() => {
    let items = allGanttItems;

    if (viewMode === 'phases') {
      items = items.filter((it) => it.is_phase);
    } else if (viewMode === 'milestones') {
      items = items.filter((it) => it.isMilestone);
    } else {
      // 'all'
      if (selectedPhaseFilter !== 'ALL') {
        items = items.filter(
          (it) => it.phase_code === selectedPhaseFilter || it.wbs_code === selectedPhaseFilter
        );
      }
    }

    if (selectedStatusFilter !== 'ALL') {
      items = items.filter((it) => it.status === selectedStatusFilter);
    }

    // Sort chronologically by start date, then wbs_code
    return [...items].sort((a, b) => {
      if (a.offsetDays !== b.offsetDays) return a.offsetDays - b.offsetDays;
      return a.wbs_code.localeCompare(b.wbs_code);
    });
  }, [allGanttItems, viewMode, selectedPhaseFilter, selectedStatusFilter]);

  // Key construction milestones list (for milestone banner / summary)
  const keyMilestones = useMemo(() => {
    const candidateActivities = allGanttItems.filter((i) => i.isMilestone || i.is_phase);
    // Take top 6 significant milestones
    return candidateActivities.slice(0, 6);
  }, [allGanttItems]);

  const completedMilestonesCount = keyMilestones.filter((m) => m.progress === 100).length;

  // Formatting date tick labels
  const formatOffsetToDate = (offsetDays: number) => {
    const d = new Date(baseStart + offsetDays * 86400000);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Height of chart calculated dynamically
  const chartHeight = useMemo(() => {
    const rowHeight = 36;
    const baseHeight = 100;
    const minHeight = compact ? 260 : 320;
    const computed = displayedItems.length * rowHeight + baseHeight;
    return Math.max(minHeight, Math.min(compact ? 340 : 540, computed));
  }, [displayedItems.length, compact]);

  // Schedule elapsed stats
  const elapsedDays = Math.max(0, Math.min(totalSpanDays, todayOffsetDays));
  const elapsedPercent = Math.min(100, Math.round((elapsedDays / totalSpanDays) * 100));
  const remainingDaysTotal = Math.max(0, totalSpanDays - elapsedDays);

  return (
    <div className="bento-card p-5 space-y-4" id="project-gantt-timeline-container">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-cyan-100 text-cyan-800">
              <BarChart2 className="w-4 h-4 text-cyan-700" />
            </span>
            <h2 className="text-base font-bold text-slate-900 font-sans tracking-tight">
              Construction Schedule & Phase Gantt Timeline
            </h2>
            <span className="text-[10px] font-mono font-bold bg-cyan-50 text-cyan-800 px-2 py-0.5 rounded border border-cyan-200">
              Interactive Recharts
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tracking planned vs actual durations, key construction milestones, and critical path progress
          </p>
        </div>

        {/* View Controls & Action */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* View Mode Toggle Buttons */}
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs font-semibold">
            <button
              id="gantt-view-phases"
              onClick={() => setViewMode('phases')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                viewMode === 'phases'
                  ? 'bg-white text-cyan-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Phases ({phases.length})
            </button>
            <button
              id="gantt-view-all"
              onClick={() => setViewMode('all')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                viewMode === 'all'
                  ? 'bg-white text-cyan-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Activities ({allGanttItems.length})
            </button>
            <button
              id="gantt-view-milestones"
              onClick={() => setViewMode('milestones')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                viewMode === 'milestones'
                  ? 'bg-white text-cyan-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Flag className="w-3 h-3 text-amber-500" />
              <span>Milestones</span>
            </button>
          </div>

          {/* Phase Filter (when in 'all' view) */}
          {viewMode === 'all' && (
            <select
              value={selectedPhaseFilter}
              onChange={(e) => setSelectedPhaseFilter(e.target.value)}
              className="h-8 px-2 text-xs font-medium bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              <option value="ALL">All Phases</option>
              {phases.map((p) => (
                <option key={p.id} value={p.wbs_code}>
                  Phase {p.wbs_code}
                </option>
              ))}
            </select>
          )}

          {/* Status Filter */}
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="h-8 px-2 text-xs font-medium bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Not Started">Not Started</option>
            <option value="Delayed">Delayed</option>
          </select>

          {compact && onExpandFull && (
            <button
              onClick={onExpandFull}
              className="h-8 px-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold inline-flex items-center gap-1 cursor-pointer transition-all"
              title="Open Dedicated Gantt View"
            >
              <Maximize2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Expand</span>
            </button>
          )}
        </div>
      </div>

      {/* Schedule Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/80 p-3 rounded-xl border border-slate-200/80 text-xs">
        <div>
          <span className="text-[10px] font-bold uppercase text-slate-400 block">
            Baseline Window
          </span>
          <span className="font-mono font-bold text-slate-800">
            {project.start_date} → {project.planned_completion}
          </span>
          <span className="text-[10px] text-slate-500 block">
            {totalSpanDays} days total ({Math.round((totalSpanDays / 7) * 10) / 10} wks)
          </span>
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase text-slate-400 block">
            Time Elapsed
          </span>
          <div className="flex items-center gap-1.5 font-mono font-bold text-slate-800">
            <span>{elapsedDays} days</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-100 text-cyan-800">
              {elapsedPercent}%
            </span>
          </div>
          <span className="text-[10px] text-slate-500 block">
            {remainingDaysTotal} days remaining to handover
          </span>
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase text-slate-400 block">
            Milestones Achieved
          </span>
          <div className="flex items-center gap-1.5 font-mono font-bold text-emerald-700">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              {completedMilestonesCount} / {keyMilestones.length} Key Milestones
            </span>
          </div>
          <span className="text-[10px] text-slate-500 block">
            {Math.round((completedMilestonesCount / (keyMilestones.length || 1)) * 100)}% milestones delivered
          </span>
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase text-slate-400 block">
            Schedule Pacing
          </span>
          <span className="font-semibold text-slate-900 block">
            {project.status === 'Completed'
              ? 'Handover Completed'
              : todayOffsetDays > totalSpanDays && (project.progress || 0) < 100
              ? 'Behind Baseline'
              : (project.progress || 0) >= elapsedPercent
              ? 'On Schedule / Tracking Ahead'
              : 'Action Required (Variance)'}
          </span>
          <span className="text-[10px] text-slate-500 block">
            Progress {project.progress || 0}% vs Elapsed {elapsedPercent}%
          </span>
        </div>
      </div>

      {/* Key Construction Milestones Ribbon */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
            <Target className="w-3 h-3 text-cyan-600" />
            <span>Key Construction Milestones</span>
          </span>
          {onNavigateToTab && (
            <button
              onClick={() => onNavigateToTab('wbs', project.id)}
              className="text-[10px] font-semibold text-cyan-700 hover:text-cyan-800 hover:underline cursor-pointer inline-flex items-center gap-0.5"
            >
              <span>Manage in WBS</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {keyMilestones.map((m, idx) => {
            const isDone = m.progress === 100;
            const isInProg = m.progress > 0 && m.progress < 100;
            return (
              <div
                key={m.id || idx}
                className={`p-2.5 rounded-lg border text-xs transition-all ${
                  isDone
                    ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                    : isInProg
                    ? 'bg-cyan-50/60 border-cyan-300 text-cyan-950 shadow-2xs'
                    : 'bg-slate-50/70 border-slate-200 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="font-mono text-[10px] font-bold px-1 rounded bg-white/80 border border-slate-200/60">
                    {m.wbs_code}
                  </span>
                  {isDone ? (
                    <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-700 bg-emerald-100/80 px-1 py-0.2 rounded">
                      <Check className="w-2.5 h-2.5" />
                      Done
                    </span>
                  ) : isInProg ? (
                    <span className="text-[9px] font-bold text-cyan-800 bg-cyan-100 px-1 py-0.2 rounded">
                      {m.progress}%
                    </span>
                  ) : (
                    <span className="text-[9px] font-medium text-slate-500">Pending</span>
                  )}
                </div>
                <div className="font-semibold text-[11px] truncate leading-tight" title={m.name}>
                  {m.name}
                </div>
                <div className="text-[10px] text-slate-500 font-mono mt-1">
                  {m.end_date ? m.end_date.slice(5) : 'TBD'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recharts Horizontal Gantt Chart Canvas */}
      <div className="border border-slate-200 rounded-xl p-3 bg-white overflow-hidden shadow-2xs">
        {displayedItems.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-medium">No schedule items match the current view and filter selection.</p>
            <button
              onClick={() => {
                setViewMode('phases');
                setSelectedPhaseFilter('ALL');
                setSelectedStatusFilter('ALL');
              }}
              className="mt-2 text-cyan-700 font-bold hover:underline cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="w-full" style={{ height: chartHeight }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={displayedItems}
                margin={{ top: 12, right: 32, left: 130, bottom: 20 }}
                barSize={16}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  type="number"
                  domain={[0, totalSpanDays]}
                  tickFormatter={formatOffsetToDate}
                  stroke="#94a3b8"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={{ stroke: '#cbd5e1' }}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis
                  type="category"
                  dataKey="displayName"
                  width={125}
                  tick={{ fontSize: 11, fill: '#1e293b', fontWeight: 500 }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                />

                {/* Custom Interactive Tooltip */}
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const item = payload[0].payload as GanttBarItem;
                    return (
                      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs border border-slate-700 max-w-xs space-y-2 z-50">
                        <div className="border-b border-slate-700 pb-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-cyan-400">
                              {item.wbs_code}
                            </span>
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                                item.status === 'Completed'
                                  ? 'bg-emerald-900/80 text-emerald-300'
                                  : item.status === 'Delayed'
                                  ? 'bg-rose-900/80 text-rose-300'
                                  : 'bg-cyan-900/80 text-cyan-300'
                              }`}
                            >
                              {item.status}
                            </span>
                          </div>
                          <div className="font-bold text-white mt-1 text-sm">{item.name}</div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                          <div>
                            <span className="text-slate-400 block text-[10px]">Start Date:</span>
                            <span className="font-mono text-white font-medium">{item.start_date}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">Completion:</span>
                            <span className="font-mono text-white font-medium">{item.end_date}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">Duration:</span>
                            <span className="text-white font-medium">
                              {item.durationDays} Days ({Math.round((item.durationDays / 7) * 10) / 10} wks)
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">Progress:</span>
                            <span className="text-cyan-300 font-bold">{item.progress}%</span>
                          </div>
                        </div>

                        {/* Financials preview if available */}
                        {item.planned_cost > 0 && (
                          <div className="pt-1 border-t border-slate-800 flex items-center justify-between text-[10px]">
                            <span className="text-slate-400">Budget:</span>
                            <span className="font-mono text-slate-200">
                              {formatCurrency(item.planned_cost)}
                            </span>
                            <span className="text-slate-400 ml-2">Actual:</span>
                            <span className="font-mono text-amber-400 font-bold">
                              {formatCurrency(item.actual_cost)}
                            </span>
                          </div>
                        )}

                        {/* Progress Bar inside tooltip */}
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-cyan-400 h-full rounded-full"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                      </div>
                    );
                  }}
                />

                {/* Vertical "Today" reference line */}
                {todayOffsetDays >= 0 && todayOffsetDays <= totalSpanDays && (
                  <ReferenceLine
                    x={todayOffsetDays}
                    stroke="#ef4444"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    label={{
                      value: 'TODAY',
                      fill: '#ef4444',
                      fontSize: 10,
                      fontWeight: 'bold',
                      position: 'top',
                    }}
                  />
                )}

                {/* Invisible offset bar to establish horizontal starting point */}
                <Bar
                  dataKey="offsetDays"
                  stackId="gantt"
                  fill="transparent"
                  isAnimationActive={false}
                />

                {/* Completed portion of duration */}
                <Bar
                  dataKey="completedDays"
                  stackId="gantt"
                  name="Completed"
                  radius={[3, 0, 0, 3]}
                  isAnimationActive={true}
                >
                  {displayedItems.map((entry, index) => (
                    <Cell
                      key={`cell-comp-${index}`}
                      fill={entry.statusColor}
                      stroke={entry.is_phase ? '#0f172a' : 'transparent'}
                      strokeWidth={entry.is_phase ? 1 : 0}
                    />
                  ))}
                </Bar>

                {/* Remaining / In-Progress duration */}
                <Bar
                  dataKey="remainingDays"
                  stackId="gantt"
                  name="Remaining"
                  radius={[0, 4, 4, 0]}
                  isAnimationActive={true}
                >
                  {displayedItems.map((entry, index) => (
                    <Cell
                      key={`cell-rem-${index}`}
                      fill="#e2e8f0"
                      stroke="#cbd5e1"
                      strokeDasharray={entry.status === 'Delayed' ? '2 2' : undefined}
                      strokeWidth={1}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Legend */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-emerald-600 inline-block" />
              <span>Completed Duration</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-cyan-600 inline-block" />
              <span>In Progress</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-slate-200 border border-slate-300 inline-block" />
              <span>Remaining Scheduled</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 border-t-2 border-dashed border-red-500 inline-block" />
              <span className="text-red-600 font-medium">Current Date (Today)</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400">
            Showing {displayedItems.length} schedule activities across {phases.length} phases
          </div>
        </div>
      </div>
    </div>
  );
};
