import React, { useState, useEffect } from 'react';
import { ProjectMilestone } from '../../types';
import { formatDate } from '../../utils/formatters';
import {
  X,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  Clock,
  Sparkles,
  FileCheck2,
} from 'lucide-react';

interface RecordMilestoneActualModalProps {
  isOpen: boolean;
  onClose: () => void;
  milestone: ProjectMilestone | null;
  onConfirm: (id: string, actualDate: string, notes?: string) => void;
}

export const RecordMilestoneActualModal: React.FC<RecordMilestoneActualModalProps> = ({
  isOpen,
  onClose,
  milestone,
  onConfirm,
}) => {
  const [actualDate, setActualDate] = useState('');
  const [verificationNotes, setVerificationNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (milestone) {
      setActualDate(milestone.actual_date || new Date().toISOString().split('T')[0]);
      setVerificationNotes(milestone.notes || '');
      setError(null);
    }
  }, [milestone, isOpen]);

  if (!isOpen || !milestone) return null;

  // Calculate variance between planned and selected actual date
  const getVarianceAnalysis = () => {
    if (!milestone.planned_date || !actualDate) return null;
    const p = new Date(milestone.planned_date).getTime();
    const a = new Date(actualDate).getTime();
    const diffDays = Math.round((a - p) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return {
        days: 0,
        text: 'Achieved exactly on planned critical path date (0d Variance)',
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        tone: 'neutral',
      };
    } else if (diffDays > 0) {
      return {
        days: diffDays,
        text: `Achieved ${diffDays} day${diffDays > 1 ? 's' : ''} after planned critical date (+${diffDays}d Slippage)`,
        badgeClass: 'bg-rose-100 text-rose-800 border-rose-300',
        tone: 'delay',
      };
    } else {
      const aheadDays = Math.abs(diffDays);
      return {
        days: diffDays,
        text: `Achieved ${aheadDays} day${aheadDays > 1 ? 's' : ''} ahead of schedule (-${aheadDays}d Ahead)`,
        badgeClass: 'bg-cyan-100 text-cyan-800 border-cyan-300',
        tone: 'early',
      };
    }
  };

  const variance = getVarianceAnalysis();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actualDate) {
      setError('Please select the actual date the milestone was achieved');
      return;
    }
    onConfirm(milestone.id, actualDate, verificationNotes);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-900 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Record Actual Completion</h3>
              <p className="text-xs text-emerald-200/80">
                Confirm deliverable sign-off & compute critical path variance
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Milestone Details Card */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {milestone.category}
              </span>
              {milestone.is_critical_path && (
                <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-amber-100 text-amber-900 rounded border border-amber-300">
                  CRITICAL PATH
                </span>
              )}
            </div>
            <h4 className="text-sm font-bold text-slate-900">{milestone.title}</h4>
            <div className="flex items-center gap-4 text-xs text-slate-600 pt-1">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-cyan-600" />
                Planned Target: <strong className="font-mono">{formatDate(milestone.planned_date)}</strong>
              </span>
            </div>
          </div>

          {/* Actual Completion Date Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              <span>Actual Completion Date <span className="text-rose-500">*</span></span>
            </label>
            <input
              type="date"
              required
              value={actualDate}
              onChange={(e) => setActualDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Dynamic Real-time Variance Analysis Banner */}
          {variance && (
            <div className={`p-3 rounded-lg border text-xs flex items-center justify-between ${variance.badgeClass}`}>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 shrink-0" />
                <span className="font-medium">{variance.text}</span>
              </div>
              <span className="font-mono font-bold">
                {variance.days > 0 ? `+${variance.days}d` : `${variance.days}d`}
              </span>
            </div>
          )}

          {/* Verification / Quality Sign-off Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <FileCheck2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Sign-off / Verification Notes</span>
            </label>
            <textarea
              rows={3}
              value={verificationNotes}
              onChange={(e) => setVerificationNotes(e.target.value)}
              placeholder="e.g. Field inspection completed by structural consultant; signed certificate of occupancy granted."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white resize-none"
            />
          </div>

          {/* Footer Actions */}
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
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm Completion</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
