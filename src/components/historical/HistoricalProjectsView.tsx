import React, { useState, useMemo } from 'react';
import { useBuild } from '../../context/BuildContext';
import { ProjectType } from '../../types';
import { formatCurrency, formatCurrencyCompact } from '../../utils/formatters';
import {
  Archive,
  Search,
  Filter,
  Building2,
  Calendar,
  Layers,
  Maximize2,
  BookOpen,
  DollarSign,
  TrendingUp,
  X,
  Plus,
} from 'lucide-react';

interface HistoricalProjectsViewProps {
  onNavigateToIntelligenceWithFilter?: (type: string, area: number) => void;
}

export const HistoricalProjectsView: React.FC<HistoricalProjectsViewProps> = ({
  onNavigateToIntelligenceWithFilter,
}) => {
  const { historicalProjects, clients, createHistoricalProject } = useBuild();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedLocation, setSelectedLocation] = useState<string>('ALL');
  const [selectedYear, setSelectedYear] = useState<string>('ALL');
  const [minArea, setMinArea] = useState<number | ''>('');
  const [maxArea, setMaxArea] = useState<number | ''>('');
  const [activeProjectModal, setActiveProjectModal] = useState<any | null>(null);

  // Quick Add Historical Project Modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newClient, setNewClient] = useState('First Capital Realty');
  const [newType, setNewType] = useState<ProjectType>('Residential');
  const [newLocation, setNewLocation] = useState('Toronto, ON');
  const [newBuildingType, setNewBuildingType] = useState('Mid-Rise Residential');
  const [newFloorArea, setNewFloorArea] = useState<number>(850);
  const [newFloors, setNewFloors] = useState<number>(4);
  const [newPlannedDuration, setNewPlannedDuration] = useState<number>(12);
  const [newActualDuration, setNewActualDuration] = useState<number>(13);
  const [newPlannedCost, setNewPlannedCost] = useState<number>(1500000);
  const [newFinalCost, setNewFinalCost] = useState<number>(1560000);
  const [newCompletionDate, setNewCompletionDate] = useState('2025-11-20');
  const [newLessons, setNewLessons] = useState(
    'Procuring pre-fabricated exterior panels saved 4 weeks on framing schedule.'
  );
  const [newDeliveryMethod, setNewDeliveryMethod] = useState<
    'Design-Bid-Build' | 'Design-Build' | 'Construction Management'
  >('Construction Management');

  // Unique locations and years for filter dropdowns
  const availableLocations = useMemo(() => {
    return Array.from(new Set(historicalProjects.map((p) => p.location.split(',')[0].trim())));
  }, [historicalProjects]);

  const availableYears = useMemo(() => {
    const years = Array.from(
      new Set(
        historicalProjects.map((p) =>
          new Date(p.completion_date || p.completed_date || '2025-01-01').getFullYear().toString()
        )
      )
    );
    return (years as string[]).sort((a, b) => b.localeCompare(a));
  }, [historicalProjects]);

  // Filtered dataset
  const filteredProjects = useMemo(() => {
    return historicalProjects.filter((p) => {
      const pName = (p.name || p.project_name || '').toLowerCase();
      const pLoc = (p.location || '').toLowerCase();
      const pBldg = (p.building_type || '').toLowerCase();
      const pLessons = (p.lessons_learned || '').toLowerCase();
      const sLower = searchTerm.toLowerCase();

      const matchSearch =
        pName.includes(sLower) ||
        pLoc.includes(sLower) ||
        pBldg.includes(sLower) ||
        pLessons.includes(sLower);

      const matchType = selectedType === 'ALL' || p.type === selectedType || p.project_type === selectedType;
      const matchLoc = selectedLocation === 'ALL' || p.location.includes(selectedLocation);
      const projYear = new Date(p.completion_date || p.completed_date || '2025-01-01').getFullYear().toString();
      const matchYr = selectedYear === 'ALL' || projYear === selectedYear;

      const matchMinArea = minArea === '' || p.floor_area >= Number(minArea);
      const matchMaxArea = maxArea === '' || p.floor_area <= Number(maxArea);

      return matchSearch && matchType && matchLoc && matchYr && matchMinArea && matchMaxArea;
    });
  }, [historicalProjects, searchTerm, selectedType, selectedLocation, selectedYear, minArea, maxArea]);

  // Derived benchmark stats across filtered projects
  const benchmarkStats = useMemo(() => {
    if (filteredProjects.length === 0) {
      return { avgCostPerM2: 0, medianCostPerM2: 0, minCostPerM2: 0, maxCostPerM2: 0, totalArea: 0 };
    }

    const rates = filteredProjects.map((p) => p.cost_per_m2).sort((a, b) => a - b);
    const sum = rates.reduce((a, b) => a + b, 0);
    const avg = Math.round(sum / rates.length);

    const mid = Math.floor(rates.length / 2);
    const median = rates.length % 2 !== 0 ? rates[mid] : Math.round((rates[mid - 1] + rates[mid]) / 2);

    const min = rates[0];
    const max = rates[rates.length - 1];
    const totalArea = filteredProjects.reduce((sum, p) => sum + p.floor_area, 0);

    return { avgCostPerM2: avg, medianCostPerM2: median, minCostPerM2: min, maxCostPerM2: max, totalArea };
  }, [filteredProjects]);

  const handleAddHistorical = (e: React.FormEvent) => {
    e.preventDefault();
    const finalActual = Number(newFinalCost);
    const planned = Number(newPlannedCost);
    const area = Number(newFloorArea);

    createHistoricalProject({
      name: newName,
      client_id: 'client_1',
      client_name: newClient,
      type: newType,
      location: newLocation,
      building_type: newBuildingType,
      floor_area: area,
      floors: Number(newFloors),
      planned_duration_months: Number(newPlannedDuration),
      actual_duration_months: Number(newActualDuration),
      planned_cost: planned,
      final_actual_cost: finalActual,
      final_cost_variance: planned - finalActual,
      cost_per_m2: area > 0 ? Math.round(finalActual / area) : 0,
      completion_date: newCompletionDate,
      lessons_learned: newLessons,
      delivery_method: newDeliveryMethod,
    });

    setIsAddOpen(false);
  };

  return (
    <div id="historical-projects-view" className="space-y-5 pb-12">
      {/* Bento Top Banner */}
      <div className="bento-card p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight font-sans">
              Archive Projects Knowledge Base
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-100 text-cyan-800 uppercase tracking-wider">
              {filteredProjects.length} Archived Projects
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Empirical archive of completed projects with verified actual costs, unit rates (C$/m²), and construction lessons.
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="h-9 px-3.5 rounded-lg bg-cyan-600 hover:bg-lime-500 text-white font-bold text-xs inline-flex items-center gap-1.5 transition-all shadow-xs cursor-pointer shrink-0 "
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Archive Project</span>
        </button>
      </div>

      {/* Bento Aggregate Empirical Benchmark Cards (Section 14) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bento-card p-4">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Average Cost / m²
          </span>
          <div className="text-xl font-bold text-amber-700 mt-1 font-mono">
            {formatCurrency(benchmarkStats.avgCostPerM2)}/m²
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Across archived projects</div>
        </div>

        <div className="bento-card p-4">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Median Cost / m²
          </span>
          <div className="text-xl font-bold text-slate-900 mt-1 font-mono">
            {formatCurrency(benchmarkStats.medianCostPerM2)}/m²
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Middle distribution value</div>
        </div>

        <div className="bento-card p-4">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Archive Cost Range
          </span>
          <div className="text-base font-bold text-slate-900 mt-1.5 font-mono">
            {formatCurrencyCompact(benchmarkStats.minCostPerM2)} &ndash;{' '}
            {formatCurrencyCompact(benchmarkStats.maxCostPerM2)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Min to max unit rates</div>
        </div>

        <div className="bento-card p-4">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Total Completed Area
          </span>
          <div className="text-xl font-bold text-slate-900 mt-1 font-mono">
            {benchmarkStats.totalArea.toLocaleString()} m²
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Delivered floor space</div>
        </div>
      </div>

      {/* Bento Filter and Search Bar */}
      <div className="bento-card p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Project Type */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
              Project Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-800 focus:ring-1 focus:ring-amber-500"
            >
              <option value="ALL">All Project Types</option>
              <option value="Residential">Residential</option>
              <option value="Commercial">Commercial</option>
              <option value="Office Renovation">Office Renovation</option>
              <option value="Retail">Retail</option>
              <option value="Industrial">Industrial</option>
              <option value="Institutional">Institutional</option>
            </select>
          </div>

          {/* Location */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
              Location
            </label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-800 focus:ring-1 focus:ring-amber-500"
            >
              <option value="ALL">All Locations</option>
              {availableLocations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          {/* Year */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
              Year Completed
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-800 focus:ring-1 focus:ring-amber-500"
            >
              <option value="ALL">All Years</option>
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>

          {/* Min Area */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
              Min Area (m²)
            </label>
            <input
              type="number"
              value={minArea}
              onChange={(e) => setMinArea(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="e.g. 400"
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-amber-500 font-mono"
            />
          </div>

          {/* Search */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
              Search
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Building type, lessons..."
                className="w-full pl-8 pr-2.5 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bento Archive Projects Table */}
      <div className="bento-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Archive Project</th>
                <th className="py-3 px-4">Type & Location</th>
                <th className="py-3 px-4 text-center">Area (m²)</th>
                <th className="py-3 px-4 text-center">Duration (Mos)</th>
                <th className="py-3 px-4 text-right">Planned Cost</th>
                <th className="py-3 px-4 text-right">Final Actual Cost</th>
                <th className="py-3 px-4 text-right">Unit Rate (CAD/m²)</th>
                <th className="py-3 px-4 text-center">Completed</th>
                <th className="py-3 px-4 text-center">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredProjects.map((proj) => {
                const variance = proj.planned_cost - proj.final_actual_cost;
                const isUnder = variance >= 0;

                return (
                  <tr
                    key={proj.id}
                    id={`historical-row-${proj.id}`}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-medium text-slate-900">
                      <div className="font-semibold text-slate-900">{proj.name}</div>
                      <div className="text-[11px] text-slate-500">
                        {proj.client_name} • {proj.delivery_method}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">{proj.type}</div>
                      <div className="text-[11px] text-slate-500">{proj.location}</div>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-semibold text-slate-800">
                      {proj.floor_area.toLocaleString()} m²
                      <span className="block text-[10px] text-slate-400 font-normal">
                        {proj.floors} floors
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono">
                      <span className="text-slate-800 font-semibold">
                        {proj.actual_duration_months}
                      </span>
                      <span className="text-slate-400 text-[10px] block">
                        (Planned: {proj.planned_duration_months})
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-600">
                      {formatCurrency(proj.planned_cost)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-900">
                      {formatCurrency(proj.final_actual_cost)}
                      <span
                        className={`block text-[10px] font-medium ${
                          isUnder ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {isUnder ? '+' : ''}
                        {formatCurrency(variance)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-amber-700 bg-amber-50/30">
                      {formatCurrency(proj.cost_per_m2)}/m²
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-slate-600">
                      {proj.completion_date}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => setActiveProjectModal(proj)}
                        className="px-2 py-1 text-xs font-semibold text-cyan-700 hover:text-cyan-800 hover:bg-lime-50 rounded border border-cyan-200 transition-colors cursor-pointer"
                      >
                        Lessons
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lessons Learned Modal */}
      {activeProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150 text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-mono font-bold text-amber-700 uppercase tracking-wider block">
                  Completed Project Benchmark
                </span>
                <h3 className="text-base font-bold text-slate-900 font-display">
                  {activeProjectModal.name}
                </h3>
              </div>
              <button
                onClick={() => setActiveProjectModal(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 uppercase text-[10px] block">Building Type</span>
                <span className="font-semibold text-slate-800">
                  {activeProjectModal.building_type}
                </span>
              </div>
              <div>
                <span className="text-slate-400 uppercase text-[10px] block">Delivery Method</span>
                <span className="font-semibold text-slate-800">
                  {activeProjectModal.delivery_method}
                </span>
              </div>
              <div>
                <span className="text-slate-400 uppercase text-[10px] block">Final Unit Rate</span>
                <span className="font-bold text-amber-800 font-mono">
                  {formatCurrency(activeProjectModal.cost_per_m2)} / m²
                </span>
              </div>
              <div>
                <span className="text-slate-400 uppercase text-[10px] block">Total Actual Cost</span>
                <span className="font-bold text-slate-900 font-mono">
                  {formatCurrency(activeProjectModal.final_actual_cost)}
                </span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                <span>Empirical Lessons Learned</span>
              </h4>
              <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-950 leading-relaxed">
                {activeProjectModal.lessons_learned}
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setActiveProjectModal(null)}
                className="px-4 py-2 bg-linear-to-r from-cyan-600 to-lime-600 hover:from-cyan-700 hover:to-lime-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer "
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Archive New Project Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-slate-900">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-100 text-amber-800">
                  <Archive className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-display">
                    Archive Completed Project
                  </h3>
                  <p className="text-xs text-slate-500">
                    Add verified historical data to improve future intelligence estimation
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddHistorical} className="p-6 overflow-y-auto space-y-4 text-sm flex-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Bayview Luxury Condos"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Client Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newClient}
                    onChange={(e) => setNewClient(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Type *
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as ProjectType)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
                  >
                    <option value="Residential">Residential</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Office Renovation">Office Renovation</option>
                    <option value="Retail">Retail</option>
                    <option value="Industrial">Industrial</option>
                    <option value="Institutional">Institutional</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Building Type *
                  </label>
                  <input
                    type="text"
                    required
                    value={newBuildingType}
                    onChange={(e) => setNewBuildingType(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Location *
                  </label>
                  <input
                    type="text"
                    required
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Floor Area (m²) *
                  </label>
                  <input
                    type="number"
                    required
                    value={newFloorArea}
                    onChange={(e) => setNewFloorArea(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Planned Cost (CAD) *
                  </label>
                  <input
                    type="number"
                    required
                    value={newPlannedCost}
                    onChange={(e) => setNewPlannedCost(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Final Actual (CAD) *
                  </label>
                  <input
                    type="number"
                    required
                    value={newFinalCost}
                    onChange={(e) => setNewFinalCost(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono font-bold text-amber-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Key Lessons Learned *
                </label>
                <textarea
                  rows={2}
                  required
                  value={newLessons}
                  onChange={(e) => setNewLessons(e.target.value)}
                  placeholder="Key factors influencing schedule or cost performance"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-600 hover:bg-lime-500 text-white font-bold rounded-lg text-xs cursor-pointer transition-all "
                >
                  Save to Benchmark Database
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
