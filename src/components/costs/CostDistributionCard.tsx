import React, { useState, useMemo } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { useBuild } from '../../context/BuildContext';
import { formatCurrency } from '../../utils/formatters';

export interface CostDistributionItem {
  id: string;
  name: string;
  percentage: number;
  amount: number;
  color: string;
  legendOrder: number; // 0: Labour, 1: Materials, 2: Subcontractors, 3: Site Expenses
}

export interface CostDistributionCardProps {
  title?: string;
  subtitle?: string;
  totalSpendDisplay?: string;
  totalSpendAmount?: number;
  items?: CostDistributionItem[];
  className?: string;
  allowToggleLive?: boolean;
  compact?: boolean;
}

// Default benchmark values matching the reference image exactly:
// Total Spend: $1189k ($1,189,000)
// - Labour: 25% ($297,250)
// - Materials: 40% ($475,600)
// - Subcontractors: 34% ($404,260)
// - Site Expenses: 1% ($11,890)
const DEFAULT_ITEMS: CostDistributionItem[] = [
  {
    id: 'labour',
    name: 'Labour',
    percentage: 25,
    amount: 297250,
    color: '#F59E0B', // Amber / Orange
    legendOrder: 0,
  },
  {
    id: 'site_expenses',
    name: 'Site Expenses',
    percentage: 1,
    amount: 11890,
    color: '#8B5CF6', // Purple
    legendOrder: 3,
  },
  {
    id: 'subcontractors',
    name: 'Subcontractors',
    percentage: 34,
    amount: 404260,
    color: '#10B981', // Emerald / Jade Green
    legendOrder: 2,
  },
  {
    id: 'materials',
    name: 'Materials',
    percentage: 40,
    amount: 475600,
    color: '#3B82F6', // Royal Blue
    legendOrder: 1,
  },
];

export const CostDistributionCard: React.FC<CostDistributionCardProps> = ({
  title = 'Cost Distribution',
  subtitle = 'Labour vs Materials vs Subcontractors',
  totalSpendDisplay = '$1189k',
  totalSpendAmount = 1189000,
  items: customItems,
  className = '',
  allowToggleLive = true,
  compact = false,
}) => {
  const { costs } = useBuild();
  const [viewMode, setViewMode] = useState<'benchmark' | 'live'>('benchmark');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Compute live costs if user switches to live mode
  const liveCostData = useMemo(() => {
    const total = costs.reduce((sum, c) => sum + c.amount, 0);
    if (total === 0) {
      return {
        totalDisplay: '$1189k',
        totalAmount: 1189000,
        items: DEFAULT_ITEMS,
      };
    }

    let labour = 0;
    let materials = 0;
    let subcontractors = 0;
    let siteExpenses = 0;

    costs.forEach((c) => {
      if (c.category === 'Labour') labour += c.amount;
      else if (c.category === 'Materials') materials += c.amount;
      else if (c.category === 'Subcontractor') subcontractors += c.amount;
      else siteExpenses += c.amount; // Equipment + Other mapped to Site Expenses
    });

    const labourPct = Math.round((labour / total) * 100);
    const materialsPct = Math.round((materials / total) * 100);
    const subPct = Math.round((subcontractors / total) * 100);
    const sitePct = Math.max(1, 100 - (labourPct + materialsPct + subPct));

    const totalInK = `$${Math.round(total / 1000)}k`;

    const liveItems: CostDistributionItem[] = [
      {
        id: 'labour',
        name: 'Labour',
        percentage: labourPct,
        amount: labour,
        color: '#F59E0B',
        legendOrder: 0,
      },
      {
        id: 'site_expenses',
        name: 'Site Expenses',
        percentage: sitePct,
        amount: siteExpenses,
        color: '#8B5CF6',
        legendOrder: 3,
      },
      {
        id: 'subcontractors',
        name: 'Subcontractors',
        percentage: subPct,
        amount: subcontractors,
        color: '#10B981',
        legendOrder: 2,
      },
      {
        id: 'materials',
        name: 'Materials',
        percentage: materialsPct,
        amount: materials,
        color: '#3B82F6',
        legendOrder: 1,
      },
    ];

    return {
      totalDisplay: totalInK,
      totalAmount: total,
      items: liveItems,
    };
  }, [costs]);

  // Active dataset
  const activeDataset = useMemo(() => {
    if (customItems) {
      return {
        totalDisplay: totalSpendDisplay,
        totalAmount: totalSpendAmount,
        items: customItems,
      };
    }
    if (viewMode === 'live') {
      return liveCostData;
    }
    return {
      totalDisplay: totalSpendDisplay,
      totalAmount: totalSpendAmount,
      items: DEFAULT_ITEMS,
    };
  }, [customItems, viewMode, liveCostData, totalSpendDisplay, totalSpendAmount]);

  // Slices ordered clockwise from top: Labour -> Site Expenses -> Subcontractors -> Materials
  const chartData = activeDataset.items;

  // Legend items ordered matching the 2-column grid in image:
  // Col 1: Labour (25%), Subcontractors (34%)
  // Col 2: Materials (40%), Site Expenses (1%)
  const labourItem = chartData.find((i) => i.id === 'labour') || DEFAULT_ITEMS[0];
  const materialsItem = chartData.find((i) => i.id === 'materials') || DEFAULT_ITEMS[3];
  const subcontractorsItem = chartData.find((i) => i.id === 'subcontractors') || DEFAULT_ITEMS[2];
  const siteExpensesItem = chartData.find((i) => i.id === 'site_expenses') || DEFAULT_ITEMS[1];

  return (
    <div
      id="card-cost-distribution"
      className={`bento-card ${compact ? 'p-3.5 sm:p-4' : 'p-5'} flex flex-col justify-between transition-all ${className}`}
    >
      {/* 1. Header Section */}
      <div className={`flex items-start justify-between gap-3 ${compact ? 'mb-1.5 pb-1.5' : 'mb-2 pb-2'} border-b border-slate-100`}>
        <div>
          <h3
            id="cost-distribution-title"
            className={`${compact ? 'text-xs sm:text-sm' : 'text-sm'} font-bold text-slate-900 uppercase tracking-wider`}
          >
            {title}
          </h3>
          <p
            id="cost-distribution-subtitle"
            className={`${compact ? 'text-[11px]' : 'text-xs'} text-slate-500 font-normal mt-0.5`}
          >
            {subtitle}
          </p>
        </div>

        {/* Optional Toggle for Live Data vs Benchmark */}
        {allowToggleLive && (
          <div className={`flex items-center gap-1 p-0.5 bg-slate-100 rounded-md border border-slate-200 ${compact ? 'text-[9px]' : 'text-[10px]'} font-mono shrink-0`}>
            <button
              type="button"
              onClick={() => setViewMode('benchmark')}
              className={`${compact ? 'px-1.5 py-0.5' : 'px-2 py-1'} rounded font-bold transition-all cursor-pointer ${
                viewMode === 'benchmark'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Reference Ontario benchmark model ($1189k)"
            >
              Benchmark
            </button>
            <button
              type="button"
              onClick={() => setViewMode('live')}
              className={`${compact ? 'px-1.5 py-0.5' : 'px-2 py-1'} rounded font-bold transition-all cursor-pointer ${
                viewMode === 'live'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Live portfolio cost expenditures"
            >
              Live
            </button>
          </div>
        )}
      </div>

      {/* 2. Donut Chart Visualization with Centered Total Spend */}
      <div className={`relative w-full ${compact ? 'h-44 sm:h-48 my-1 sm:my-2' : 'h-64 sm:h-72 my-3'} flex items-center justify-center`}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload as CostDistributionItem;
                  return (
                    <div className="bg-slate-900/95 text-white px-2.5 py-1.5 rounded-lg text-xs shadow-lg border border-slate-700 font-mono">
                      <div className="font-bold flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: data.color }}
                        />
                        {data.name}
                      </div>
                      <div className="text-slate-300 mt-0.5">
                        Share: <span className="font-bold text-white">{data.percentage}%</span>
                      </div>
                      <div className="text-slate-300">
                        Amount:{' '}
                        <span className="font-bold text-lime-400">
                          {formatCurrency(data.amount)}
                        </span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={compact ? 48 : 70}
              outerRadius={compact ? 68 : 98}
              dataKey="percentage"
              startAngle={90}
              endAngle={-270}
              stroke="#ffffff"
              strokeWidth={compact ? 2 : 3}
              paddingAngle={2}
              onMouseEnter={(_, index) => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${entry.id}`}
                  fill={entry.color}
                  className="transition-all duration-300 outline-hidden cursor-pointer"
                  style={{
                    filter:
                      hoveredIndex === index
                        ? 'brightness(1.1) drop-shadow(0 4px 6px rgba(0,0,0,0.15))'
                        : 'none',
                    transform: hoveredIndex === index ? 'scale(1.02)' : 'scale(1)',
                    transformOrigin: 'center center',
                  }}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center Ring Typography: "Total Spend" + "$1189k" */}
        <div
          id="cost-donut-center"
          className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none text-center"
        >
          <span className={`${compact ? 'text-[10px] sm:text-xs' : 'text-xs sm:text-sm'} font-medium text-slate-400 tracking-tight`}>
            Total Spend
          </span>
          <span className={`${compact ? 'text-lg sm:text-xl' : 'text-2xl sm:text-3xl'} font-extrabold text-slate-900 font-mono tracking-tight mt-0.5`}>
            {activeDataset.totalDisplay}
          </span>
        </div>
      </div>

      {/* 3. Divider Line */}
      <div className={`w-full h-px bg-slate-100 ${compact ? 'mb-2.5 sm:mb-3' : 'mb-6'}`} />

      {/* 4. 2-Column x 2-Row Legend Grid matching image */}
      <div id="cost-distribution-legend" className={`grid grid-cols-2 ${compact ? 'gap-y-2 gap-x-4' : 'gap-y-4 gap-x-6'}`}>
        {/* Row 1, Col 1: Labour */}
        <div
          id="legend-item-labour"
          className={`flex items-start ${compact ? 'gap-2' : 'gap-2.5'} transition-transform hover:translate-x-0.5 cursor-default`}
          onMouseEnter={() => {
            const idx = chartData.findIndex((i) => i.id === 'labour');
            setHoveredIndex(idx >= 0 ? idx : null);
          }}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <span
            className={`${compact ? 'w-2.5 h-2.5 mt-0.5' : 'w-3 h-3 mt-1'} rounded-full shrink-0 shadow-2xs`}
            style={{ backgroundColor: labourItem.color }}
          />
          <div>
            <div className={`${compact ? 'text-[11px] sm:text-xs' : 'text-xs sm:text-sm'} text-slate-600 font-normal leading-tight`}>
              {labourItem.name}
            </div>
            <div className={`${compact ? 'text-sm sm:text-base' : 'text-base sm:text-lg'} font-bold text-slate-900 tracking-tight leading-tight mt-0.5`}>
              {labourItem.percentage}%
            </div>
          </div>
        </div>

        {/* Row 1, Col 2: Materials */}
        <div
          id="legend-item-materials"
          className={`flex items-start ${compact ? 'gap-2' : 'gap-2.5'} transition-transform hover:translate-x-0.5 cursor-default`}
          onMouseEnter={() => {
            const idx = chartData.findIndex((i) => i.id === 'materials');
            setHoveredIndex(idx >= 0 ? idx : null);
          }}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <span
            className={`${compact ? 'w-2.5 h-2.5 mt-0.5' : 'w-3 h-3 mt-1'} rounded-full shrink-0 shadow-2xs`}
            style={{ backgroundColor: materialsItem.color }}
          />
          <div>
            <div className={`${compact ? 'text-[11px] sm:text-xs' : 'text-xs sm:text-sm'} text-slate-600 font-normal leading-tight`}>
              {materialsItem.name}
            </div>
            <div className={`${compact ? 'text-sm sm:text-base' : 'text-base sm:text-lg'} font-bold text-slate-900 tracking-tight leading-tight mt-0.5`}>
              {materialsItem.percentage}%
            </div>
          </div>
        </div>

        {/* Row 2, Col 1: Subcontractors */}
        <div
          id="legend-item-subcontractors"
          className={`flex items-start ${compact ? 'gap-2' : 'gap-2.5'} transition-transform hover:translate-x-0.5 cursor-default`}
          onMouseEnter={() => {
            const idx = chartData.findIndex((i) => i.id === 'subcontractors');
            setHoveredIndex(idx >= 0 ? idx : null);
          }}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <span
            className={`${compact ? 'w-2.5 h-2.5 mt-0.5' : 'w-3 h-3 mt-1'} rounded-full shrink-0 shadow-2xs`}
            style={{ backgroundColor: subcontractorsItem.color }}
          />
          <div>
            <div className={`${compact ? 'text-[11px] sm:text-xs' : 'text-xs sm:text-sm'} text-slate-600 font-normal leading-tight`}>
              {subcontractorsItem.name}
            </div>
            <div className={`${compact ? 'text-sm sm:text-base' : 'text-base sm:text-lg'} font-bold text-slate-900 tracking-tight leading-tight mt-0.5`}>
              {subcontractorsItem.percentage}%
            </div>
          </div>
        </div>

        {/* Row 2, Col 2: Site Expenses */}
        <div
          id="legend-item-site-expenses"
          className={`flex items-start ${compact ? 'gap-2' : 'gap-2.5'} transition-transform hover:translate-x-0.5 cursor-default`}
          onMouseEnter={() => {
            const idx = chartData.findIndex((i) => i.id === 'site_expenses');
            setHoveredIndex(idx >= 0 ? idx : null);
          }}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <span
            className={`${compact ? 'w-2.5 h-2.5 mt-0.5' : 'w-3 h-3 mt-1'} rounded-full shrink-0 shadow-2xs`}
            style={{ backgroundColor: siteExpensesItem.color }}
          />
          <div>
            <div className={`${compact ? 'text-[11px] sm:text-xs' : 'text-xs sm:text-sm'} text-slate-600 font-normal leading-tight`}>
              {siteExpensesItem.name}
            </div>
            <div className={`${compact ? 'text-sm sm:text-base' : 'text-base sm:text-lg'} font-bold text-slate-900 tracking-tight leading-tight mt-0.5`}>
              {siteExpensesItem.percentage}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
