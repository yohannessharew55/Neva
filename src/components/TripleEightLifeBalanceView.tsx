import React, { useState, useMemo } from 'react';
import { 
  PieChart, Clock, Moon, Briefcase, Heart, 
  Palette, Music, Swords, Sparkles, Plus, 
  Trash2, Play, CheckCircle2, Sun, Zap, 
  ChevronRight, Calendar, ArrowLeft, SlidersHorizontal,
  Dumbbell, BookOpen, Coffee, Info
} from 'lucide-react';
import { useLivotion } from '../context/LivotionContext';
import { ScheduleTask, DomainType } from '../types';
import { gregorianToEthiopian, AMHARIC_DAYS } from '../utils/ethiopianCalendar';

// Triple 8 Pillars
export type TripleEightPillar = 'sleep' | 'career' | 'living';

export interface ActivitySlice {
  id: string;
  name: string;
  pillar: TripleEightPillar;
  hours: number;
  color: string;
  icon?: any;
  isCustom?: boolean;
}

export const TripleEightLifeBalanceView: React.FC = () => {
  const { 
    tasks, 
    addTask, 
    deleteTask, 
    setActiveTab, 
    setSelectedCategoryId,
    language,
    t
  } = useLivotion();

  // Selected Day Filter (defaults to today's day of week)
  const today = new Date();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayIndex = today.getDay();
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(todayIndex);

  // View mode: 'donut' | 'clock24' | 'pillars'
  const [chartMode, setChartMode] = useState<'donut' | 'clock24'>('donut');
  const [activeHoverSlice, setActiveHoverSlice] = useState<ActivitySlice | null>(null);

  // Sleep duration target (default 8.0 hrs)
  const [sleepTargetHours, setSleepTargetHours] = useState<number>(8.0);
  
  // Quick Add Activity Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newHours, setNewHours] = useState('2.0');
  const [newPillar, setNewPillar] = useState<TripleEightPillar>('living');
  const [newCategoryType, setNewCategoryType] = useState('chess');

  // Ethiopian Date string for today
  const ethDate = gregorianToEthiopian(today);
  const dayNameEn = dayNames[selectedDayIndex];
  const dayNameAm = AMHARIC_DAYS[selectedDayIndex]?.am || dayNameEn;

  // Domain to Pillar classification helper
  const classifyDomainToPillar = (domain: string, title: string): { pillar: TripleEightPillar; color: string; icon: any } => {
    const d = domain.toUpperCase();
    const tLower = title.toLowerCase();

    // Career Domains
    if (
      d.includes('ARCHITECTURE') || 
      d.includes('SITE') || 
      d.includes('TRADING') || 
      d.includes('FOREX') || 
      tLower.includes('work') || 
      tLower.includes('client') ||
      tLower.includes('code') ||
      tLower.includes('career')
    ) {
      if (d.includes('TRADING') || d.includes('FOREX')) {
        return { pillar: 'career', color: '#10b981', icon: Zap };
      }
      return { pillar: 'career', color: '#0082ff', icon: Briefcase };
    }

    // Hobbies & Living
    if (d.includes('CHESS') || tLower.includes('chess')) {
      return { pillar: 'living', color: '#8b5cf6', icon: Swords };
    }
    if (d.includes('GUITAR') || d.includes('MUSIC') || tLower.includes('music') || tLower.includes('guitar')) {
      return { pillar: 'living', color: '#ec4899', icon: Music };
    }
    if (d.includes('PAINTING') || d.includes('ART') || tLower.includes('art')) {
      return { pillar: 'living', color: '#f59e0b', icon: Palette };
    }
    if (d.includes('FITNESS') || d.includes('EXERCISE') || tLower.includes('gym') || tLower.includes('workout')) {
      return { pillar: 'living', color: '#ef4444', icon: Dumbbell };
    }
    if (d.includes('DEVOTION') || d.includes('PRAYER') || tLower.includes('prayer') || tLower.includes('scripture')) {
      return { pillar: 'living', color: '#06b6d4', icon: BookOpen };
    }

    // Default Living / Buffer
    return { pillar: 'living', color: '#3b82f6', icon: Sparkles };
  };

  // Compile All Slices for the 24-Hour Day
  const { slices, pillarTotals, balanceScore } = useMemo(() => {
    // 1. Fixed / Dedicated Sleep Slice (8.0 hours default)
    const sleepSlice: ActivitySlice = {
      id: 'sleep-fixed',
      name: language === 'am' ? 'ዕለታዊ እንቅልፍ እና ዕረፍት' : 'Sleep & Biological Restoration',
      pillar: 'sleep',
      hours: sleepTargetHours,
      color: '#4f46e5', // Deep Indigo
      icon: Moon
    };

    // 2. Aggregate tasks scheduled for today
    const rawSlices: ActivitySlice[] = [sleepSlice];
    let careerTotal = 0;
    let livingTotal = 0;

    // Filter tasks for today / selected day
    tasks.forEach(t => {
      const durHours = (t.durationMin || 60) / 60;
      const { pillar, color, icon } = classifyDomainToPillar(t.domain, t.title);

      rawSlices.push({
        id: t.id,
        name: t.title,
        pillar,
        hours: durHours,
        color: t.color || color,
        icon
      });

      if (pillar === 'career') careerTotal += durHours;
      if (pillar === 'living') livingTotal += durHours;
    });

    // If user has no career or living tasks yet, add realistic baseline defaults if empty
    // so they see the full 8/8/8 concept immediately
    if (careerTotal === 0 && tasks.length === 0) {
      rawSlices.push({
        id: 'career-baseline-arch',
        name: language === 'am' ? 'አርክቴክቸርና ዲዛይን' : 'Architecture & Core Craft',
        pillar: 'career',
        hours: 4.5,
        color: '#0082ff',
        icon: Briefcase
      });
      rawSlices.push({
        id: 'career-baseline-trading',
        name: language === 'am' ? 'ትሬዲንግና ገበያ ትንተና' : 'Financial Markets Analysis',
        pillar: 'career',
        hours: 2.0,
        color: '#10b981',
        icon: Zap
      });
      careerTotal = 6.5;
    }

    if (livingTotal === 0 && tasks.length === 0) {
      rawSlices.push({
        id: 'living-baseline-chess',
        name: language === 'am' ? 'የቼስ ስልጠና' : 'Chess Tactics & Openings',
        pillar: 'living',
        hours: 3.0,
        color: '#8b5cf6',
        icon: Swords
      });
      rawSlices.push({
        id: 'living-baseline-music',
        name: language === 'am' ? 'የጊታር ልምምድ' : 'Guitar Acoustic Flow',
        pillar: 'living',
        hours: 3.0,
        color: '#ec4899',
        icon: Music
      });
      rawSlices.push({
        id: 'living-baseline-fitness',
        name: language === 'am' ? 'አካላዊ ብቃት' : 'Physical Fitness Protocol',
        pillar: 'living',
        hours: 1.0,
        color: '#ef4444',
        icon: Dumbbell
      });
      livingTotal = 7.0;
    }

    // 3. Compute unallocated buffers for Career (up to 8h) and Living (up to 8h)
    const careerRemaining = Math.max(0, 8.0 - careerTotal);
    const livingRemaining = Math.max(0, 8.0 - livingTotal);
    const totalAssigned = sleepTargetHours + careerTotal + livingTotal;
    const dayFreeSurplus = Math.max(0, 24.0 - totalAssigned);

    if (careerRemaining > 0 && dayFreeSurplus > 0) {
      const openWork = Math.min(careerRemaining, dayFreeSurplus);
      rawSlices.push({
        id: 'career-unallocated',
        name: language === 'am' ? 'ክፍት የስራ ሰዓት' : 'Available Career Focus Capacity',
        pillar: 'career',
        hours: openWork,
        color: '#93c5fd', // Light Blue
        icon: Clock
      });
    }

    if (livingRemaining > 0) {
      rawSlices.push({
        id: 'living-unallocated',
        name: language === 'am' ? 'ክፍት የዕለት ፋታና እረፍት' : 'Free Leisure & Life Buffer',
        pillar: 'living',
        hours: livingRemaining,
        color: '#fed7aa', // Soft Peach
        icon: Coffee
      });
    }

    // Normalize slices to exactly 24.0 hours for flawless geometry
    const totalCalculated = rawSlices.reduce((acc, s) => acc + s.hours, 0);
    const normalizedSlices = rawSlices.map(s => ({
      ...s,
      normalizedHours: (s.hours / Math.max(1, totalCalculated)) * 24.0
    }));

    // Balance Harmony Score (0 to 100%): How closely current distribution matches 8/8/8
    const sleepDiff = Math.abs(sleepTargetHours - 8.0);
    const careerDiff = Math.abs(careerTotal - 8.0);
    const livingDiff = Math.abs(livingTotal - 8.0);
    const totalDeviation = (sleepDiff + careerDiff + livingDiff) / 24.0;
    const score = Math.max(50, Math.round((1 - totalDeviation) * 100));

    return {
      slices: normalizedSlices,
      pillarTotals: {
        sleep: sleepTargetHours,
        career: careerTotal,
        living: livingTotal,
        careerRemaining: Math.max(0, 8.0 - careerTotal),
        livingRemaining: Math.max(0, 8.0 - livingTotal)
      },
      balanceScore: score
    };
  }, [tasks, sleepTargetHours, language]);

  // Helper to generate SVG pie slice path
  const generatePieSlicePath = (
    centerX: number,
    centerY: number,
    innerRadius: number,
    outerRadius: number,
    startAngleDeg: number,
    endAngleDeg: number
  ) => {
    const toRad = (deg: number) => (deg - 90) * (Math.PI / 180);
    const startRad = toRad(startAngleDeg);
    const endRad = toRad(endAngleDeg);

    const x1 = centerX + outerRadius * Math.cos(startRad);
    const y1 = centerY + outerRadius * Math.sin(startRad);
    const x2 = centerX + outerRadius * Math.cos(endRad);
    const y2 = centerY + outerRadius * Math.sin(endRad);

    const x3 = centerX + innerRadius * Math.cos(endRad);
    const y3 = centerY + innerRadius * Math.sin(endRad);
    const x4 = centerX + innerRadius * Math.cos(startRad);
    const y4 = centerY + innerRadius * Math.sin(startRad);

    const largeArc = endAngleDeg - startAngleDeg > 180 ? 1 : 0;

    return `M ${x1} ${y1} A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4} Z`;
  };

  // Compute SVG arcs
  let accumulatedAngle = 0;
  const chartSlicesWithAngles = slices.map((slice) => {
    const sliceAngle = (slice.hours / 24.0) * 360;
    const startAngle = accumulatedAngle;
    const endAngle = accumulatedAngle + sliceAngle;
    accumulatedAngle += sliceAngle;
    return {
      ...slice,
      startAngle,
      endAngle,
      percentOfDay: ((slice.hours / 24.0) * 100).toFixed(1)
    };
  });

  const handleAddQuickBlock = (title: string, hours: number, pillar: TripleEightPillar, categoryId: string) => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:00`;
    let domain: DomainType = 'OPEN_MULTIPURPOSE';
    let color = '#0082ff';

    if (categoryId === 'chess') {
      domain = 'CHESS';
      color = '#8b5cf6';
    } else if (categoryId === 'music') {
      domain = 'GUITAR';
      color = '#ec4899';
    } else if (categoryId === 'architecture') {
      domain = 'ARCHITECTURE_DESIGN';
      color = '#0082ff';
    } else if (categoryId === 'exercise') {
      domain = 'PHYSICAL_FITNESS';
      color = '#ef4444';
    } else if (categoryId === 'trading') {
      domain = 'FOREX_TRADING';
      color = '#10b981';
    }

    addTask({
      title,
      domain,
      startTime: timeStr,
      durationMin: Math.round(hours * 60),
      completed: false,
      color
    });
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-5 animate-fadeIn pb-28 md:pb-12 text-slate-800 dark:text-slate-100">
      
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('cockpit')}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#0082ff] dark:text-slate-400 dark:hover:text-[#0082ff] transition cursor-pointer px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 shrink-0"
          >
            <ArrowLeft size={14} /> <span>{language === 'am' ? 'ወደ ዛሬው ዳሽቦርድ' : 'Today Cockpit'}</span>
          </button>
          <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
          <span className="text-xs font-bold text-slate-400 hidden sm:inline">
            {language === 'am' ? 'የ24 ሰዓት የሶስት 8ቶች (8/8/8) ሚዛን' : '24-Hour Triple-8 Life Balance'}
          </span>
        </div>

        {/* Chart View Mode Toggle */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-xl text-xs font-bold">
          <button
            onClick={() => setChartMode('donut')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              chartMode === 'donut' 
                ? 'bg-white dark:bg-slate-900 text-[#0082ff] shadow-xs' 
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <PieChart size={13} />
            <span>{language === 'am' ? 'ፓይ ቻርት' : 'Balance Wheel'}</span>
          </button>
          <button
            onClick={() => setChartMode('clock24')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              chartMode === 'clock24' 
                ? 'bg-white dark:bg-slate-900 text-[#0082ff] shadow-xs' 
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Clock size={13} />
            <span>{language === 'am' ? '24 ሰዓት መደወያ' : '24h Clock Dial'}</span>
          </button>
        </div>
      </div>

      {/* Hero Banner: The Triple 8 Rule (8/8/8) Explanation */}
      <div className="p-4 sm:p-6 rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold uppercase tracking-wider bg-white/20 backdrop-blur-xs border border-white/25">
                {language === 'am' ? 'የህይወት ሚዛን ህግ' : 'The 8 / 8 / 8 Life Balance'}
              </span>
              <span className="text-xs opacity-80 font-mono">
                {dayNameEn} • {ethDate.monthNameAmharic} {ethDate.day}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              {language === 'am' ? 'የ24 ሰዓት የሶስት 8ቶች ክፍፍል' : '24 Hours • Triple Eights Life Equilibrium'}
            </h1>
            <p className="text-xs sm:text-sm text-blue-100 max-w-2xl leading-relaxed">
              {language === 'am' 
                ? 'በአንድ ቀን ውስጥ ያሉ 24 ሰዓታት በሶስት እኩል 8 ሰዓታት ይከፈላሉ፡ 8 ሰዓት ለእረፍትና እንቅልፍ፣ 8 ሰዓት ለስራና ሙያዊ ልህቀት፣ እና 8 ሰዓት ለግል ህይወት፣ ቼስ፣ ሙዚቃና መዝናኛ።'
                : 'One day holds exactly 24 hours partitioned by the Golden Rule of 8/8/8: 8 hours for Sleep & Recovery, 8 hours for Career & Craft, and 8 hours for Living, Hobbies (Chess, Music) & Personal Growth.'}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20 self-start md:self-auto">
            <div className="text-center px-2 border-r border-white/20">
              <span className="block text-2xl font-black font-mono">8h</span>
              <span className="text-[10px] uppercase font-bold text-blue-200">Sleep</span>
            </div>
            <div className="text-center px-2 border-r border-white/20">
              <span className="block text-2xl font-black font-mono">8h</span>
              <span className="text-[10px] uppercase font-bold text-blue-200">Career</span>
            </div>
            <div className="text-center px-2">
              <span className="block text-2xl font-black font-mono">8h</span>
              <span className="text-[10px] uppercase font-bold text-blue-200">Hobbies</span>
            </div>
          </div>
        </div>
      </div>

      {/* Day Selector Strip */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {dayNames.map((day, idx) => {
          const isToday = idx === todayIndex;
          const isSelected = idx === selectedDayIndex;
          const dayShort = day.slice(0, 3);
          const amShort = AMHARIC_DAYS[idx]?.short || AMHARIC_DAYS[idx]?.am || dayShort;

          return (
            <button
              key={day}
              onClick={() => setSelectedDayIndex(idx)}
              className={`px-3 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                isSelected
                  ? 'bg-[#0082ff] text-white shadow-md shadow-blue-500/25 scale-102'
                  : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
              }`}
            >
              <span>{language === 'am' ? amShort : dayShort}</span>
              {isToday && (
                <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white animate-pulse' : 'bg-[#0082ff]'}`} />
              )}
            </button>
          );
        })}
      </div>

      {/* Main Grid: Interactive Graphical Chart (Left) & Pillar Breakdowns (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* LEFT COLUMN: THE GRAPHICAL 24-HOUR PIE / DIAL (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-[#121927] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-sm flex flex-col items-center">
          
          <div className="w-full flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-2">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <PieChart size={18} className="text-[#0082ff]" />
                <span>{language === 'am' ? 'የ24 ሰዓት የክብ ቻርት' : '24-Hour Equilibrium Wheel'}</span>
              </h2>
              <span className="text-[11px] text-slate-400">
                {language === 'am' ? 'ክፍተቶቹን በመጫን ወይም በመንካት ዝርዝሩን ይመልከቱ' : 'Touch or hover any segment to inspect slice metrics'}
              </span>
            </div>

            <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-mono font-black">
              {balanceScore}% {language === 'am' ? 'ሚዛናዊነት' : 'Harmony'}
            </span>
          </div>

          {/* SVG Pie Chart Canvas */}
          <div className="relative w-full max-w-[340px] sm:max-w-[380px] aspect-square flex items-center justify-center my-3 select-none">
            <svg 
              viewBox="0 0 400 400" 
              className="w-full h-full transform transition-all duration-300 drop-shadow-md"
            >
              <defs>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Outer Minute/Hour Tick Marks for Authentic Clock Aesthetics */}
              {Array.from({ length: 24 }).map((_, i) => {
                const angle = (i / 24) * 360 - 90;
                const rad = angle * (Math.PI / 180);
                const x1 = 200 + 185 * Math.cos(rad);
                const y1 = 200 + 185 * Math.sin(rad);
                const x2 = 200 + 192 * Math.cos(rad);
                const y2 = 200 + 192 * Math.sin(rad);
                return (
                  <line 
                    key={i} 
                    x1={x1} 
                    y1={y1} 
                    x2={x2} 
                    y2={y2} 
                    stroke="currentColor" 
                    className="text-slate-300 dark:text-slate-700" 
                    strokeWidth={i % 6 === 0 ? 2 : 1}
                  />
                );
              })}

              {/* 24 Hour Numeric Clock Labels */}
              {chartMode === 'clock24' && [0, 6, 12, 18].map((hour) => {
                const angle = (hour / 24) * 360 - 90;
                const rad = angle * (Math.PI / 180);
                const x = 200 + 172 * Math.cos(rad);
                const y = 200 + 172 * Math.sin(rad);
                return (
                  <text 
                    key={hour} 
                    x={x} 
                    y={y + 4} 
                    textAnchor="middle" 
                    className="text-[10px] font-mono font-bold fill-slate-400"
                  >
                    {String(hour).padStart(2, '0')}:00
                  </text>
                );
              })}

              {/* Donut Slices */}
              {chartSlicesWithAngles.map((slice) => {
                const isHovered = activeHoverSlice?.id === slice.id;
                const path = generatePieSlicePath(
                  200, 
                  200, 
                  chartMode === 'donut' ? 95 : 75, 
                  chartMode === 'donut' ? (isHovered ? 165 : 155) : (isHovered ? 160 : 150), 
                  slice.startAngle, 
                  slice.endAngle
                );

                return (
                  <path
                    key={slice.id}
                    d={path}
                    fill={slice.color}
                    className="cursor-pointer transition-all duration-200 stroke-white dark:stroke-[#121927] stroke-2 hover:opacity-90 active:scale-98"
                    onMouseEnter={() => setActiveHoverSlice(slice)}
                    onMouseLeave={() => setActiveHoverSlice(null)}
                    onClick={() => setActiveHoverSlice(slice)}
                  />
                );
              })}

              {/* Center Wheel Dial */}
              <circle 
                cx="200" 
                cy="200" 
                r={chartMode === 'donut' ? 85 : 68} 
                className="fill-white dark:fill-[#0c121e] stroke-slate-200 dark:stroke-slate-800" 
                strokeWidth="2"
              />
            </svg>

            {/* Inner Center Badge / Active Slice Info */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center pointer-events-none">
              {activeHoverSlice ? (
                <div className="space-y-0.5 animate-fadeIn">
                  <span 
                    className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider text-white inline-block"
                    style={{ backgroundColor: activeHoverSlice.color }}
                  >
                    {activeHoverSlice.pillar}
                  </span>
                  <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white max-w-[140px] truncate">
                    {activeHoverSlice.name}
                  </h4>
                  <span className="text-xl sm:text-2xl font-black font-mono text-[#0082ff] block">
                    {activeHoverSlice.hours.toFixed(1)}h
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono block">
                    {((activeHoverSlice.hours / 24.0) * 100).toFixed(1)}% of 24h
                  </span>
                </div>
              ) : (
                <div className="space-y-0.5">
                  <span className="text-[9px] font-mono font-extrabold uppercase tracking-widest text-slate-400 block">
                    TOTAL DAY
                  </span>
                  <span className="text-3xl font-black font-mono text-slate-900 dark:text-white block">
                    24<span className="text-sm font-bold text-slate-400">h</span>
                  </span>
                  <div className="flex items-center justify-center gap-1 text-[10px] font-mono font-bold text-slate-500">
                    <span className="text-indigo-500">8h</span> • <span className="text-blue-500">8h</span> • <span className="text-amber-500">8h</span>
                  </div>
                  <span className="text-[9px] text-emerald-500 font-bold block">
                    Equilibrium
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Slices Legend Grid */}
          <div className="w-full grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
            {chartSlicesWithAngles.map((slice) => {
              const isSelected = activeHoverSlice?.id === slice.id;
              return (
                <button
                  key={slice.id}
                  onClick={() => setActiveHoverSlice(isSelected ? null : slice)}
                  className={`p-2 rounded-xl text-left transition cursor-pointer flex items-center gap-2 border ${
                    isSelected 
                      ? 'border-[#0082ff] bg-blue-500/10' 
                      : 'border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/20 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <span 
                    className="w-3 h-3 rounded-full shrink-0 shadow-2xs" 
                    style={{ backgroundColor: slice.color }} 
                  />
                  <div className="min-w-0 flex-1">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block truncate text-[11px]">
                      {slice.name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono block">
                      {slice.hours.toFixed(1)}h ({slice.percentOfDay}%)
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

        </div>

        {/* RIGHT COLUMN: THE 3 GOLDEN PILLARS (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* 1. PILLAR 1: SLEEP & BIOLOGICAL RESTORATION (8h) */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#121927] border border-indigo-200/80 dark:border-indigo-900/50 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <Moon size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 font-mono uppercase tracking-wider">Pillar 1</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    <span className="text-[10px] font-bold text-slate-400">Target: 8.0h</span>
                  </div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {language === 'am' ? 'እንቅልፍና ባዮሎጂያዊ እረፍት' : 'Sleep & Recovery'}
                  </h3>
                </div>
              </div>

              <span className="text-base font-black font-mono text-indigo-600 dark:text-indigo-400">
                {pillarTotals.sleep.toFixed(1)}h
              </span>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1">
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (pillarTotals.sleep / 8.0) * 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>{language === 'am' ? 'ባዮሎጂያዊ እድሳት' : 'Circadian Restoration'}</span>
                <span>{((pillarTotals.sleep / 8.0) * 100).toFixed(0)}% Allocated</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {language === 'am' 
                ? '8 ሰዓት የተሟላ እንቅልፍ ለአንጎል ማደስ፣ ለሰውነት ጥንካሬና ለቀጣዩ ቀን ትኩረት ወሳኝ ነው።'
                : 'Dedicated 8.0 hours for circadian sleep, neurological recovery, and deep biological recharge.'}
            </p>
          </div>

          {/* 2. PILLAR 2: CAREER & CRAFT (8h) */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#121927] border border-blue-200/80 dark:border-blue-900/50 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/15 text-[#0082ff] flex items-center justify-center shrink-0">
                  <Briefcase size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-[#0082ff] font-mono uppercase tracking-wider">Pillar 2</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0082ff]" />
                    <span className="text-[10px] font-bold text-slate-400">Target: 8.0h</span>
                  </div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {language === 'am' ? 'ሙያ፣ ስራና ጥልቅ ልህቀት' : 'Career & Craft Mastery'}
                  </h3>
                </div>
              </div>

              <span className="text-base font-black font-mono text-[#0082ff]">
                {pillarTotals.career.toFixed(1)} / 8.0h
              </span>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1">
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (pillarTotals.career / 8.0) * 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>{pillarTotals.careerRemaining > 0 ? `${pillarTotals.careerRemaining.toFixed(1)}h capacity open` : 'Fully Allocated'}</span>
                <span>{((pillarTotals.career / 8.0) * 100).toFixed(0)}% Utilized</span>
              </div>
            </div>

            {/* Quick Action Pill to add work */}
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <button
                onClick={() => handleAddQuickBlock('Architecture Focus Block', 2.0, 'career', 'architecture')}
                className="px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-[#0082ff] text-[11px] font-bold transition flex items-center gap-1 cursor-pointer active:scale-95"
              >
                <Plus size={11} /> <span>+2h Architecture</span>
              </button>
              <button
                onClick={() => handleAddQuickBlock('Trading Session Block', 1.0, 'career', 'trading')}
                className="px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer active:scale-95"
              >
                <Plus size={11} /> <span>+1h Trading</span>
              </button>
            </div>
          </div>

          {/* 3. PILLAR 3: LIVING & HOBBIES (8h - Chess 3h, Music 3h, Living) */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#121927] border border-amber-200/80 dark:border-amber-900/50 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Heart size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400 font-mono uppercase tracking-wider">Pillar 3</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span className="text-[10px] font-bold text-slate-400">Target: 8.0h</span>
                  </div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {language === 'am' ? 'የግል ህይወት፣ ቼስ፣ ሙዚቃና መዝናኛ' : 'Living, Hobbies & Vitality'}
                  </h3>
                </div>
              </div>

              <span className="text-base font-black font-mono text-amber-600 dark:text-amber-400">
                {pillarTotals.living.toFixed(1)} / 8.0h
              </span>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1">
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 via-pink-500 to-purple-600 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (pillarTotals.living / 8.0) * 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>{pillarTotals.livingRemaining > 0 ? `${pillarTotals.livingRemaining.toFixed(1)}h leisure left` : 'Fully Allocated'}</span>
                <span>{((pillarTotals.living / 8.0) * 100).toFixed(0)}% Utilized</span>
              </div>
            </div>

            {/* Quick 1-Tap Adders for Chess & Music as Requested! */}
            <div className="space-y-2 pt-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                {language === 'am' ? 'ፈጣን የልምምድ ሰዓት አክል' : 'Quick Add to Today’s Wheel:'}
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => handleAddQuickBlock('Chess Tactics & Grandmaster Drills', 3.0, 'living', 'chess')}
                  className="px-2.5 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 text-purple-600 dark:text-purple-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-2xs"
                >
                  <Swords size={12} /> <span>+3h Chess</span>
                </button>

                <button
                  onClick={() => handleAddQuickBlock('Acoustic Guitar & Repertoire', 3.0, 'living', 'music')}
                  className="px-2.5 py-1.5 rounded-xl bg-pink-50 dark:bg-pink-950/60 hover:bg-pink-100 text-pink-600 dark:text-pink-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-2xs"
                >
                  <Music size={12} /> <span>+3h Music</span>
                </button>

                <button
                  onClick={() => handleAddQuickBlock('Physical Fitness & Cardio', 1.0, 'living', 'exercise')}
                  className="px-2.5 py-1.5 rounded-xl bg-red-50 dark:bg-red-950/60 hover:bg-red-100 text-red-600 dark:text-red-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-2xs"
                >
                  <Dumbbell size={12} /> <span>+1h Gym</span>
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
