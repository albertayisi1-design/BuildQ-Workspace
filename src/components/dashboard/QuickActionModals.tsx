import React, { useState } from 'react';
import { useBuild } from '../../context/BuildContext';
import {
  X,
  HardHat,
  Boxes,
  Receipt,
  Camera,
  Upload,
  CheckCircle2,
  DollarSign,
  Calendar,
  Clock,
  Building2,
  FileText,
  AlertCircle,
  Tag,
  User,
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

// Available stock jobsite inspection photos for quick capture simulation
const SAMPLE_JOBSITE_PHOTOS = [
  {
    url: 'https://images.unsplash.com/photo-1541888946425-d0fbb18615f3?w=800&auto=format&fit=crop&q=80',
    label: 'Concrete Slab Pour & Reinforcing Rebar',
  },
  {
    url: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&auto=format&fit=crop&q=80',
    label: 'Structural Steel Framing & Columns',
  },
  {
    url: 'https://images.unsplash.com/photo-1590402494682-cd3fb53b1f70?w=800&auto=format&fit=crop&q=80',
    label: 'Rough-in MEP Electrical & HVAC Run',
  },
  {
    url: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800&auto=format&fit=crop&q=80',
    label: 'Curtain Wall & Architectural Envelope',
  },
];

// -------------------------------------------------------------
// 1. ADD LABOUR MODAL
// -------------------------------------------------------------
interface AddLabourModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (msg: string) => void;
}

export const AddLabourModal: React.FC<AddLabourModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { projects, wbsItems, createCost } = useBuild();
  const activeProjects = projects.filter((p) => p.status !== 'Closed');

  const [projectId, setProjectId] = useState<string>(activeProjects[0]?.id || projects[0]?.id || '');
  const [tradeRole, setTradeRole] = useState('Carpentry & Framing Crew');
  const [workerName, setWorkerName] = useState('Apex Carpentry & Framing - 4 Techs');
  const [hours, setHours] = useState<number>(32);
  const [hourlyRate, setHourlyRate] = useState<number>(55);
  const [customTotal, setCustomTotal] = useState<number | null>(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('Erected structural shear walls and second-floor joist framing.');

  if (!isOpen) return null;

  const calculatedAmount = customTotal !== null ? customTotal : hours * hourlyRate;
  const projectWbs = wbsItems.filter((w) => w.project_id === projectId && !w.is_phase);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;

    createCost({
      project_id: projectId,
      wbs_id: projectWbs[0]?.id || 'wbs_default',
      category: 'Labour',
      amount: calculatedAmount,
      description: `${tradeRole}: ${description}`,
      payee: workerName,
      reference: `PAY-${Date.now().toString().slice(-6)}`,
      date,
      cost_type: 'Direct',
      notes: `${hours} hours logged @ $${hourlyRate}/hr`,
    });

    if (onSuccess) {
      onSuccess(`Labour record of ${formatCurrency(calculatedAmount)} logged successfully.`);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 bg-slate-950/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-[360px] overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-3.5 py-2.5 bg-[#0F172A] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <HardHat className="w-3.5 h-3.5" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-white">Add Labour Record</h2>
              <p className="text-[10px] text-slate-400">Log trade workforce hours &amp; payroll</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-3.5 space-y-2 text-xs">
          <div>
            <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-0.5">
              Project *
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full h-7 px-2 rounded-md border border-slate-300 text-slate-800 bg-white focus:outline-hidden focus:border-amber-500 font-medium text-xs"
              required
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.project_number} — {p.name} ({p.status})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-0.5">
                Trade Role *
              </label>
              <select
                value={tradeRole}
                onChange={(e) => setTradeRole(e.target.value)}
                className="w-full h-7 px-2 rounded-md border border-slate-300 text-slate-800 bg-white focus:outline-hidden focus:border-amber-500 text-xs"
              >
                <option value="Carpentry & Framing Crew">Carpentry & Framing</option>
                <option value="Certified Electricians">Electrical Trade</option>
                <option value="Plumbing & Mechanical">Plumbing & HVAC</option>
                <option value="Concrete & Rebar Crew">Concrete & Masonry</option>
                <option value="Drywall & Acoustic Ceiling">Drywall & Taping</option>
                <option value="General Site Support">General Site Labour</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-0.5">
                Date *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-7 px-2 rounded-md border border-slate-300 text-slate-800 bg-white focus:outline-hidden focus:border-amber-500 text-xs"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-0.5">
              Payee / Crew Name *
            </label>
            <input
              type="text"
              value={workerName}
              onChange={(e) => setWorkerName(e.target.value)}
              className="w-full h-7 px-2 rounded-md border border-slate-300 text-slate-800 bg-white focus:outline-hidden focus:border-amber-500 text-xs"
              placeholder="e.g. Apex Carpentry Crew"
              required
            />
          </div>

          {/* Hours & Rates Grid */}
          <div className="grid grid-cols-3 gap-2 p-2 bg-amber-50/50 rounded-lg border border-amber-200/60">
            <div>
              <label className="block text-[9px] font-bold text-amber-900 uppercase tracking-wider mb-0.5">
                Hours
              </label>
              <input
                type="number"
                min="1"
                step="0.5"
                value={hours}
                onChange={(e) => {
                  setHours(parseFloat(e.target.value) || 0);
                  setCustomTotal(null);
                }}
                className="w-full h-6 px-1.5 rounded-md border border-amber-300 text-slate-800 bg-white text-center font-mono font-bold text-xs"
              />
            </div>
            <div>
              <label className="block text-[9px] font-bold text-amber-900 uppercase tracking-wider mb-0.5">
                Rate (C$)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={hourlyRate}
                onChange={(e) => {
                  setHourlyRate(parseFloat(e.target.value) || 0);
                  setCustomTotal(null);
                }}
                className="w-full h-6 px-1.5 rounded-md border border-amber-300 text-slate-800 bg-white text-center font-mono font-bold text-xs"
              />
            </div>
            <div>
              <label className="block text-[9px] font-bold text-amber-900 uppercase tracking-wider mb-0.5">
                Total
              </label>
              <div className="h-6 rounded-md bg-amber-500 text-slate-950 font-bold font-mono flex items-center justify-center text-[11px]">
                {formatCurrency(calculatedAmount)}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-0.5">
              Work Description
            </label>
            <textarea
              rows={1}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-1.5 rounded-md border border-slate-300 text-slate-800 bg-white focus:outline-hidden focus:border-amber-500 text-xs"
              placeholder="Detail specific tasks executed..."
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="h-7 px-3 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-7 px-3 rounded-md bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold flex items-center gap-1 shadow-sm text-xs cursor-pointer transition-all"
            >
              <HardHat className="w-3.5 h-3.5" />
              <span>Log Labour</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// 2. ADD MATERIAL MODAL
// -------------------------------------------------------------
interface AddMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (msg: string) => void;
}

export const AddMaterialModal: React.FC<AddMaterialModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { projects, wbsItems, createCost } = useBuild();
  const activeProjects = projects.filter((p) => p.status !== 'Closed');

  const [projectId, setProjectId] = useState<string>(activeProjects[0]?.id || projects[0]?.id || '');
  const [materialItem, setMaterialItem] = useState('Ready-Mix High-Strength Concrete (35MPa)');
  const [supplier, setSupplier] = useState('Lafarge Canada Inc.');
  const [invoice, setInvoice] = useState(`INV-2026-${Math.floor(Math.random() * 8000) + 1000}`);
  const [amount, setAmount] = useState<number>(24500);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('Delivery of 45 cubic meters 35MPa concrete for foundation footing pour.');

  if (!isOpen) return null;

  const projectWbs = wbsItems.filter((w) => w.project_id === projectId && !w.is_phase);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || amount <= 0) return;

    createCost({
      project_id: projectId,
      wbs_id: projectWbs[0]?.id || 'wbs_default',
      category: 'Materials',
      amount,
      description: `${materialItem}: ${description}`,
      payee: supplier,
      supplier_contractor: supplier,
      reference: invoice,
      invoice_number: invoice,
      date,
      cost_type: 'Direct',
    });

    if (onSuccess) {
      onSuccess(`Material invoice of ${formatCurrency(amount)} logged successfully.`);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 bg-slate-950/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-[360px] overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-3.5 py-2.5 bg-[#0F172A] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Boxes className="w-3.5 h-3.5" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-white">Add Material Delivery</h2>
              <p className="text-[10px] text-slate-400">Record material invoices &amp; waybills</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-3.5 space-y-2 text-xs">
          <div>
            <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-0.5">
              Target Project *
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full h-7 px-2 rounded-md border border-slate-300 text-slate-800 bg-white focus:outline-hidden focus:border-blue-500 font-medium text-xs"
              required
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.project_number} — {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-0.5">
                Material Item *
              </label>
              <select
                value={materialItem}
                onChange={(e) => setMaterialItem(e.target.value)}
                className="w-full h-7 px-2 rounded-md border border-slate-300 text-slate-800 bg-white focus:outline-hidden focus:border-blue-500 text-xs"
              >
                <option value="Ready-Mix Concrete (35MPa)">Ready-Mix Concrete</option>
                <option value="Reinforcing Rebar Steel (15M/20M)">Reinforcing Steel</option>
                <option value="SPF Structural Framing Lumber">Framing Lumber</option>
                <option value="Type X 5/8 Drywall Panels">Drywall Panels</option>
                <option value="R-24 Mineral Wool Insulation">Wool Insulation</option>
                <option value="Structural Precast Columns">Precast Columns</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-0.5">
                Date *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-7 px-2 rounded-md border border-slate-300 text-slate-800 bg-white focus:outline-hidden focus:border-blue-500 text-xs"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-0.5">
                Supplier *
              </label>
              <input
                type="text"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                className="w-full h-7 px-2 rounded-md border border-slate-300 text-slate-800 bg-white focus:outline-hidden focus:border-blue-500 text-xs"
                placeholder="e.g. Lafarge Canada"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-0.5">
                Invoice # *
              </label>
              <input
                type="text"
                value={invoice}
                onChange={(e) => setInvoice(e.target.value)}
                className="w-full h-7 px-2 rounded-md border border-slate-300 text-slate-800 bg-white font-mono focus:outline-hidden focus:border-blue-500 text-xs"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-0.5">
              Invoice Amount (C$) *
            </label>
            <div className="relative">
              <span className="absolute left-2.5 top-1.5 text-slate-400 font-bold text-xs">$</span>
              <input
                type="number"
                min="1"
                step="1"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                className="w-full h-7 pl-6 pr-2 rounded-md border border-slate-300 text-slate-900 bg-white font-mono font-bold text-xs focus:outline-hidden focus:border-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-0.5">
              Batch &amp; Staging Details
            </label>
            <textarea
              rows={1}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-1.5 rounded-md border border-slate-300 text-slate-800 bg-white focus:outline-hidden focus:border-blue-500 text-xs"
              placeholder="Batch number, quantity received..."
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="h-7 px-3 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-7 px-3 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1 shadow-sm text-xs cursor-pointer transition-all"
            >
              <Boxes className="w-3.5 h-3.5" />
              <span>Record Invoice</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// 3. ADD EXPENSE MODAL
// -------------------------------------------------------------
interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (msg: string) => void;
}

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { projects, wbsItems, createCost } = useBuild();
  const activeProjects = projects.filter((p) => p.status !== 'Closed');

  const [projectId, setProjectId] = useState<string>(activeProjects[0]?.id || projects[0]?.id || '');
  const [expenseType, setExpenseType] = useState('Equipment Rental (Boom Lift & Telehandler)');
  const [category, setCategory] = useState<'Equipment' | 'Other'>('Equipment');
  const [vendor, setVendor] = useState('Sunbelt Rentals Ontario');
  const [reference, setReference] = useState(`EXP-2026-${Math.floor(Math.random() * 8000) + 1000}`);
  const [amount, setAmount] = useState<number>(3850);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('Monthly rental of 45ft rough-terrain boom lift and delivery fee.');

  if (!isOpen) return null;

  const projectWbs = wbsItems.filter((w) => w.project_id === projectId && !w.is_phase);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || amount <= 0) return;

    createCost({
      project_id: projectId,
      wbs_id: projectWbs[0]?.id || 'wbs_default',
      category,
      amount,
      description: `${expenseType}: ${description}`,
      payee: vendor,
      supplier_contractor: vendor,
      reference,
      date,
      cost_type: 'Direct',
    });

    if (onSuccess) {
      onSuccess(`Site expense of ${formatCurrency(amount)} recorded successfully.`);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 bg-slate-950/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-[360px] overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-3.5 py-2.5 bg-[#0F172A] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Receipt className="w-3.5 h-3.5" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-white">Add Site Expense</h2>
              <p className="text-[10px] text-slate-400">Log equipment, permits, utilities &amp; bins</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-3.5 space-y-2 text-xs">
          <div>
            <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-0.5">
              Project *
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full h-7 px-2 rounded-md border border-slate-300 text-slate-800 bg-white focus:outline-hidden focus:border-emerald-500 font-medium text-xs"
              required
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.project_number} — {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-0.5">
                Expense Type *
              </label>
              <select
                value={expenseType}
                onChange={(e) => {
                  const val = e.target.value;
                  setExpenseType(val);
                  if (val.includes('Equipment')) {
                    setCategory('Equipment');
                  } else {
                    setCategory('Other');
                  }
                }}
                className="w-full h-7 px-2 rounded-md border border-slate-300 text-slate-800 bg-white focus:outline-hidden focus:border-emerald-500 text-xs"
              >
                <option value="Equipment Rental (Boom Lift & Telehandler)">Equipment: Lift/Rental</option>
                <option value="Municipal Building Permit">Permit: City Permit</option>
                <option value="Temporary Power & Site Utilities">Utilities: Temp Hydro</option>
                <option value="Waste Disposal & Bins">Site: Disposal Bins</option>
                <option value="Compaction & Concrete QA Testing">Testing: Soil/QA</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-0.5">
                Date *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-7 px-2 rounded-md border border-slate-300 text-slate-800 bg-white focus:outline-hidden focus:border-emerald-500 text-xs"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-0.5">
                Payee / Vendor *
              </label>
              <input
                type="text"
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                className="w-full h-7 px-2 rounded-md border border-slate-300 text-slate-800 bg-white focus:outline-hidden focus:border-emerald-500 text-xs"
                placeholder="e.g. Sunbelt Rentals"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-0.5">
                Ref # *
              </label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="w-full h-7 px-2 rounded-md border border-slate-300 text-slate-800 bg-white font-mono focus:outline-hidden focus:border-emerald-500 text-xs"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-0.5">
              Expense Amount (C$) *
            </label>
            <div className="relative">
              <span className="absolute left-2.5 top-1.5 text-slate-400 font-bold text-xs">$</span>
              <input
                type="number"
                min="1"
                step="1"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                className="w-full h-7 pl-6 pr-2 rounded-md border border-slate-300 text-slate-900 bg-white font-mono font-bold text-xs focus:outline-hidden focus:border-emerald-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-0.5">
              Notes &amp; Purpose
            </label>
            <textarea
              rows={1}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-1.5 rounded-md border border-slate-300 text-slate-800 bg-white focus:outline-hidden focus:border-emerald-500 text-xs"
              placeholder="Provide context on why this expense occurred..."
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="h-7 px-3 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-7 px-3 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1 shadow-sm text-xs cursor-pointer transition-all"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Record Expense</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// 4. TAKE PHOTO / SITE INSPECTION MODAL
// -------------------------------------------------------------
interface TakePhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (msg: string) => void;
}

export const TakePhotoModal: React.FC<TakePhotoModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { projects, createSiteReport } = useBuild();
  const activeProjects = projects.filter((p) => p.status !== 'Closed');

  const [projectId, setProjectId] = useState<string>(activeProjects[0]?.id || projects[0]?.id || '');
  const [photoUrl, setPhotoUrl] = useState(SAMPLE_JOBSITE_PHOTOS[0].url);
  const [caption, setCaption] = useState('Ground floor slab concrete pour completed and initial cure inspection verified.');
  const [tag, setTag] = useState('Foundation & Structural QA');
  const [inspector, setInspector] = useState('David Chen (Site PM)');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  if (!isOpen) return null;

  const currentProject = projects.find((p) => p.id === projectId);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (loadEvt) => {
        if (typeof loadEvt.target?.result === 'string') {
          setPhotoUrl(loadEvt.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;

    createSiteReport({
      project_id: projectId,
      date,
      supervisor: inspector,
      weather: 'Clear, 20°C',
      activities: `[${tag}] ${caption}`,
      workers: 14,
      materials: 'Photo verification verified on site',
      issues: 'No critical defects observed',
      safety_notes: 'Full PPE in place on inspection perimeter',
      progress: currentProject?.progress || 50,
      photos: [
        {
          id: `photo_${Date.now()}`,
          site_report_id: '',
          file_url: photoUrl,
          caption: `${tag}: ${caption}`,
        },
      ],
      flag: 'normal',
    });

    if (onSuccess) {
      onSuccess(`Site inspection photo saved to ${currentProject?.name || 'project'}.`);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 bg-slate-950/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-[360px] overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-3.5 py-2.5 bg-[#0F172A] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Camera className="w-3.5 h-3.5" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-white">Capture Site Photo</h2>
              <p className="text-[10px] text-slate-400">Progress &amp; QA inspection photo</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-3.5 space-y-2 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-0.5">
                Project *
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full h-7 px-2 rounded-md border border-slate-300 text-slate-800 bg-white focus:outline-hidden focus:border-purple-500 font-medium text-xs"
                required
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.project_number} — {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-0.5">
                Tag *
              </label>
              <select
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                className="w-full h-7 px-2 rounded-md border border-slate-300 text-slate-800 bg-white focus:outline-hidden focus:border-purple-500 text-xs"
              >
                <option value="Foundation & Structural QA">Structural QA</option>
                <option value="Framing & Shear Walls">Framing</option>
                <option value="MEP Rough-in Verification">MEP Rough-in</option>
                <option value="Building Envelope & Glazing">Envelope</option>
                <option value="Finishes & Final QA">Finishes QA</option>
                <option value="Daily Safety Walkthrough">Safety Walk</option>
              </select>
            </div>
          </div>

          {/* Photo Preview & Options */}
          <div>
            <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-900 aspect-video max-h-32 flex items-center justify-center">
              <img
                src={photoUrl}
                alt="Inspection Preview"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-slate-950/80 backdrop-blur-xs text-[9px] font-bold text-purple-300 border border-purple-500/30">
                {tag}
              </div>
              <div className="absolute bottom-1.5 left-1.5 right-1.5 px-2 py-0.5 rounded bg-slate-950/85 backdrop-blur-xs text-[10px] text-slate-200 truncate">
                {caption}
              </div>
            </div>

            {/* Quick stock selector or file upload */}
            <div className="mt-1.5 flex items-center justify-between gap-1.5">
              <div className="flex items-center gap-1 overflow-x-auto py-0.5">
                {SAMPLE_JOBSITE_PHOTOS.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setPhotoUrl(sample.url);
                      setCaption(sample.label);
                    }}
                    className={`h-5 px-1.5 text-[9px] rounded-md font-semibold border transition-all whitespace-nowrap cursor-pointer ${
                      photoUrl === sample.url
                        ? 'bg-purple-100 text-purple-800 border-purple-300 font-bold'
                        : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    Preset {idx + 1}
                  </button>
                ))}
              </div>

              <label className="h-5 px-2 rounded-md bg-white border border-slate-300 hover:border-purple-400 text-slate-700 text-[9px] font-bold flex items-center gap-1 cursor-pointer transition-colors shrink-0">
                <Upload className="w-2.5 h-2.5 text-purple-600" />
                <span>Upload</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-0.5">
              Observation Caption *
            </label>
            <textarea
              rows={1}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full p-1.5 rounded-md border border-slate-300 text-slate-800 bg-white focus:outline-hidden focus:border-purple-500 text-xs"
              placeholder="Describe observation..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-0.5">
                Logged By
              </label>
              <input
                type="text"
                value={inspector}
                onChange={(e) => setInspector(e.target.value)}
                className="w-full h-7 px-2 rounded-md border border-slate-300 text-slate-800 bg-white focus:outline-hidden focus:border-purple-500 text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-0.5">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-7 px-2 rounded-md border border-slate-300 text-slate-800 bg-white focus:outline-hidden focus:border-purple-500 text-xs"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="h-7 px-3 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-7 px-3 rounded-md bg-purple-600 hover:bg-purple-700 text-white font-bold flex items-center gap-1 shadow-sm text-xs cursor-pointer transition-all"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Save Photo</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
