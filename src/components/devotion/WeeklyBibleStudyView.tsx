import React, { useState, useEffect } from 'react';
import { 
  BarChart2, BookOpen, Clock, Plus, Check, Star, 
  Trash2, ChevronRight, ChevronDown, ChevronUp, Sparkles, Filter, Edit2, Lightbulb,
  FileText, TrendingUp, Layers
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { BIBLE_STUDY_AREAS, BibleStudyArea, BibleStudySession } from '../../data/bibleData';
import { soundEngine } from '../../utils/audio';

interface WeeklyBibleStudyViewProps {
  language: string;
  onLogDevotionSession: (durationMinutes: number, title: string, notes?: string) => void;
}

export const WeeklyBibleStudyView: React.FC<WeeklyBibleStudyViewProps> = ({
  language,
  onLogDevotionSession
}) => {
  // Weekly Target Study Metric (hours per week)
  const [weeklyTargetHours, setWeeklyTargetHours] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('livotion_bible_study_target_hours_v1');
      return saved ? Number(saved) : 3.0;
    } catch (e) {
      return 3.0;
    }
  });

  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [tempTargetHours, setTempTargetHours] = useState<number>(weeklyTargetHours);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('neva_collapse_devotion_weekly_study') === 'true';
    } catch {
      return false;
    }
  });

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('neva_collapse_devotion_weekly_study', String(next));
        soundEngine.playPencil();
      } catch {}
      return next;
    });
  };

  useEffect(() => {
    try {
      localStorage.setItem('livotion_bible_study_target_hours_v1', String(weeklyTargetHours));
    } catch (e) {}
  }, [weeklyTargetHours]);

  // Form state for logging a study session
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [selectedAreaId, setSelectedAreaId] = useState<string>('theology');
  const [studyTopic, setStudyTopic] = useState<string>('');
  const [studyPassage, setStudyPassage] = useState<string>('');
  const [studyDurationMin, setStudyDurationMin] = useState<number>(45);
  const [keyInsights, setKeyInsights] = useState<string>('');
  const [lifeApplication, setLifeApplication] = useState<string>('');
  const [selectedFilterArea, setSelectedFilterArea] = useState<string>('all');

  // Study Sessions List stored in localStorage
  const [studySessions, setStudySessions] = useState<BibleStudySession[]>(() => {
    try {
      const saved = localStorage.getItem('livotion_bible_study_sessions_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      {
        id: 'study-1',
        date: new Date().toISOString().split('T')[0],
        areaId: 'epistles',
        areaName: 'Epistles & Practical Walk',
        topic: 'Justification by Faith & No Condemnation',
        passage: 'Romans 8:1-17',
        durationMinutes: 60,
        keyInsights: 'There is now no condemnation for those who are in Christ Jesus. Life in the Spirit frees from the law of sin and death.',
        application: 'Walk with confidence in grace rather than performance anxiety.',
        completedAt: '09:15 AM'
      },
      {
        id: 'study-2',
        date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
        areaId: 'gospels',
        areaName: 'The Gospels & Life of Christ',
        topic: 'The Sermon on the Mount & Kingdom Beatitudes',
        passage: 'Matthew 5:1-16',
        durationMinutes: 45,
        keyInsights: 'Blessed are the poor in spirit. We are called to be the salt of the earth and the light of the world.',
        application: 'Practice humility and let good works glorify the Father.',
        completedAt: '07:30 AM'
      }
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem('livotion_bible_study_sessions_v1', JSON.stringify(studySessions));
    } catch (e) {}
  }, [studySessions]);

  // Weekly calculations
  const totalWeeklyMinutes = studySessions.reduce((acc, s) => acc + s.durationMinutes, 0);
  const totalWeeklyHours = Number((totalWeeklyMinutes / 60).toFixed(1));
  const progressPercent = Math.min(100, Math.round((totalWeeklyHours / (weeklyTargetHours || 1)) * 100));
  const remainingMinutes = Math.max(0, Math.round(weeklyTargetHours * 60 - totalWeeklyMinutes));
  const remainingFormatted = `${(remainingMinutes / 60).toFixed(1)}h`;

  const handleSaveStudySession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studyTopic.trim() && !studyPassage.trim()) return;

    const area = BIBLE_STUDY_AREAS.find((a) => a.id === selectedAreaId) || BIBLE_STUDY_AREAS[0];
    const newSession: BibleStudySession = {
      id: `study-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      areaId: area.id,
      areaName: area.nameEn,
      topic: studyTopic.trim() || `${area.nameEn} Study`,
      passage: studyPassage.trim() || 'Scripture Passage',
      durationMinutes: Number(studyDurationMin) || 45,
      keyInsights: keyInsights.trim() || 'Insightful scripture study completed.',
      application: lifeApplication.trim() || undefined,
      completedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setStudySessions([newSession, ...studySessions]);
    onLogDevotionSession(
      newSession.durationMinutes,
      `Bible Study: ${newSession.topic} (${newSession.passage})`,
      `${newSession.areaName}\nKey Insights: ${newSession.keyInsights}`
    );

    setIsLogModalOpen(false);
    setStudyTopic('');
    setStudyPassage('');
    setKeyInsights('');
    setLifeApplication('');

    try {
      soundEngine.playSound('CHIME_MEDITATION');
      confetti({ particleCount: 65, spread: 75, origin: { y: 0.6 } });
    } catch (e) {}
  };

  const handleDeleteSession = (id: string) => {
    if (confirm(language === 'am' ? 'ይህንን የጥናት ውጤት ማጥፋት ይፈልጋሉ?' : 'Delete this study result?')) {
      setStudySessions((prev) => prev.filter((s) => s.id !== id));
    }
  };

  const handleSaveTarget = () => {
    const val = Math.max(0.5, Math.min(20, Number(tempTargetHours)));
    setWeeklyTargetHours(val);
    setIsEditingTarget(false);
    try { soundEngine.playPencil(); } catch (e) {}
  };

  const filteredSessions = studySessions.filter((s) => {
    if (selectedFilterArea === 'all') return true;
    return s.areaId === selectedFilterArea;
  });

  return (
    <div className="w-full space-y-6">
      {/* Top Header & Weekly Target Metric Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/10 dark:bg-purple-500/20 text-[#a855f7] flex items-center justify-center font-bold shadow-xs">
            <BarChart2 size={20} />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <span>{language === 'am' ? 'ሳምንታዊ የመጽሐፍ ቅዱስ ጥናትና ውጤት' : 'Weekly Bible Study Result Metrics'}</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {language === 'am' 
                ? 'የሳምንቱን የጥናት ሰዓት ግብ ማስቀመጥ፣ የጥናት ዘርፍ መምረጥና መንፈሳዊ ውጤቶችን መመዝገብ' 
                : 'Set your weekly study target hours, select key biblical study areas, and log doctrinal insights.'}
            </p>
          </div>
        </div>

        {/* Action Button: Log Study Session & Section Collapse Icon */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            onClick={() => setIsLogModalOpen(true)}
            className="px-4 py-2 bg-[#a855f7] hover:bg-purple-600 text-white rounded-2xl text-xs font-bold transition cursor-pointer active:scale-95 shadow-xs flex items-center gap-1.5"
          >
            <Plus size={15} strokeWidth={2.5} />
            <span>{language === 'am' ? 'የጥናት ውጤት መዝግብ' : 'Log Study Result'}</span>
          </button>

          <button
            type="button"
            onClick={toggleCollapse}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
            title={isCollapsed ? (language === 'am' ? 'ዘርጋ' : 'Expand Section') : (language === 'am' ? 'ሰብስብ' : 'Collapse Section')}
          >
            {isCollapsed ? <ChevronDown size={17} /> : <ChevronUp size={17} />}
          </button>
        </div>
      </div>

      {/* Collapsed State or Full Study Content */}
      {isCollapsed ? (
        <div 
          onClick={toggleCollapse}
          className="p-3.5 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-dashed border-purple-200 dark:border-purple-800/60 text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center justify-between cursor-pointer hover:border-purple-400 hover:text-purple-600 transition group"
        >
          <div className="flex items-center gap-2 truncate">
            <span className="text-base">📊</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {totalWeeklyHours}h / {weeklyTargetHours}h {language === 'am' ? 'ሳምንታዊ ጥናት' : 'Weekly Study Target'}
            </span>
            <span className="truncate opacity-75">
              • {studySessions.length} {language === 'am' ? 'የተመዘገቡ ጥናቶች' : 'logged sessions'}
            </span>
          </div>
          <span className="shrink-0 text-purple-600 dark:text-purple-400 font-bold flex items-center gap-1 group-hover:underline">
            <span>{language === 'am' ? 'ዘርጋ' : 'Expand Study'}</span>
            <ChevronDown size={14} />
          </span>
        </div>
      ) : (
        <>
          {/* Feature Metric Card: Weekly Target Gauge & Study Areas Distribution */}
      <div className="bg-white dark:bg-[#121927] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          {/* Target Hours Indicator */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                {language === 'am' ? 'ሳምንታዊ የጥናት ግብ' : 'WEEKLY STUDY METRIC TARGET'}
              </span>
              {!isEditingTarget ? (
                <button
                  onClick={() => {
                    setTempTargetHours(weeklyTargetHours);
                    setIsEditingTarget(true);
                  }}
                  className="text-slate-400 hover:text-[#a855f7] transition cursor-pointer p-0.5"
                  title="Edit weekly target"
                >
                  <Edit2 size={12} />
                </button>
              ) : null}
            </div>

            {isEditingTarget ? (
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="20"
                  value={tempTargetHours}
                  onChange={(e) => setTempTargetHours(Number(e.target.value))}
                  className="w-20 px-2 py-1 text-sm font-bold bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-center"
                />
                <span className="text-xs font-bold text-slate-500">hours / week</span>
                <button
                  onClick={handleSaveTarget}
                  className="px-2.5 py-1 bg-emerald-600 text-white text-xs font-bold rounded-lg cursor-pointer"
                >
                  Save
                </button>
                <button
                  onClick={() => setIsEditingTarget(false)}
                  className="px-2 py-1 text-xs text-slate-500 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-slate-900 dark:text-white">
                  {totalWeeklyHours}
                </span>
                <span className="text-base sm:text-lg font-bold text-slate-400 font-mono">
                  / {weeklyTargetHours.toFixed(1)}h
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 font-mono ml-1">
                  {progressPercent}%
                </span>
              </div>
            )}
          </div>

          {/* Remaining / Pace Indicator */}
          <div className="flex items-center gap-3 bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-900/60 px-4 py-2.5 rounded-2xl">
            <Clock size={16} className="text-[#a855f7]" />
            <div>
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {language === 'am' ? 'ቀሪ ሰዓት በዚህ ሳምንት' : 'Remaining This Week'}
              </p>
              <p className="text-xs font-black text-slate-800 dark:text-slate-200">
                {remainingMinutes === 0 
                  ? (language === 'am' ? 'የሳምንቱ ግብ ተሳክቷል! 🎉' : 'Target Achieved! 🎉') 
                  : `${remainingFormatted} left to target`}
              </p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-[#a855f7] transition-all duration-500 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* 8 Core Bible Study Areas Pills */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Layers size={13} className="text-[#a855f7]" />
              <span>{language === 'am' ? 'የመጽሐፍ ቅዱስ የጥናት መስኮች' : 'Biblical Study Areas'}</span>
            </span>
            <span className="text-[10px] text-slate-400">
              {language === 'am' ? 'ለመመደብ ወይም ለማጣራት ይጫኑ' : 'Tap any area to filter study logs'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {BIBLE_STUDY_AREAS.map((area) => {
              const isSelected = selectedFilterArea === area.id;
              const areaSessions = studySessions.filter((s) => s.areaId === area.id);
              const areaMinutes = areaSessions.reduce((acc, s) => acc + s.durationMinutes, 0);

              return (
                <button
                  key={area.id}
                  onClick={() => setSelectedFilterArea(isSelected ? 'all' : area.id)}
                  className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-2 select-none ${
                    isSelected
                      ? 'bg-purple-50 dark:bg-purple-950/50 border-[#a855f7] shadow-xs'
                      : 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-800 hover:border-purple-300'
                  }`}
                >
                  <span className="text-base shrink-0">{area.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-black truncate text-slate-800 dark:text-slate-200">
                      {language === 'am' ? area.nameAm : area.nameEn}
                    </p>
                    <p className="text-[9px] font-mono font-bold text-purple-600 dark:text-purple-400">
                      {areaMinutes} min ({areaSessions.length})
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Logged Bible Study Results Section */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-[#a855f7]" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {language === 'am' ? 'የተመዘገቡ የጥናት ውጤቶችና ማጠቃለያዎች' : 'Logged Study Results & Insights'}
            </h3>
          </div>
          {selectedFilterArea !== 'all' && (
            <button
              onClick={() => setSelectedFilterArea('all')}
              className="text-xs text-[#a855f7] hover:underline font-bold"
            >
              Show all ({studySessions.length})
            </button>
          )}
        </div>

        {filteredSessions.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-[#121927] border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl space-y-3">
            <span className="text-3xl">📖</span>
            <p className="text-xs font-semibold text-slate-500 max-w-sm mx-auto">
              {language === 'am' 
                ? 'ምንም የተመዘገበ የጥናት ውጤት የለም። አዲስ የጥናት ክፍለ-ጊዜ ለመመዝገብ «የጥናት ውጤት መዝግብ» የሚለውን ይጫኑ።' 
                : 'No study sessions logged for this area yet. Tap "Log Study Result" above to record your biblical study!'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredSessions.map((session) => {
              const area = BIBLE_STUDY_AREAS.find((a) => a.id === session.areaId) || BIBLE_STUDY_AREAS[0];

              return (
                <div
                  key={session.id}
                  className="p-5 rounded-3xl bg-white dark:bg-[#121927] border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-2xs group/card relative"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-purple-50 dark:bg-purple-950/70 text-[#a855f7] border border-purple-200/80 dark:border-purple-800 flex items-center gap-1">
                          <span>{area.icon}</span>
                          <span>{language === 'am' ? area.nameAm : area.nameEn}</span>
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-400">
                          • {session.passage}
                        </span>
                      </div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white">
                        {session.topic}
                      </h4>
                    </div>

                    <span className="text-xs font-mono font-black px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
                      {session.durationMinutes} min
                    </span>
                  </div>

                  {/* Key Insights Box */}
                  <div className="p-3 rounded-2xl bg-purple-50/40 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40 space-y-1">
                    <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
                      <Lightbulb size={12} />
                      <span>{language === 'am' ? 'የተገለጠው መንፈሳዊ እውነት' : 'Key Insight / Doctrinal Takeaway'}</span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-serif">
                      "{session.keyInsights}"
                    </p>
                  </div>

                  {/* Life Application */}
                  {session.application && (
                    <div className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-1.5">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                        {language === 'am' ? 'ተግባራዊ ኑሮ:' : 'Life Application:'}
                      </span>
                      <span>{session.application}</span>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/60 text-[10px] text-slate-400">
                    <span>{session.date} • {session.completedAt}</span>
                    <button
                      onClick={() => handleDeleteSession(session.id)}
                      className="opacity-0 group-hover/card:opacity-100 hover:text-rose-500 transition cursor-pointer p-1"
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      </>
      )}

      {/* Log Study Session Modal */}
      {isLogModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveStudySession}
            className="w-full max-w-lg bg-white dark:bg-[#121927] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <BookOpen size={18} className="text-[#a855f7]" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {language === 'am' ? 'አዲስ የመጽሐፍ ቅዱስ ጥናት መዝግብ' : 'Log Bible Study Session'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsLogModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Study Area Dropdown */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {language === 'am' ? 'የጥናት መስክ' : 'Area of Bible Study'}
              </label>
              <select
                value={selectedAreaId}
                onChange={(e) => setSelectedAreaId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-2.5 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#a855f7] cursor-pointer"
              >
                {BIBLE_STUDY_AREAS.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.icon} {a.nameEn} ({a.nameAm})
                  </option>
                ))}
              </select>
            </div>

            {/* Topic & Passage */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {language === 'am' ? 'የጥናቱ ርዕስ' : 'Study Topic / Focus'}
                </label>
                <input
                  type="text"
                  required
                  value={studyTopic}
                  onChange={(e) => setStudyTopic(e.target.value)}
                  placeholder="e.g. Justification & Grace"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#a855f7]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {language === 'am' ? 'የቅዱስ ቃል ክፍል' : 'Scripture Passage'}
                </label>
                <input
                  type="text"
                  required
                  value={studyPassage}
                  onChange={(e) => setStudyPassage(e.target.value)}
                  placeholder="e.g. Romans 8:1-17"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#a855f7]"
                />
              </div>
            </div>

            {/* Duration */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {language === 'am' ? 'የፈጀው ጊዜ (ደቂቃዎች)' : 'Study Duration (Minutes)'}
              </label>
              <div className="flex items-center gap-2">
                {[30, 45, 60, 90].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setStudyDurationMin(mins)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition ${
                      studyDurationMin === mins
                        ? 'bg-[#a855f7] text-white shadow-2xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
                <input
                  type="number"
                  min="5"
                  max="300"
                  value={studyDurationMin}
                  onChange={(e) => setStudyDurationMin(Number(e.target.value))}
                  className="w-20 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-center"
                />
              </div>
            </div>

            {/* Key Insights */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {language === 'am' ? 'የተገለጠው መንፈሳዊ እውነት / ውጤት' : 'Key Result / Doctrinal Insight'}
              </label>
              <textarea
                rows={3}
                required
                value={keyInsights}
                onChange={(e) => setKeyInsights(e.target.value)}
                placeholder="What revelation, doctrinal truth, or deep principle did you discover from this study?"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#a855f7]"
              />
            </div>

            {/* Personal Life Application */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {language === 'am' ? 'ተግባራዊ አኗኗር' : 'Personal Life Application'}
              </label>
              <input
                type="text"
                value={lifeApplication}
                onChange={(e) => setLifeApplication(e.target.value)}
                placeholder="How will you live this out in your daily walk?"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#a855f7]"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsLogModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                {language === 'am' ? 'ተው' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#a855f7] hover:bg-purple-600 text-white rounded-xl text-xs font-bold cursor-pointer transition shadow-xs"
              >
                {language === 'am' ? 'አስቀምጥና መዝግብ' : 'Save & Log Study'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
