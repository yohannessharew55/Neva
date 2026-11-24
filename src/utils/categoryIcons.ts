import {
  Swords, Palette, Music, Dumbbell, Building2, TrendingUp, BookOpen, Shield,
  Code, Flame, Target, Compass, Laptop, Feather, Briefcase, Heart,
  Brain, Camera, Video, Mic, Headphones, Gamepad2, Globe, GraduationCap,
  DollarSign, Rocket, Cpu, Lightbulb, Leaf, Coffee, Sun, Moon,
  Star, Award, Wrench, Calculator
} from 'lucide-react';

export const CATEGORY_PRESET_COLORS = [
  '#0082ff', // Electric Blue
  '#2563eb', // Royal Blue
  '#38bdf8', // Sky Blue
  '#06b6d4', // Cyan
  '#0d9488', // Teal
  '#10b981', // Emerald
  '#22c55e', // Green
  '#84cc16', // Lime
  '#eab308', // Yellow
  '#f59e0b', // Amber
  '#f97316', // Orange
  '#ef4444', // Red
  '#e11d48', // Crimson Rose
  '#ec4899', // Pink
  '#d946ef', // Fuchsia
  '#a855f7', // Purple
  '#8b5cf6', // Violet
  '#6366f1', // Indigo
  '#78716c', // Stone
  '#64748b', // Slate
  '#475569', // Charcoal
  '#1e293b', // Midnight
];

export const CATEGORY_ICON_OPTIONS = [
  { id: 'Swords', label: 'Chess / Battle', icon: Swords },
  { id: 'Palette', label: 'Art / Creative', icon: Palette },
  { id: 'Music', label: 'Music / Sound', icon: Music },
  { id: 'Dumbbell', label: 'Fitness / Strength', icon: Dumbbell },
  { id: 'Building2', label: 'Design / Arch', icon: Building2 },
  { id: 'TrendingUp', label: 'Trading / Market', icon: TrendingUp },
  { id: 'BookOpen', label: 'Devotion / Study', icon: BookOpen },
  { id: 'Shield', label: 'Rest / Buffer', icon: Shield },
  { id: 'Code', label: 'Coding / Software', icon: Code },
  { id: 'Flame', label: 'Sprint / Peak', icon: Flame },
  { id: 'Target', label: 'Precision Goal', icon: Target },
  { id: 'Compass', label: 'Exploration', icon: Compass },
  { id: 'Laptop', label: 'Deep Work', icon: Laptop },
  { id: 'Feather', label: 'Writing / Journal', icon: Feather },
  { id: 'Brain', label: 'Mind / Thinking', icon: Brain },
  { id: 'GraduationCap', label: 'Learning / Study', icon: GraduationCap },
  { id: 'Rocket', label: 'Startup / Launch', icon: Rocket },
  { id: 'Cpu', label: 'AI / Tech', icon: Cpu },
  { id: 'Lightbulb', label: 'Ideas / Research', icon: Lightbulb },
  { id: 'Briefcase', label: 'Career / Business', icon: Briefcase },
  { id: 'DollarSign', label: 'Finance / Wealth', icon: DollarSign },
  { id: 'Calculator', label: 'Math / Analytics', icon: Calculator },
  { id: 'Globe', label: 'Language / World', icon: Globe },
  { id: 'Camera', label: 'Photo / Visual', icon: Camera },
  { id: 'Video', label: 'Film / Video', icon: Video },
  { id: 'Mic', label: 'Podcast / Voice', icon: Mic },
  { id: 'Headphones', label: 'Audio / Listening', icon: Headphones },
  { id: 'Gamepad2', label: 'Gaming / Strategy', icon: Gamepad2 },
  { id: 'Heart', label: 'Health / Family', icon: Heart },
  { id: 'Leaf', label: 'Nature / Wellness', icon: Leaf },
  { id: 'Coffee', label: 'Break / Routine', icon: Coffee },
  { id: 'Sun', label: 'Morning / Energy', icon: Sun },
  { id: 'Moon', label: 'Evening / Sleep', icon: Moon },
  { id: 'Star', label: 'Mastery / Peak', icon: Star },
  { id: 'Award', label: 'Achievement', icon: Award },
  { id: 'Wrench', label: 'Engineering / Craft', icon: Wrench },
];

export const getDefaultCategoryIconId = (catId: string): string => {
  switch (catId) {
    case 'chess': return 'Swords';
    case 'art': return 'Palette';
    case 'music': return 'Music';
    case 'exercise': return 'Dumbbell';
    case 'architecture': return 'Building2';
    case 'trading': return 'TrendingUp';
    case 'devotion': return 'BookOpen';
    case 'buffer': return 'Shield';
    default: return 'Shield';
  }
};

export const resolveCategoryIcon = (catId: string, iconName?: string) => {
  const targetId = iconName || getDefaultCategoryIconId(catId);
  const found = CATEGORY_ICON_OPTIONS.find((item) => item.id === targetId);
  return found ? found.icon : Shield;
};

export const compressImageFileToDataUrl = (file: File, maxWidth = 1200, quality = 0.82): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(String(e.target?.result || ''));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = String(e.target?.result || '');
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
