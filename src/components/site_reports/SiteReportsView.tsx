import React, { useState, useMemo } from 'react';
import { useBuild } from '../../context/BuildContext';
import { SiteReport, EmailAlert, SiteReportFlag } from '../../types';
import {
  ClipboardList,
  Plus,
  Calendar,
  CloudSun,
  Users,
  AlertTriangle,
  CheckCircle,
  Truck,
  Camera,
  Search,
  X,
  Building2,
  Image as ImageIcon,
  Mail,
  Clock,
  Send,
  CheckCircle2,
  Bell,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { EmailAlertsLogModal } from './EmailAlertsLogModal';
import { EmailAlertModal } from '../common/EmailAlertModal';

interface SiteReportsViewProps {
  initialProjectId?: string;
  isAddModalOpenInitially?: boolean;
}

export const SiteReportsView: React.FC<SiteReportsViewProps> = ({
  initialProjectId,
  isAddModalOpenInitially = false,
}) => {
  const { projects, siteReports, alerts, createSiteReport, updateSiteReport, sendSiteReportAlert } = useBuild();

  const [selectedProjectId, setSelectedProjectId] = useState<string>(initialProjectId || 'ALL');
  const [selectedFlagFilter, setSelectedFlagFilter] = useState<'all' | 'normal' | 'delay' | 'critical'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReport, setSelectedReport] = useState<SiteReport | null>(null);

  // Email Alerts Modals State
  const [isAlertsLogOpen, setIsAlertsLogOpen] = useState(false);
  const [previewAlert, setPreviewAlert] = useState<EmailAlert | null>(null);
  const [isDispatchingInModal, setIsDispatchingInModal] = useState(false);
  const [dispatchFeedback, setDispatchFeedback] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(isAddModalOpenInitially);
  const [modalProjectId, setModalProjectId] = useState<string>(
    initialProjectId || projects[0]?.id || ''
  );
  const [modalDate, setModalDate] = useState(new Date().toISOString().split('T')[0]);
  const [modalWeather, setModalWeather] = useState('Clear, 18°C');
  const [modalWorkers, setModalWorkers] = useState<number>(14);
  const [modalWorkCompleted, setModalWorkCompleted] = useState(
    'Poured level 2 slab concrete. Stripped forms on ground floor columns.'
  );
  const [modalDelays, setModalDelays] = useState('None. Ready-mix concrete arrived on schedule at 08:30 AM.');
  const [modalMaterials, setModalMaterials] = useState(
    '60 cubic meters 35MPa concrete, 4 tons 15M reinforcing steel bars.'
  );
  const [modalSafetyIncidents, setModalSafetyIncidents] = useState<boolean>(false);
  const [modalSafetyDetails, setModalSafetyDetails] = useState('');
  const [modalFlag, setModalFlag] = useState<SiteReportFlag>('normal');
  const [modalFlagReason, setModalFlagReason] = useState<string>('');
  const [photoUrls, setPhotoUrls] = useState<string[]>([
    'https://images.unsplash.com/photo-1541888946425-d0fbb18615f3?w=800&auto=format&fit=crop&q=80',
  ]);

  // Filtered reports
  const filteredReports = useMemo(() => {
    return siteReports
      .filter((r) => {
        const matchProj = selectedProjectId === 'ALL' || r.project_id === selectedProjectId;
        const matchFlag = selectedFlagFilter === 'all' || (r.flag || 'normal') === selectedFlagFilter;
        const workStr = (r.work_completed || r.activities || '').toLowerCase();
        const matStr = (r.materials_delivered || r.materials || '').toLowerCase();
        const weatherStr = (r.weather || '').toLowerCase();
        const search = searchTerm.toLowerCase();

        const matchSearch =
          workStr.includes(search) || matStr.includes(search) || weatherStr.includes(search);
        return matchProj && matchFlag && matchSearch;
      })
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [siteReports, selectedProjectId, selectedFlagFilter, searchTerm]);

  const severityCounts = useMemo(() => {
    const baseReports =
      selectedProjectId === 'ALL'
        ? siteReports
        : siteReports.filter((r) => r.project_id === selectedProjectId);
    return {
      all: baseReports.length,
      normal: baseReports.filter((r) => (r.flag || 'normal') === 'normal').length,
      delay: baseReports.filter((r) => r.flag === 'delay').length,
      critical: baseReports.filter((r) => r.flag === 'critical').length,
    };
  }, [siteReports, selectedProjectId]);

  const reportTabs = [
    { id: 'all', label: 'All Logs', count: severityCounts.all },
    { id: 'normal', label: 'Routine', count: severityCounts.normal },
    { id: 'delay', label: 'Schedule Delays', count: severityCounts.delay },
    { id: 'critical', label: 'Critical Incidents', count: severityCounts.critical },
  ];

  const handleCreateReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalProjectId) return;

    createSiteReport({
      project_id: modalProjectId,
      date: modalDate,
      supervisor: 'David Chen',
      weather: modalWeather as any,
      workers: Number(modalWorkers) || 12,
      workers_count: Number(modalWorkers) || 12,
      activities: modalWorkCompleted,
      work_completed: modalWorkCompleted,
      materials: modalMaterials,
      materials_delivered: modalMaterials,
      issues: modalDelays || 'None',
      safety_notes: modalSafetyIncidents ? modalSafetyDetails : 'No safety incidents recorded',
      flag: modalFlag,
      flag_reason: modalFlagReason || (modalFlag !== 'normal' ? modalDelays || modalWorkCompleted : undefined),
      progress: 0,
      photos: photoUrls.map((url, i) => ({
        id: `photo_${Date.now()}_${i}`,
        site_report_id: '',
        file_url: url,
        caption: `Site log photo ${i + 1}`,
      })),
    });

    setIsModalOpen(false);
    // Reset modal state
    setModalFlag('normal');
    setModalFlagReason('');
  };

  const handleDispatchAlertForReport = async (
    report: SiteReport,
    flag: 'critical' | 'delay',
    customNote?: string
  ) => {
    setIsDispatchingInModal(true);
    setDispatchFeedback(null);
    try {
      updateSiteReport(report.id, { flag, flag_reason: customNote });
      await sendSiteReportAlert(report, flag, customNote);
      setDispatchFeedback(`Email alert successfully delivered to Project Manager!`);
      setTimeout(() => setDispatchFeedback(null), 4000);
    } catch (err: any) {
      console.error('Failed to dispatch alert:', err);
      setDispatchFeedback(`Error sending alert: ${err.message || 'Unknown error'}`);
    } finally {
      setIsDispatchingInModal(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        if (uploadEvent.target?.result) {
          setPhotoUrls((prev) => [...prev, uploadEvent.target!.result as string]);
        }
      };
      reader.readAsDataURL(files[0]);
    }
  };

  return (
    <div id="site-reports-view" className="space-y-5 pb-12">
      {/* Bento View Header (Reduced by 25% with Integrated Tabs & Controls) */}
      <div className="bento-card p-3 sm:p-3.5 space-y-2.5">
        {/* Top Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight font-sans">
                Site Reports & Daily Logs
              </h1>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-cyan-100 text-cyan-800 uppercase tracking-wider">
                {filteredReports.length} Submitted
              </span>
              {alerts.length > 0 && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  <Mail className="w-2.5 h-2.5 text-amber-700" />
                  {alerts.length} PM Email Alerts
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Supervisory field verification: worker counts, weather conditions, deliveries, photographic site progress, and automated PM alert dispatch.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              id="btn-open-email-alerts-log"
              onClick={() => setIsAlertsLogOpen(true)}
              className="h-7.5 px-3 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-xs inline-flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer shrink-0"
              title="View audit trail of email alerts sent to Project Managers"
            >
              <Mail className="w-3.5 h-3.5 text-cyan-600" />
              <span>PM Email Alerts</span>
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-slate-100 text-[10px] font-mono font-bold text-slate-700 border border-slate-200">
                {alerts.length}
              </span>
            </button>

            <button
              id="btn-create-site-report"
              onClick={() => setIsModalOpen(true)}
              className="h-7.5 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs inline-flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Daily Report</span>
            </button>
          </div>
        </div>

        {/* Integrated Filter Tabs & Search Controls Row */}
        <div className="pt-2 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-2.5">
          {/* Severity Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-0.5 md:pb-0 scrollbar-none">
            {reportTabs.map((tab) => {
              const isActive = selectedFlagFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedFlagFilter(tab.id as any)}
                  className={`h-7 px-2.5 rounded-md text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-2xs font-bold'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                      isActive ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search & Project Controls */}
          <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
            <div className="relative flex-1 md:w-52">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="inp-search-site-reports"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search report logs or materials..."
                className="w-full pl-8 pr-2.5 py-1 rounded-md border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500 bg-white"
              />
            </div>

            <div className="flex items-center gap-1 text-xs shrink-0">
              <select
                id="sel-filter-site-reports-project"
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="h-7 px-2.5 rounded-md border border-slate-200 text-xs bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-cyan-500 max-w-44 truncate shrink-0"
              >
                <option value="ALL">All Projects</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Bento Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
        {filteredReports.map((report) => {
          const proj = projects.find((p) => p.id === report.project_id);

          return (
            <div
              key={report.id}
              id={`site-report-card-${report.id}`}
              onClick={() => setSelectedReport(report)}
              className="bento-card p-5 flex flex-col justify-between cursor-pointer group hover:border-amber-400 transition-all"
            >
              <div>
                {/* Header Date, Status & Safety */}
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-600">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{report.date}</span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    {report.flag === 'critical' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-300">
                        <AlertTriangle className="w-3 h-3" /> Critical Alert
                      </span>
                    ) : report.flag === 'delay' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                        <Clock className="w-3 h-3" /> Delay Flagged
                      </span>
                    ) : null}

                    {report.safety_incident ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                        <AlertTriangle className="w-3 h-3" /> Incident Logged
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle className="w-3 h-3" /> Safe Shift
                      </span>
                    )}
                  </div>
                </div>

                {/* Project Title */}
                <h3 className="font-bold text-sm text-slate-900 group-hover:text-amber-800 transition-colors line-clamp-1 font-sans">
                  {proj?.name || 'Construction Project'}
                </h3>

                {/* Email Notification Status Pill (if flagged or sent) */}
                {(report.flag === 'critical' || report.flag === 'delay' || (report.email_alerts_sent && report.email_alerts_sent > 0)) && (
                  <div className="mt-1.5 flex items-center justify-between text-[11px] bg-slate-50 border border-slate-200 rounded-md px-2 py-1">
                    <div className="flex items-center gap-1.5 text-slate-700 truncate">
                      <Mail className="w-3 h-3 text-cyan-600 shrink-0" />
                      <span className="font-semibold truncate">
                        PM Alert Dispatched
                      </span>
                    </div>
                    {alerts.some((a) => a.report_id === report.id) && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const alertMatch = alerts.find((a) => a.report_id === report.id);
                          if (alertMatch) setPreviewAlert(alertMatch);
                        }}
                        className="text-[10px] font-semibold text-cyan-700 hover:text-cyan-900 hover:underline shrink-0 ml-2 cursor-pointer"
                      >
                        Preview Email
                      </button>
                    )}
                  </div>
                )}

                {/* Meta stats */}
                <div className="flex items-center gap-4 text-xs text-slate-500 mt-2">
                  <div className="flex items-center gap-1 text-[11px]">
                    <CloudSun className="w-3.5 h-3.5 text-amber-500" />
                    <span>{report.weather}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px]">
                    <Users className="w-3.5 h-3.5 text-sky-500" />
                    <span>{report.workers_count} Workers</span>
                  </div>
                </div>

                {/* Work Summary */}
                <div className="mt-3 text-xs text-slate-600 line-clamp-3 bento-subbox p-2.5">
                  <strong className="text-slate-800 block text-[10px] uppercase tracking-wider mb-0.5 font-bold">
                    Work Completed:
                  </strong>
                  {report.work_completed}
                </div>

                {/* Photos Thumbnail Preview */}
                {report.photos && report.photos.length > 0 && (
                  <div className="mt-3 flex items-center gap-2 overflow-hidden">
                    {report.photos.slice(0, 3).map((photoItem: any, idx: number) => {
                      const photoUrl = typeof photoItem === 'string' ? photoItem : photoItem?.file_url;
                      return (
                        <div
                          key={idx}
                          className="h-14 w-20 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0"
                        >
                          <img
                            src={photoUrl}
                            alt={`Site photo ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      );
                    })}
                    {report.photos.length > 3 && (
                      <div className="h-14 w-10 rounded-lg bg-slate-800 text-amber-400 flex items-center justify-center text-xs font-bold font-mono">
                        +{report.photos.length - 3}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* View detail footer */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="truncate max-w-[180px] text-[11px]">
                  Delivered: {report.materials_delivered?.split(',')[0] || 'Standard supplies'}
                </span>
                <span className="text-amber-700 font-bold group-hover:underline text-[11px]">
                  Full Report &rarr;
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {filteredReports.length === 0 && (
        <div className="text-center py-12 bento-card text-slate-500">
          <ClipboardList className="w-10 h-10 mx-auto text-slate-300 mb-2" />
          <p className="font-semibold text-slate-700 text-sm">No site reports match this filter</p>
          <p className="text-xs text-slate-400 mt-1">Submit your first report using the button above</p>
        </div>
      )}

      {/* View Full Report Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden text-slate-900 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <span className="text-xs font-mono text-slate-500 block">
                  Report Date: {selectedReport.date}
                </span>
                <h3 className="text-lg font-bold text-slate-900 font-display">
                  Daily Site Activity Log
                </h3>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-sm flex-1">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 block uppercase text-[10px]">Weather</span>
                  <span className="font-semibold text-slate-800">{selectedReport.weather}</span>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase text-[10px]">Headcount</span>
                  <span className="font-semibold text-slate-800">
                    {selectedReport.workers_count} Active Trades
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase text-[10px]">Safety Record</span>
                  <span
                    className={`font-semibold ${
                      selectedReport.safety_incident ? 'text-rose-700' : 'text-emerald-700'
                    }`}
                  >
                    {selectedReport.safety_incident ? 'Incident Reported' : 'Zero Incidents'}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Work Completed Today
                </h4>
                <p className="text-slate-800 bg-white p-3 rounded-lg border border-slate-200 text-xs leading-relaxed">
                  {selectedReport.work_completed}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Materials & Equipment Delivered
                </h4>
                <p className="text-slate-800 bg-white p-3 rounded-lg border border-slate-200 text-xs leading-relaxed">
                  {selectedReport.materials_delivered}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Delays, Roadblocks, or Issues
                </h4>
                <p className="text-slate-800 bg-white p-3 rounded-lg border border-slate-200 text-xs leading-relaxed">
                  {selectedReport.delays_issues || 'None reported.'}
                </p>
              </div>

              {/* Operational Flag & PM Notification Service Section */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-cyan-600" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      PM Email Notification Service
                    </h4>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {selectedReport.flag === 'critical' ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-300">
                        <AlertTriangle className="w-3 h-3" /> Critical Incident
                      </span>
                    ) : selectedReport.flag === 'delay' ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                        <Clock className="w-3 h-3" /> Schedule Delay
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700">
                        Routine Shift
                      </span>
                    )}
                  </div>
                </div>

                {dispatchFeedback && (
                  <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-medium flex items-center gap-2 animate-in fade-in duration-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{dispatchFeedback}</span>
                  </div>
                )}

                {/* Audit Trail for this report */}
                {(() => {
                  const reportAlerts = alerts.filter((a) => a.report_id === selectedReport.id);
                  return (
                    <div className="space-y-2">
                      {reportAlerts.length > 0 ? (
                        <div className="space-y-2">
                          <p className="text-[11px] text-slate-600">
                            <strong>{reportAlerts.length}</strong> automated email alert(s) dispatched to Project Manager:
                          </p>
                          {reportAlerts.map((alt) => (
                            <div
                              key={alt.id}
                              className="p-2.5 rounded-lg bg-white border border-slate-200 text-xs flex items-center justify-between gap-2 shadow-2xs"
                            >
                              <div className="truncate">
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase ${
                                      alt.flag === 'critical'
                                        ? 'bg-red-100 text-red-800'
                                        : 'bg-amber-100 text-amber-900'
                                    }`}
                                  >
                                    {alt.flag}
                                  </span>
                                  <span className="font-semibold text-slate-900 truncate">
                                    {alt.recipient_name} &lt;{alt.recipient_email}&gt;
                                  </span>
                                </div>
                                <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                  Sent: {new Date(alt.sent_at).toLocaleString()} • {alt.status}
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => setPreviewAlert(alt)}
                                  className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-[11px] inline-flex items-center gap-1 cursor-pointer transition-colors"
                                >
                                  <Eye className="w-3 h-3 text-slate-500" />
                                  <span>View Email</span>
                                </button>
                                <button
                                  type="button"
                                  disabled={isDispatchingInModal}
                                  onClick={() => handleDispatchAlertForReport(selectedReport, alt.flag === 'critical' ? 'critical' : 'delay', alt.metadata?.delay_reason || alt.metadata?.issues || alt.subject)}
                                  className="px-2 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-800 font-medium text-[11px] inline-flex items-center gap-1 cursor-pointer transition-colors border border-amber-200"
                                >
                                  <RefreshCw className={`w-3 h-3 ${isDispatchingInModal ? 'animate-spin' : ''}`} />
                                  <span>Resend</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-500 italic">
                          No email alerts have been dispatched for this report yet. You can flag this report below to immediately notify the Project Manager.
                        </p>
                      )}

                      {/* Action triggers */}
                      <div className="pt-2 border-t border-slate-200 flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-semibold text-slate-600">
                          Update Flag & Notify PM:
                        </span>
                        <button
                          type="button"
                          disabled={isDispatchingInModal}
                          onClick={() => handleDispatchAlertForReport(selectedReport, 'delay', selectedReport.delays_issues || 'Schedule delay reported')}
                          className="px-2.5 py-1 rounded-md bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs inline-flex items-center gap-1 cursor-pointer shadow-2xs transition-colors disabled:opacity-50"
                        >
                          <Clock className="w-3 h-3" />
                          <span>Dispatch Delay Alert</span>
                        </button>
                        <button
                          type="button"
                          disabled={isDispatchingInModal}
                          onClick={() => handleDispatchAlertForReport(selectedReport, 'critical', selectedReport.safety_notes || selectedReport.work_completed)}
                          className="px-2.5 py-1 rounded-md bg-red-600 hover:bg-red-700 text-white font-medium text-xs inline-flex items-center gap-1 cursor-pointer shadow-2xs transition-colors disabled:opacity-50"
                        >
                          <AlertTriangle className="w-3 h-3" />
                          <span>Dispatch Critical Alert</span>
                        </button>
                        {selectedReport.flag && selectedReport.flag !== 'normal' && (
                          <button
                            type="button"
                            disabled={isDispatchingInModal}
                            onClick={() => {
                              updateSiteReport(selectedReport.id, { flag: 'normal' });
                              setSelectedReport({ ...selectedReport, flag: 'normal' });
                            }}
                            className="px-2 py-1 rounded-md bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium text-xs cursor-pointer"
                          >
                            Mark Normal
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {selectedReport.photos && selectedReport.photos.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Site Photography ({selectedReport.photos.length})
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedReport.photos.map((photo: any, i: number) => {
                      const photoUrl = typeof photo === 'string' ? photo : photo?.file_url;
                      return (
                        <div
                          key={i}
                          className="rounded-xl overflow-hidden border border-slate-200 max-h-48 bg-slate-100"
                        >
                          <img
                            src={photoUrl}
                            alt={`Site ${i + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsAlertsLogOpen(true)}
                className="text-xs font-medium text-slate-600 hover:text-slate-900 inline-flex items-center gap-1 cursor-pointer"
              >
                <Mail className="w-3.5 h-3.5 text-cyan-600" />
                <span>Open All PM Alerts Audit Log ({alerts.length})</span>
              </button>
              <button
                onClick={() => setSelectedReport(null)}
                className="px-4 py-2 bg-linear-to-r from-cyan-600 to-lime-600 hover:from-cyan-700 hover:to-lime-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer "
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Site Report Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden text-slate-900 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-100 text-amber-800">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-display">
                    Submit Daily Site Report
                  </h3>
                  <p className="text-xs text-slate-500">
                    Capture daily site operational activity and progress
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateReport} className="p-6 overflow-y-auto space-y-4 text-sm flex-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Project *
                </label>
                <select
                  value={modalProjectId}
                  onChange={(e) => setModalProjectId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white font-medium"
                  required
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={modalDate}
                    onChange={(e) => setModalDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Weather *
                  </label>
                  <input
                    type="text"
                    required
                    value={modalWeather}
                    onChange={(e) => setModalWeather(e.target.value)}
                    placeholder="e.g. Sunny, 21°C"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Workers on Site *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={modalWorkers}
                    onChange={(e) => setModalWorkers(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Work Completed Today *
                </label>
                <textarea
                  rows={2}
                  required
                  value={modalWorkCompleted}
                  onChange={(e) => setModalWorkCompleted(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  placeholder="Key milestones, concrete pours, framing progress"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Materials Delivered
                </label>
                <input
                  type="text"
                  value={modalMaterials}
                  onChange={(e) => setModalMaterials(e.target.value)}
                  placeholder="e.g. 50 bundles drywall, 2 tons rebar"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Delays or Issues
                </label>
                <input
                  type="text"
                  value={modalDelays}
                  onChange={(e) => setModalDelays(e.target.value)}
                  placeholder="e.g. None or Rain stoppage for 2 hours"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                />
              </div>

              {/* Safety Toggle */}
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700">
                    Any Safety Incidents or Near Misses?
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setModalSafetyIncidents(false)}
                      className={`px-3 py-1 rounded text-xs font-bold cursor-pointer ${
                        !modalSafetyIncidents
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      No (Safe)
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalSafetyIncidents(true)}
                      className={`px-3 py-1 rounded text-xs font-bold cursor-pointer ${
                        modalSafetyIncidents
                          ? 'bg-rose-600 text-white'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      Yes (Incident)
                    </button>
                  </div>
                </div>

                {modalSafetyIncidents && (
                  <input
                    type="text"
                    required={modalSafetyIncidents}
                    value={modalSafetyDetails}
                    onChange={(e) => setModalSafetyDetails(e.target.value)}
                    placeholder="Describe incident, injured parties, corrective actions taken"
                    className="w-full px-3 py-2 rounded-lg border border-rose-300 text-xs bg-white text-rose-900"
                  />
                )}
              </div>

              {/* Operational Flag & PM Notification Trigger */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800">
                    Operational Status & PM Alert Trigger
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Auto-Email Notification
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setModalFlag('normal')}
                    className={`py-2 px-2.5 rounded-lg border text-xs font-semibold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      modalFlag === 'normal'
                        ? 'bg-white border-slate-400 text-slate-800 shadow-2xs ring-1 ring-slate-400'
                        : 'bg-slate-100/70 border-slate-200 text-slate-500 hover:bg-white'
                    }`}
                  >
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>Routine</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setModalFlag('delay')}
                    className={`py-2 px-2.5 rounded-lg border text-xs font-semibold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      modalFlag === 'delay'
                        ? 'bg-amber-50 border-amber-400 text-amber-950 shadow-2xs ring-1 ring-amber-400 font-bold'
                        : 'bg-slate-100/70 border-slate-200 text-slate-500 hover:bg-amber-50/50'
                    }`}
                  >
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>Delay</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setModalFlag('critical')}
                    className={`py-2 px-2.5 rounded-lg border text-xs font-semibold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      modalFlag === 'critical'
                        ? 'bg-red-50 border-red-400 text-red-950 shadow-2xs ring-1 ring-red-400 font-bold'
                        : 'bg-slate-100/70 border-slate-200 text-slate-500 hover:bg-red-50/50'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span>Critical</span>
                  </button>
                </div>

                {modalFlag !== 'normal' && (
                  <div className="mt-2 space-y-2 animate-in fade-in duration-200">
                    <div className="p-2.5 rounded-lg bg-amber-50/90 border border-amber-300 text-amber-900 text-xs flex items-start gap-2">
                      <Mail className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                      <div className="leading-tight">
                        <strong className="font-bold block text-amber-950">
                          Automated PM Email Alert Active
                        </strong>
                        Submitting this report flagged as{' '}
                        <span className="font-bold uppercase tracking-wide">
                          {modalFlag}
                        </span>{' '}
                        will immediately dispatch an email notification to the Project Manager (David Chen &lt;david.chen@buildiq.ca&gt;).
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        PM Alert Summary Note (Included in Email subject & body):
                      </label>
                      <input
                        type="text"
                        value={modalFlagReason}
                        onChange={(e) => setModalFlagReason(e.target.value)}
                        placeholder="e.g. 4-hour crane hydraulic pump breakdown causing pour delay"
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Photos Upload */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Site Photos
                </label>
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50">
                    <Camera className="w-4 h-4 text-slate-500" />
                    <span>Upload Image File</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  <span className="text-xs text-slate-400">
                    {photoUrls.length} image(s) attached
                  </span>
                </div>

                {photoUrls.length > 0 && (
                  <div className="flex items-center gap-2 mt-2">
                    {photoUrls.map((p, i) => (
                      <div key={i} className="relative h-12 w-12 rounded border overflow-hidden">
                        <img src={p} alt="upload" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="btn-submit-site-report"
                  type="submit"
                  className="px-5 py-2 bg-cyan-600 hover:bg-lime-500 text-white font-bold rounded-lg text-xs cursor-pointer shadow-xs transition-all "
                >
                  Submit Report {modalFlag !== 'normal' && '& Send PM Alert'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Email Alerts Audit Trail Log Modal */}
      <EmailAlertsLogModal
        isOpen={isAlertsLogOpen}
        onClose={() => setIsAlertsLogOpen(false)}
      />

      {/* Individual Email Alert Preview & Resend Modal */}
      <EmailAlertModal
        alert={previewAlert}
        isOpen={!!previewAlert}
        onClose={() => setPreviewAlert(null)}
      />
    </div>
  );
};
