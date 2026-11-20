import React, { useState, useMemo } from 'react';
import { 
  PieChart, Clock, Moon, Briefcase, Heart, 
  Palette, Music, Swords, ChessKnight, Sparkles, Plus, 
  Trash2, Play, CheckCircle2, Sun, Zap, 
  ChevronRight, Calendar, ArrowLeft, SlidersHorizontal,
  Dumbbell, BookOpen, Coffee, Info,
  Edit2, Check, X, RotateCcw, ChevronDown, ChevronUp, Settings,
  Building2, TrendingUp, Layers
} from 'lucide-react';
import { useLivotion, CategoryPlan } from '../context/LivotionContext';
import { ScheduleTask, DomainType } from '../types';
import { gregorianToEthiopian, AMHARIC_DAYS } from '../utils/ethiopianCalendar';
import { soundEngine } from '../utils/audio';
import { formatTaskDuration } from '../utils/formatDuration';

// Triple 8 Pillars: 8h Career • 8h Hobby • 8h Living = 24h Equilibrium
export type TripleEightPillar = 'career' | 'hobby' | 'living';

export interface ActivitySlice {
  id: string;
  name: string;
  pillar: TripleEightPillar;
  hours: number;
  color: string;
  icon?: any;
  isCustom?: boolean;
}

export interface QuickPreset {
  id: string;
  label: string;
  hours: number;
  domain: DomainType;
  categoryId: string;
  color: string;
  iconType: 'swords' | 'music' | 'dumbbell' | 'palette' | 'book' | 'sparkles' | 'coffee' | 'briefcase' | 'zap';
}

const DEFAULT_CAREER_PRESETS: QuickPreset[] = [
  { id: 'p-arch', label: 'Architecture', hours: 2.0, domain: 'ARCHITECTURE_DESIGN', categoryId: 'architecture', color: '#0082ff', iconType: 'briefcase' },
  { id: 'p-trade', label: 'Trading', hours: 1.0, domain: 'FOREX_TRADING', categoryId: 'trading', color: '#10b981', iconType: 'zap' },
];

const DEFAULT_HOBBY_PRESETS: QuickPreset[] = [
  { id: 'p-chess', label: 'Chess', hours: 3.0, domain: 'CHESS', categoryId: 'chess', color: '#8b5cf6', iconType: 'swords' },
  { id: 'p-music', label: 'Music & Guitar', hours: 2.5, domain: 'GUITAR', categoryId: 'music', color: '#ec4899', iconType: 'music' },
  { id: 'p-art', label: 'Art & Painting', hours: 2.0, domain: 'OIL_PAINTING', categoryId: 'art', color: '#f59e0b', iconType: 'palette' },
];

const DEFAULT_LIVING_PRESETS: QuickPreset[] = [
  { id: 'p-gym', label: 'Gym & Fitness', hours: 1.0, domain: 'PHYSICAL_FITNESS', categoryId: 'exercise', color: '#ef4444', iconType: 'dumbbell' },
  { id: 'p-devotion', label: 'Devotion', hours: 0.75, domain: 'DEVOTION_PRAYER', categoryId: 'devotion', color: '#06b6d4', iconType: 'book' },
  { id: 'p-sleep', label: 'Sleep & Recovery', hours: 6.25, domain: 'OPEN_MULTIPURPOSE', categoryId: 'buffer', color: '#6366f1', iconType: 'sparkles' },
];

export const TripleEightLifeBalanceView: React.FC = () => {
  const { 
    tasks, 
    getDaySchedule,
    categoryPlans,
    categoryOrder,
    updateCategoryPlan,
    openManageCategoriesModal,
    addTask, 
    updateTask,
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

  // View mode: 'streams' (Main Streams) vs 'pillars' (3 Golden Pillars 8/8/8)
  const [streamViewMode, setStreamViewMode] = useState<'streams' | 'pillars'>('streams');

  // Chart type: 'donut' | 'clock24'
  const [chartMode, setChartMode] = useState<'donut' | 'clock24'>('donut');
  const [activeHoverSlice, setActiveHoverSlice] = useState<ActivitySlice | null>(null);

  // Compute active date based on selected day index
  const activeDate = useMemo(() => {
    const d = new Date();
    const currentDay = d.getDay();
    const diff = selectedDayIndex - currentDay;
    d.setDate(d.getDate() + diff);
    return d;
  }, [selectedDayIndex]);

  // Resolve schedule for active day (avoids duplicating tasks across days)
  const daySchedule = useMemo(() => {
    if (typeof getDaySchedule === 'function') {
      return getDaySchedule(activeDate);
    }
    return { tasks: [] };
  }, [getDaySchedule, activeDate]);

  const activeDayTasks = useMemo(() => {
    if (daySchedule?.tasks && daySchedule.tasks.length > 0) {
      return daySchedule.tasks;
    }
    return tasks;
  }, [daySchedule, tasks]);

  // Targets for the 3 Golden Pillars (default 8.0h each, summing to exactly 24.0h)
  const [pillarTargets, setPillarTargets] = useState<{ career: number; hobby: number; living: number }>(() => {
    try {
      const saved = localStorage.getItem('neva_triple8_targets_v2');
      if (saved) return JSON.parse(saved);
      const oldSaved = localStorage.getItem('neva_triple8_targets_v1');
      if (oldSaved) {
        const old = JSON.parse(oldSaved);
        return { career: old.career || 8.0, hobby: 8.0, living: old.living || 8.0 };
      }
    } catch {}
    return { career: 8.0, hobby: 8.0, living: 8.0 };
  });

  const updatePillarTarget = (pillar: 'career' | 'hobby' | 'living', hours: number) => {
    const clamped = Math.max(0.5, Math.min(18, parseFloat(hours.toFixed(1))));
    const next = { ...pillarTargets, [pillar]: clamped };
    setPillarTargets(next);
    try {
      localStorage.setItem('neva_triple8_targets_v2', JSON.stringify(next));
    } catch {}
    try { soundEngine.playPencil(); } catch {}
  };

  // Quick Add Presets State for the 3 Pillars
  const [careerPresets, setCareerPresets] = useState<QuickPreset[]>(() => {
    try {
      const saved = localStorage.getItem('neva_triple8_career_presets_v2');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_CAREER_PRESETS;
  });

  const saveCareerPresets = (next: QuickPreset[]) => {
    setCareerPresets(next);
    try {
      localStorage.setItem('neva_triple8_career_presets_v2', JSON.stringify(next));
    } catch {}
    try { soundEngine.playPencil(); } catch {}
  };

  const [hobbyPresets, setHobbyPresets] = useState<QuickPreset[]>(() => {
    try {
      const saved = localStorage.getItem('neva_triple8_hobby_presets_v2');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_HOBBY_PRESETS;
  });

  const saveHobbyPresets = (next: QuickPreset[]) => {
    setHobbyPresets(next);
    try {
      localStorage.setItem('neva_triple8_hobby_presets_v2', JSON.stringify(next));
    } catch {}
    try { soundEngine.playPencil(); } catch {}
  };

  const [livingPresets, setLivingPresets] = useState<QuickPreset[]>(() => {
    try {
      const saved = localStorage.getItem('neva_triple8_living_presets_v2');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_LIVING_PRESETS;
  });

  const saveLivingPresets = (next: QuickPreset[]) => {
    setLivingPresets(next);
    try {
      localStorage.setItem('neva_triple8_living_presets_v2', JSON.stringify(next));
    } catch {}
    try { soundEngine.playPencil(); } catch {}
  };

  // Editing UI states for Pillar 1 (Career)
  const [isEditingCareerTarget, setIsEditingCareerTarget] = useState(false);
  const [isEditingCareerPresets, setIsEditingCareerPresets] = useState(false);
  const [isExpandedCareerTasks, setIsExpandedCareerTasks] = useState(false);
  const [customCareerTitle, setCustomCareerTitle] = useState('');
  const [customCareerHours, setCustomCareerHours] = useState('1.5');
  const [customCareerCategory, setCustomCareerCategory] = useState('architecture');

  // Editing UI states for Pillar 2 (Hobby)
  const [isEditingHobbyTarget, setIsEditingHobbyTarget] = useState(false);
  const [isEditingHobbyPresets, setIsEditingHobbyPresets] = useState(false);
  const [isExpandedHobbyTasks, setIsExpandedHobbyTasks] = useState(false);
  const [customHobbyTitle, setCustomHobbyTitle] = useState('');
  const [customHobbyHours, setCustomHobbyHours] = useState('2.0');
  const [customHobbyCategory, setCustomHobbyCategory] = useState('chess');

  // Editing UI states for Pillar 3 (Living)
  const [isEditingLivingTarget, setIsEditingLivingTarget] = useState(false);
  const [isEditingLivingPresets, setIsEditingLivingPresets] = useState(false);
  const [isExpandedLivingTasks, setIsExpandedLivingTasks] = useState(false);
  const [customLivingTitle, setCustomLivingTitle] = useState('');
  const [customLivingHours, setCustomLivingHours] = useState('1.0');
  const [customLivingCategory, setCustomLivingCategory] = useState('exercise');

  // Ethiopian Date string for today
  const ethDate = gregorianToEthiopian(today);
  const dayNameEn = dayNames[selectedDayIndex];

  // Helper to map a task to its Main Stream Subject / Category and resolved Triple-8 Pillar
  const getStreamForTask = (task: ScheduleTask): { streamId: string; streamTitle: string; pillar: TripleEightPillar; color: string; icon: any } => {
    // 1. Badge exact or partial match with categoryPlans
    if (task.badge) {
      const badgeLower = task.badge.toLowerCase();
      for (const [id, plan] of Object.entries(categoryPlans || {})) {
        if (badgeLower.includes(id.toLowerCase()) || plan.title.toLowerCase().includes(badgeLower)) {
          const streamType: TripleEightPillar = plan.triple8Type || (
            ['architecture', 'trading', 'career', 'work'].includes(id) ? 'career' :
            ['chess', 'music', 'art', 'guitar', 'painting'].includes(id) ? 'hobby' : 'living'
          );
          return {
            streamId: id,
            streamTitle: plan.title,
            pillar: streamType,
            color: plan.color,
            icon: streamType === 'career' ? Briefcase : streamType === 'hobby' ? (id === 'chess' ? ChessKnight : id === 'music' ? Music : Palette) : (id === 'exercise' ? Dumbbell : id === 'devotion' ? BookOpen : Heart)
          };
        }
      }
    }

    const d = (task.domain || '').toUpperCase();
    const tLower = (task.title || '').toLowerCase();

    // 2. Iterate each category plan to find matched subject
    for (const [id, plan] of Object.entries(categoryPlans || {})) {
      const pTitle = plan.title.toLowerCase();
      if (
        tLower.includes(pTitle) ||
        (id === 'chess' && (d.includes('CHESS') || tLower.includes('chess') || tLower.includes('puzzle') || tLower.includes('aagard'))) ||
        (id === 'music' && (d.includes('GUITAR') || d.includes('MUSIC') || tLower.includes('music') || tLower.includes('guitar') || tLower.includes('warmup') || tLower.includes('lick'))) ||
        (id === 'exercise' && (d.includes('FITNESS') || d.includes('EXERCISE') || tLower.includes('gym') || tLower.includes('workout'))) ||
        (id === 'art' && (d.includes('PAINTING') || d.includes('ART') || tLower.includes('art'))) ||
        (id === 'devotion' && (d.includes('DEVOTION') || d.includes('PRAYER') || tLower.includes('prayer') || tLower.includes('scripture'))) ||
        (id === 'trading' && (d.includes('TRADING') || d.includes('FOREX') || tLower.includes('trading') || tLower.includes('market'))) ||
        (id === 'architecture' && (d.includes('ARCHITECTURE') || d.includes('SITE') || tLower.includes('arch') || tLower.includes('design') || tLower.includes('client')))
      ) {
        const streamType: TripleEightPillar = plan.triple8Type || (
          ['architecture', 'trading', 'career', 'work'].includes(id) ? 'career' :
          ['chess', 'music', 'art', 'guitar', 'painting'].includes(id) ? 'hobby' : 'living'
        );
        return {
          streamId: id,
          streamTitle: plan.title,
          pillar: streamType,
          color: plan.color,
          icon: streamType === 'career' ? Briefcase : streamType === 'hobby' ? (id === 'chess' ? ChessKnight : id === 'music' ? Music : Palette) : (id === 'exercise' ? Dumbbell : id === 'devotion' ? BookOpen : Heart)
        };
      }
    }

    return {
      streamId: 'living-other',
      streamTitle: language === 'am' ? 'ዕለታዊ እንቅስቃሴ' : 'Living & Leisure',
      pillar: 'living',
      color: '#3b82f6',
      icon: Sparkles
    };
  };

  // Compile All Slices for the 24-Hour Day: Syncs strictly with each stream's triple8Type
  const { slices, pillarTotals, balanceScore } = useMemo(() => {
    let careerTotal = 0;
    let hobbyTotal = 0;
    let livingTotal = 0;

    const careerStreamMap = new Map<string, ActivitySlice>();
    const hobbyStreamMap = new Map<string, ActivitySlice>();
    const livingStreamMap = new Map<string, ActivitySlice>();

    activeDayTasks.forEach((t) => {
      const durHours = (t.durationMin || 60) / 60;
      const { streamId, streamTitle, pillar, color, icon } = getStreamForTask(t);

      if (pillar === 'career') {
        careerTotal += durHours;
        if (!careerStreamMap.has(streamId)) {
          careerStreamMap.set(streamId, {
            id: `stream-${streamId}`,
            name: streamTitle,
            pillar: 'career',
            hours: durHours,
            color,
            icon
          });
        } else {
          careerStreamMap.get(streamId)!.hours += durHours;
        }
      } else if (pillar === 'hobby') {
        hobbyTotal += durHours;
        if (!hobbyStreamMap.has(streamId)) {
          hobbyStreamMap.set(streamId, {
            id: `stream-${streamId}`,
            name: streamTitle,
            pillar: 'hobby',
            hours: durHours,
            color,
            icon
          });
        } else {
          hobbyStreamMap.get(streamId)!.hours += durHours;
        }
      } else {
        livingTotal += durHours;
        if (!livingStreamMap.has(streamId)) {
          livingStreamMap.set(streamId, {
            id: `stream-${streamId}`,
            name: streamTitle,
            pillar: 'living',
            hours: durHours,
            color,
            icon
          });
        } else {
          livingStreamMap.get(streamId)!.hours += durHours;
        }
      }
    });

    // Compute unallocated buffers preserving strictly 24.0 total hours
    const totalScheduledHours = careerTotal + hobbyTotal + livingTotal;
    const availableBuffer = Math.max(0, 24.0 - totalScheduledHours);

    // Compute ideal capacity targets for unallocated portions
    const idealCareerRem = Math.max(0, pillarTargets.career - careerTotal);
    const idealHobbyRem = Math.max(0, pillarTargets.hobby - hobbyTotal);
    const idealLivingRem = Math.max(0, pillarTargets.living - livingTotal);
    const idealRemSum = idealCareerRem + idealHobbyRem + idealLivingRem;

    // Distribute unallocated buffer proportionally without exceeding 24h
    let careerRemaining = 0;
    let hobbyRemaining = 0;
    let livingRemaining = 0;

    if (availableBuffer > 0) {
      if (idealRemSum > 0) {
        careerRemaining = (idealCareerRem / idealRemSum) * availableBuffer;
        hobbyRemaining = (idealHobbyRem / idealRemSum) * availableBuffer;
        livingRemaining = (idealLivingRem / idealRemSum) * availableBuffer;
      } else {
        // Equal split if all targets reached but day has spare buffer
        careerRemaining = availableBuffer / 3;
        hobbyRemaining = availableBuffer / 3;
        livingRemaining = availableBuffer / 3;
      }
    }

    let rawSlices: ActivitySlice[] = [];

    if (streamViewMode === 'pillars') {
      // 3 Golden Pillars View (Career 8h • Hobby 8h • Living 8h = 24h)
      rawSlices = [
        {
          id: 'pillar-career',
          name: language === 'am' ? 'ምሰሶ 1: ስራና ሙያ (Career 8h)' : 'Pillar 1: Career & Craft (8h)',
          pillar: 'career',
          hours: pillarTargets.career,
          color: '#0082ff',
          icon: Briefcase
        },
        {
          id: 'pillar-hobby',
          name: language === 'am' ? 'ምሰሶ 2: ተሰጥኦና መዝናኛ (Hobby 8h)' : 'Pillar 2: Hobbies & Passions (8h)',
          pillar: 'hobby',
          hours: pillarTargets.hobby,
          color: '#8b5cf6',
          icon: Palette
        },
        {
          id: 'pillar-living',
          name: language === 'am' ? 'ምሰሶ 3: የግል ኑሮና እረፍት (Living 8h)' : 'Pillar 3: Living & Vitality (8h)',
          pillar: 'living',
          hours: pillarTargets.living,
          color: '#10b981',
          icon: Heart
        }
      ];
    } else {
      // Main Streams View: Grouped by Career -> Hobby -> Living
      // 1. Career Streams
      if (careerStreamMap.size > 0) {
        careerStreamMap.forEach((stream) => rawSlices.push(stream));
      }
      if (careerRemaining > 0.05) {
        rawSlices.push({
          id: 'stream-career-capacity',
          name: language === 'am' ? 'ክፍት የስራ ሰዓት' : 'Available Career Capacity',
          pillar: 'career',
          hours: careerRemaining,
          color: '#93c5fd',
          icon: Briefcase
        });
      }

      // 2. Hobby Streams
      if (hobbyStreamMap.size > 0) {
        hobbyStreamMap.forEach((stream) => rawSlices.push(stream));
      }
      if (hobbyRemaining > 0.05) {
        rawSlices.push({
          id: 'stream-hobby-capacity',
          name: language === 'am' ? 'ክፍት የተሰጥኦ ሰዓት' : 'Available Hobby Capacity',
          pillar: 'hobby',
          hours: hobbyRemaining,
          color: '#d8b4fe',
          icon: Sparkles
        });
      }

      // 3. Living Streams
      if (livingStreamMap.size > 0) {
        livingStreamMap.forEach((stream) => rawSlices.push(stream));
      }
      if (livingRemaining > 0.05) {
        rawSlices.push({
          id: 'stream-living-buffer',
          name: language === 'am' ? 'ክፍት የዕለት ፋታና እረፍት' : 'Free Living & Rest Buffer',
          pillar: 'living',
          hours: livingRemaining,
          color: '#a7f3d0',
          icon: Coffee
        });
      }
    }

    // Normalize slices to guarantee EXACTLY 24.0 hours for flawless wheel geometry
    const totalCalculated = rawSlices.reduce((acc, s) => acc + s.hours, 0) || 24;
    const normalizedSlices = rawSlices.map(s => ({
      ...s,
      hours: (s.hours / totalCalculated) * 24.0,
      normalizedHours: (s.hours / totalCalculated) * 24.0
    }));

    // Balance Harmony Score across the 3 pillars
    const careerDiff = Math.abs(careerTotal - pillarTargets.career);
    const hobbyDiff = Math.abs(hobbyTotal - pillarTargets.hobby);
    const livingDiff = Math.abs(livingTotal - pillarTargets.living);
    const totalDeviation = (careerDiff + hobbyDiff + livingDiff) / 24.0;
    const score = Math.max(50, Math.round((1 - totalDeviation) * 100));

    return {
      slices: normalizedSlices,
      pillarTotals: {
        career: careerTotal,
        hobby: hobbyTotal,
        living: livingTotal,
        careerTarget: pillarTargets.career,
        hobbyTarget: pillarTargets.hobby,
        livingTarget: pillarTargets.living,
        careerRemaining,
        hobbyRemaining,
        livingRemaining
      },
      balanceScore: score
    };
  }, [activeDayTasks, pillarTargets, streamViewMode, categoryOrder, language, categoryPlans]);

  // Helper to generate SVG pie slice path with full 360 circle support
  const generatePieSlicePath = (
    centerX: number,
    centerY: number,
    innerRadius: number,
    outerRadius: number,
    startAngleDeg: number,
    endAngleDeg: number
  ) => {
    const span = endAngleDeg - startAngleDeg;
    if (span <= 0.001) return '';

    const toRad = (deg: number) => (deg - 90) * (Math.PI / 180);

    // Full 360 circle (or nearly complete) needs two 180-deg arcs to prevent SVG collapse
    if (span >= 359.95) {
      const midAngle = startAngleDeg + 180;
      const r1 = toRad(startAngleDeg);
      const r2 = toRad(midAngle);
      const x1 = centerX + outerRadius * Math.cos(r1);
      const y1 = centerY + outerRadius * Math.sin(r1);
      const x2 = centerX + outerRadius * Math.cos(r2);
      const y2 = centerY + outerRadius * Math.sin(r2);
      const ix1 = centerX + innerRadius * Math.cos(r1);
      const iy1 = centerY + innerRadius * Math.sin(r1);
      const ix2 = centerX + innerRadius * Math.cos(r2);
      const iy2 = centerY + innerRadius * Math.sin(r2);

      return `M ${x1} ${y1} A ${outerRadius} ${outerRadius} 0 0 1 ${x2} ${y2} A ${outerRadius} ${outerRadius} 0 0 1 ${x1} ${y1} M ${ix1} ${iy1} A ${innerRadius} ${innerRadius} 0 0 0 ${ix2} ${iy2} A ${innerRadius} ${innerRadius} 0 0 0 ${ix1} ${iy1} Z`;
    }

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

    const largeArc = span > 180 ? 1 : 0;

    return `M ${x1} ${y1} A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4} Z`;
  };

  // Compute SVG arcs: tightly bounded from 0 to exactly 360 deg
  let accumulatedAngle = 0;
  const totalSliceHours = slices.reduce((acc, s) => acc + s.hours, 0) || 24;
  const chartSlicesWithAngles = slices.map((slice, index) => {
    const isLast = index === slices.length - 1;
    const sliceAngle = (slice.hours / totalSliceHours) * 360;
    const startAngle = accumulatedAngle;
    const endAngle = isLast ? 360.0 : Math.min(360.0, accumulatedAngle + sliceAngle);
    accumulatedAngle = endAngle;
    return {
      ...slice,
      startAngle,
      endAngle,
      percentOfDay: ((slice.hours / totalSliceHours) * 100).toFixed(1)
    };
  });

  const handleAddQuickBlock = (title: string, hours: number, pillar: TripleEightPillar, categoryId: string) => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:00`;
    let domain: DomainType = 'OPEN_MULTIPURPOSE';
    let color = '#0082ff';

    if (categoryId === 'chess') { domain = 'CHESS'; color = '#8b5cf6'; }
    else if (categoryId === 'music') { domain = 'GUITAR'; color = '#ec4899'; }
    else if (categoryId === 'architecture') { domain = 'ARCHITECTURE_DESIGN'; color = '#0082ff'; }
    else if (categoryId === 'exercise') { domain = 'PHYSICAL_FITNESS'; color = '#ef4444'; }
    else if (categoryId === 'trading') { domain = 'FOREX_TRADING'; color = '#10b981'; }
    else if (categoryId === 'art') { domain = 'OIL_PAINTING'; color = '#f59e0b'; }
    else if (categoryId === 'devotion') { domain = 'DEVOTION_PRAYER'; color = '#06b6d4'; }

    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    addTask({
      title,
      domain,
      startTime: timeStr,
      durationMin: Math.round(hours * 60),
      completed: false,
      color,
      date: todayStr
    });
    try { soundEngine.playSound('CHIME_MEDITATION'); } catch {}
  };

  const careerTasks = useMemo(() => {
    return activeDayTasks.filter(t => getStreamForTask(t).pillar === 'career');
  }, [activeDayTasks, categoryPlans]);

  const hobbyTasks = useMemo(() => {
    return activeDayTasks.filter(t => getStreamForTask(t).pillar === 'hobby');
  }, [activeDayTasks, categoryPlans]);

  const livingTasks = useMemo(() => {
    return activeDayTasks.filter(t => getStreamForTask(t).pillar === 'living');
  }, [activeDayTasks, categoryPlans]);

  const handleAdjustTaskDuration = (taskId: string, deltaMin: number) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const newDur = Math.max(15, (task.durationMin || 60) + deltaMin);
    updateTask(taskId, { durationMin: newDur });
    try { soundEngine.playPencil(); } catch {}
  };

  const handleDeleteActivity = (taskId: string) => {
    deleteTask(taskId);
    try { soundEngine.playPencil(); } catch {}
  };

  const handleAddPresetBlock = (preset: QuickPreset) => {
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    addTask({
      title: `${preset.label} Session`,
      startTime: 'Flexible',
      durationMin: Math.round(preset.hours * 60),
      domain: preset.domain,
      badge: preset.label,
      color: preset.color,
      completed: false,
      date: todayStr,
      checklist: [
        { id: `c-${Date.now()}-1`, text: 'Warm-up & context setup', done: false },
        { id: `c-${Date.now()}-2`, text: 'Core deliberate execution', done: false },
      ]
    });
    try { soundEngine.playSound('CHIME_MEDITATION'); } catch {}
  };

  // Change Stream Type directly in Triple-8 view
  const handleSetStreamType = (streamId: string, newType: TripleEightPillar) => {
    updateCategoryPlan(streamId, { triple8Type: newType });
    try { soundEngine.playPencil(); } catch {}
  };

  const renderPresetIcon = (iconType: string) => {
    switch (iconType) {
      case 'swords': return <Swords size={12} />;
      case 'music': return <Music size={12} />;
      case 'dumbbell': return <Dumbbell size={12} />;
      case 'palette': return <Palette size={12} />;
      case 'book': return <BookOpen size={12} />;
      case 'briefcase': return <Briefcase size={12} />;
      case 'zap': return <Zap size={12} />;
      default: return <Sparkles size={12} />;
    }
  };

  // Active Category List from Context
  const allStreamsList = useMemo(() => {
    return Object.values(categoryPlans || {});
  }, [categoryPlans]);

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
            {language === 'am' ? 'የ24 ሰዓት የሶስት 8ቶች (8/8/8) ሚዛን' : '24-Hour Triple-8 Life Balance (Career • Hobby • Living)'}
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

      {/* Hero Banner: The Triple 8 Rule (Career 8h • Hobby 8h • Living 8h = 24h) */}
      <div className="p-4 sm:p-6 rounded-3xl bg-gradient-to-r from-blue-600 via-purple-600 to-emerald-600 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold uppercase tracking-wider bg-white/20 backdrop-blur-xs border border-white/25">
                {language === 'am' ? 'የሶስት 8ቶች ሚዛን ህግ' : 'The Golden 8 / 8 / 8 Equilibrium'}
              </span>
              <span className="text-xs opacity-80 font-mono">
                {dayNameEn} • {ethDate.monthNameAmharic} {ethDate.day}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              {language === 'am' ? 'የ24 ሰዓት ሚዛን፡ ስራ (8h) • ተሰጥኦ (8h) • ኑሮ (8h)' : '24 Hours • Career (8h) • Hobby (8h) • Living (8h)'}
            </h1>
            <p className="text-xs sm:text-sm text-blue-100 max-w-2xl leading-relaxed">
              {language === 'am' 
                ? 'ዋና ዋና ዘርፎችዎን በሶስት ወርቃማ ምድቦች (ስራ/ሙያ፣ ተሰጥኦ/መዝናኛ፣ እና የግል ኑሮ/እረፍት) ይመድቡ። ተግባራትዎ ወዲያውኑ ወደ 24 ሰዓት ቻርት ይሰምራሉ።'
                : 'Every stream is categorized into one of three synchronized pillars: Career (Work & Craft), Hobby (Creative Passions & Chess), or Living (Health, Rest & Vitality).'}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20 self-start md:self-auto">
            <div className="text-center px-2 border-r border-white/20">
              <span className="block text-2xl font-black font-mono">8h</span>
              <span className="text-[10px] uppercase font-bold text-blue-200">Career</span>
            </div>
            <div className="text-center px-2 border-r border-white/20">
              <span className="block text-2xl font-black font-mono">8h</span>
              <span className="text-[10px] uppercase font-bold text-purple-200">Hobby</span>
            </div>
            <div className="text-center px-2">
              <span className="block text-2xl font-black font-mono">8h</span>
              <span className="text-[10px] uppercase font-bold text-emerald-200">Living</span>
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

      {/* Main Grid: Interactive Wheel (Left) & 3 Golden Pillars (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* LEFT COLUMN: THE GRAPHICAL 24-HOUR PIE / DIAL & STREAM CLASSIFIER (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          <div className="bg-white dark:bg-[#121927] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-sm flex flex-col items-center">
            
            <div className="w-full flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-2 flex-wrap gap-2">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <PieChart size={18} className="text-[#0082ff]" />
                  <span>{language === 'am' ? 'የ24 ሰዓት የክብ ቻርት' : '24-Hour Equilibrium Wheel'}</span>
                </h2>
                <span className="text-[11px] text-slate-400">
                  {language === 'am' ? 'በስራ፣ ተሰጥኦና ኑሮ የተከፋፈለ 24 ሰዓት' : 'Synchronized with Career • Hobby • Living'}
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Segmented Mode Switcher: Main Streams vs 3 Pillars */}
                <div className="inline-flex p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
                  <button
                    type="button"
                    onClick={() => { setStreamViewMode('streams'); setActiveHoverSlice(null); }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      streamViewMode === 'streams'
                        ? 'bg-white dark:bg-slate-900 text-[#0082ff] shadow-2xs'
                        : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                    }`}
                  >
                    {language === 'am' ? 'ዋና ዋና ዘርፎች' : 'Main Streams'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setStreamViewMode('pillars'); setActiveHoverSlice(null); }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      streamViewMode === 'pillars'
                        ? 'bg-white dark:bg-slate-900 text-purple-600 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                    }`}
                  >
                    {language === 'am' ? '3 ምሰሶዎች (8/8/8)' : '3 Pillars (8/8/8)'}
                  </button>
                </div>

                <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-mono font-black">
                  {balanceScore}% {language === 'am' ? 'ሚዛናዊነት' : 'Harmony'}
                </span>
              </div>
            </div>

            {/* SVG Pie Chart Canvas */}
            <div className="relative w-full max-w-[340px] sm:max-w-[380px] aspect-square flex items-center justify-center my-3 select-none">
              <svg 
                viewBox="0 0 400 400" 
                className="w-full h-full transform transition-all duration-300 drop-shadow-md"
              >
                {/* Outer Tick Marks */}
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
                      <span className="text-blue-500">{pillarTotals.career.toFixed(1)}h Work</span> • <span className="text-purple-500">{pillarTotals.hobby.toFixed(1)}h Hobby</span> • <span className="text-emerald-500">{pillarTotals.living.toFixed(1)}h Living</span>
                    </div>
                    <span className="text-[9px] text-emerald-500 font-bold block">
                      {balanceScore >= 80 ? (language === 'am' ? 'ሚዛናዊ' : 'Equilibrium') : `${balanceScore}% ${language === 'am' ? 'ሚዛናዊነት' : 'Harmony'}`}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Slices Legend Grid */}
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              {chartSlicesWithAngles.map((slice) => {
                const isSelected = activeHoverSlice?.id === slice.id;
                return (
                  <button
                    key={slice.id}
                    onClick={() => setActiveHoverSlice(isSelected ? null : slice)}
                    className={`p-2.5 rounded-xl text-left transition cursor-pointer flex items-center gap-2.5 border ${
                      isSelected 
                        ? 'border-[#0082ff] bg-blue-500/10 shadow-2xs ring-1 ring-[#0082ff]/50' 
                        : 'border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/20 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <span 
                      className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs ring-2 ring-white dark:ring-slate-900" 
                      style={{ backgroundColor: slice.color }} 
                    />
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-slate-800 dark:text-slate-200 block truncate text-xs">
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

          {/* STREAM CLASSIFICATION & TRIPLE-8 SYNC CARD */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#121927] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                  <Layers size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {language === 'am' ? 'የዋና ዘርፎች የ24 ሰዓት ምድብ ምርጫ' : 'Stream Classification & Triple-8 Sync'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {language === 'am' ? 'እያንዳንዱን ዘርፍ ወደ ስራ፣ ተሰጥኦ ወይም ኑሮ ይመድቡ' : 'Choose whether each stream counts as Career, Hobby, or Living'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => openManageCategoriesModal()}
                className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <Settings size={12} />
                <span>{language === 'am' ? 'አስተዳድር' : 'Manage'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {allStreamsList.map((cat) => {
                const currentType: TripleEightPillar = cat.triple8Type || (
                  ['architecture', 'trading', 'career', 'work'].includes(cat.id) ? 'career' :
                  ['chess', 'music', 'art', 'guitar', 'painting'].includes(cat.id) ? 'hobby' : 'living'
                );

                return (
                  <div 
                    key={cat.id} 
                    className="p-3 rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span 
                        className="w-3 h-3 rounded-full shrink-0 shadow-2xs" 
                        style={{ backgroundColor: cat.color }} 
                      />
                      <span className="font-extrabold text-slate-800 dark:text-slate-200 truncate">
                        {cat.title}
                      </span>
                    </div>

                    {/* 3-Way Segmented Choice Pill */}
                    <div className="inline-flex p-0.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-700 shrink-0 shadow-2xs">
                      <button
                        type="button"
                        onClick={() => handleSetStreamType(cat.id, 'career')}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center gap-1 ${
                          currentType === 'career'
                            ? 'bg-blue-600 text-white shadow-2xs'
                            : 'text-slate-500 hover:text-blue-600'
                        }`}
                        title="Count as Career (8h Pillar)"
                      >
                        <Briefcase size={10} />
                        <span>Career</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSetStreamType(cat.id, 'hobby')}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center gap-1 ${
                          currentType === 'hobby'
                            ? 'bg-purple-600 text-white shadow-2xs'
                            : 'text-slate-500 hover:text-purple-600'
                        }`}
                        title="Count as Hobby (8h Pillar)"
                      >
                        <Palette size={10} />
                        <span>Hobby</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSetStreamType(cat.id, 'living')}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center gap-1 ${
                          currentType === 'living'
                            ? 'bg-emerald-600 text-white shadow-2xs'
                            : 'text-slate-500 hover:text-emerald-600'
                        }`}
                        title="Count as Living (8h Pillar)"
                      >
                        <Heart size={10} />
                        <span>Living</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: THE 3 GOLDEN PILLARS (Career 8h • Hobby 8h • Living 8h) (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* 1. PILLAR 1: CAREER & CRAFT MASTERY */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#121927] border border-blue-200/80 dark:border-blue-900/50 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/15 text-[#0082ff] flex items-center justify-center shrink-0">
                  <Briefcase size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-bold text-[#0082ff] font-mono uppercase tracking-wider">Pillar 1</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0082ff]" />
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-bold text-slate-400">Target: {pillarTargets.career.toFixed(1)}h</span>
                      <button
                        type="button"
                        onClick={() => setIsEditingCareerTarget(!isEditingCareerTarget)}
                        className="p-0.5 rounded hover:bg-blue-100 dark:hover:bg-blue-950/60 text-[#0082ff] cursor-pointer"
                        title="Edit Target Career Hours"
                      >
                        <Edit2 size={10} />
                      </button>
                    </div>
                  </div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {language === 'am' ? 'ሙያ፣ ስራና ጥልቅ ልህቀት' : 'Career & Professional Craft'}
                  </h3>
                </div>
              </div>

              <span className="text-base font-black font-mono text-[#0082ff]">
                {pillarTotals.career.toFixed(1)} / {pillarTargets.career.toFixed(1)}h
              </span>
            </div>

            {/* Editable Career Target Drawer */}
            {isEditingCareerTarget && (
              <div className="p-2.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800 space-y-2 animate-fadeIn">
                <div className="flex items-center justify-between text-xs font-bold text-blue-900 dark:text-blue-200">
                  <span>Adjust Career Target:</span>
                  <button
                    type="button"
                    onClick={() => setIsEditingCareerTarget(false)}
                    className="p-1 px-2 rounded-md bg-[#0082ff] text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Check size={11} strokeWidth={3} /> <span>Done</span>
                  </button>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => updatePillarTarget('career', pillarTargets.career - 0.5)}
                    className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100 font-mono font-bold flex items-center justify-center cursor-pointer hover:bg-blue-100"
                  >
                    -
                  </button>
                  <span className="px-3 py-1 bg-white dark:bg-slate-800 border border-blue-300 dark:border-blue-700 rounded-lg font-mono font-black text-[#0082ff] text-xs">
                    {pillarTargets.career.toFixed(1)} hrs
                  </span>
                  <button
                    type="button"
                    onClick={() => updatePillarTarget('career', pillarTargets.career + 0.5)}
                    className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100 font-mono font-bold flex items-center justify-center cursor-pointer hover:bg-blue-100"
                  >
                    +
                  </button>
                  {[4, 6, 8, 9, 10].map(h => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => updatePillarTarget('career', h)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold cursor-pointer transition ${
                        pillarTargets.career === h
                          ? 'bg-[#0082ff] text-white'
                          : 'bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 text-slate-600 dark:text-slate-300 hover:bg-blue-50'
                      }`}
                    >
                      {h}h
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Progress Bar */}
            <div className="space-y-1">
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (pillarTotals.career / pillarTargets.career) * 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>{pillarTotals.careerRemaining > 0 ? `${pillarTotals.careerRemaining.toFixed(1)}h capacity open` : 'Fully Allocated'}</span>
                <span>{((pillarTotals.career / pillarTargets.career) * 100).toFixed(0)}% Utilized</span>
              </div>
            </div>

            {/* Quick Action Presets */}
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              {careerPresets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handleAddPresetBlock(preset)}
                  className="px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-[#0082ff] text-[11px] font-bold transition flex items-center gap-1 cursor-pointer active:scale-95"
                >
                  <Plus size={11} /> <span>+{preset.hours.toFixed(0)}h {preset.label}</span>
                </button>
              ))}
            </div>

            {/* Inspect / Edit Career Activities Drawer */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsExpandedCareerTasks(!isExpandedCareerTasks)}
                className="w-full flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-[#0082ff] dark:hover:text-[#0082ff] cursor-pointer"
              >
                <span>Allocated Career Activities ({careerTasks.length})</span>
                {isExpandedCareerTasks ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {isExpandedCareerTasks && (
                <div className="mt-2.5 space-y-2 animate-fadeIn">
                  {careerTasks.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic">No career tasks scheduled yet today.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {careerTasks.map((t) => (
                        <div key={t.id} className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: t.color || '#0082ff' }} />
                            <span className="font-bold truncate text-slate-800 dark:text-slate-200">{t.title}</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleAdjustTaskDuration(t.id, -30)}
                              className="w-5 h-5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-mono text-[10px] font-bold flex items-center justify-center cursor-pointer hover:bg-slate-100"
                              title="Decrease 30m"
                            >
                              -
                            </button>
                            <span className="font-mono font-bold text-[11px] w-12 text-center text-blue-600 dark:text-blue-400">
                              {formatTaskDuration(t.durationMin || 60)}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleAdjustTaskDuration(t.id, 30)}
                              className="w-5 h-5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-mono text-[10px] font-bold flex items-center justify-center cursor-pointer hover:bg-slate-100"
                              title="Increase 30m"
                            >
                              +
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteActivity(t.id)}
                              className="p-1 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer ml-0.5"
                              title="Delete activity"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 2. PILLAR 2: HOBBIES & CREATIVE PASSIONS */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#121927] border border-purple-200/80 dark:border-purple-900/50 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                  <Palette size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-bold text-purple-600 dark:text-purple-400 font-mono uppercase tracking-wider">Pillar 2</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-bold text-slate-400">Target: {pillarTargets.hobby.toFixed(1)}h</span>
                      <button
                        type="button"
                        onClick={() => setIsEditingHobbyTarget(!isEditingHobbyTarget)}
                        className="p-0.5 rounded hover:bg-purple-100 dark:hover:bg-purple-950/60 text-purple-600 dark:text-purple-400 cursor-pointer"
                        title="Edit Target Hobby Hours"
                      >
                        <Edit2 size={10} />
                      </button>
                    </div>
                  </div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {language === 'am' ? 'ተሰጥኦ፣ ቼስ፣ ሙዚቃና ስዕል' : 'Hobbies, Chess & Passions'}
                  </h3>
                </div>
              </div>

              <span className="text-base font-black font-mono text-purple-600 dark:text-purple-400">
                {pillarTotals.hobby.toFixed(1)} / {pillarTargets.hobby.toFixed(1)}h
              </span>
            </div>

            {/* Editable Hobby Target Drawer */}
            {isEditingHobbyTarget && (
              <div className="p-2.5 rounded-2xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-800 space-y-2 animate-fadeIn">
                <div className="flex items-center justify-between text-xs font-bold text-purple-900 dark:text-purple-200">
                  <span>Adjust Hobby Target:</span>
                  <button
                    type="button"
                    onClick={() => setIsEditingHobbyTarget(false)}
                    className="p-1 px-2 rounded-md bg-purple-600 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Check size={11} strokeWidth={3} /> <span>Done</span>
                  </button>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => updatePillarTarget('hobby', pillarTargets.hobby - 0.5)}
                    className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-100 font-mono font-bold flex items-center justify-center cursor-pointer hover:bg-purple-100"
                  >
                    -
                  </button>
                  <span className="px-3 py-1 bg-white dark:bg-slate-800 border border-purple-300 dark:border-purple-700 rounded-lg font-mono font-black text-purple-600 dark:text-purple-400 text-xs">
                    {pillarTargets.hobby.toFixed(1)} hrs
                  </span>
                  <button
                    type="button"
                    onClick={() => updatePillarTarget('hobby', pillarTargets.hobby + 0.5)}
                    className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-100 font-mono font-bold flex items-center justify-center cursor-pointer hover:bg-purple-100"
                  >
                    +
                  </button>
                  {[4, 6, 8, 9, 10].map(h => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => updatePillarTarget('hobby', h)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold cursor-pointer transition ${
                        pillarTargets.hobby === h
                          ? 'bg-purple-600 text-white'
                          : 'bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-800 text-slate-600 dark:text-slate-300 hover:bg-purple-50'
                      }`}
                    >
                      {h}h
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Progress Bar */}
            <div className="space-y-1">
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (pillarTotals.hobby / pillarTargets.hobby) * 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>{pillarTotals.hobbyRemaining > 0 ? `${pillarTotals.hobbyRemaining.toFixed(1)}h creative leisure left` : 'Fully Allocated'}</span>
                <span>{((pillarTotals.hobby / pillarTargets.hobby) * 100).toFixed(0)}% Utilized</span>
              </div>
            </div>

            {/* Quick Action Presets */}
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              {hobbyPresets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handleAddPresetBlock(preset)}
                  className="px-2.5 py-1 rounded-xl bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 text-purple-600 dark:text-purple-400 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer active:scale-95"
                >
                  <Plus size={11} /> <span>+{preset.hours.toFixed(0)}h {preset.label}</span>
                </button>
              ))}
            </div>

            {/* Inspect / Edit Hobby Activities Drawer */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsExpandedHobbyTasks(!isExpandedHobbyTasks)}
                className="w-full flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 cursor-pointer"
              >
                <span>Allocated Hobby Activities ({hobbyTasks.length})</span>
                {isExpandedHobbyTasks ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {isExpandedHobbyTasks && (
                <div className="mt-2.5 space-y-2 animate-fadeIn">
                  {hobbyTasks.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic">No hobby activities scheduled yet today.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {hobbyTasks.map((t) => (
                        <div key={t.id} className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: t.color || '#8b5cf6' }} />
                            <span className="font-bold truncate text-slate-800 dark:text-slate-200">{t.title}</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleAdjustTaskDuration(t.id, -30)}
                              className="w-5 h-5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-mono text-[10px] font-bold flex items-center justify-center cursor-pointer hover:bg-slate-100"
                              title="Decrease 30m"
                            >
                              -
                            </button>
                            <span className="font-mono font-bold text-[11px] w-12 text-center text-purple-600 dark:text-purple-400">
                              {formatTaskDuration(t.durationMin || 60)}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleAdjustTaskDuration(t.id, 30)}
                              className="w-5 h-5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-mono text-[10px] font-bold flex items-center justify-center cursor-pointer hover:bg-slate-100"
                              title="Increase 30m"
                            >
                              +
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteActivity(t.id)}
                              className="p-1 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer ml-0.5"
                              title="Delete activity"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 3. PILLAR 3: LIVING, HEALTH & VITALITY */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#121927] border border-emerald-200/80 dark:border-emerald-900/50 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Heart size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono uppercase tracking-wider">Pillar 3</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-bold text-slate-400">Target: {pillarTargets.living.toFixed(1)}h</span>
                      <button
                        type="button"
                        onClick={() => setIsEditingLivingTarget(!isEditingLivingTarget)}
                        className="p-0.5 rounded hover:bg-emerald-100 dark:hover:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 cursor-pointer"
                        title="Edit Target Living Hours"
                      >
                        <Edit2 size={10} />
                      </button>
                    </div>
                  </div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {language === 'am' ? 'የግል ኑሮ፣ ስፖርት፣ ጸሎትና እረፍት' : 'Living, Health & Restoration'}
                  </h3>
                </div>
              </div>

              <span className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400">
                {pillarTotals.living.toFixed(1)} / {pillarTargets.living.toFixed(1)}h
              </span>
            </div>

            {/* Editable Living Target Drawer */}
            {isEditingLivingTarget && (
              <div className="p-2.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800 space-y-2 animate-fadeIn">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-900 dark:text-emerald-200">
                  <span>Adjust Living Target:</span>
                  <button
                    type="button"
                    onClick={() => setIsEditingLivingTarget(false)}
                    className="p-1 px-2 rounded-md bg-emerald-600 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Check size={11} strokeWidth={3} /> <span>Done</span>
                  </button>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => updatePillarTarget('living', pillarTargets.living - 0.5)}
                    className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100 font-mono font-bold flex items-center justify-center cursor-pointer hover:bg-emerald-100"
                  >
                    -
                  </button>
                  <span className="px-3 py-1 bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 rounded-lg font-mono font-black text-emerald-600 dark:text-emerald-400 text-xs">
                    {pillarTargets.living.toFixed(1)} hrs
                  </span>
                  <button
                    type="button"
                    onClick={() => updatePillarTarget('living', pillarTargets.living + 0.5)}
                    className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100 font-mono font-bold flex items-center justify-center cursor-pointer hover:bg-emerald-100"
                  >
                    +
                  </button>
                  {[5, 6, 7, 8, 9, 10].map(h => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => updatePillarTarget('living', h)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold cursor-pointer transition ${
                        pillarTargets.living === h
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-50'
                      }`}
                    >
                      {h}h
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Progress Bar */}
            <div className="space-y-1">
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (pillarTotals.living / pillarTargets.living) * 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>{pillarTotals.livingRemaining > 0 ? `${pillarTotals.livingRemaining.toFixed(1)}h rest/recovery left` : 'Fully Allocated'}</span>
                <span>{((pillarTotals.living / pillarTargets.living) * 100).toFixed(0)}% Utilized</span>
              </div>
            </div>

            {/* Quick Action Presets */}
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              {livingPresets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handleAddPresetBlock(preset)}
                  className="px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer active:scale-95"
                >
                  <Plus size={11} /> <span>+{preset.hours.toFixed(1)}h {preset.label}</span>
                </button>
              ))}
            </div>

            {/* Inspect / Edit Living Activities Drawer */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsExpandedLivingTasks(!isExpandedLivingTasks)}
                className="w-full flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer"
              >
                <span>Allocated Living Activities ({livingTasks.length})</span>
                {isExpandedLivingTasks ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {isExpandedLivingTasks && (
                <div className="mt-2.5 space-y-2 animate-fadeIn">
                  {livingTasks.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic">No living activities logged yet today.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {livingTasks.map((t) => (
                        <div key={t.id} className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: t.color || '#10b981' }} />
                            <span className="font-bold truncate text-slate-800 dark:text-slate-200">{t.title}</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleAdjustTaskDuration(t.id, -30)}
                              className="w-5 h-5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-mono text-[10px] font-bold flex items-center justify-center cursor-pointer hover:bg-slate-100"
                              title="Decrease 30m"
                            >
                              -
                            </button>
                            <span className="font-mono font-bold text-[11px] w-12 text-center text-emerald-600 dark:text-emerald-400">
                              {formatTaskDuration(t.durationMin || 60)}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleAdjustTaskDuration(t.id, 30)}
                              className="w-5 h-5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-mono text-[10px] font-bold flex items-center justify-center cursor-pointer hover:bg-slate-100"
                              title="Increase 30m"
                            >
                              +
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteActivity(t.id)}
                              className="p-1 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer ml-0.5"
                              title="Delete activity"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
