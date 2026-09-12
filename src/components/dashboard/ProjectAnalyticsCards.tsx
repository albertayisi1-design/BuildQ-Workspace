import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { ArrowUpRight } from 'lucide-react';

interface ProjectAnalyticsCardsProps {
  onNavigate?: (tab: string) => void;
  onSelectProject?: (projectId: string) => void;
}

// Monthly cost incurred dataset matching the exact values in image.png
const MONTHLY_COST_DATA = [
  { month: 'Jan', labour: 24, materials: 38, subcontractors: 18 },
  { month: 'Feb', labour: 45, materials: 62, subcontractors: 42 },
  { month: 'Mar', labour: 70, materials: 85, subcontractors: 77 },
  { month: 'Apr', labour: 83, materials: 102, subcontractors: 97 },
  { month: 'May', labour: 96, materials: 120, subcontractors: 110 },
  { month: 'Jun', labour: 110, materials: 140, subcontractors: 125 },
  { month: 'Jul', labour: 88, materials: 95, subcontractors: 90 },
  { month: 'Aug', labour: 82, materials: 84, subcontractors: 83 },
  { month: 'Sep', labour: 42, materials: 50, subcontractors: 48 },
];

// Cost per sq ft benchmark dataset matching the exact values in image.png
const COST_PER_SQFT_DATA = [
  {
    code: 'PRJ-2024-001',
    costPerSqFt: 102,
    name: 'Highland Residences Phase 1',
    type: 'Residential (Townhouse)',
    area: '580 m² (6,243 sq ft)',
  },
  {
    code: 'PRJ-2024-002',
    costPerSqFt: 57,
    name: 'Centennial Park Office Tower',
    type: 'Commercial Office',
    area: '1,200 m² (12,916 sq ft)',
  },
  {
    code: 'PRJ-2024-003',
    costPerSqFt: 65,
    name: 'Harbourfront Logistics Center',
    type: 'Light Industrial / Logistics',
    area: '950 m² (10,225 sq ft)',
  },
  {
    code: 'PRJ-2024-004',
    costPerSqFt: 29,
    name: 'Bloor West Medical Pavilion',
    type: 'Institutional / Clinical Shell',
    area: '850 m² (9,149 sq ft)',
  },
  {
    code: 'PRJ-2024-005',
    costPerSqFt: 73,
    name: 'Oakridge Estate Executive Villas',
    type: 'Multi-Unit Residential Luxury',
    area: '1,100 m² (11,840 sq ft)',
  },
];

export const ProjectAnalyticsCards: React.FC<ProjectAnalyticsCardsProps> = ({
  onNavigate,
}) => {
  const [activeHoverMonth, setActiveHoverMonth] = useState<string | null>(null);

  return (
    <div id="project-data-analytics-grid" className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
      {/* CARD 1: Project Cost Incurred by Month */}
      <div
        id="card-cost-incurred-by-month"
        className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col justify-between"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight ">
              Project Cost Incurred by Month
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Cumulative labour, materials & subcontractors ($ in thousands)
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-md text-xs font-semibold text-slate-600 bg-slate-100 border border-slate-200/80 font-mono shrink-0">
            YTD 2024
          </span>
        </div>

        {/* Spline Line Chart */}
        <div className="h-64 sm:h-72 w-full mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={MONTHLY_COST_DATA}
              margin={{ top: 15, right: 15, left: -15, bottom: 5 }}
              onMouseMove={(state) => {
                if (state && state.activeLabel) {
                  setActiveHoverMonth(state.activeLabel);
                }
              }}
              onMouseLeave={() => setActiveHoverMonth(null)}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#f1f5f9"
              />
              <XAxis
                dataKey="month"
                tickLine={true}
                axisLine={{ stroke: '#64748b', strokeWidth: 1 }}
                tick={{ fontSize: 12, fill: '#475569' }}
                dy={6}
              />
              <YAxis
                domain={[0, 140]}
                ticks={[0, 35, 70, 105, 140]}
                tickLine={true}
                axisLine={{ stroke: '#64748b', strokeWidth: 1 }}
                tick={{ fontSize: 12, fill: '#475569' }}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const labourVal = payload.find((p) => p.dataKey === 'labour')?.value;
                    const materialsVal = payload.find((p) => p.dataKey === 'materials')?.value;
                    const subVal = payload.find((p) => p.dataKey === 'subcontractors')?.value;

                    return (
                      <div className="bg-white/95 backdrop-blur-xs rounded-xl p-3 border border-slate-200 shadow-lg text-xs min-w-[100px]">
                        <div className="font-bold text-slate-800 mb-1 text-sm">{label}</div>
                        <div className="space-y-1 font-mono font-medium">
                          <div className="text-[#F59E0B]">
                            : ${labourVal}k
                          </div>
                          <div className="text-[#3B82F6]">
                            : ${materialsVal}k
                          </div>
                          <div className="text-[#10B981]">
                            : ${subVal}k
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              {/* Labour (Orange / Amber) */}
              <Line
                type="monotone"
                dataKey="labour"
                name="Labour"
                stroke="#F59E0B"
                strokeWidth={2.5}
                dot={activeHoverMonth === 'Feb' ? { r: 4, fill: '#F59E0B', strokeWidth: 0 } : false}
                activeDot={{ r: 5, fill: '#F59E0B', stroke: '#ffffff', strokeWidth: 2 }}
              />
              {/* Materials (Blue) */}
              <Line
                type="monotone"
                dataKey="materials"
                name="Materials"
                stroke="#3B82F6"
                strokeWidth={2.5}
                dot={activeHoverMonth === 'Feb' ? { r: 4, fill: '#3B82F6', strokeWidth: 0 } : false}
                activeDot={{ r: 5, fill: '#3B82F6', stroke: '#ffffff', strokeWidth: 2 }}
              />
              {/* Subcontractors (Green / Emerald) */}
              <Line
                type="monotone"
                dataKey="subcontractors"
                name="Subcontractors"
                stroke="#10B981"
                strokeWidth={2.5}
                dot={activeHoverMonth === 'Feb' ? { r: 4, fill: '#10B981', strokeWidth: 0 } : false}
                activeDot={{ r: 5, fill: '#10B981', stroke: '#ffffff', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Custom Legend Matching image.png */}
        <div className="flex items-center justify-center gap-6 mt-4 pt-2 text-xs font-medium text-slate-700">
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center">
              <span className="w-2.5 h-0.5 bg-[#F59E0B] inline-block" />
              <span className="w-2 h-2 rounded-full border border-[#F59E0B] bg-white -ml-0.5 -mr-0.5" />
              <span className="w-2.5 h-0.5 bg-[#F59E0B] inline-block" />
            </span>
            <span className="text-[#F59E0B] font-semibold">Labour</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center">
              <span className="w-2.5 h-0.5 bg-[#3B82F6] inline-block" />
              <span className="w-2 h-2 rounded-full border border-[#3B82F6] bg-white -ml-0.5 -mr-0.5" />
              <span className="w-2.5 h-0.5 bg-[#3B82F6] inline-block" />
            </span>
            <span className="text-[#3B82F6] font-semibold">Materials</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center">
              <span className="w-2.5 h-0.5 bg-[#10B981] inline-block" />
              <span className="w-2 h-2 rounded-full border border-[#10B981] bg-white -ml-0.5 -mr-0.5" />
              <span className="w-2.5 h-0.5 bg-[#10B981] inline-block" />
            </span>
            <span className="text-[#10B981] font-semibold">Subcontractors</span>
          </div>
        </div>
      </div>

      {/* CARD 2: Cost per Square Foot by Project */}
      <div
        id="card-cost-per-sqft"
        className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col justify-between"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight ">
              Cost per Square Foot by Project
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Unit cost economics ($/sq ft) for historical estimate calibration
            </p>
          </div>
          <button
            id="btn-analytics-analyze"
            onClick={() => onNavigate?.('intelligence')}
            className="text-xs sm:text-sm font-bold text-[#F97316] hover:text-[#EA580C] inline-flex items-center gap-1 cursor-pointer transition-colors shrink-0 group"
            title="Navigate to Parametric Cost Benchmark"
          >
            <span>Analyze</span>
            <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </button>
        </div>

        {/* Horizontal Bar Chart */}
        <div className="h-64 sm:h-72 w-full mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={COST_PER_SQFT_DATA}
              margin={{ top: 10, right: 25, left: 20, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={false}
                stroke="#f1f5f9"
              />
              <XAxis
                type="number"
                domain={[0, 105]}
                ticks={[0, 25, 50, 75, 100]}
                tickFormatter={(val) => `${val} $/sqft`}
                tickLine={true}
                axisLine={{ stroke: '#64748b', strokeWidth: 1 }}
                tick={{ fontSize: 11, fill: '#475569' }}
              />
              <YAxis
                type="category"
                dataKey="code"
                tickLine={true}
                axisLine={{ stroke: '#64748b', strokeWidth: 1 }}
                tick={{ fontSize: 11, fill: '#475569', fontFamily: 'monospace' }}
                width={85}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white/95 backdrop-blur-xs rounded-xl p-3 border border-slate-200 shadow-lg text-xs min-w-[180px]">
                        <div className="font-bold text-slate-900 font-mono text-xs">{data.code}</div>
                        <div className="font-medium text-slate-700 text-[11px] truncate mb-1.5">{data.name}</div>
                        <div className="border-t border-slate-100 pt-1.5 space-y-1">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-slate-500">Unit Cost:</span>
                            <span className="font-bold font-mono text-[#8B5CF6]">{data.costPerSqFt} $/sqft</span>
                          </div>
                          <div className="flex items-center justify-between gap-3 text-[11px]">
                            <span className="text-slate-500">Typology:</span>
                            <span className="text-slate-700">{data.type}</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar
                dataKey="costPerSqFt"
                fill="#8B5CF6"
                radius={[0, 4, 4, 0]}
                barSize={24}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Footer info note */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mt-4 pt-2 border-t border-slate-100">
          <span>Historical baseline calibrated across 5 archetype projects</span>
          <span className="text-purple-600 font-semibold">Avg: 65.2 $/sqft</span>
        </div>
      </div>
    </div>
  );
};
