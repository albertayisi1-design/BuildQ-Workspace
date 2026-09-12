import React from 'react';
import { Sparkles, CheckCircle2, ArrowRight, X, Play } from 'lucide-react';
import { useBuild } from '../../context/BuildContext';

interface DemoGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string, contextId?: string) => void;
  onQuickRunScenarioStep: (stepNumber: number) => void;
}

export const DemoGuideModal: React.FC<DemoGuideModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onQuickRunScenarioStep,
}) => {
  if (!isOpen) return null;

  const steps = [
    {
      step: 1,
      title: 'Create Project',
      desc: 'Create residential development (e.g. Riverside Modern Condominiums).',
      tab: 'projects',
      actionText: 'Go to Projects',
    },
    {
      step: 2,
      title: 'Set Dimensions & Budget',
      desc: '600 m² floor area, C$1,200,000 contract value, C$950,000 approved budget.',
      tab: 'projects',
      actionText: 'View Project',
    },
    {
      step: 3,
      title: 'Define WBS Activities',
      desc: 'Preliminaries, Foundation, Structure, Blockwork, Finishing hierarchy.',
      tab: 'wbs',
      actionText: 'Inspect WBS',
    },
    {
      step: 4,
      title: 'Record Actual Costs',
      desc: 'Post direct Labour, Materials, Subcontractors, and Equipment expenses.',
      tab: 'costs',
      actionText: 'Review Costs',
    },
    {
      step: 5,
      title: 'Submit Daily Site Report',
      desc: 'Record weather, worker headcount, materials delivered, and site photos.',
      tab: 'site_reports',
      actionText: 'Open Site Reports',
    },
    {
      step: 6,
      title: 'Track Project Progress',
      desc: 'Synchronize activity completions to advance project progress to 45%.',
      tab: 'wbs',
      actionText: 'Check Progress',
    },
    {
      step: 7,
      title: 'Inspect Project Dashboard',
      desc: 'Verify Budget vs Actual, Forecast Cost, Variance, and Profit Margin.',
      tab: 'projects',
      actionText: 'Open Project Overview',
    },
    {
      step: 8,
      title: 'Archive Projects Database',
      desc: '5 completed archive projects stored with C$/m² benchmarks and duration.',
      tab: 'historical',
      actionText: 'Archive Projects',
    },
    {
      step: 9,
      title: 'Run Project Intelligence',
      desc: 'Query benchmark engine for Residential, Apartment, Toronto, 600 m².',
      tab: 'intelligence',
      actionText: 'Open Intelligence',
    },
    {
      step: 10,
      title: 'Match Similar Projects',
      desc: 'Weighted similarity engine scores comparable builds (92%, 87%, 81%).',
      tab: 'intelligence',
      actionText: 'View Similarity',
    },
    {
      step: 11,
      title: 'Calculate Cost Benchmarks',
      desc: 'Derive Average (C$1,780/m²), Median (C$1,800/m²), and Min-Max Range.',
      tab: 'intelligence',
      actionText: 'View Benchmarks',
    },
    {
      step: 12,
      title: 'Generate Preliminary Estimate',
      desc: '600 m² × C$1,780/m² = C$1,068,000 with clear historical disclaimer.',
      tab: 'intelligence',
      actionText: 'Inspect Estimate',
    },
    {
      step: 13,
      title: 'Generate Intelligence Report',
      desc: 'Compile executive PDF/Print report with data insights and breakdown.',
      tab: 'reports',
      actionText: 'Open Reports',
    },
  ];

  return (
    <div
      id="demo-guide-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto"
    >
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-slate-800">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-slate-800 text-amber-400 border border-slate-700 shadow-xs">
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Civil Ops Demonstration Scenario
                <span className="text-xs font-mono font-normal px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  Section 34
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                13-step proof of concept workflow demonstrating operational data to business intelligence
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1 bg-white">
          <div className="p-3.5 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-950 text-xs leading-relaxed">
            <strong className="text-cyan-800 font-bold">Core Business Proposition:</strong> Capture construction project operational data, monitor active performance, archive completed histories, and synthesize empirical benchmarks to generate preliminary cost estimates for prospective builds.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-2">
            {steps.map((s) => (
              <div
                key={s.step}
                className="p-3 rounded-xl bg-slate-50 hover:bg-cyan-50/40 border border-slate-200 transition-all flex flex-col justify-between shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-mono font-bold text-cyan-800 bg-cyan-100/60 px-2 py-0.5 rounded border border-cyan-200">
                      Step {s.step}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium capitalize">
                      {s.tab.replace('_', ' ')}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mt-1 ">{s.title}</h4>
                  <p className="text-xs text-slate-600 mt-1 leading-snug">{s.desc}</p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-end">
                  <button
                    onClick={() => {
                      onNavigate(s.tab);
                      onQuickRunScenarioStep(s.step);
                      onClose();
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-700 hover:text-cyan-900 hover:underline cursor-pointer"
                  >
                    <span>{s.actionText}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <div>
            Data is pre-populated and fully interconnected in real time.
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all shadow-xs cursor-pointer border border-slate-950"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
