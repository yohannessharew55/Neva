import React, { useState, useEffect } from 'react';
import { 
  X, Plus, Trash2, ArrowUpRight, Check, 
  StickyNote, FileText, Sparkles 
} from 'lucide-react';
import { useLivotion } from '../context/LivotionContext';

interface ScratchItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
}

interface QuickScratchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenNotesApp?: () => void;
}

export const QuickScratchModal: React.FC<QuickScratchModalProps> = ({
  isOpen,
  onClose,
  onOpenNotesApp
}) => {
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

  // Reload items whenever modal opens in case updated elsewhere
  useEffect(() => {
    if (isOpen) {
      try {
        const saved = localStorage.getItem('livotion_quick_scratchpad_v1');
        if (saved) setItems(JSON.parse(saved));
      } catch (e) {}
    }
  }, [isOpen]);

  // Persist items
  useEffect(() => {
    try {
      localStorage.setItem('livotion_quick_scratchpad_v1', JSON.stringify(items));
    } catch (e) {}
  }, [items]);

  if (!isOpen) return null;

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
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center sm:items-center p-3 sm:p-4 bg-slate-950/50 backdrop-blur-sm animate-fadeIn select-none pt-16 sm:pt-4"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-lg bg-white dark:bg-[#121927] border border-amber-200/80 dark:border-amber-900/60 rounded-3xl shadow-2xl overflow-hidden animate-slideUp sm:animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-amber-100 dark:border-slate-800 bg-amber-50/50 dark:bg-amber-950/20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-2xs">
              <StickyNote size={18} className="fill-amber-400/30 text-amber-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-amber-600 dark:text-amber-400">
                  {language === 'am' ? 'ፈጣን ማስታወሻ' : 'QUICK SCRATCHPAD'}
                </span>
                {pendingCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-amber-200 dark:bg-amber-900/80 text-amber-800 dark:text-amber-200">
                    {pendingCount} {language === 'am' ? 'ቀሪ' : 'active'}
                  </span>
                )}
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                {language === 'am' ? 'ድንገተኛ ሀሳቦችና ረቂቆች' : 'Instant Brain Dump & Scratch'}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {onOpenNotesApp && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenNotesApp();
                }}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-amber-700 dark:text-amber-300 bg-white dark:bg-slate-900 hover:bg-amber-100 dark:hover:bg-amber-950/50 border border-amber-200 dark:border-amber-900 transition flex items-center gap-1 cursor-pointer shadow-2xs"
                title="Open full Notes App"
              >
                <FileText size={13} />
                <span className="hidden sm:inline">{language === 'am' ? 'ሙሉ ማስታወሻ' : 'Notes App'}</span>
                <ArrowUpRight size={12} />
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Form and items list */}
        <div className="p-4 sm:p-5 space-y-4 max-h-[70vh] flex flex-col">
          {/* Rapid Add Form */}
          <form onSubmit={handleAddItem} className="flex items-center gap-2 shrink-0">
            <input
              type="text"
              autoFocus
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={language === 'am' ? 'ፈጣን ሀሳብ ፅፈው Enter ይጫኑ...' : 'Type instant thought, reminder, phone #... (Press Enter)'}
              className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-amber-200/80 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-amber-500 transition font-medium"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white rounded-2xl transition shadow-2xs active:scale-95 cursor-pointer disabled:cursor-not-allowed shrink-0"
              title="Add scratch item"
            >
              <Plus size={16} />
            </button>
          </form>

          {/* List of scratch items */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[160px] max-h-[320px]">
            {items.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400 space-y-1">
                <StickyNote size={24} className="mx-auto text-amber-400/60 stroke-[1.5]" />
                <p>{language === 'am' ? 'ምንም ረቂቅ የለም።' : 'Scratchpad is empty.'}</p>
                <p className="text-[11px] text-slate-400">{language === 'am' ? 'ከላይ አዲስ ሀሳብ ይፃፉ።' : 'Capture any idea above without scheduling.'}</p>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className={`group p-3 rounded-2xl border transition flex items-center justify-between gap-3 ${
                    item.completed
                      ? 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-100 dark:border-slate-800/60 opacity-60'
                      : 'bg-white dark:bg-[#141b29] border-slate-200/70 dark:border-slate-800 hover:border-amber-400/50 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
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
                      className={`text-xs sm:text-sm font-medium leading-relaxed truncate select-text ${
                        item.completed
                          ? 'line-through text-slate-400 dark:text-slate-500'
                          : 'text-slate-800 dark:text-slate-100'
                      }`}
                    >
                      {item.text}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100">
                    {!item.completed && (
                      <button
                        type="button"
                        onClick={() => promoteToTask(item)}
                        className="p-1.5 text-slate-400 hover:text-[#0082ff] rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/60 transition"
                        title={language === 'am' ? 'ወደ ዛሬ እቅድ ቀይር' : 'Convert to Today Schedule Task'}
                      >
                        <ArrowUpRight size={14} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => deleteItem(item.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/60 transition"
                      title={language === 'am' ? 'ሰርዝ' : 'Delete'}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer note */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>{items.length} {language === 'am' ? 'ጠቅላላ ማስታወሻዎች' : 'total items'}</span>
            <span className="font-mono text-[10px]">{language === 'am' ? 'በአካባቢው ተቀምጧል' : 'Instant local auto-save'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
