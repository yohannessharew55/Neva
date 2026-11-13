import React, { useState } from 'react';
import { 
  History, Calendar, Award, AlertCircle, 
  Sparkles, CheckCircle2, ChevronRight, Plus, 
  BarChart3, RefreshCw 
} from 'lucide-react';
import { useLivotion } from '../context/LivotionContext';
import { HorizonLevel } from '../types';

export const RetrospectivesView: React.FC = () => {
  const { reviews, addReview, domains } = useLivotion();
  const [showNewModal, setShowNewModal] = useState(false);

  // Form
  const [horizon, setHorizon] = useState<HorizonLevel>('WEEKLY');
  const [wins, setWins] = useState('');
  const [frictions, setFrictions] = useState('');
  const [adjustments, setAdjustments] = useState('');

  // Auto-calculated stats from current domain hours
  const totalHoursLogged = Number(domains.reduce((acc, d) => acc + d.currentHours, 0).toFixed(1));
  const hoursPerDomain = domains.reduce((acc, d) => {
    acc[d.domainType] = d.currentHours;
    return acc;
  }, {} as Record<string, number>);

  const handleCreateReview = (e: React.FormEvent) => {
    e.preventDefault();
    const today = new Date().toISOString().split('T')[0];

    addReview({
      horizonReviewed: horizon,
      periodStart: today,
      periodEnd: today,
      totalHoursLogged,
      hoursPerDomain,
      adherenceRates: {
        'Workouts': '6/6 (100%)',
        'Devotion': '7/7 (100%)',
        'Nutrition Targets': '6/7 (86%)',
        'Site Audits': '2/2 (100%)',
      },
      winsSummary: wins || 'Strong cognitive focus and consistent physical conditioning.',
      frictionPoints: frictions || 'Minor schedule slippage during transition buffers.',
      adjustmentsForNextCycle: adjustments || 'Pre-stage workout gear and enforce strict 11:30 AM buffer.',
    });

    setWins('');
    setFrictions('');
    setAdjustments('');
    setShowNewModal(false);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 text-zinc-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-50 flex items-center gap-2">
            <History className="text-purple-400" /> Weekly & Monthly Feedback Retrospectives
          </h2>
          <p className="text-zinc-400 text-sm mt-0.5">
            Systematic retrospective feedback loops to eliminate friction, audit domain adherence, and recalibrate tactical execution.
          </p>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
        >
          <Plus size={14} /> New Retrospective
        </button>
      </div>

      {/* Review Cards */}
      {reviews.length === 0 ? (
        <div className="py-12 text-center border-2 border-dashed border-zinc-800 rounded-2xl p-6 text-zinc-400">
          <History className="mx-auto mb-2 opacity-50 text-purple-400" size={28} />
          <p className="text-xs font-semibold">No retrospective reviews logged yet.</p>
          <button
            type="button"
            onClick={() => setShowNewModal(true)}
            className="mt-2 text-xs font-bold text-purple-400 hover:underline cursor-pointer"
          >
            + Log your first retrospective
          </button>
        </div>
      ) : (
        <div className="space-y-6">
        {reviews.map((rev) => (
          <div
            key={rev.id}
            className="p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-5 shadow-xl"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 rounded text-xs font-mono uppercase font-bold bg-purple-950 border border-purple-800 text-purple-300">
                  {rev.horizonReviewed} Review
                </span>
                <span className="text-xs text-zinc-400 font-mono flex items-center gap-1">
                  <Calendar size={12} /> {rev.periodStart} to {rev.periodEnd}
                </span>
              </div>
              <div className="text-xs font-mono text-zinc-300 bg-zinc-950 border border-zinc-800 px-3 py-1.5 rounded-lg">
                Total Deliberate Focus Logged: <strong className="text-purple-400">{rev.totalHoursLogged} hrs</strong>
              </div>
            </div>

            {/* Adherence Rates */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Object.entries(rev.adherenceRates).map(([k, v]) => (
                <div key={k} className="p-3 bg-zinc-950/70 border border-zinc-800/80 rounded-xl">
                  <span className="text-[11px] text-zinc-400 block">{k}</span>
                  <span className="text-sm font-mono font-bold text-emerald-400">{v}</span>
                </div>
              ))}
            </div>

            {/* 3 Pillars of Retro */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {/* Wins */}
              <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-900/40 space-y-1.5">
                <span className="font-bold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                  <Sparkles size={14} /> Wins & Breakthroughs
                </span>
                <p className="text-zinc-300 leading-relaxed">{rev.winsSummary}</p>
              </div>

              {/* Frictions */}
              <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-900/40 space-y-1.5">
                <span className="font-bold text-amber-400 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                  <AlertCircle size={14} /> Friction Points
                </span>
                <p className="text-zinc-300 leading-relaxed">{rev.frictionPoints}</p>
              </div>

              {/* Next Cycle Adjustments */}
              <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-900/40 space-y-1.5">
                <span className="font-bold text-purple-400 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                  <RefreshCw size={14} /> Adjustments Next Cycle
                </span>
                <p className="text-zinc-300 leading-relaxed">{rev.adjustmentsForNextCycle}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      )}

      {/* New Review Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-xl rounded-2xl p-6 space-y-5 shadow-2xl">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
              <h3 className="text-lg font-bold text-zinc-100">Draft Retrospective Feedback</h3>
              <button onClick={() => setShowNewModal(false)} className="text-zinc-400 hover:text-zinc-200">✕</button>
            </div>

            <form onSubmit={handleCreateReview} className="space-y-4">
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Horizon Reviewed</label>
                <select
                  value={horizon}
                  onChange={(e) => setHorizon(e.target.value as HorizonLevel)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-100"
                >
                  <option value="WEEKLY">Weekly Cycle Retrospective</option>
                  <option value="MONTHLY">Monthly Cycle Retrospective</option>
                  <option value="QUARTERLY">Quarterly Strategic Review</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1">Wins & Breakthroughs</label>
                <textarea
                  rows={2}
                  required
                  value={wins}
                  onChange={(e) => setWins(e.target.value)}
                  placeholder="What went exceptionally well? Which technical masteries advanced?"
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-100"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1">Friction Points & Cognitive Drag</label>
                <textarea
                  rows={2}
                  required
                  value={frictions}
                  onChange={(e) => setFrictions(e.target.value)}
                  placeholder="Where did attention leak? Where were buffers violated?"
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-100"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1">Concrete Adjustments for Next Cycle</label>
                <textarea
                  rows={2}
                  required
                  value={adjustments}
                  onChange={(e) => setAdjustments(e.target.value)}
                  placeholder="Specific protocol shifts to implement in tomorrow’s cockpit..."
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-100"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold"
                >
                  Save Retrospective
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
