import React, { useState, useMemo } from 'react';
import { useBuild } from '../../context/BuildContext';
import { Project, IntelligenceResult } from '../../types';
import {
  formatCurrency,
  formatPercent,
  calculateProjectHealth,
} from '../../utils/formatters';
import { HealthBadge } from '../common/HealthBadge';
import {
  FileBarChart2,
  Printer,
  Download,
  Building2,
  BrainCircuit,
  Calendar,
  CheckCircle2,
  DollarSign,
  AlertTriangle,
} from 'lucide-react';

interface ReportsViewProps {
  initialReportType?: 'project' | 'intelligence';
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  initialReportType = 'project',
}) => {
  const { projects, clients, costs, wbsItems, runIntelligenceQuery } = useBuild();

  const [activeTab, setActiveTab] = useState<'project' | 'intelligence'>(initialReportType);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || '');

  const project = projects.find((p) => p.id === selectedProjectId) || projects[0];
  const client = clients.find((c) => c.id === project?.client_id);
  const projectCosts = costs.filter((c) => c.project_id === project?.id);
  const projectWbs = wbsItems.filter((w) => w.project_id === project?.id);

  // Default intelligence result for reporting
  const intelligenceResult = useMemo(() => {
    return runIntelligenceQuery({
      name: 'Queen Street Boutique Residences',
      project_type: 'Residential',
      building_type: 'Apartment',
      location: 'Toronto, ON',
      floor_area: 600,
      floors: 3,
      delivery_method: 'Construction Management',
    });
  }, [runIntelligenceQuery]);

  const handlePrint = () => {
    window.print();
  };

  // CSV export function
  const handleExportCSV = () => {
    if (activeTab === 'project' && project) {
      let csvContent = `data:text/csv;charset=utf-8,`;
      csvContent += `BuildIQ Project Cost Report\r\n`;
      csvContent += `Project,${project.name}\r\n`;
      csvContent += `Project Number,${project.project_number}\r\n`;
      csvContent += `Client,${client?.name || ''}\r\n`;
      csvContent += `Contract Value,${project.contract_value}\r\n`;
      csvContent += `Approved Budget,${project.approved_budget}\r\n`;
      csvContent += `Actual Cost,${project.actual_cost || 0}\r\n`;
      csvContent += `Progress,${project.progress || 0}%\r\n\r\n`;

      csvContent += `Date,Category,Supplier,Reference,Amount,Description\r\n`;
      projectCosts.forEach((c) => {
        csvContent += `"${c.date}","${c.category}","${c.supplier_contractor || c.payee || ''}","${c.invoice_number || c.reference || ''}",${c.amount},"${c.description}"\r\n`;
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `BuildIQ_${project.project_number}_Cost_Report.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      let csvContent = `data:text/csv;charset=utf-8,`;
      csvContent += `BuildIQ Project Intelligence Report\r\n`;
      csvContent += `Prospective Project,${intelligenceResult.query.name}\r\n`;
      csvContent += `Type,${intelligenceResult.query.project_type}\r\n`;
      csvContent += `Floor Area (m2),${intelligenceResult.query.floor_area}\r\n`;
      csvContent += `Average Cost per m2,${intelligenceResult.benchmarks.avg_cost_per_m2}\r\n`;
      csvContent += `Preliminary Estimated Cost,${intelligenceResult.preliminary_estimate.estimated_cost}\r\n\r\n`;

      csvContent += `Category,Percentage,Amount\r\n`;
      intelligenceResult.category_breakdown.forEach((cat) => {
        csvContent += `"${cat.category}",${cat.percentage}%,${cat.amount}\r\n`;
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `BuildIQ_Intelligence_Report.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div id="reports-view" className="space-y-5 pb-12">
      {/* Bento Top Banner & Action Controls */}
      <div className="bento-card p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight font-sans">
              Reports & Executive Export
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 uppercase tracking-wider">
              PDF & Excel Ready
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Generate printable executive financial summaries and cost intelligence estimates.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            onClick={handleExportCSV}
            className="h-9 px-3.5 rounded-lg bg-white hover:bg-slate-50 hover:text-slate-900 text-slate-700 border border-slate-300 font-semibold text-xs inline-flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="h-9 px-3.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / PDF</span>
          </button>
        </div>
      </div>

      {/* Bento Report Selector Pills */}
      <div className="bento-card p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('project')}
            className={`h-9 px-3.5 rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center justify-center whitespace-nowrap ${
              activeTab === 'project'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent'
            }`}
          >
            Project Cost Report
          </button>
          <button
            onClick={() => setActiveTab('intelligence')}
            className={`h-9 px-3.5 rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center justify-center whitespace-nowrap ${
              activeTab === 'intelligence'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent'
            }`}
          >
            Project Intelligence Report
          </button>
        </div>

        {activeTab === 'project' && (
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Select Project:</span>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-800 font-medium focus:ring-1 focus:ring-amber-500 w-full sm:w-auto"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Bento Printable Report Canvas */}
      <div className="bento-card p-4 sm:p-8 md:p-12 print:border-none print:shadow-none print:p-0">
        {/* Printable Header */}
        <div className="flex items-center justify-between border-b-2 border-slate-900 pb-6 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-amber-500 text-slate-950 font-black text-base flex items-center justify-center">
                B
              </div>
              <span className="text-2xl font-black tracking-tight text-slate-900 font-display">
                BUILDIQ
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-semibold">
              Construction Project Intelligence & Cost Management
            </p>
          </div>

          <div className="text-right text-xs">
            <div className="font-bold text-slate-900 text-sm">
              {activeTab === 'project'
                ? 'EXECUTIVE PROJECT COST REPORT'
                : 'PROJECT INTELLIGENCE BENCHMARK REPORT'}
            </div>
            <div className="text-slate-500 mt-0.5">
              Generated: {new Date().toLocaleDateString()} • Currency: CAD (C$)
            </div>
          </div>
        </div>

        {/* Tab 1: Project Cost Report */}
        {activeTab === 'project' && project && (
          <div className="space-y-8">
            {/* Project Summary Section */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200 pb-1 mb-3">
                1. Project Specifications & Baseline
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block">Project Name</span>
                  <span className="font-bold text-slate-900 text-sm">{project.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Project Number</span>
                  <span className="font-mono font-bold text-slate-800">{project.project_number}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Client</span>
                  <span className="font-semibold text-slate-800">{client?.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Location</span>
                  <span className="font-semibold text-slate-800">{project.location}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Floor Area</span>
                  <span className="font-mono font-semibold text-slate-800">{project.floor_area} m²</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Project Manager</span>
                  <span className="font-semibold text-slate-800">{project.project_manager}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Start Date</span>
                  <span className="font-mono text-slate-800">{project.start_date}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Planned Finish</span>
                  <span className="font-mono text-slate-800">{project.planned_completion}</span>
                </div>
              </div>
            </div>

            {/* Financial Status Section */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200 pb-1 mb-3">
                2. Financial Overview & Cost Variance
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 block">Contract Value</span>
                  <span className="font-mono font-bold text-base text-slate-900">
                    {formatCurrency(project.contract_value)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Approved Budget</span>
                  <span className="font-mono font-bold text-base text-slate-900">
                    {formatCurrency(project.approved_budget)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Actual Cost to Date</span>
                  <span className="font-mono font-bold text-base text-amber-700">
                    {formatCurrency(project.actual_cost || 0)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Cost Variance</span>
                  <span
                    className={`font-mono font-bold text-base ${
                      project.approved_budget - (project.actual_cost || 0) >= 0
                        ? 'text-emerald-700'
                        : 'text-rose-700'
                    }`}
                  >
                    {project.approved_budget - (project.actual_cost || 0) >= 0 ? '+' : ''}
                    {formatCurrency(project.approved_budget - (project.actual_cost || 0))}
                  </span>
                </div>
              </div>
            </div>

            {/* WBS Breakdown */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200 pb-1 mb-3">
                3. Work Breakdown Structure (WBS) Status
              </h3>
              <div className="overflow-x-auto touch-pan-x scrollbar-thin">
                <table className="w-full text-left text-xs border border-slate-200 min-w-[560px]">
                  <thead className="bg-slate-100 text-slate-700 font-semibold uppercase text-[10px]">
                    <tr>
                      <th className="p-2.5">Code</th>
                      <th className="p-2.5">Phase / Activity</th>
                      <th className="p-2.5 text-right">Planned Cost</th>
                      <th className="p-2.5 text-right">Actual Cost</th>
                      <th className="p-2.5 text-center">Progress</th>
                      <th className="p-2.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono">
                    {projectWbs.map((w) => (
                      <tr key={w.id} className={w.is_phase ? 'bg-slate-50 font-bold' : ''}>
                        <td className="p-2.5 text-slate-600">{w.wbs_code}</td>
                        <td className="p-2.5 font-sans text-slate-900">{w.name}</td>
                        <td className="p-2.5 text-right">{formatCurrency(w.planned_cost)}</td>
                        <td className="p-2.5 text-right font-semibold">{formatCurrency(w.actual_cost)}</td>
                        <td className="p-2.5 text-center">{w.progress}%</td>
                        <td className="p-2.5 text-center font-sans text-[11px]">{w.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Signatures */}
            <div className="pt-8 sm:pt-12 grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-12 text-xs border-t border-slate-200">
              <div>
                <div className="border-b border-slate-400 pb-8 mb-2"></div>
                <span className="font-semibold text-slate-800">Project Manager Signature</span>
                <p className="text-slate-400 text-[10px]">{project.project_manager}</p>
              </div>
              <div>
                <div className="border-b border-slate-400 pb-8 mb-2"></div>
                <span className="font-semibold text-slate-800">Executive Director Approval</span>
                <p className="text-slate-400 text-[10px]">Elena Rostova, Chief Operating Officer</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Project Intelligence Benchmark Report */}
        {activeTab === 'intelligence' && (
          <div className="space-y-8">
            {/* Parameters */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200 pb-1 mb-3">
                1. Target Project Parameters
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block">Prospective Project</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {intelligenceResult.query.name}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Project Type</span>
                  <span className="font-semibold text-slate-800">
                    {intelligenceResult.query.project_type}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Building Type</span>
                  <span className="font-semibold text-slate-800">
                    {intelligenceResult.query.building_type}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Location</span>
                  <span className="font-semibold text-slate-800">
                    {intelligenceResult.query.location}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Floor Area</span>
                  <span className="font-mono font-bold text-slate-900">
                    {intelligenceResult.query.floor_area} m²
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Floors</span>
                  <span className="font-mono text-slate-800">
                    {intelligenceResult.query.floors} Levels
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Delivery Method</span>
                  <span className="font-semibold text-slate-800">
                    {intelligenceResult.query.delivery_method}
                  </span>
                </div>
              </div>
            </div>

            {/* Benchmarks & Estimate */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200 pb-1 mb-3">
                2. Empirical Cost Benchmarks & Preliminary Estimate
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 block">Average Cost / m²</span>
                  <span className="font-mono font-bold text-base text-amber-800">
                    {formatCurrency(intelligenceResult.benchmarks.avg_cost_per_m2)}/m²
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Median Cost / m²</span>
                  <span className="font-mono font-bold text-base text-slate-900">
                    {formatCurrency(intelligenceResult.benchmarks.median_cost_per_m2)}/m²
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Preliminary Estimate</span>
                  <span className="font-mono font-bold text-lg text-slate-950">
                    {formatCurrency(intelligenceResult.preliminary_estimate.estimated_cost)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Cost Range</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {formatCurrency(intelligenceResult.preliminary_estimate.range_min)} &ndash;{' '}
                    {formatCurrency(intelligenceResult.preliminary_estimate.range_max)}
                  </span>
                </div>
              </div>
            </div>

            {/* Category Breakdown Table */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200 pb-1 mb-3">
                3. Estimated Budget by Historical Category Proportions
              </h3>
              <div className="overflow-x-auto touch-pan-x scrollbar-thin">
                <table className="w-full text-left text-xs border border-slate-200 min-w-[520px]">
                  <thead className="bg-slate-100 text-slate-700 font-semibold uppercase text-[10px]">
                    <tr>
                      <th className="p-2.5">Category</th>
                      <th className="p-2.5 text-center">Historical %</th>
                      <th className="p-2.5 text-right">Preliminary Estimated Amount (CAD)</th>
                      <th className="p-2.5 text-right">Unit Rate (CAD/m²)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono">
                    {intelligenceResult.category_breakdown.map((cat) => (
                      <tr key={cat.category}>
                        <td className="p-2.5 font-sans font-medium text-slate-900">{cat.category}</td>
                        <td className="p-2.5 text-center font-bold">{cat.percentage}%</td>
                        <td className="p-2.5 text-right font-bold">{formatCurrency(cat.amount)}</td>
                        <td className="p-2.5 text-right text-slate-600">
                          {formatCurrency(cat.amount / intelligenceResult.query.floor_area)}/m²
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-slate-50 font-bold border-t-2 border-slate-200">
                      <td className="p-2.5 font-sans">Total Estimated Cost</td>
                      <td className="p-2.5 text-center">100%</td>
                      <td className="p-2.5 text-right text-amber-800">
                        {formatCurrency(intelligenceResult.preliminary_estimate.estimated_cost)}
                      </td>
                      <td className="p-2.5 text-right">
                        {formatCurrency(intelligenceResult.benchmarks.avg_cost_per_m2)}/m²
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="p-4 rounded-xl border border-slate-300 text-xs text-slate-600 bg-slate-50 italic">
              <strong>Notice: </strong>
              {intelligenceResult.preliminary_estimate.disclaimer}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
