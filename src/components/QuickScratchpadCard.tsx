import React, { useState, useEffect } from 'react';
import { 
  SquarePen, Plus, Trash2, ArrowUpRight, 
  Check, ChevronDown, ChevronUp, FileText, Sparkles 
} from 'lucide-react';
import { useLivotion } from '../context/LivotionContext';

interface ScratchItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
}

interface QuickScratchpadCardProps {
  onOpenAppleNotes?: () => void;
}

export const QuickScratchpadCard: React.FC<QuickScratchpadCardProps> = ({ onOpenAppleNotes }) => {
  const { addTask, language } = useLivotion();
  const [items, setItems] = useState<ScratchItem[]>(() => {
    try {
      const saved = localStorage.getItem('livotion_quick_scratchpad_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      { id: 'sc-1', text: 'Quick thought: Review guitar progression before evening practice', completed: false, createdAt: new Date().toISOString() },
      { id: 'sc-2', text: 'Call contractor for site update', completed: true, createdAt: new Date().toISOString() }
    ];
  });

  const [inputText, setInputText] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    try {
      localStorage.setItem('livotion_quick_scratchpad_v1', JSON.stringify(items));
    } catch (e) {}
  }, [items]);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newItem: ScratchItem = {
      id: `sc-${Date.now()}`,
      text: inputText.trim(),
      completed: false,
      createdAt: new Date().toISOString()
    };

    setItems((prev) => [newItem, ...prev]);
    setInputText('');
  };

  const toggleItem = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item))
    );
  };

  const deleteItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const promoteToTask = (item: ScratchItem) => {
    addTask({
      title: item.text,
      domain: 'OPEN_MULTIPURPOSE',
      startTime: '12:00 PM',
      durationMin: 30,
      completed: false,
      color: '#0082ff',
      badge: 'QUICK'
    });
    deleteItem(item.id);
  };

  const pendingCount = items.filter((i) => !i.completed).length;

  return (
    <div className="w-full bg-white dark:bg-[#121927] border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xs overflow-hidden transition-all">
      {/* Header Bar */}
      <div className="p-3.5 sm:p-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#151c2c]/50">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xs font-bold shadow-2xs">
            <SquarePen size={14} />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>{language === 'am' ? 'ፈጣን ማስታወሻና ረቂቅ' : 'Quick Scratchpad & Brain Dump'}</span>
              {pendingCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300">
                  {pendingCount}
                </span>
              )}
            </h3>
            <p className="text-[10px] text-slate-400">
              {language === 'am' ? 'ድንገተኛ ሀሳቦችን በቅጽበት ይፃፉ' : 'Drop instant thoughts • zero formal scheduling'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {onOpenAppleNotes && (
            <button
              onClick={onOpenAppleNotes}
              className="px-2.5 py-1 rounded-xl text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 border border-amber-200/80 dark:border-amber-900/60 transition flex items-center gap-1 cursor-pointer"
              title="Open full Apple Notes app"
            >
              <FileText size={12} />
              <span className="hidden sm:inline">{language === 'am' ? 'ሙሉ ማስታወሻ' : 'Notes App'}</span>
              <ArrowUpRight size={11} />
            </button>
          )}

          <button
            onClick={() => setIsExpanded((prev) => !prev)}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-3.5 sm:p-4 space-y-3">
          {/* Quick Input Form */}
          <form onSubmit={handleAddItem} className="flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={language === 'am' ? 'ፈጣን ሀሳብ ፅፈው Enter ይጫኑ...' : 'Capture instant thought or note... (Press Enter)'}
              className="flex-1 px-3.5 py-2 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-amber-500 transition font-medium"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white rounded-2xl transition shadow-2xs active:scale-95 cursor-pointer disabled:cursor-not-allowed"
              title="Add Note"
            >
              <Plus size={16} />
            </button>
          </form>

          {/* List of scratch items */}
          {items.length === 0 ? (
            <div className="py-4 text-center text-xs text-slate-400 italic">
              {language === 'am' ? 'ምንም ረቂቅ የለም። አዲስ ሀሳብ ይፃፉ።' : 'Scratchpad is clear. Drop any rapid thoughts above.'}
            </div>
          ) : (
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={`group p-2.5 rounded-2xl border transition flex items-center justify-between gap-2.5 ${
                    item.completed
                      ? 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-100 dark:border-slate-800/60 opacity-60'
                      : 'bg-white dark:bg-[#141b29] border-slate-200/70 dark:border-slate-800 hover:border-amber-400/50 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => toggleItem(item.id)}
                      className={`w-5 h-5 rounded-lg border flex items-center justify-center transition shrink-0 cursor-pointer ${
                        item.completed
                          ? 'bg-amber-500 border-amber-500 text-white'
                          : 'border-slate-300 dark:border-slate-700 hover:border-amber-500'
                      }`}
                    >
                      {item.completed && <Check size={12} strokeWidth={3} />}
                    </button>
                    <span
                      className={`text-xs font-medium leading-relaxed truncate select-text ${
                        item.completed
                          ? 'line-through text-slate-400 dark:text-slate-500'
                          : 'text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {item.text}
                    </span>
                  </div>

                  {/* Actions on hover/touch */}
                  <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100">
                    {!item.completed && (
                      <button
                        type="button"
                        onClick={() => promoteToTask(item)}
                        className="p-1 text-slate-400 hover:text-[#0082ff] rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/60 transition"
                        title={language === 'am' ? 'ወደ ዛሬ እቅድ ቀይር' : 'Convert to Today Schedule Task'}
                      >
                        <ArrowUpRight size={13} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => deleteItem(item.id)}
                      className="p-1 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/60 transition"
                      title={language === 'am' ? 'ሰርዝ' : 'Delete'}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
