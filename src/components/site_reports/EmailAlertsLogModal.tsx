import React, { useState } from 'react';
import { EmailAlert } from '../../types';
import { useBuild } from '../../context/BuildContext';
import {
  X,
  Mail,
  AlertTriangle,
  Clock,
  CheckCircle2,
  RefreshCw,
  Eye,
  Filter,
  Search,
  ExternalLink,
  Send,
  Trash2,
} from 'lucide-react';
import { EmailAlertModal } from '../common/EmailAlertModal';

interface EmailAlertsLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewReport?: (reportId: string) => void;
}

export const EmailAlertsLogModal: React.FC<EmailAlertsLogModalProps> = ({
  isOpen,
  onClose,
  onViewReport,
}) => {
  const { alerts, resendEmailAlert, sendTestEmailAlert, clearAlerts, projects } = useBuild();
  const [selectedAlert, setSelectedAlert] = useState<EmailAlert | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'critical' | 'delay'>('all');
  const [filterProject, setFilterProject] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testSuccess, setTestSuccess] = useState(false);

  if (!isOpen) return null;

  const filteredAlerts = alerts.filter((alert) => {
    if (filterSeverity !== 'all' && alert.flag !== filterSeverity) return false;
    if (filterProject !== 'all' && alert.project_id !== filterProject) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        alert.project_name.toLowerCase().includes(q) ||
        alert.recipient_name.toLowerCase().includes(q) ||
        alert.recipient_email.toLowerCase().includes(q) ||
        alert.subject.toLowerCase().includes(q) ||
        (alert.metadata?.issues && alert.metadata.issues.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const criticalCount = alerts.filter((a) => a.flag === 'critical').length;
  const delayCount = alerts.filter((a) => a.flag === 'delay').length;

  const handleSendTest = async (flag: 'critical' | 'delay') => {
    setIsSendingTest(true);
    try {
      await sendTestEmailAlert('david.chen@buildiq.ca', flag);
      setTestSuccess(true);
      setTimeout(() => setTestSuccess(false), 3500);
    } catch (err) {
      console.error('Failed to send test alert:', err);
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <>
      <div
        id="email-alerts-log-backdrop"
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto"
        onClick={onClose}
      >
        <div
          id="email-alerts-log-container"
          className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-4xl w-full flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-linear-to-tr from-cyan-500 to-lime-500 flex items-center justify-center text-white font-bold shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold  text-white">
                    PM Email Notification Audit Log
                  </h2>
                  <span className="text-xs font-mono font-bold bg-cyan-950 text-cyan-400 border border-cyan-700/50 px-2 py-0.5 rounded">
                    Field Integration
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Real-time record of email alerts dispatched to Project Managers for Critical & Delay site reports.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="btn-close-alerts-log"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Metrics & Test Dispatch Bar */}
          <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5 font-medium text-slate-700">
                <span className="font-bold text-slate-900">{alerts.length}</span> Total Dispatched
              </div>
              <div className="flex items-center gap-1.5 text-red-700 font-medium bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span className="font-bold">{criticalCount}</span> Critical Incidents
              </div>
              <div className="flex items-center gap-1.5 text-amber-700 font-medium bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                <Clock className="w-3.5 h-3.5" />
                <span className="font-bold">{delayCount}</span> Schedule Delays
              </div>
            </div>

            <div className="flex items-center gap-2">
              {testSuccess && (
                <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Test Alert Delivered!
                </span>
              )}

              <button
                type="button"
                onClick={() => handleSendTest('critical')}
                disabled={isSendingTest}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                title="Send simulated Critical email alert to PM David Chen"
              >
                <Send className="w-3 h-3" />
                Test Critical Alert
              </button>

              <button
                type="button"
                onClick={() => handleSendTest('delay')}
                disabled={isSendingTest}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                title="Send simulated Delay email alert to PM David Chen"
              >
                <Send className="w-3 h-3" />
                Test Delay Alert
              </button>
            </div>
          </div>

          {/* Filter & Search Toolbar */}
          <div className="p-4 bg-white border-b border-slate-200 flex flex-wrap items-center gap-3">
            <div className="relative grow max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search alerts by project, recipient, issues..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-500 font-medium">Flag:</span>
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value as any)}
                className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 focus:outline-hidden"
              >
                <option value="all">All Severities</option>
                <option value="critical">Critical Incidents Only</option>
                <option value="delay">Schedule Delays Only</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-500 font-medium">Project:</span>
              <select
                value={filterProject}
                onChange={(e) => setFilterProject(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 focus:outline-hidden max-w-xs truncate"
              >
                <option value="all">All Projects</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Alerts List Table */}
          <div className="overflow-y-auto grow p-4 bg-slate-50/50">
            {filteredAlerts.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border border-slate-200 p-8">
                <Mail className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-slate-700">No Dispatched Email Alerts Found</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Site reports flagged as 'critical' or 'delay' will appear here with recipient delivery status and HTML previews.
                </p>
                <div className="mt-4 flex justify-center gap-2">
                  <button
                    onClick={() => handleSendTest('critical')}
                    className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Send First Test Email Alert
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredAlerts.map((alert) => {
                  const isCritical = alert.flag === 'critical';
                  return (
                    <div
                      key={alert.id}
                      className={`bg-white rounded-lg p-3.5 border transition-all hover:shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isCritical
                          ? 'border-red-200 hover:border-red-300'
                          : 'border-amber-200 hover:border-amber-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                            isCritical
                              ? 'bg-red-100 text-red-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {isCritical ? (
                            <AlertTriangle className="w-4 h-4" />
                          ) : (
                            <Clock className="w-4 h-4" />
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                                isCritical
                                  ? 'bg-red-50 text-red-800 border-red-300'
                                  : 'bg-amber-50 text-amber-800 border-amber-300'
                              }`}
                            >
                              {alert.flag.toUpperCase()} ALERT
                            </span>
                            <span className="text-xs font-bold text-slate-900">
                              {alert.project_name}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              {new Date(alert.sent_at).toLocaleDateString()} {new Date(alert.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          <div className="text-xs text-slate-600 mt-1 line-clamp-1">
                            <span className="font-semibold text-slate-800">To PM:</span> {alert.recipient_name} ({alert.recipient_email}) &bull; <span className="font-semibold text-slate-800">Supervisor:</span> {alert.sender_name}
                          </div>

                          {alert.metadata?.issues && (
                            <div className="text-xs text-slate-500 mt-1 line-clamp-1 bg-slate-50 px-2 py-1 rounded border border-slate-200/60 font-mono">
                              {alert.metadata.issues}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-medium">
                          <CheckCircle2 className="w-3 h-3" /> Delivered
                        </span>

                        <button
                          type="button"
                          onClick={() => setSelectedAlert(alert)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Preview HTML
                        </button>

                        <button
                          type="button"
                          onClick={() => resendEmailAlert(alert.id)}
                          className="p-1 rounded-md text-slate-400 hover:text-cyan-700 hover:bg-cyan-50 transition-colors cursor-pointer"
                          title="Resend this email alert"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>
              Configured recipient: <strong>david.chen@buildiq.ca</strong> (Project Manager)
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Individual Email Alert Preview Modal */}
      {selectedAlert && (
        <EmailAlertModal
          alert={selectedAlert}
          onClose={() => setSelectedAlert(null)}
          onViewReport={onViewReport}
        />
      )}
    </>
  );
};
