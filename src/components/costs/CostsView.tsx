import React, { useState, useMemo } from 'react';
import { useBuild } from '../../context/BuildContext';
import { Cost, CostCategory, CostType } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { CostDistributionCard } from './CostDistributionCard';
import {
  Receipt,
  Plus,
  Search,
  Filter,
  Trash2,
  Calendar,
  DollarSign,
  Tag,
  Building2,
  X,
  FileText,
} from 'lucide-react';

interface CostsViewProps {
  initialProjectId?: string;
  isAddModalOpenInitially?: boolean;
}

export const CostsView: React.FC<CostsViewProps> = ({
  initialProjectId,
  isAddModalOpenInitially = false,
}) => {
  const { projects, wbsItems, costs, createCost, deleteCost, settings } = useBuild();

  const [selectedProjectId, setSelectedProjectId] = useState<string>(initialProjectId || 'ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedCostType, setSelectedCostType] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');

  // Add Cost Modal State
  const [isModalOpen, setIsModalOpen] = useState(isAddModalOpenInitially);
  const [modalProjectId, setModalProjectId] = useState<string>(
    initialProjectId || projects[0]?.id || ''
  );
  const [modalWbsId, setModalWbsId] = useState<string>('');
  const [modalCategory, setModalCategory] = useState<CostCategory>('Materials');
  const [modalDate, setModalDate] = useState(new Date().toISOString().split('T')[0]);
  const [modalSupplier, setModalSupplier] = useState('Lafarge Ready Mix Concrete');
  const [modalInvoice, setModalInvoice] = useState(
    `INV-2026-${String(Math.floor(Math.random() * 8000) + 1000)}`
  );
  const [modalAmount, setModalAmount] = useState<number>(35000);
  const [modalDescription, setModalDescription] = useState('Ready-mix high-durability concrete delivery');
  const [modalCostType, setModalCostType] = useState<CostType>('Direct');

  // Filtered WBS items for the modal's project
  const modalWbsItems = useMemo(() => {
    return wbsItems.filter((w) => w.project_id === modalProjectId && !w.is_phase);
  }, [wbsItems, modalProjectId]);

  // Filtered costs
  const filteredCosts = useMemo(() => {
    return costs.filter((c) => {
      const matchProj = selectedProjectId === 'ALL' || c.project_id === selectedProjectId;
      const matchCat = selectedCategory === 'ALL' || c.category === selectedCategory;
      const matchType = selectedCostType === 'ALL' || c.cost_type === selectedCostType;

      const matchSearch =
        (c.supplier_contractor || c.payee || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.invoice_number || c.reference || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStart = !startDateFilter || c.date >= startDateFilter;
      const matchEnd = !endDateFilter || c.date <= endDateFilter;

      return matchProj && matchCat && matchType && matchSearch && matchStart && matchEnd;
    });
  }, [costs, selectedProjectId, selectedCategory, selectedCostType, searchTerm, startDateFilter, endDateFilter]);

  // Sum of filtered costs
  const totalFilteredCost = useMemo(() => {
    return filteredCosts.reduce((sum, c) => sum + c.amount, 0);
  }, [filteredCosts]);

  // Category totals
  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {
      Labour: 0,
      Materials: 0,
      Subcontractor: 0,
      Equipment: 0,
      Other: 0,
    };
    filteredCosts.forEach((c) => {
      if (totals[c.category] !== undefined) {
        totals[c.category] += c.amount;
      }
    });
    return totals;
  }, [filteredCosts]);

  const handleAddCostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalProjectId) return;

    createCost({
      project_id: modalProjectId,
      wbs_id: modalWbsId || '',
      category: modalCategory,
      date: modalDate,
      payee: modalSupplier,
      reference: modalInvoice,
      supplier_contractor: modalSupplier,
      invoice_number: modalInvoice,
      amount: Number(modalAmount),
      description: modalDescription,
      cost_type: modalCostType,
    });

    setIsModalOpen(false);
    // Reset defaults
    setModalAmount(25000);
    setModalDescription('');
    setModalSupplier('');
    setModalInvoice(`REC-2026-${String(Math.floor(Math.random() * 8000) + 1000)}`);
  };

  const handleDeleteCost = (costId: string) => {
    if (window.confirm('Delete this recorded cost? Project and WBS actual costs will recalculate automatically.')) {
      deleteCost(costId);
    }
  };

  return (
    <div id="cost-tracking-view" className="space-y-5 pb-12">
      {/* Bento Top Banner */}
      <div className="bento-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight font-sans">
              Cost Tracking & Ledger
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200 uppercase tracking-wider">
              {filteredCosts.length} Records
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Capture vendor receipts, labour expenditures, and direct project costs with instant budget rollups.
          </p>
        </div>

        <button
          id="btn-open-add-cost-modal"
          onClick={() => setIsModalOpen(true)}
          className="h-9 px-3.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs inline-flex items-center gap-1.5 transition-all shadow-xs cursor-pointer shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Cost Record</span>
        </button>
      </div>

      {/* Cost Distribution & Category Summary Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Cost Distribution Card matching user design */}
        <div className="lg:col-span-4 flex">
          <CostDistributionCard className="w-full" />
        </div>

        {/* Bento Summary KPI Grid & Budget Tracking */}
        <div className="lg:col-span-8 flex flex-col justify-between gap-3.5">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bento-card p-4 col-span-2 sm:col-span-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Filtered Total
              </span>
              <div className="text-xl font-bold text-slate-900 mt-1 font-mono">
                {formatCurrency(totalFilteredCost)}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Across active filters</div>
            </div>

            <div className="bento-card p-4">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Labour
              </span>
              <div className="text-base font-bold text-amber-600 mt-1 font-mono">
                {formatCurrency(categoryTotals.Labour)}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Workforce payroll</div>
            </div>

            <div className="bento-card p-4">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Materials
              </span>
              <div className="text-base font-bold text-blue-600 mt-1 font-mono">
                {formatCurrency(categoryTotals.Materials)}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Raw supply delivery</div>
            </div>

            <div className="bento-card p-4">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Subcontractors
              </span>
              <div className="text-base font-bold text-emerald-600 mt-1 font-mono">
                {formatCurrency(categoryTotals.Subcontractor)}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Specialist trades</div>
            </div>

            <div className="bento-card p-4">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Equipment
              </span>
              <div className="text-base font-bold text-slate-800 mt-1 font-mono">
                {formatCurrency(categoryTotals.Equipment)}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Plant & machinery</div>
            </div>

            <div className="bento-card p-4">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Site Expenses / Other
              </span>
              <div className="text-base font-bold text-purple-600 mt-1 font-mono">
                {formatCurrency(categoryTotals.Other)}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Permits & utilities</div>
            </div>
          </div>

          {/* Quick Benchmark Reference Banner */}
          <div className="bento-subbox p-3.5 flex items-center justify-between bg-slate-50 border border-slate-200/70 rounded-2xl">
            <div className="flex items-center gap-2.5 text-xs text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
              <span>
                Standard parametric benchmark allocation: <strong className="text-amber-700">25% Labour</strong>, <strong className="text-blue-700">40% Materials</strong>, <strong className="text-emerald-700">34% Subcontractors</strong>, and <strong className="text-purple-700">1% Site Expenses</strong>.
              </span>
            </div>
            <span className="hidden sm:inline-block text-[11px] font-mono text-slate-400 font-bold">
              Total Spend: $1189k
            </span>
          </div>
        </div>
      </div>

      {/* Bento Filter & Search Bar */}
      <div className="bento-card p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Project Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
              Project
            </label>
            <select
              id="filter-cost-project"
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-800 focus:ring-1 focus:ring-amber-500"
            >
              <option value="ALL">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
              Category
            </label>
            <select
              id="filter-cost-category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-800 focus:ring-1 focus:ring-amber-500"
            >
              <option value="ALL">All Categories</option>
              <option value="Labour">Labour</option>
              <option value="Materials">Materials</option>
              <option value="Subcontractor">Subcontractor</option>
              <option value="Equipment">Equipment</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Cost Type Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
              Cost Type
            </label>
            <select
              id="filter-cost-type"
              value={selectedCostType}
              onChange={(e) => setSelectedCostType(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-800 focus:ring-1 focus:ring-amber-500"
            >
              <option value="ALL">Direct & Indirect</option>
              <option value="Direct">Direct Cost</option>
              <option value="Indirect">Indirect Cost</option>
            </select>
          </div>

          {/* Search */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
              Search
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="inp-search-costs"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Supplier, reference, details..."
                className="w-full pl-8 pr-2.5 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bento Costs Table Card */}
      <div className="bento-card overflow-hidden">
        <div className="overflow-x-auto touch-pan-x scrollbar-thin">
          <table className="w-full text-left text-sm min-w-[720px]">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="py-2.5 sm:py-3 px-3 sm:px-4">Date</th>
                <th className="py-2.5 sm:py-3 px-3 sm:px-4">Project / WBS</th>
                <th className="py-2.5 sm:py-3 px-3 sm:px-4">Category</th>
                <th className="py-2.5 sm:py-3 px-3 sm:px-4">Supplier / Contractor</th>
                <th className="py-2.5 sm:py-3 px-3 sm:px-4">Ref / Receipt #</th>
                <th className="py-2.5 sm:py-3 px-3 sm:px-4">Description</th>
                <th className="py-2.5 sm:py-3 px-3 sm:px-4 text-center">Type</th>
                <th className="py-2.5 sm:py-3 px-3 sm:px-4 text-right">Amount ({settings.currency})</th>
                <th className="py-2.5 sm:py-3 px-3 sm:px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredCosts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 italic">
                    No cost records match the current filter selection.
                  </td>
                </tr>
              ) : (
                filteredCosts.map((cost) => {
                  const proj = projects.find((p) => p.id === cost.project_id);
                  const wbs = wbsItems.find((w) => w.id === cost.wbs_id);

                  return (
                    <tr key={cost.id} id={`cost-row-${cost.id}`} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                        {cost.date}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">
                          {proj?.name || 'Project'}
                        </div>
                        {wbs && (
                          <div className="text-[11px] text-slate-500 font-mono">
                            {wbs.wbs_code} • {wbs.name}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full font-semibold text-[11px] ${
                            cost.category === 'Materials'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : cost.category === 'Labour'
                              ? 'bg-blue-50 text-blue-800 border border-blue-200'
                              : cost.category === 'Subcontractor'
                              ? 'bg-sky-50 text-sky-800 border border-sky-200'
                              : cost.category === 'Equipment'
                              ? 'bg-purple-50 text-purple-800 border border-purple-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {cost.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">
                        {cost.supplier_contractor}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 font-semibold">
                        {cost.invoice_number}
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={cost.description}>
                        {cost.description}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded uppercase font-semibold ${
                            cost.cost_type === 'Direct'
                              ? 'bg-slate-100 text-slate-700'
                              : 'bg-slate-200 text-slate-800'
                          }`}
                        >
                          {cost.cost_type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                        {formatCurrency(cost.amount)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleDeleteCost(cost.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                          title="Delete cost record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Cost Record Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-2 overflow-y-auto">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-[400px] max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-slate-900">
            <div className="px-3.5 py-2.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-100 text-amber-800">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 font-display">
                    Add Project Cost Record
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    Vendor payment, materials or labour
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCostSubmit} className="p-3.5 overflow-y-auto space-y-2 text-xs flex-1">
              <div>
                <label className="block text-[10px] font-semibold text-slate-700 mb-0.5">
                  Project *
                </label>
                <select
                  id="inp-cost-modal-project"
                  value={modalProjectId}
                  onChange={(e) => setModalProjectId(e.target.value)}
                  className="w-full px-2 py-1 rounded-md border border-slate-300 text-xs bg-white font-medium"
                  required
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.project_number})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-700 mb-0.5">
                  WBS Activity (Optional)
                </label>
                <select
                  id="inp-cost-modal-wbs"
                  value={modalWbsId}
                  onChange={(e) => setModalWbsId(e.target.value)}
                  className="w-full px-2 py-1 rounded-md border border-slate-300 text-xs bg-white"
                >
                  <option value="">-- General Project Cost (No WBS link) --</option>
                  {modalWbsItems.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.wbs_code} • {w.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-700 mb-0.5">
                    Cost Category *
                  </label>
                  <select
                    id="inp-cost-modal-cat"
                    value={modalCategory}
                    onChange={(e) => setModalCategory(e.target.value as CostCategory)}
                    className="w-full px-2 py-1 rounded-md border border-slate-300 text-xs bg-white"
                  >
                    <option value="Labour">Labour</option>
                    <option value="Materials">Materials</option>
                    <option value="Subcontractor">Subcontractor</option>
                    <option value="Equipment">Equipment</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-700 mb-0.5">
                    Cost Type *
                  </label>
                  <select
                    id="inp-cost-modal-cost-type"
                    value={modalCostType}
                    onChange={(e) => setModalCostType(e.target.value as CostType)}
                    className="w-full px-2 py-1 rounded-md border border-slate-300 text-xs bg-white"
                  >
                    <option value="Direct">Direct Cost</option>
                    <option value="Indirect">Indirect Cost</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-700 mb-0.5">
                    Amount (CAD) *
                  </label>
                  <input
                    id="inp-cost-modal-amount"
                    type="number"
                    min="1"
                    step="10"
                    required
                    value={modalAmount}
                    onChange={(e) => setModalAmount(Number(e.target.value))}
                    className="w-full px-2 py-1 rounded-md border border-slate-300 text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-700 mb-0.5">
                    Date *
                  </label>
                  <input
                    id="inp-cost-modal-date"
                    type="date"
                    required
                    value={modalDate}
                    onChange={(e) => setModalDate(e.target.value)}
                    className="w-full px-2 py-1 rounded-md border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-700 mb-0.5">
                    Supplier / Payee *
                  </label>
                  <input
                    id="inp-cost-modal-supplier"
                    type="text"
                    required
                    value={modalSupplier}
                    onChange={(e) => setModalSupplier(e.target.value)}
                    placeholder="e.g. Ontario Steel Fab"
                    className="w-full px-2 py-1 rounded-md border border-slate-300 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-700 mb-0.5">
                    Reference / Receipt # *
                  </label>
                  <input
                    id="inp-cost-modal-invoice"
                    type="text"
                    required
                    value={modalInvoice}
                    onChange={(e) => setModalInvoice(e.target.value)}
                    placeholder="e.g. REC-9042"
                    className="w-full px-2 py-1 rounded-md border border-slate-300 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-700 mb-0.5">
                  Description *
                </label>
                <textarea
                  id="inp-cost-modal-desc"
                  rows={1.5 as any}
                  required
                  value={modalDescription}
                  onChange={(e) => setModalDescription(e.target.value)}
                  placeholder="Detailed breakdown of work or items supplied"
                  className="w-full px-2 py-1 rounded-md border border-slate-300 text-xs resize-none"
                />
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1 border border-slate-300 text-slate-700 rounded-md text-xs hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="btn-submit-add-cost"
                  type="submit"
                  className="px-3.5 py-1 bg-cyan-600 hover:bg-lime-500 text-white font-bold rounded-md text-xs cursor-pointer shadow-xs transition-all "
                >
                  Record Cost
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
