import React, { useState, useMemo } from 'react';
import { Project, CostRecord, SiteReport, ProjectDocument } from '../../types';
import { formatCurrency, formatDate, formatPercent } from '../../utils/formatters';
import {
  Clock,
  Calendar,
  Receipt,
  ClipboardList,
  FolderOpen,
  DollarSign,
  HardHat,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  ArrowUpDown,
  Plus,
  FileText,
  AlertTriangle,
  Sun,
  CloudRain,
  Cloud,
  Wind,
  CheckCircle2,
  ExternalLink,
  Users,
  Camera,
  Layers,
  Flag,
  Sparkles,
} from 'lucide-react';

export type TimelineEventType = 'all' | 'cost' | 'site_report' | 'document' | 'milestone';

export interface TimelineItem {
  id: string;
  date: string;
  timestamp: number;
  type: 'cost' | 'site_report' | 'document' | 'milestone';
  title: string;
  subtitle?: string;
  badgeText?: string;
  badgeColor: string;
  amount?: number;
  metadata?: {
    category?: string;
    payee?: string;
    invoiceNumber?: string;
    reference?: string;
    wbsCode?: string;
    weather?: string;
    workersCount?: number;
    progress?: number;
    safetyNotes?: string;
    issues?: string;
    activities?: string;
    photosCount?: number;
    version?: string;
    docStatus?: string;
    fileName?: string;
    uploadedBy?: string;
    supervisor?: string;
  };
}

interface ProjectTimelineProps {
  project: Project;
  costs: CostRecord[];
  siteReports: SiteReport[];
  documents?: ProjectDocument[];
  onNavigateToTab: (tab: string, contextId?: string) => void;
  onOpenAddCost: (projectId: string) => void;
  onOpenAddSiteReport: (projectId: string) => void;
}

export const ProjectTimeline: React.FC<ProjectTimelineProps> = ({
  project,
  costs,
  siteReports,
  documents = [],
  onNavigateToTab,
  onOpenAddCost,
  onOpenAddSiteReport,
}) => {
  const [filterType, setFilterType] = useState<TimelineEventType>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedItemIds, setExpandedItemIds] = useState<Set<string>>(new Set());

  // Aggregate and normalize all chronological events for this project
  const timelineEvents = useMemo(() => {
    const items: TimelineItem[] = [];

    // 1. Cost Entries
    costs.forEach((cost) => {
      const dateStr = cost.date || cost.created_at || '';
      const ts = dateStr ? new Date(dateStr).getTime() : 0;
      items.push({
        id: `cost-${cost.id}`,
        date: dateStr,
        timestamp: isNaN(ts) ? 0 : ts,
        type: 'cost',
        title: cost.description || 'Cost Entry',
        subtitle: `Payee: ${cost.payee || 'Vendor / Contractor'} • Ref: ${cost.reference || 'N/A'}`,
        badgeText: cost.category,
        badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
        amount: cost.amount,
        metadata: {
          category: cost.category,
          payee: cost.payee,
          invoiceNumber: cost.invoice_number,
          reference: cost.reference,
          wbsCode: cost.wbs_id,
        },
      });
    });

    // 2. Site Reports
    siteReports.forEach((sr) => {
      const dateStr = sr.date || sr.created_at || '';
      const ts = dateStr ? new Date(dateStr).getTime() : 0;
      items.push({
        id: `report-${sr.id}`,
        date: dateStr,
        timestamp: isNaN(ts) ? 0 : ts,
        type: 'site_report',
        title: `Site Progress Log: ${sr.progress}% Complete`,
        subtitle: `Supervisor: ${sr.supervisor} • ${sr.workers || 0} Workers on site`,
        badgeText: sr.weather ? `${sr.weather}` : 'Daily Log',
        badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
        metadata: {
          supervisor: sr.supervisor,
          weather: sr.weather,
          workersCount: sr.workers,
          progress: sr.progress,
          activities: sr.activities,
          safetyNotes: sr.safety_notes,
          issues: sr.issues,
          photosCount: sr.photos?.length || 0,
        },
      });
    });

    // 3. Documents & Blueprints
    documents.forEach((doc) => {
      const dateStr = doc.uploaded_at || '';
      const ts = dateStr ? new Date(dateStr).getTime() : 0;
      items.push({
        id: `doc-${doc.id}`,
        date: dateStr,
        timestamp: isNaN(ts) ? 0 : ts,
        type: 'document',
        title: doc.title,
        subtitle: `${doc.file_name} • ${doc.version || 'v1.0'}`,
        badgeText: doc.category,
        badgeColor: 'bg-sky-100 text-sky-900 border-sky-300',
        metadata: {
          category: doc.category,
          docStatus: doc.status,
          version: doc.version,
          fileName: doc.file_name,
          uploadedBy: doc.uploaded_by,
        },
      });
    });

    // 4. Project Key Milestones
    if (project.start_date) {
      const startTs = new Date(project.start_date).getTime();
      items.push({
        id: `milestone-start-${project.id}`,
        date: project.start_date,
        timestamp: isNaN(startTs) ? 0 : startTs,
        type: 'milestone',
        title: 'Project Official Mobilization & Kickoff',
        subtitle: `Initial approved baseline budget: ${formatCurrency(project.approved_budget)}`,
        badgeText: 'Project Start',
        badgeColor: 'bg-indigo-100 text-indigo-900 border-indigo-300',
      });
    }

    if (project.status === 'Completed' && project.actual_completion) {
      const finishTs = new Date(project.actual_completion).getTime();
      items.push({
        id: `milestone-finish-${project.id}`,
        date: project.actual_completion,
        timestamp: isNaN(finishTs) ? 0 : finishTs,
        type: 'milestone',
        title: 'Final Project Handover & Completion',
        subtitle: `Project completed and verified at 100% progress`,
        badgeText: 'Completed',
        badgeColor: 'bg-purple-100 text-purple-900 border-purple-300',
      });
    }

    return items;
  }, [costs, siteReports, documents, project]);

  // Filtering and Sorting
  const filteredEvents = useMemo(() => {
    return timelineEvents
      .filter((item) => {
        // Filter by Type
        if (filterType !== 'all' && item.type !== filterType) {
          return false;
        }

        // Filter by Search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = item.title.toLowerCase().includes(q);
          const matchSub = item.subtitle?.toLowerCase().includes(q);
          const matchBadge = item.badgeText?.toLowerCase().includes(q);
          const matchPayee = item.metadata?.payee?.toLowerCase().includes(q);
          const matchSup = item.metadata?.supervisor?.toLowerCase().includes(q);
          const matchAct = item.metadata?.activities?.toLowerCase().includes(q);
          return matchTitle || matchSub || matchBadge || matchPayee || matchSup || matchAct;
        }

        return true;
      })
      .sort((a, b) => {
        return sortOrder === 'desc' ? b.timestamp - a.timestamp : a.timestamp - b.timestamp;
      });
  }, [timelineEvents, filterType, searchQuery, sortOrder]);

  // Group events by Month / Year for readable chronological visual cadence
  const groupedEvents = useMemo(() => {
    const groups: { monthYear: string; items: TimelineItem[] }[] = [];
    const map = new Map<string, TimelineItem[]>();

    filteredEvents.forEach((item) => {
      let key = 'Timeline';
      if (item.date) {
        const d = new Date(item.date);
        if (!isNaN(d.getTime())) {
          key = d.toLocaleDateString('en-CA', { month: 'long', year: 'numeric' });
        }
      }

      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(item);
    });

    map.forEach((items, monthYear) => {
      groups.push({ monthYear, items });
    });

    return groups;
  }, [filteredEvents]);

  // Metrics summary
  const totalCostAmount = useMemo(() => {
    return costs.reduce((sum, c) => sum + (c.amount || 0), 0);
  }, [costs]);

  const toggleExpand = (id: string) => {
    setExpandedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAllExpanded = () => {
    if (expandedItemIds.size > 0) {
      setExpandedItemIds(new Set());
    } else {
      setExpandedItemIds(new Set(filteredEvents.map((e) => e.id)));
    }
  };

  // Weather Icon helper
  const getWeatherIcon = (weather?: string) => {
    switch (weather) {
      case 'Clear':
      case 'Sunny':
        return <Sun className="w-3.5 h-3.5 text-amber-500" />;
      case 'Rain':
        return <CloudRain className="w-3.5 h-3.5 text-blue-500" />;
      case 'Windy':
        return <Wind className="w-3.5 h-3.5 text-teal-500" />;
      case 'Overcast':
      default:
        return <Cloud className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  return (
    <div id="project-timeline-component" className="bento-card overflow-hidden">
      {/* Header & Meta Section */}
      <div className="p-5 border-b border-slate-100 bg-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-700 border border-amber-500/20">
                <Clock className="w-4 h-4" />
              </span>
              <h2 className="text-base font-bold text-slate-900 font-sans">
                Project Chronological Timeline
              </h2>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {filteredEvents.length} {filteredEvents.length === 1 ? 'event' : 'events'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Time-ordered log of verified cost entries, daily supervisor site reports, blueprints, and milestone transitions for{' '}
              <span className="font-semibold text-slate-800">{project.name}</span>.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              id="btn-timeline-add-cost"
              onClick={() => onOpenAddCost(project.id)}
              className="px-2.5 py-1.5 rounded-lg bg-linear-to-r from-cyan-500 to-lime-500 hover:from-cyan-600 hover:to-lime-600 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer "
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Cost</span>
            </button>
            <button
              id="btn-timeline-add-report"
              onClick={() => onOpenAddSiteReport(project.id)}
              className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-cyan-50/60 text-cyan-800 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-cyan-300 shadow-xs "
            >
              <ClipboardList className="w-3.5 h-3.5 text-cyan-600" />
              <span>Submit Site Report</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-4 border-t border-slate-100">
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Cost Records
              </span>
              <Receipt className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <div className="text-sm font-bold text-slate-900 font-mono mt-0.5">
              {costs.length} recorded
            </div>
            <div className="text-[10px] text-amber-700 font-semibold font-mono">
              {formatCurrency(totalCostAmount)}
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Site Reports
              </span>
              <ClipboardList className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="text-sm font-bold text-slate-900 font-mono mt-0.5">
              {siteReports.length} field logs
            </div>
            <div className="text-[10px] text-emerald-700 font-semibold">
              Latest: {siteReports[0]?.date ? formatDate(siteReports[0].date) : 'Pending'}
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Documents & Files
              </span>
              <FolderOpen className="w-3.5 h-3.5 text-sky-600" />
            </div>
            <div className="text-sm font-bold text-slate-900 font-mono mt-0.5">
              {documents.length} attachments
            </div>
            <div className="text-[10px] text-sky-700 font-semibold">
              Blueprints, contracts & permits
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Current Progress
              </span>
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
            </div>
            <div className="text-sm font-bold text-slate-900 font-mono mt-0.5">
              {project.progress || 0}%
            </div>
            <div className="text-[10px] text-slate-500">
              Target Finish: {formatDate(project.planned_completion)}
            </div>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-100">
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <button
              id="filter-all"
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                filterType === 'all'
                  ? 'bg-linear-to-r from-cyan-600 to-lime-600 text-white font-bold shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Events ({timelineEvents.length})
            </button>

            <button
              id="filter-cost"
              type="button"
              onClick={() => setFilterType('cost')}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer ${
                filterType === 'cost'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                  : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
              }`}
            >
              <Receipt className="w-3 h-3 text-amber-700" />
              <span>Costs ({costs.length})</span>
            </button>

            <button
              id="filter-site-report"
              type="button"
              onClick={() => setFilterType('site_report')}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer ${
                filterType === 'site_report'
                  ? 'bg-emerald-600 text-white shadow-xs font-bold'
                  : 'bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              <ClipboardList className="w-3 h-3 text-emerald-700" />
              <span>Site Reports ({siteReports.length})</span>
            </button>

            <button
              id="filter-document"
              type="button"
              onClick={() => setFilterType('document')}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer ${
                filterType === 'document'
                  ? 'bg-sky-600 text-white shadow-xs font-bold'
                  : 'bg-sky-50 text-sky-900 border border-sky-200 hover:bg-sky-100'
              }`}
            >
              <FileText className="w-3 h-3 text-sky-700" />
              <span>Documents ({documents.length})</span>
            </button>

            <button
              id="filter-milestone"
              type="button"
              onClick={() => setFilterType('milestone')}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer ${
                filterType === 'milestone'
                  ? 'bg-indigo-600 text-white shadow-xs font-bold'
                  : 'bg-indigo-50 text-indigo-900 border border-indigo-200 hover:bg-indigo-100'
              }`}
            >
              <Flag className="w-3 h-3 text-indigo-700" />
              <span>Milestones</span>
            </button>
          </div>

          {/* Search, Sort, and Toggle Details */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 md:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                id="input-timeline-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search event, vendor, supervisor..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-amber-500 text-slate-800"
              />
            </div>

            <button
              id="btn-toggle-sort"
              type="button"
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="px-2.5 py-1.5 text-xs font-medium border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              title={sortOrder === 'desc' ? 'Showing newest first' : 'Showing oldest first'}
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">{sortOrder === 'desc' ? 'Newest' : 'Oldest'}</span>
            </button>

            <button
              id="btn-toggle-expand-all"
              type="button"
              onClick={toggleAllExpanded}
              className="px-2.5 py-1.5 text-xs font-medium border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
              title="Expand or collapse all details"
            >
              {expandedItemIds.size > 0 ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Collapse</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Expand</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Timeline Stream */}
      <div className="p-5 bg-slate-50/50 min-h-[300px]">
        {groupedEvents.length === 0 ? (
          <div className="py-12 px-4 text-center bg-white rounded-xl border border-slate-200/80">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
              <Filter className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No events matched your selection</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              {searchQuery
                ? `No entries matched "${searchQuery}". Try clearing your search query or reset the filter.`
                : 'There are no events logged under the selected filter criteria.'}
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              {(filterType !== 'all' || searchQuery) && (
                <button
                  onClick={() => {
                    setFilterType('all');
                    setSearchQuery('');
                  }}
                  className="px-3 py-1.5 text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Reset Filters
                </button>
              )}
              <button
                onClick={() => onOpenAddCost(project.id)}
                className="h-9 px-3.5 text-xs font-bold bg-cyan-600 text-white hover:bg-lime-500 rounded-lg transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-xs "
              >
                Record First Cost
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {groupedEvents.map((group) => (
              <div key={group.monthYear} className="relative">
                {/* Month Group Header */}
                <div className="sticky top-0 z-10 flex items-center gap-3 mb-4">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 shadow-xs text-xs font-bold text-slate-700 font-mono">
                    <Calendar className="w-3.5 h-3.5 text-amber-600" />
                    <span>{group.monthYear}</span>
                  </div>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>

                {/* Event Nodes with Vertical Axis */}
                <div className="relative pl-6 sm:pl-8 space-y-4 before:content-[''] before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {group.items.map((event) => {
                    const isExpanded = expandedItemIds.has(event.id);

                    // Timeline node icon and colors based on event type
                    let nodeIcon = <Clock className="w-3.5 h-3.5" />;
                    let nodeBg = 'bg-slate-600 text-white ring-slate-100';

                    if (event.type === 'cost') {
                      nodeIcon = <Receipt className="w-3.5 h-3.5" />;
                      nodeBg = 'bg-amber-500 text-slate-950 ring-amber-100';
                    } else if (event.type === 'site_report') {
                      nodeIcon = <HardHat className="w-3.5 h-3.5" />;
                      nodeBg = 'bg-emerald-600 text-white ring-emerald-100';
                    } else if (event.type === 'document') {
                      nodeIcon = <FileText className="w-3.5 h-3.5" />;
                      nodeBg = 'bg-sky-600 text-white ring-sky-100';
                    } else if (event.type === 'milestone') {
                      nodeIcon = <Flag className="w-3.5 h-3.5" />;
                      nodeBg = 'bg-indigo-600 text-white ring-indigo-100';
                    }

                    return (
                      <div
                        key={event.id}
                        id={`timeline-event-${event.id}`}
                        className="relative group"
                      >
                        {/* The Node Dot on the vertical line */}
                        <div
                          className={`absolute -left-6 sm:-left-8 top-3 w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center shadow-xs ring-4 ${nodeBg} transition-transform group-hover:scale-110`}
                        >
                          {nodeIcon}
                        </div>

                        {/* Event Card */}
                        <div
                          onClick={() => toggleExpand(event.id)}
                          className={`bg-white rounded-xl border p-4 transition-all cursor-pointer ${
                            isExpanded
                              ? 'border-amber-400 shadow-md ring-1 ring-amber-400/30'
                              : 'border-slate-200 hover:border-slate-300 hover:shadow-xs'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono text-xs font-semibold text-slate-500">
                                  {formatDate(event.date)}
                                </span>

                                {event.badgeText && (
                                  <span
                                    className={`px-2 py-0.5 rounded text-[11px] font-bold border ${event.badgeColor}`}
                                  >
                                    {event.badgeText}
                                  </span>
                                )}

                                {event.type === 'cost' && event.amount !== undefined && (
                                  <span className="font-mono text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                    {formatCurrency(event.amount)}
                                  </span>
                                )}

                                {event.type === 'site_report' &&
                                  event.metadata?.progress !== undefined && (
                                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                      Progress: {event.metadata.progress}%
                                    </span>
                                  )}
                              </div>

                              <h4 className="text-sm font-bold text-slate-900 mt-1 font-sans group-hover:text-amber-800 transition-colors">
                                {event.title}
                              </h4>

                              {event.subtitle && (
                                <p className="text-xs text-slate-500 mt-0.5 font-sans">
                                  {event.subtitle}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-start">
                              <button
                                type="button"
                                className="text-slate-400 hover:text-slate-700 p-1 rounded transition-colors"
                                aria-label="Toggle details"
                              >
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Expanded Detail Panel */}
                          {isExpanded && (
                            <div
                              className="mt-3 pt-3 border-t border-slate-100 text-xs space-y-2.5 text-slate-700"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {/* Specific Cost Details */}
                              {event.type === 'cost' && (
                                <div className="space-y-2">
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                                    <div>
                                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                                        Amount Incurred
                                      </span>
                                      <span className="font-mono font-bold text-amber-800 text-sm">
                                        {formatCurrency(event.amount || 0)}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                                        Category & WBS
                                      </span>
                                      <span className="font-semibold text-slate-800">
                                        {event.metadata?.category || 'General'}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                                        Receipt / Ref Number
                                      </span>
                                      <span className="font-mono text-slate-800">
                                        {event.metadata?.invoiceNumber || event.metadata?.reference || 'N/A'}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-between pt-1">
                                    <span className="text-xs text-slate-500">
                                      Payee: <strong className="text-slate-700">{event.metadata?.payee}</strong>
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => onNavigateToTab('costs', project.id)}
                                      className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 cursor-pointer"
                                    >
                                      <span>View in Cost Ledger</span>
                                      <ExternalLink className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              )}

                              {/* Specific Site Report Details */}
                              {event.type === 'site_report' && (
                                <div className="space-y-2">
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                                    <div>
                                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                                        Supervisor
                                      </span>
                                      <span className="font-semibold text-slate-800">
                                        {event.metadata?.supervisor}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                                        Weather
                                      </span>
                                      <div className="flex items-center gap-1 text-slate-800 font-semibold">
                                        {getWeatherIcon(event.metadata?.weather)}
                                        <span>{event.metadata?.weather || 'Clear'}</span>
                                      </div>
                                    </div>
                                    <div>
                                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                                        Field Workers
                                      </span>
                                      <span className="font-mono text-slate-800 font-bold">
                                        {event.metadata?.workersCount || 0} crew
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                                        Photos
                                      </span>
                                      <span className="font-semibold text-emerald-700 flex items-center gap-1">
                                        <Camera className="w-3 h-3" />
                                        <span>{event.metadata?.photosCount || 0} attached</span>
                                      </span>
                                    </div>
                                  </div>

                                  {event.metadata?.activities && (
                                    <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                                        Work & Activities Completed
                                      </span>
                                      <p className="text-xs text-slate-700 whitespace-pre-line">
                                        {event.metadata.activities}
                                      </p>
                                    </div>
                                  )}

                                  {event.metadata?.safetyNotes && (
                                    <div className="p-2 bg-amber-50/70 border border-amber-200 rounded-lg text-amber-900 flex items-start gap-2">
                                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                      <div>
                                        <span className="font-bold text-[11px] block">Safety Notes & Compliance</span>
                                        <p className="text-xs text-amber-800">{event.metadata.safetyNotes}</p>
                                      </div>
                                    </div>
                                  )}

                                  <div className="flex items-center justify-between pt-1">
                                    <span className="text-xs text-slate-500">
                                      Submitted for Project <strong className="text-slate-700">{project.project_number}</strong>
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => onNavigateToTab('site_reports', project.id)}
                                      className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                                    >
                                      <span>View Full Field Report</span>
                                      <ExternalLink className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              )}

                              {/* Specific Document Details */}
                              {event.type === 'document' && (
                                <div className="space-y-2">
                                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                                    <div>
                                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                                        Category
                                      </span>
                                      <span className="font-semibold text-slate-800">
                                        {event.metadata?.category}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                                        Version & Status
                                      </span>
                                      <span className="font-mono text-slate-800">
                                        {event.metadata?.version} • {event.metadata?.docStatus}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                                        Uploaded By
                                      </span>
                                      <span className="text-slate-800">
                                        {event.metadata?.uploadedBy || 'Team Member'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Milestone Details */}
                              {event.type === 'milestone' && (
                                <div className="p-2.5 bg-indigo-50/60 border border-indigo-200 rounded-lg text-indigo-950">
                                  <p className="text-xs font-medium">
                                    {event.subtitle || 'Critical path project lifecycle milestone reached.'}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
