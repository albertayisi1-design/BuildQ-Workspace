import React, { useState, useMemo } from 'react';
import { useBuild } from '../../context/BuildContext';
import { ProjectType, DeliveryMethod, IntelligenceResult } from '../../types';
import { formatCurrency, formatCurrencyCompact } from '../../utils/formatters';
import {
  SlidersHorizontal,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Clock,
  Layers,
  ChevronDown,
  CheckCircle2,
  Building2,
  ShieldCheck,
} from 'lucide-react';

interface ParametricCostStudioProps {
  onNavigate?: (tab: string) => void;
  onOpenNewProjectWithParams?: (params: {
    name: string;
    type: ProjectType;
    location: string;
    budget: number;
    floor_area: number;
  }) => void;
  onSelectResult?: (result: IntelligenceResult) => void;
  standalone?: boolean;
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

export const ParametricCostStudio: React.FC<ParametricCostStudioProps> = ({
  onNavigate,
  onOpenNewProjectWithParams,
  onSelectResult,
  standalone = false,
}) => {
  const { runIntelligenceQuery, historicalProjects } = useBuild();

  // State matching image.png exactly
  const [typology, setTypology] = useState<ProjectType>('Residential');
  const [locationMarket, setLocationMarket] = useState('Toronto, ON (GTA)');
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('Construction Management');
  const [floorArea, setFloorArea] = useState<number>(650);
  const [floors, setFloors] = useState<number>(4);

  // Compute live intelligence estimate
  const result: IntelligenceResult = useMemo(() => {
    const locClean = locationMarket.replace(' (GTA)', '');
    return runIntelligenceQuery({
      name: `${typology} Development (${floorArea}m²)`,
      project_type: typology,
      building_type: typology === 'Residential' ? 'Apartment' : typology,
      location: locClean,
      floor_area: floorArea,
      floors: floors,
      delivery_method: deliveryMethod,
    });
  }, [typology, locationMarket, deliveryMethod, floorArea, floors, runIntelligenceQuery]);

  // Clean location display for the top-right badge
  const activeLocationDisplay = useMemo(() => {
    return locationMarket.includes('Toronto') ? 'Toronto, ON' : locationMarket.replace(' (GTA)', '');
  }, [locationMarket]);

  return (
    <div
      id="parametric-cost-studio"
      className="bento-card overflow-hidden shadow-md border border-slate-200 transition-all"
    >
      {/* 1. Header Bar (Navy/Dark Slate with Amber Icon & Estimator Pill) - Compact 40% reduced */}
      <div className="bg-[#0F172A] px-3.5 py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 text-white">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Amber Icon Box */}
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

        {/* Top-Right Active Location Badge */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto shrink-0">
          <span className="text-[11px] text-slate-400 font-medium">Active Location:</span>
          <div className="px-2 py-0.5 rounded-md bg-[#0B132B] border border-slate-700/80 text-[#F59E0B] font-mono text-[11px] font-bold shadow-xs">
            {activeLocationDisplay}
          </div>
        </div>
      </div>

      {/* 2. Main Studio Controls Body - Compact 40% reduction */}
      <div className="p-3.5 sm:p-4 space-y-3.5 bg-white">
        {/* Building Typology Grid (Clean single row on desktop, 2-col on mobile) */}
        <div>
          <label className="block text-[10px] font-bold text-slate-500 tracking-wider  uppercase mb-1.5">
            BUILDING TYPOLOGY
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {TYPOLOGY_OPTIONS.map((item) => {
              const isSelected = typology === item.value;
              return (
                <button
                  key={item.value}
                  type="button"
                  id={`btn-typology-${item.value.toLowerCase()}`}
                  onClick={() => setTypology(item.value)}
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
          {/* Location Market */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 tracking-wider  uppercase mb-1">
              LOCATION MARKET
            </label>
            <div className="relative">
              <select
                id="sel-studio-location"
                value={locationMarket}
                onChange={(e) => setLocationMarket(e.target.value)}
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

          {/* Delivery Method */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 tracking-wider  uppercase mb-1">
              DELIVERY METHOD
            </label>
            <div className="relative">
              <select
                id="sel-studio-delivery"
                value={deliveryMethod}
                onChange={(e) => setDeliveryMethod(e.target.value as DeliveryMethod)}
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

        {/* Gross Floor Area (m²) with Quick Presets & Interactive Range Slider */}
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
                  id={`btn-area-preset-${preset}`}
                  onClick={() => setFloorArea(preset)}
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

          {/* Range Slider Track */}
          <div className="relative py-0.5">
            <input
              id="slider-studio-floor-area"
              type="range"
              min={100}
              max={12000}
              step={25}
              value={floorArea}
              onChange={(e) => setFloorArea(Number(e.target.value))}
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

        {/* Storeys / Floor Selector Row */}
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
                  id={`btn-floors-${fl}`}
                  onClick={() => setFloors(fl)}
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

        {/* 3. Live Parametric Calculation Display (Interactive Result Card) */}
        <div className="pt-3 border-t border-slate-100">
          <div className="p-3 sm:p-3.5 rounded-xl bg-slate-50/80 border border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500">
                  Preliminary Parametric Estimate
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-lime-100 text-lime-800 font-mono">
                  Confidence: 94%
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-[#0F172A] font-mono tracking-tight mt-0.5">
                {formatCurrency(result.preliminary_estimate.estimated_cost)}
              </div>
              <div className="flex items-center gap-2.5 text-[11px] text-slate-500 mt-0.5 font-mono flex-wrap">
                <span>
                  Range: {formatCurrency(result.preliminary_estimate.range_min)} – {formatCurrency(result.preliminary_estimate.range_max)}
                </span>
                <span>•</span>
                <span className="text-cyan-700 font-bold">
                  {formatCurrency(result.benchmarks.median_cost_per_m2)} / m²
                </span>
                <span>•</span>
                <span>Est: {result.preliminary_estimate.estimated_duration_months} mo</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap shrink-0">
              {onNavigate && (
                <button
                  type="button"
                  id="btn-studio-deep-dive"
                  onClick={() => {
                    if (onSelectResult) {
                      onSelectResult(result);
                    }
                    onNavigate('intelligence');
                  }}
                  className="h-7.5 px-3 rounded-md bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold border border-slate-300 transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-2xs "
                >
                  <span>Detailed Intelligence</span>
                  <ArrowRight className="w-3 h-3 text-slate-500" />
                </button>
              )}

              <button
                type="button"
                id="btn-studio-create-project"
                onClick={() => {
                  if (onOpenNewProjectWithParams) {
                    onOpenNewProjectWithParams({
                      name: `${typology} Development (${floorArea}m²)`,
                      type: typology,
                      location: locationMarket.replace(' (GTA)', ''),
                      budget: result.preliminary_estimate.estimated_cost,
                      floor_area: floorArea,
                    });
                  } else if (onNavigate) {
                    onNavigate('projects');
                  }
                }}
                className="h-7.5 px-3 rounded-md bg-linear-to-r from-cyan-500 to-lime-500 hover:from-cyan-600 hover:to-lime-600 text-white text-xs font-bold transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5 "
              >
                <span>+ Seed New Project</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
