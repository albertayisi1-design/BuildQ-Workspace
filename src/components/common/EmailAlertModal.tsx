import React, { useState } from 'react';
import { EmailAlert } from '../../types';
import {
  X,
  Mail,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Send,
  RefreshCw,
  ExternalLink,
  Code,
  Eye,
  Building,
  User,
  Calendar,
} from 'lucide-react';
import { useBuild } from '../../context/BuildContext';

interface EmailAlertModalProps {
  alert: EmailAlert | null;
  onClose: () => void;
  onViewReport?: (reportId: string) => void;
}

export const EmailAlertModal: React.FC<EmailAlertModalProps> = ({
  alert,
  onClose,
  onViewReport,
}) => {
  const { resendEmailAlert } = useBuild();
  const [activeTab, setActiveTab] = useState<'preview' | 'text' | 'headers'>('preview');
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  if (!alert) return null;

  const isCritical = alert.flag === 'critical';

  const handleResend = async () => {
    setIsResending(true);
    try {
      await resendEmailAlert(alert.id);
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 3500);
    } catch (err) {
      console.error('Failed to resend alert:', err);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div
      id="email-alert-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="email-alert-modal-container"
        className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          className={`px-6 py-4 border-b flex items-center justify-between ${
            isCritical
              ? 'bg-red-50/80 border-red-200 text-red-950'
              : 'bg-amber-50/80 border-amber-200 text-amber-950'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                isCritical ? 'bg-red-600 text-white' : 'bg-amber-500 text-white'
              }`}
            >
              {isCritical ? (
                <AlertTriangle className="w-5 h-5" />
              ) : (
                <Clock className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/70 border border-slate-200">
                  {alert.flag.toUpperCase()} EMAIL ALERT
                </span>
                <span className="flex items-center gap-1 text-xs text-emerald-700 font-semibold bg-emerald-100/80 px-2 py-0.5 rounded">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Delivered (250 OK)
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mt-1 line-clamp-1">
                Dispatched to Project Manager
              </h3>
            </div>
          </div>
          <button
            id="btn-close-email-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white/80 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Envelope Metadata Bar */}
        <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">From:</span>
            <span className="font-mono text-slate-800">
              BuildIQ Field Operations &lt;notifications@buildiq.ca&gt;
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">To (Project Manager):</span>
            <span className="font-mono font-semibold text-cyan-800">
              {alert.recipient_name} &lt;{alert.recipient_email}&gt;
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Subject:</span>
            <span className="font-semibold text-slate-900 truncate max-w-md">
              {alert.subject}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
            <span>Sent: {new Date(alert.sent_at).toLocaleString()}</span>
            <span className="font-mono truncate max-w-xs">{alert.message_id}</span>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex items-center justify-between px-6 pt-3 pb-2 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('preview')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer transition-all ${
                activeTab === 'preview'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              HTML Email Preview
            </button>
            <button
              onClick={() => setActiveTab('text')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer transition-all ${
                activeTab === 'text'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              Plain Text
            </button>
            <button
              onClick={() => setActiveTab('headers')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer transition-all ${
                activeTab === 'headers'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              Audit Payload
            </button>
          </div>

          {resendSuccess && (
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1 animate-in fade-in">
              <CheckCircle2 className="w-3.5 h-3.5" /> Alert re-sent successfully!
            </span>
          )}
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto grow bg-slate-100/60 max-h-[500px]">
          {activeTab === 'preview' && (
            <div className="bg-white rounded-lg shadow-xs border border-slate-200 overflow-hidden">
              <div
                className="email-html-body"
                dangerouslySetInnerHTML={{ __html: alert.body_html }}
              />
            </div>
          )}

          {activeTab === 'text' && (
            <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg text-xs font-mono whitespace-pre-wrap leading-relaxed shadow-xs">
              {alert.body_text}
            </pre>
          )}

          {activeTab === 'headers' && (
            <div className="bg-white p-4 rounded-lg border border-slate-200 font-mono text-xs text-slate-700 space-y-2">
              <div><strong>Message-ID:</strong> {alert.message_id}</div>
              <div><strong>Alert ID:</strong> {alert.id}</div>
              <div><strong>Report ID:</strong> {alert.report_id}</div>
              <div><strong>Project:</strong> {alert.project_name} ({alert.project_id})</div>
              <div><strong>Recipient:</strong> {alert.recipient_name} &lt;{alert.recipient_email}&gt;</div>
              <div><strong>Status:</strong> {alert.status}</div>
              <div><strong>Timestamp:</strong> {alert.sent_at}</div>
              <div className="pt-2 border-t border-slate-200">
                <strong>Metadata:</strong>
                <pre className="mt-1 p-2 bg-slate-50 rounded border border-slate-200 overflow-x-auto">
                  {JSON.stringify(alert.metadata, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-white border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Project: <strong>{alert.project_name}</strong></span>
          </div>

          <div className="flex items-center gap-2.5">
            {onViewReport && (
              <button
                type="button"
                onClick={() => {
                  onViewReport(alert.report_id);
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Jump to Site Report
              </button>
            )}

            <button
              id="btn-resend-email-alert"
              type="button"
              onClick={handleResend}
              disabled={isResending}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
              {isResending ? 'Resending...' : 'Resend Email to PM'}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
