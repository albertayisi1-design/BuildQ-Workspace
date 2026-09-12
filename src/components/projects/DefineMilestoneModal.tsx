import React, { useState, useEffect } from 'react';
import { Project, ProjectMilestone, MilestoneStatus } from '../../types';
import {
  X,
  Flag,
  Calendar,
  Layers,
  AlertTriangle,
  User,
  FileText,
  Clock,
  CheckCircle2,
  Sparkles,
  Percent,
} from 'lucide-react';

interface DefineMilestoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  milestoneToEdit?: ProjectMilestone | null;
  onSave: (data: Omit<ProjectMilestone, 'id' | 'created_at'>, id?: string) => void;
}

const COMMON_CATEGORIES = [
  'Substructure & Foundations',
  'Superstructure & Framing',
  'Building Envelope & Glazing',
  'MEP & Specialized Mechanical',
  'Drywall & Interior Finishes',
  'Commissioning, Testing & Handover',
  'Regulatory, Permitting & Code',
];

export const DefineMilestoneModal: React.FC<DefineMilestoneModalProps> = ({
  isOpen,
  onClose,
  project,
  milestoneToEdit,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(COMMON_CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState('');
  const [isCriticalPath, setIsCriticalPath] = useState(true);
  const [plannedDate, setPlannedDate] = useState('');
  const [actualDate, setActualDate] = useState('');
  const [status, setStatus] = useState<MilestoneStatus>('Pending');
  const [progress, setProgress] = useState<number>(0);
  const [responsibleParty, setResponsibleParty] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (milestoneToEdit) {
      setTitle(milestoneToEdit.title);
      if (COMMON_CATEGORIES.includes(milestoneToEdit.category)) {
        setCategory(milestoneToEdit.category);
        setCustomCategory('');
      } else {
        setCategory('Other');
        setCustomCategory(milestoneToEdit.category);
      }
      setIsCriticalPath(milestoneToEdit.is_critical_path);
      setPlannedDate(milestoneToEdit.planned_date);
      setActualDate(milestoneToEdit.actual_date || '');
      setStatus(milestoneToEdit.status);
      setProgress(milestoneToEdit.progress ?? (milestoneToEdit.status === 'Achieved' ? 100 : 0));
      setResponsibleParty(milestoneToEdit.responsible_party || '');
      setDescription(milestoneToEdit.description || '');
      setNotes(milestoneToEdit.notes || '');
    } else {
      // Defaults for new milestone
      setTitle('');
      setCategory(COMMON_CATEGORIES[0]);
      setCustomCategory('');
      setIsCriticalPath(true);
      setPlannedDate(project.planned_completion || new Date().toISOString().split('T')[0]);
      setActualDate('');
      setStatus('Pending');
      setProgress(0);
      setResponsibleParty(project.project_manager || '');
      setDescription('');
      setNotes('');
    }
    setError(null);
  }, [milestoneToEdit, isOpen, project]);

  if (!isOpen) return null;

  // Real-time variance calculation preview
  const calculateVariance = (): { days: number; label: string; color: string } | null => {
    if (!plannedDate) return null;
    const targetDate = actualDate || (status === 'Achieved' ? new Date().toISOString().split('T')[0] : null);
    if (!targetDate) return null;

    const p = new Date(plannedDate).getTime();
    const a = new Date(targetDate).getTime();
    const diffDays = Math.round((a - p) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return { days: 0, label: '0 Days (Precisely on baseline schedule)', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    } else if (diffDays > 0) {
      return { days: diffDays, label: `+${diffDays} Days Delay vs planned critical path`, color: 'text-rose-700 bg-rose-50 border-rose-200' };
    } else {
      return { days: diffDays, label: `${Math.abs(diffDays)} Days Ahead of critical path schedule`, color: 'text-cyan-800 bg-cyan-50 border-cyan-200' };
    }
  };

  const variancePreview = calculateVariance();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Milestone title is required');
      return;
    }
    if (!plannedDate) {
      setError('Planned critical path date is required');
      return;
    }

    const resolvedCategory = category === 'Other' ? customCategory.trim() || 'General' : category;

    // Determine variance
    let variance_days = 0;
    if (actualDate && plannedDate) {
      const p = new Date(plannedDate).getTime();
      const a = new Date(actualDate).getTime();
      variance_days = Math.round((a - p) / (1000 * 60 * 60 * 24));
    }

    let finalActualDate = actualDate.trim() || undefined;
    if (status === 'Achieved' && !finalActualDate) {
      finalActualDate = new Date().toISOString().split('T')[0];
      const p = new Date(plannedDate).getTime();
      const a = new Date(finalActualDate).getTime();
      variance_days = Math.round((a - p) / (1000 * 60 * 60 * 24));
    }

    const payload: Omit<ProjectMilestone, 'id' | 'created_at'> = {
      project_id: project.id,
      title: title.trim(),
      category: resolvedCategory,
      is_critical_path: isCriticalPath,
      planned_date: plannedDate,
      actual_date: finalActualDate,
      variance_days,
      status,
      progress: status === 'Achieved' ? 100 : progress,
      responsible_party: responsibleParty.trim() || undefined,
      description: description.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    onSave(payload, milestoneToEdit?.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
              <Flag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {milestoneToEdit ? 'Edit Critical Path Milestone' : 'Define New Critical Path Milestone'}
              </h3>
              <p className="text-xs text-slate-300">
                {project.name} &bull; Critical path schedule & completion tracking
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Milestone Name / Critical Deliverable <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Substructure Raft Slab Pour & Curing"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:bg-white transition-colors"
            />
          </div>

          {/* Critical Path Indicator Banner / Toggle */}
          <div className="p-3.5 bg-amber-50/60 border border-amber-200/80 rounded-xl flex items-start gap-3">
            <input
              type="checkbox"
              id="is_critical_path"
              checked={isCriticalPath}
              onChange={(e) => setIsCriticalPath(e.target.checked)}
              className="mt-1 w-4 h-4 text-amber-600 rounded border-amber-300 focus:ring-amber-500 cursor-pointer"
            />
            <label htmlFor="is_critical_path" className="cursor-pointer">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-950 uppercase tracking-wide">
                  Critical Path Milestone
                </span>
                {isCriticalPath && (
                  <span className="px-1.5 py-0.5 text-[10px] font-extrabold bg-amber-200 text-amber-900 rounded font-mono">
                    SCHEDULE-CRITICAL
                  </span>
                )}
              </div>
              <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                Critical path milestones determine the minimum overall project duration. Any delay here directly drives baseline schedule slippage and late handover penalties.
              </p>
            </label>
          </div>

          {/* Category & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                <span>Phase / Category</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:bg-white"
              >
                {COMMON_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
                <option value="Other">Other / Custom Category...</option>
              </select>

              {category === 'Other' && (
                <input
                  type="text"
                  placeholder="Enter custom category"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="mt-2 w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Current Status</span>
              </label>
              <select
                value={status}
                onChange={(e) => {
                  const newStatus = e.target.value as MilestoneStatus;
                  setStatus(newStatus);
                  if (newStatus === 'Achieved') {
                    setProgress(100);
                    if (!actualDate) {
                      setActualDate(new Date().toISOString().split('T')[0]);
                    }
                  } else if (newStatus === 'Pending') {
                    setProgress(0);
                  }
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:bg-white font-medium"
              >
                <option value="Pending">Pending (Not Started)</option>
                <option value="In Progress">In Progress</option>
                <option value="Achieved">Achieved / Completed</option>
                <option value="Delayed">Delayed / At Risk</option>
              </select>
            </div>
          </div>

          {/* Planned Date vs Actual Completion Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50/80 border border-slate-200 rounded-xl">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-cyan-600" />
                <span>Planned Critical Date <span className="text-rose-500">*</span></span>
              </label>
              <input
                type="date"
                required
                value={plannedDate}
                onChange={(e) => setPlannedDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:ring-2 focus:ring-cyan-500"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Baseline contractual / engineering target</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Actual Completion Date</span>
              </label>
              <input
                type="date"
                value={actualDate}
                onChange={(e) => {
                  setActualDate(e.target.value);
                  if (e.target.value && status !== 'Achieved') {
                    // Prompt status update if actual date is supplied
                    setStatus('Achieved');
                    setProgress(100);
                  }
                }}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                {status === 'Achieved' ? 'Date signed off & verified' : 'Optional until milestone is achieved'}
              </span>
            </div>

            {/* Calculated Variance Live Feedback */}
            {variancePreview && (
              <div className={`col-span-full px-3 py-2 rounded-lg border text-xs font-medium flex items-center justify-between ${variancePreview.color}`}>
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Variance Analysis: <strong>{variancePreview.label}</strong></span>
                </div>
                <span className="font-mono font-bold text-[11px]">
                  {variancePreview.days > 0 ? `+${variancePreview.days}d` : `${variancePreview.days}d`}
                </span>
              </div>
            )}
          </div>

          {/* Progress & Responsible Lead */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Percent className="w-3.5 h-3.5 text-slate-400" />
                  <span>Completion Progress</span>
                </label>
                <span className="text-xs font-mono font-bold text-cyan-700">{progress}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={progress}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setProgress(val);
                  if (val === 100 && status !== 'Achieved') {
                    setStatus('Achieved');
                    if (!actualDate) setActualDate(new Date().toISOString().split('T')[0]);
                  } else if (val > 0 && status === 'Pending') {
                    setStatus('In Progress');
                  }
                }}
                className="w-full accent-cyan-600 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Responsible Lead / Subcontractor</span>
              </label>
              <input
                type="text"
                value={responsibleParty}
                onChange={(e) => setResponsibleParty(e.target.value)}
                placeholder="e.g. Apex Structural Engineers Ltd."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-cyan-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Scope / Deliverable Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Scope, Deliverables & Acceptance Criteria</span>
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detail required engineering sign-offs, inspections, or concrete cylinder strength tests..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:bg-white resize-none"
            />
          </div>

          {/* Notes / Verification Records */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Verification Sign-off & Field Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. City Inspector sign-off permit #84920 issued; 28-day break tests passed 35MPa."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:bg-white resize-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-cyan-700 hover:bg-cyan-800 rounded-lg shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Flag className="w-4 h-4" />
              <span>{milestoneToEdit ? 'Update Milestone' : 'Save Milestone'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
