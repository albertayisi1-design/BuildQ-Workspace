import React, { useState, useMemo } from 'react';
import { useBuild } from '../../context/BuildContext';
import { Project, ProjectStatus, ProjectType } from '../../types';
import { formatCurrency, calculateProjectHealth } from '../../utils/formatters';
import { HealthBadge } from '../common/HealthBadge';
import { CreateProjectModal } from './CreateProjectModal';
import {
  Building2,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  MapPin,
  Maximize2,
  Layers,
  ArrowRight,
  FolderOpen,
} from 'lucide-react';

interface ProjectsListProps {
  onSelectProject: (projectId: string) => void;
}

export const ProjectsList: React.FC<ProjectsListProps> = ({ onSelectProject }) => {
  const { projects, clients, completeProject, settings, documents } = useBuild();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.project_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.project_manager.toLowerCase().includes(searchTerm.toLowerCase());

      const matchType = selectedType === 'ALL' || p.type === selectedType;
      const matchStatus = selectedStatus === 'ALL' || p.status === selectedStatus;

      return matchSearch && matchType && matchStatus;
    });
  }, [projects, searchTerm, selectedType, selectedStatus]);

  // Aggregate project statistics for Bento metrics
  const stats = useMemo(() => {
    const totalContract = projects.reduce((acc, p) => acc + p.contract_value, 0);
    const activeCount = projects.filter((p) => p.status === 'Active').length;
    const completedCount = projects.filter((p) => p.status === 'Completed').length;
    const activeOrPlanning = projects.filter((p) => p.status !== 'Closed');
    const avgProgress = activeOrPlanning.length > 0
      ? Math.round(activeOrPlanning.reduce((sum, p) => sum + (p.progress || 0), 0) / activeOrPlanning.length)
      : 0;

    return { totalContract, activeCount, completedCount, avgProgress };
  }, [projects]);

  const handleCompleteProject = (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to mark this project as Completed? This will calculate final metrics and permanently archive it into the Archive Projects benchmark database.')) {
      completeProject(projectId);
    }
  };

  return (
    <div id="projects-list-view" className="space-y-5 pb-12">
      {/* Bento View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight font-sans">
              Projects Management
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200 uppercase tracking-wider">
              {projects.length} Total Projects
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor active site construction, track budget execution, and archive completed projects to historical benchmarks.
          </p>
        </div>

        <button
          id="btn-create-new-project"
          onClick={() => setIsCreateOpen(true)}
          className="h-9 px-3.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs inline-flex items-center gap-1.5 transition-all shadow-xs cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      {/* Bento Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bento-card p-4 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Total Projects
          </span>
          <div className="text-2xl font-bold text-slate-900 font-mono mt-1">
            {projects.length}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5">All active & archived</span>
        </div>

        <div className="bento-card p-4 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Committed Value
          </span>
          <div className="text-2xl font-bold text-slate-900 font-mono mt-1">
            {formatCurrency(stats.totalContract)}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5">Total contracted revenue</span>
        </div>

        <div className="bento-card p-4 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Average Progress
          </span>
          <div className="text-2xl font-bold text-amber-600 font-mono mt-1">
            {stats.avgProgress}%
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5">Active portfolio average</span>
        </div>

        <div className="bento-card p-4 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Project Health
          </span>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-base font-bold text-emerald-600 font-mono">{stats.activeCount} Active</span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-semibold text-slate-600">{stats.completedCount} Done</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5">Lifecycle distribution</span>
        </div>
      </div>

      {/* Bento Filter & Search Bar */}
      <div className="bento-card p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="inp-search-projects"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search projects, location, PM..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 shrink-0">
            <Filter className="w-3.5 h-3.5" />
            <span>Type:</span>
          </div>
          <select
            id="filter-project-type"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500 shrink-0"
          >
            <option value="ALL">All Project Types</option>
            <option value="Residential">Residential</option>
            <option value="Commercial">Commercial</option>
            <option value="Office Renovation">Office Renovation</option>
            <option value="Retail">Retail</option>
            <option value="Industrial">Industrial</option>
            <option value="Institutional">Institutional</option>
            <option value="Other">Other</option>
          </select>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 shrink-0 ml-2">
            <span>Status:</span>
          </div>
          <select
            id="filter-project-status"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500 shrink-0"
          >
            <option value="ALL">All Statuses</option>
            <option value="Planning">Planning</option>
            <option value="Active">Active</option>
            <option value="On Hold">On Hold</option>
            <option value="Completed">Completed</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Projects Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
        {filteredProjects.map((proj) => {
          const client = clients.find((c) => c.id === proj.client_id);
          const actualCost = proj.actual_cost || 0;
          const variance = proj.approved_budget - actualCost;
          const forecast = actualCost + Math.max(0, proj.forecast_remaining ?? (proj.approved_budget - actualCost));
          const health = calculateProjectHealth(
            proj,
            actualCost,
            forecast,
            settings.amber_threshold_percent,
            settings.red_threshold_percent
          );

          return (
            <div
              key={proj.id}
              id={`project-card-${proj.id}`}
              onClick={() => onSelectProject(proj.id)}
              className="bento-card p-5 flex flex-col justify-between cursor-pointer group hover:border-amber-400/90 hover:shadow-md transition-all"
            >
              <div>
                {/* Card Top Pill */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {proj.project_number}
                    </span>
                    {documents.some((d) => d.project_id === proj.id) && (
                      <span
                        className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded flex items-center gap-1"
                        title={`${documents.filter((d) => d.project_id === proj.id).length} attached documents`}
                      >
                        <FolderOpen className="w-3 h-3 text-slate-400" />
                        <span>{documents.filter((d) => d.project_id === proj.id).length}</span>
                      </span>
                    )}
                  </div>
                  <HealthBadge status={health} size="sm" />
                </div>

                {/* Project Title & Client */}
                <h3 className="font-bold text-base text-slate-900 group-hover:text-amber-700 transition-colors line-clamp-1">
                  {proj.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                  {client?.name || 'Standard Client'}
                </p>

                {/* Specs / Meta (Bento Sub-box) */}
                <div className="grid grid-cols-2 gap-2 mt-4 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200/70">
                  <div className="flex items-center gap-1.5 truncate">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{proj.type}</span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{proj.location}</span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate">
                    <Maximize2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{proj.floor_area} m²</span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate">
                    <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{proj.floors} Floors</span>
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="mt-4 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Contract Value:</span>
                    <span className="font-mono font-semibold text-slate-900">
                      {formatCurrency(proj.contract_value)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Approved Budget:</span>
                    <span className="font-mono text-slate-700">
                      {formatCurrency(proj.approved_budget)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Actual Cost:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {formatCurrency(actualCost)}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-500 font-medium">Progress</span>
                    <span className="font-bold text-slate-800">{proj.progress || 0}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        proj.progress === 100
                          ? 'bg-emerald-500'
                          : (proj.progress || 0) > 50
                          ? 'bg-amber-500'
                          : 'bg-sky-500'
                      }`}
                      style={{ width: `${proj.progress || 0}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  PM: <strong className="text-slate-600 font-medium">{proj.project_manager}</strong>
                </span>

                <div className="flex items-center gap-2">
                  {proj.status === 'Active' && (
                    <button
                      id={`btn-complete-project-${proj.id}`}
                      onClick={(e) => handleCompleteProject(e, proj.id)}
                      className="px-2.5 py-1 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold border border-emerald-200 transition-colors cursor-pointer flex items-center gap-1"
                      title="Mark as Completed and archive to Historical Benchmarks"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Complete</span>
                    </button>
                  )}

                  <span className="text-xs font-semibold text-amber-700 group-hover:text-amber-800 flex items-center gap-0.5">
                    <span>Overview</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredProjects.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 text-slate-500">
          <Building2 className="w-10 h-10 mx-auto text-slate-300 mb-2" />
          <p className="font-semibold text-slate-700">No matching projects found</p>
          <p className="text-xs text-slate-400 mt-1">Try adjusting your search terms or filters</p>
        </div>
      )}

      {/* Modal */}
      <CreateProjectModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={(id) => onSelectProject(id)}
      />
    </div>
  );
};
