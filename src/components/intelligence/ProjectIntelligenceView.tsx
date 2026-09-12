import React, { useState, useMemo } from 'react';
import { useBuild } from '../../context/BuildContext';
import { ProjectType, DeliveryMethod, IntelligenceQuery, IntelligenceResult } from '../../types';
import {
  formatCurrency,
  formatCurrencyCompact,
  formatPercent,
} from '../../utils/formatters';
import {
  BrainCircuit,
  Search,
  Sparkles,
  Building2,
  Calendar,
  Maximize2,
  Sliders,
  SlidersHorizontal,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  FileText,
  Printer,
  ChevronRight,
  ChevronDown,
  ShieldAlert,
  Layers,
  ArrowRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface ProjectIntelligenceViewProps {
  onNavigateToReportsWithData?: (result: IntelligenceResult) => void;
}

const TYPOLOGY_OPTIONS: { label: string; value: ProjectType }[] = [
  { label: 'Residential', value: 'Residential' },
  { label: 'Commercial', value: 'Commercial' },
  { label: 'Institutional', value: 'Institutional' },
  { label: 'Industrial', value: 'Industrial' },
  { label: 'Retail', value: 'Retail' },
];

const LOCATION_OPTIONS = [
  'Toronto, ON (GTA)',
  'Ottawa, ON',
  'Hamilton, ON',
  'Kitchener-Waterloo, ON',
  'London, ON',
  'Greater Golden Horseshoe, ON',
];

const DELIVERY_OPTIONS: DeliveryMethod[] = [
  'Construction Management',
  'Design-Build',
  'Design-Bid-Build',
];

const AREA_PRESETS = [450, 650, 1200, 3500, 8000];
const FLOOR_PRESETS = [2, 4, 8, 16, 24];

export const ProjectIntelligenceView: React.FC<ProjectIntelligenceViewProps> = ({
  onNavigateToReportsWithData,
}) => {
  const { runIntelligenceQuery } = useBuild();

  // Query Parameters (Pre-filled to match studio defaults: Residential, Toronto, 650 m², 4 Floors)
  const [name, setName] = useState('Queen Street Boutique Residences');
  const [projectType, setProjectType] = useState<ProjectType>('Residential');
  const [buildingType, setBuildingType] = useState('Apartment');
  const [location, setLocation] = useState('Toronto, ON (GTA)');
  const [floorArea, setFloorArea] = useState<number>(650);
  const [floors, setFloors] = useState<number>(4);
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('Construction Management');

  // Active query result
  const [result, setResult] = useState<IntelligenceResult>(() => {
    return runIntelligenceQuery({
      name: 'Queen Street Boutique Residences',
      project_type: 'Residential',
      building_type: 'Apartment',
      location: 'Toronto, ON',
      floor_area: 650,
      floors: 4,
      delivery_method: 'Construction Management',
    });
  });

  const updateParam = (paramKey: string, val: any) => {
    let newName = name;
    let newType = projectType;
    let newBuilding = buildingType;
    let newLoc = location;
    let newArea = floorArea;
    let newFloors = floors;
    let newDelivery = deliveryMethod;

    if (paramKey === 'projectType') {
      newType = val;
      setProjectType(val);
      if (val === 'Residential') newBuilding = 'Apartment';
      else if (val === 'Commercial') newBuilding = 'Office Building';
      else newBuilding = val;
      setBuildingType(newBuilding);
    } else if (paramKey === 'location') {
      newLoc = val;
      setLocation(val);
    } else if (paramKey === 'floorArea') {
      newArea = Number(val);
      setFloorArea(Number(val));
    } else if (paramKey === 'floors') {
      newFloors = Number(val);
      setFloors(Number(val));
    } else if (paramKey === 'deliveryMethod') {
      newDelivery = val;
      setDeliveryMethod(val);
    } else if (paramKey === 'name') {
      newName = val;
      setName(val);
    }

    const locClean = newLoc.replace(' (GTA)', '');
    const res = runIntelligenceQuery({
      name: newName,
      project_type: newType,
      building_type: newBuilding,
      location: locClean,
      floor_area: Number(newArea) || 100,
      floors: Number(newFloors) || 1,
      delivery_method: newDelivery,
    });
    setResult(res);
  };

  const handleRunAnalysis = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const locClean = location.replace(' (GTA)', '');
    const res = runIntelligenceQuery({
      name,
      project_type: projectType,
      building_type: buildingType,
      location: locClean,
      floor_area: Number(floorArea) || 100,
      floors: Number(floors) || 1,
      delivery_method: deliveryMethod,
    });
    setResult(res);
  };

  // Pre-fill helper for Demonstration Scenario Step 9
  const handleLoadScenarioPreset = () => {
    setName('Queen Street Boutique Residences');
    setProjectType('Residential');
    setBuildingType('Apartment');
    setLocation('Toronto, ON (GTA)');
    setFloorArea(650);
    setFloors(4);
    setDeliveryMethod('Construction Management');

    const res = runIntelligenceQuery({
      name: 'Queen Street Boutique Residences',
      project_type: 'Residential',
      building_type: 'Apartment',
      location: 'Toronto, ON',
      floor_area: 650,
      floors: 4,
      delivery_method: 'Construction Management',
    });
    setResult(res);
  };

  // Pie chart colors for category breakdown
  const CATEGORY_COLORS = ['#3b82f6', '#f59e0b', '#0ea5e9', '#8b5cf6', '#64748b'];

  const categoryPieData = useMemo(() => {
    return result.category_breakdown.map((c) => ({
      name: c.category,
      value: c.amount,
      pct: c.percentage,
    }));
  }, [result]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div id="project-intelligence-view" className="space-y-3.5 pb-8">
      {/* Bento Top Banner - Compact 40% reduction */}
      <div className="bento-card p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-700 border border-amber-500/20">
              <BrainCircuit className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight font-sans">
                  Project Intelligence Engine
                </h1>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 uppercase tracking-wider">
                  Core Differentiator
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Empirical cost benchmarking and preliminary estimate modeling from verified completed project data
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleLoadScenarioPreset}
            className="h-8 px-3 rounded-md bg-cyan-50 hover:bg-lime-100 text-cyan-950 border border-cyan-300 font-bold text-xs inline-flex items-center gap-1.5 transition-all cursor-pointer "
          >
            <Sparkles className="w-3 h-3 text-cyan-600" />
            <span>Load Demo (600m² Res)</span>
          </button>
          <button
            onClick={handlePrint}
            className="h-8 px-3 rounded-md bg-cyan-600 hover:bg-lime-500 text-white font-bold text-xs inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-xs "
          >
            <Printer className="w-3 h-3" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Parametric Cost Benchmark - Compact 40% reduction */}
      <div id="parametric-cost-studio-main" className="bento-card overflow-hidden shadow-md border border-slate-200">
        {/* Header Bar matching image.png */}
        <div className="bg-[#0F172A] px-3.5 py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 text-white">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-md bg-[#F59E0B] flex items-center justify-center text-slate-950 font-bold shrink-0 shadow-xs">
              <SlidersHorizontal className="w-4 h-4 text-slate-950" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xs sm:text-sm font-bold text-white  tracking-tight truncate">
                  Parametric Cost Benchmark
                </h2>
                <span className="bg-[#F59E0B] text-slate-950 text-[9px] font-black px-1.5 py-0.5 rounded tracking-wide uppercase font-mono">
                  ESTIMATOR
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                Calibrated machine-learning benchmarks trained on Ontario historical delivery records
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 self-start sm:self-auto shrink-0">
            <span className="text-[11px] text-slate-400 font-medium">Active Location:</span>
            <div className="px-2 py-0.5 rounded-md bg-[#0B132B] border border-slate-700/80 text-[#F59E0B] font-mono text-[11px] font-bold shadow-xs">
              {location.includes('Toronto') ? 'Toronto, ON' : location.replace(' (GTA)', '')}
            </div>
          </div>
        </div>

        {/* Main Controls Body */}
        <div className="p-3.5 sm:p-4 space-y-3.5 bg-white">
          {/* Building Typology Grid (Clean single row on desktop, 2-col on mobile) */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 tracking-wider  uppercase mb-1.5">
              BUILDING TYPOLOGY
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {TYPOLOGY_OPTIONS.map((item) => {
                const isSelected = projectType === item.value;
                return (
                  <button
                    key={item.value}
                    type="button"
                    id={`btn-intel-typology-${item.value.toLowerCase()}`}
                    onClick={() => updateParam('projectType', item.value)}
                    className={`h-8 px-2.5 rounded-md text-xs font-semibold text-left transition-all cursor-pointer border flex items-center justify-between ${
                      isSelected
                        ? 'bg-[#0F172A] text-white border-[#0F172A] shadow-xs'
                        : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    <span className="truncate">{item.label}</span>
                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-lime-400 shrink-0 ml-1" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Location Market & Delivery Method Dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 tracking-wider  uppercase mb-1">
                LOCATION MARKET
              </label>
              <div className="relative">
                <select
                  id="sel-intel-location-market"
                  value={location}
                  onChange={(e) => updateParam('location', e.target.value)}
                  className="w-full h-8 px-2.5 pr-8 rounded-md border border-slate-200 bg-white text-xs font-medium text-slate-800 appearance-none focus:outline-hidden focus:ring-2 focus:ring-cyan-500 cursor-pointer shadow-2xs"
                >
                  {LOCATION_OPTIONS.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 tracking-wider  uppercase mb-1">
                DELIVERY METHOD
              </label>
              <div className="relative">
                <select
                  id="sel-intel-delivery-method"
                  value={deliveryMethod}
                  onChange={(e) => updateParam('deliveryMethod', e.target.value as DeliveryMethod)}
                  className="w-full h-8 px-2.5 pr-8 rounded-md border border-slate-200 bg-white text-xs font-medium text-slate-800 appearance-none focus:outline-hidden focus:ring-2 focus:ring-cyan-500 cursor-pointer shadow-2xs"
                >
                  {DELIVERY_OPTIONS.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Gross Floor Area (m²) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[10px] font-bold text-slate-500 tracking-wider  uppercase">
                GROSS FLOOR AREA (M²)
              </label>
              <div className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-900 font-mono font-bold text-xs">
                {floorArea.toLocaleString()} m²
              </div>
            </div>

            {/* Area Preset Pills */}
            <div className="flex items-center gap-1.5 flex-wrap mb-2">
              {AREA_PRESETS.map((preset) => {
                const isSelected = floorArea === preset;
                return (
                  <button
                    key={preset}
                    type="button"
                    id={`btn-intel-area-${preset}`}
                    onClick={() => updateParam('floorArea', preset)}
                    className={`px-2 py-1 rounded-md text-[11px] font-mono font-bold transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-amber-100 text-amber-950 border-amber-400 shadow-2xs'
                        : 'bg-slate-50/80 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {preset}m²
                  </button>
                );
              })}
            </div>

            {/* Range Slider */}
            <div className="relative py-0.5">
              <input
                id="slider-intel-floor-area"
                type="range"
                min={100}
                max={12000}
                step={25}
                value={floorArea}
                onChange={(e) => updateParam('floorArea', Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-md appearance-none cursor-pointer accent-[#0F172A] focus:outline-hidden"
              />
              <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono mt-0.5">
                <span>100 m²</span>
                <span>2,500 m²</span>
                <span>5,000 m²</span>
                <span>8,000 m²</span>
                <span>12,000 m²</span>
              </div>
            </div>
          </div>

          {/* Storeys / Floor Selector */}
          <div className="pt-1.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="text-xs font-mono text-slate-700 font-medium">
              Storeys: <span className="font-bold text-slate-900">{floors} Floors</span>
            </div>

            <div className="flex items-center gap-1 self-start sm:self-auto">
              {FLOOR_PRESETS.map((fl) => {
                const isSelected = floors === fl;
                return (
                  <button
                    key={fl}
                    type="button"
                    id={`btn-intel-floors-${fl}`}
                    onClick={() => updateParam('floors', fl)}
                    className={`w-7 h-6.5 rounded-md text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center border ${
                      isSelected
                        ? 'bg-[#0F172A] text-white border-[#0F172A] shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {fl}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional Name Customization & Instant Refresh */}
          <div className="pt-2.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <label className="text-xs font-medium text-slate-500 shrink-0">
                Target Project Label:
              </label>
              <input
                type="text"
                id="inp-intel-custom-name"
                value={name}
                onChange={(e) => updateParam('name', e.target.value)}
                placeholder="e.g. Queen Street Boutique Residences"
                className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 text-xs text-slate-800 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-cyan-500 font-medium"
              />
            </div>

            <button
              id="btn-run-intel-query"
              type="button"
              onClick={() => handleRunAnalysis()}
              className="h-8 px-3 bg-linear-to-r from-cyan-500 to-lime-500 hover:from-cyan-600 hover:to-lime-600 text-white font-bold text-xs rounded-md shadow-xs inline-flex items-center gap-1.5 transition-all cursor-pointer  shrink-0"
            >
              <BrainCircuit className="w-3.5 h-3.5" />
              <span>Update Benchmark Modeling</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bento Primary Estimate Presentation Box - Compact 40% reduction */}
      <div className="bento-card-dark p-4 sm:p-5 relative overflow-hidden">
        <div className="relative z-10 space-y-3.5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3.5">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 text-[9px] font-mono font-bold border border-amber-400/30 uppercase tracking-wider">
                  Preliminary Estimate
                </span>
                <span className="text-[11px] text-slate-400">
                  Empirical Formula: Floor Area ({result.query.floor_area} m²) &times; Avg Cost/m² ({formatCurrency(result.benchmarks.avg_cost_per_m2)})
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 mt-1 font-mono tracking-tight">
                {formatCurrency(result.preliminary_estimate.estimated_cost)}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Baseline preliminary cost for {result.query.floor_area} m² {result.query.project_type} build ({result.query.location})
              </p>
            </div>

            {/* Estimated Range Bento Box */}
            <div className="bg-slate-800/80 p-2.5 sm:p-3 rounded-lg border border-slate-700/80 text-right">
              <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">
                Estimated Cost Range (Min &ndash; Max)
              </span>
              <div className="text-base sm:text-lg font-bold font-mono text-white mt-0.5">
                {formatCurrency(result.preliminary_estimate.range_min)} &ndash;{' '}
                {formatCurrency(result.preliminary_estimate.range_max)}
              </div>
              <div className="text-[9px] text-slate-400 mt-0.5">
                Based on historical rates {formatCurrency(result.benchmarks.min_cost_per_m2)}/m² to {formatCurrency(result.benchmarks.max_cost_per_m2)}/m²
              </div>
            </div>
          </div>

          {/* 4 Secondary Benchmark Bento Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/60">
              <span className="text-[9px] text-slate-400 uppercase tracking-wider font-bold block">
                Average Cost / m²
              </span>
              <div className="text-base sm:text-lg font-bold text-amber-300 mt-0.5 font-mono">
                {formatCurrency(result.benchmarks.avg_cost_per_m2)}/m²
              </div>
              <div className="text-[9px] text-slate-500 mt-0.5">Matched portfolio mean</div>
            </div>

            <div className="bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/60">
              <span className="text-[9px] text-slate-400 uppercase tracking-wider font-bold block">
                Median Cost / m²
              </span>
              <div className="text-base sm:text-lg font-bold text-slate-200 mt-0.5 font-mono">
                {formatCurrency(result.benchmarks.median_cost_per_m2)}/m²
              </div>
              <div className="text-[9px] text-slate-500 mt-0.5">Distribution median</div>
            </div>

            <div className="bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/60">
              <span className="text-[9px] text-slate-400 uppercase tracking-wider font-bold block">
                Estimated Duration
              </span>
              <div className="text-base sm:text-lg font-bold text-emerald-400 mt-0.5 font-mono">
                {result.preliminary_estimate.estimated_duration_months} Months
              </div>
              <div className="text-[9px] text-slate-500 mt-0.5">Historical execution avg</div>
            </div>

            <div className="bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/60">
              <span className="text-[9px] text-slate-400 uppercase tracking-wider font-bold block">
                Suggested Contingency
              </span>
              <div className="text-base sm:text-lg font-bold text-amber-400 mt-0.5 font-mono">
                {result.preliminary_estimate.suggested_contingency_percent}%
              </div>
              <div className="text-[9px] text-slate-500 mt-0.5">Risk & market buffer</div>
            </div>
          </div>

          {/* Mandatory Formal Disclaimer */}
          <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] flex items-start gap-2">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="font-semibold text-amber-200">Notice: </strong>
              {result.preliminary_estimate.disclaimer}
            </div>
          </div>
        </div>
      </div>

      {/* Cost Breakdown Bento Grid (Category Table + Pie Chart) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Category Table Bento Card */}
        <div className="lg:col-span-7 bento-card overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-3.5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 font-sans">
                  Cost Breakdown by Category
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Estimated budget apportioned by historical empirical cost distributions
                </p>
              </div>
              <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                Section 20
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-semibold text-slate-600 uppercase tracking-wider">
                  <tr>
                    <th className="py-2 px-3">Category</th>
                    <th className="py-2 px-3 text-center">Historical %</th>
                    <th className="py-2 px-3 text-right">Estimated Amount (CAD)</th>
                    <th className="py-2 px-3 text-right">Unit Rate (CAD/m²)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {result.category_breakdown.map((cat, idx) => (
                    <tr key={cat.category} className="hover:bg-slate-50/50">
                      <td className="py-2 px-3 font-sans font-medium text-slate-900 flex items-center gap-2">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] }}
                        />
                        <span className="truncate">{cat.category}</span>
                      </td>
                      <td className="py-2 px-3 text-center font-bold text-slate-800">
                        {cat.percentage}%
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-slate-900">
                        {formatCurrency(cat.amount)}
                      </td>
                      <td className="py-2 px-3 text-right text-slate-600">
                        {formatCurrency(cat.amount / (result.query.floor_area || 1))}/m²
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50 font-bold border-t border-slate-200 font-sans">
                    <td className="py-2.5 px-3 text-slate-900">Total Preliminary Budget</td>
                    <td className="py-2.5 px-3 text-center font-mono">100%</td>
                    <td className="py-2.5 px-3 text-right text-amber-800 font-mono text-xs">
                      {formatCurrency(result.preliminary_estimate.estimated_cost)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-900 font-mono">
                      {formatCurrency(result.benchmarks.avg_cost_per_m2)}/m²
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Visual Category Distribution Bento Card */}
        <div className="lg:col-span-5 bento-card p-3.5 flex flex-col items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 font-sans mb-1.5 self-start">
            Category Share Allocation
          </h3>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={65}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {categoryPieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => formatCurrency(Number(val))}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-1.5 w-full pt-2.5 border-t border-slate-100 text-[11px]">
            {result.category_breakdown.map((cat, idx) => (
              <div key={cat.category} className="flex items-center gap-1.5">
                <span
                  className="h-1.5 w-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] }}
                />
                <span className="text-slate-600 truncate">{cat.category}:</span>
                <span className="font-mono font-bold text-slate-900">{cat.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Similar Projects Matching Table Bento Card */}
      <div className="bento-card overflow-hidden">
        <div className="p-3.5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 font-sans">
                Matched Comparable Archive Projects
              </h2>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-sky-100 text-sky-800 uppercase tracking-wider">
                {result.matched_projects.length} Matches Found
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Ranked by similarity scoring based on project type, scale (&plusmn;30% floor area), and geographic location
            </p>
          </div>
          <span className="text-[11px] text-slate-400">
            Source: Completed Archive Database
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-semibold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="py-2 px-3">Archive Project</th>
                <th className="py-2 px-3">Building Type</th>
                <th className="py-2 px-3">Location</th>
                <th className="py-2 px-3 text-center">Floor Area (m²)</th>
                <th className="py-2 px-3 text-right">Final Actual Cost</th>
                <th className="py-2 px-3 text-right">Unit Rate (CAD/m²)</th>
                <th className="py-2 px-3 text-center">Similarity Match</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {result.matched_projects.map((match) => {
                const proj = match.project;
                return (
                  <tr key={proj.id} className="hover:bg-slate-50/60">
                    <td className="py-2.5 px-3 font-sans font-medium text-slate-900">
                      <div className="font-semibold text-slate-900 text-xs">{proj.name}</div>
                      <div className="text-[10px] text-slate-500 font-normal">
                        {proj.client_name} • Completed {proj.completion_date}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">{proj.building_type}</td>
                    <td className="py-2.5 px-3 text-slate-700">{proj.location}</td>
                    <td className="py-2.5 px-3 text-center font-mono font-semibold text-slate-800">
                      {proj.floor_area.toLocaleString()} m²
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                      {formatCurrency(proj.final_actual_cost)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-700 bg-amber-50/30">
                      {formatCurrency(proj.cost_per_m2)}/m²
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold font-mono ${
                          match.similarity_score >= 85
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : match.similarity_score >= 70
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {match.similarity_score}% Match
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empirical Risk Factors & Lessons Learned Bento Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Risk Factors Bento Card */}
        <div className="bento-card p-3.5">
          <div className="flex items-center gap-2 mb-2.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <h3 className="text-xs font-bold text-slate-900 font-sans">
              Synthesized Risk Factors
            </h3>
          </div>
          <div className="space-y-1.5">
            {result.risk_factors.map((risk, i) => (
              <div
                key={i}
                className="p-2.5 rounded-md bg-slate-50 border border-slate-200/70 text-xs text-slate-700 flex items-start gap-2"
              >
                <span className="text-amber-500 font-bold mt-0.5">•</span>
                <span>{risk}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Historical Lessons Learned Bento Card */}
        <div className="bento-card p-3.5">
          <div className="flex items-center gap-2 mb-2.5">
            <FileText className="w-3.5 h-3.5 text-slate-700" />
            <h3 className="text-xs font-bold text-slate-900 font-sans">
              Historical Lessons Learned from Matches
            </h3>
          </div>
          <div className="space-y-1.5">
            {result.matched_projects.slice(0, 3).map((match, i) => (
              <div
                key={i}
                className="p-2.5 rounded-md bg-amber-50/50 border border-amber-200/60 text-xs text-slate-800"
              >
                <strong className="text-amber-950 block font-semibold mb-0.5">
                  {match.project.name} ({match.project.building_type}):
                </strong>
                <p className="text-slate-600 text-[11px]">{match.project.lessons_learned}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
