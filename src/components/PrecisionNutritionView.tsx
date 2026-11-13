import React, { useState } from 'react';
import { 
  Utensils, CheckCircle2, Square, Droplet, 
  Flame, Clock, Plus, Minus
} from 'lucide-react';
import { useLivotion } from '../context/LivotionContext';

export const PrecisionNutritionView: React.FC = () => {
  const { user, meals, toggleMealConsumed } = useLivotion();
  const [waterGlasses, setWaterGlasses] = useState<number>(5);

  const consumedCalories = meals
    .filter((m) => m.consumed)
    .reduce((acc, m) => acc + m.calories, 0);
  const consumedProtein = meals
    .filter((m) => m.consumed)
    .reduce((acc, m) => acc + m.proteinG, 0);

  const calPercent = Math.min(100, Math.round((consumedCalories / user.targetDailyCalories) * 100));
  const proPercent = Math.min(100, Math.round((consumedProtein / user.targetProteinGrams) * 100));

  return (
    <div className="w-full max-w-7xl xl:max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800/80 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Utensils className="text-emerald-500" /> Meals & Nutrition
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Track your meals and stay hydrated throughout the day.
          </p>
        </div>

        {/* Water Hydration Pill */}
        <div className="flex items-center gap-3 bg-white dark:bg-[#121927] border border-slate-200/80 dark:border-slate-800 p-2.5 rounded-2xl shadow-xs self-start sm:self-auto">
          <Droplet size={17} className="text-cyan-500 ml-1" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
            {waterGlasses} of 8 glasses
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setWaterGlasses((prev) => Math.max(0, prev - 1))}
              className="w-7 h-7 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold flex items-center justify-center cursor-pointer"
            >
              <Minus size={13} />
            </button>
            <button
              onClick={() => setWaterGlasses((prev) => prev + 1)}
              className="w-7 h-7 bg-cyan-50 hover:bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 rounded-lg text-xs font-bold flex items-center justify-center cursor-pointer"
            >
              <Plus size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Clean Macro Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Calories Card */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#121927] border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-xs">
          <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 font-semibold">
            <span className="flex items-center gap-1.5"><Flame size={14} className="text-amber-500" /> Daily Calories</span>
            <span>{calPercent}%</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{consumedCalories}</span>
            <span className="text-xs text-slate-400 font-medium">/ {user.targetDailyCalories} kcal</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div className="bg-amber-500 h-full transition-all duration-300" style={{ width: `${calPercent}%` }} />
          </div>
        </div>

        {/* Protein Card */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#121927] border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-xs">
          <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 font-semibold">
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">Protein Target</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">{proPercent}%</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">{consumedProtein}g</span>
            <span className="text-xs text-slate-400 font-medium">/ {user.targetProteinGrams}g</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full transition-all duration-300" style={{ width: `${proPercent}%` }} />
          </div>
        </div>
      </div>

      {/* Meals List */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
          Today's Meals
        </h3>

        {meals.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-[#121927] border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl space-y-2">
            <Utensils size={24} className="mx-auto text-emerald-500 opacity-60" />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              No meals scheduled for today yet.
            </p>
            <p className="text-xs text-slate-400">
              Log your meals and track daily macros from scratch.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {meals.map((meal) => (
            <div
              key={meal.id}
              onClick={() => toggleMealConsumed(meal.id)}
              className={`p-5 rounded-3xl border transition cursor-pointer select-none space-y-2.5 ${
                meal.consumed
                  ? 'bg-slate-50 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/60 text-slate-400'
                  : 'bg-white dark:bg-[#121927] border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {meal.consumed ? (
                    <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                  ) : (
                    <Square size={18} className="text-slate-400 shrink-0" />
                  )}
                  <span className="text-xs font-mono font-bold text-slate-400 flex items-center gap-1">
                    <Clock size={11} /> {meal.scheduledTime}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                    {meal.calories} kcal
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-300 font-bold">
                    {meal.proteinG}g P
                  </span>
                </div>
              </div>

              <div>
                <h4 className={`text-base font-bold ${meal.consumed ? 'line-through text-slate-400' : 'text-slate-900 dark:text-slate-100'}`}>
                  {meal.mealTitle.split('|')[1]?.trim() || meal.mealTitle}
                </h4>
                {meal.prepInstructions && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {meal.prepInstructions}
                  </p>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-1.5">
                {meal.ingredients.map((ing, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-600 dark:text-slate-300 font-medium"
                  >
                    {ing}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
        )}
      </div>
    </div>
  );
};
