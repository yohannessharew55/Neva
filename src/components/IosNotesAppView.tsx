import React, { useState, useEffect, useRef } from 'react';
import { 
  SquarePen, Search, Pin, Trash2, Copy, Check, 
  ChevronLeft, Folder, Share2, ListTodo, Hash, 
  Clock, Sparkles, Plus, MoreHorizontal, ArrowLeft
} from 'lucide-react';
import { useLivotion } from '../context/LivotionContext';

export interface IosNoteItem {
  id: string;
  title: string;
  body: string;
  folder: 'Work' | 'Ideas' | 'Personal' | 'All';
  pinned: boolean;
  updatedAt: string;
}

const DEFAULT_NOTES: IosNoteItem[] = [
  {
    id: 'note-1',
    title: 'Neva Mastery OS • Core Directives',
    body: '1. Relentless daily execution beats erratic bursts.\n2. 90-minute Ultradian blocks for deep cognitive architecture.\n3. Keep the schedule clean, minimalist, and truthful.\n\n- [x] Morning devotional reading\n- [x] Strength training compound lift\n- [ ] Evening review & day closeout',
    folder: 'Work',
    pinned: true,
    updatedAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'note-2',
    title: 'Guitar Solo Phrasing & Dorian Scale',
    body: 'Focus on hitting the 6th degree on the resolution chord.\nUse subtle vibrato on whole-tone bends at 12th fret.\n\nKey practice chords:\n- Dm7 -> G7 -> Cmaj7\n- Target tempo: 110 BPM with clean articulation.',
    folder: 'Ideas',
    pinned: false,
    updatedAt: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 'note-3',
    title: 'Architecture & Site Supervision Checkpoints',
    body: 'Foundation pour verification:\n- Check rebar spacing on grid B-4\n- Verify concrete slump test before pour\n- Confirm curing compound spray coverage',
    folder: 'Work',
    pinned: false,
    updatedAt: new Date(Date.now() - 172800000).toISOString()
  }
];

export const IosNotesAppView: React.FC = () => {
  const { language } = useLivotion();
  const [notes, setNotes] = useState<IosNoteItem[]>(() => {
    try {
      const saved = localStorage.getItem('livotion_apple_notes_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_NOTES;
  });

  const [activeNoteId, setActiveNoteId] = useState<string>(() => {
    return notes[0]?.id || '';
  });

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFolder, setSelectedFolder] = useState<string>('All');
  const [isMobileEditorOpen, setIsMobileEditorOpen] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const activeNote = notes.find((n) => n.id === activeNoteId) || notes[0];

  useEffect(() => {
    try {
      localStorage.setItem('livotion_apple_notes_v1', JSON.stringify(notes));
    } catch (e) {}
  }, [notes]);

  const handleCreateNote = () => {
    const newNote: IosNoteItem = {
      id: `note-${Date.now()}`,
      title: language === 'am' ? 'አዲስ ማስታወሻ' : 'New Note',
      body: '',
      folder: (selectedFolder === 'All' ? 'Work' : selectedFolder) as any,
      pinned: false,
      updatedAt: new Date().toISOString()
    };

    setNotes((prev) => [newNote, ...prev]);
    setActiveNoteId(newNote.id);
    setIsMobileEditorOpen(true);
  };

  const handleUpdateActiveNote = (updates: Partial<IosNoteItem>) => {
    if (!activeNote) return;
    setNotes((prev) =>
      prev.map((n) =>
        n.id === activeNote.id
          ? { ...n, ...updates, updatedAt: new Date().toISOString() }
          : n
      )
    );
  };

  const handleDeleteNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (activeNoteId === id) {
      const remaining = notes.filter((n) => n.id !== id);
      if (remaining.length > 0) {
        setActiveNoteId(remaining[0].id);
      } else {
        setActiveNoteId('');
        setIsMobileEditorOpen(false);
      }
    }
  };

  const togglePin = (id: string) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n))
    );
  };

  const handleCopyNote = (note: IosNoteItem) => {
    try {
      navigator.clipboard.writeText(`${note.title}\n\n${note.body}`);
      setCopiedId(note.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (e) {}
  };

  const insertTextAtCursor = (prefix: string) => {
    if (!activeNote) return;
    const newBody = activeNote.body ? `${activeNote.body}\n${prefix}` : prefix;
    handleUpdateActiveNote({ body: newBody });
  };

  // Filter notes by search & folder
  const filteredNotes = notes.filter((note) => {
    const matchesSearch =
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.body.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFolder = selectedFolder === 'All' || note.folder === selectedFolder;
    return matchesSearch && matchesFolder;
  });

  // Sort: pinned first, then by updatedAt desc
  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  const formatDateLabel = (isoStr: string) => {
    const date = new Date(isoStr);
    const now = new Date();
    const diffHours = (now.getTime() - date.getTime()) / 3600000;
    if (diffHours < 24 && now.getDate() === date.getDate()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatFullDate = (isoStr: string) => {
    const date = new Date(isoStr);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    }) + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const folders = ['All', 'Work', 'Ideas', 'Personal'];

  return (
    <div className="w-full max-w-7xl xl:max-w-screen-2xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 animate-fadeIn select-none">
      
      {/* Outer Shell styled with Apple Notes warm/slate aesthetics */}
      <div className="bg-white dark:bg-[#111724] border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden min-h-[640px] flex flex-col md:flex-row">
        
        {/* ================= LEFT COLUMN: Notes List ================= */}
        <div className={`w-full md:w-80 lg:w-96 border-r border-slate-200/80 dark:border-slate-800/80 flex flex-col bg-slate-50/70 dark:bg-[#0e1420]/80 shrink-0 ${
          isMobileEditorOpen ? 'hidden md:flex' : 'flex'
        }`}>
          
          {/* Top Bar: Title & New Note Button */}
          <div className="p-4 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-amber-600 dark:text-amber-400 block">
                {language === 'am' ? 'የአይፎን ማስታወሻ' : 'iCloud • Notes'}
              </span>
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                {language === 'am' ? 'ማስታወሻዎች' : 'Notes'}
              </h2>
            </div>

            <button
              onClick={handleCreateNote}
              className="p-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-1 text-xs font-bold"
              title="Create new note"
            >
              <SquarePen size={16} />
              <span className="hidden sm:inline">{language === 'am' ? 'አዲስ' : 'New'}</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="px-3 pt-3 pb-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === 'am' ? 'ማስታወሻዎችን ፈልግ...' : 'Search all notes...'}
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-amber-500 transition"
              />
            </div>
          </div>

          {/* Folder Pills */}
          <div className="px-3 pb-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {folders.map((f) => (
              <button
                key={f}
                onClick={() => setSelectedFolder(f)}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition cursor-pointer shrink-0 ${
                  selectedFolder === f
                    ? 'bg-amber-500 text-white shadow-2xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Notes List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 p-2 space-y-1">
            {sortedNotes.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                {language === 'am' ? 'ምንም ማስታወሻ አልተገኘም' : 'No notes found.'}
              </div>
            ) : (
              sortedNotes.map((note) => {
                const isSelected = activeNote?.id === note.id;
                const snippet = note.body.replace(/[\n\r]+/g, ' ').slice(0, 75);

                return (
                  <div
                    key={note.id}
                    onClick={() => {
                      setActiveNoteId(note.id);
                      setIsMobileEditorOpen(true);
                    }}
                    className={`p-3 rounded-2xl cursor-pointer transition text-left relative group ${
                      isSelected
                        ? 'bg-amber-100/70 dark:bg-amber-950/40 border border-amber-300/60 dark:border-amber-800/60 shadow-2xs'
                        : 'hover:bg-white dark:hover:bg-slate-900/60 border border-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                        {note.title || (language === 'am' ? 'ያለ ርዕስ' : 'Untitled Note')}
                      </h4>
                      {note.pinned && (
                        <Pin size={12} className="text-amber-500 fill-amber-500 shrink-0 mt-0.5" />
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400 font-mono">
                      <span className="font-bold text-slate-500 dark:text-slate-400">
                        {formatDateLabel(note.updatedAt)}
                      </span>
                      <span className="truncate text-slate-600 dark:text-slate-400 font-sans">
                        {snippet || (language === 'am' ? 'ምንም ተጨማሪ ጽሁፍ የለም' : 'No additional text')}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Bottom Bar: Total count */}
          <div className="p-3 border-t border-slate-200/80 dark:border-slate-800/80 text-center text-[11px] font-mono font-bold text-slate-400">
            {notes.length} {language === 'am' ? 'ማስታወሻዎች' : 'Notes'}
          </div>
        </div>

        {/* ================= RIGHT COLUMN: Active Note Editor ================= */}
        <div className={`flex-1 flex flex-col bg-white dark:bg-[#111724] ${
          !isMobileEditorOpen ? 'hidden md:flex' : 'flex'
        }`}>
          {activeNote ? (
            <div className="flex-1 flex flex-col h-full">
              
              {/* Note Editor Header / Actions */}
              <div className="p-3.5 sm:p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                
                {/* Mobile Back Button */}
                <button
                  onClick={() => setIsMobileEditorOpen(false)}
                  className="md:hidden flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 hover:text-amber-700 cursor-pointer p-1"
                >
                  <ChevronLeft size={18} />
                  <span>{language === 'am' ? 'ማስታወሻዎች' : 'Notes'}</span>
                </button>

                {/* Date & Meta */}
                <div className="hidden md:flex items-center gap-2 text-[11px] font-mono text-slate-400">
                  <Clock size={12} />
                  <span>{formatFullDate(activeNote.updatedAt)}</span>
                </div>

                {/* Formatting Tools & Actions */}
                <div className="flex items-center gap-1 sm:gap-1.5 ml-auto">
                  <button
                    type="button"
                    onClick={() => insertTextAtCursor('- [ ] ')}
                    className="p-1.5 sm:px-2.5 sm:py-1 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1 text-xs font-medium cursor-pointer"
                    title="Insert Checklist Item"
                  >
                    <ListTodo size={15} className="text-amber-500" />
                    <span className="hidden sm:inline">Checklist</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => insertTextAtCursor('### ')}
                    className="p-1.5 sm:px-2.5 sm:py-1 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1 text-xs font-medium cursor-pointer"
                    title="Insert Heading"
                  >
                    <Hash size={15} className="text-amber-500" />
                    <span className="hidden sm:inline">Heading</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => togglePin(activeNote.id)}
                    className={`p-2 rounded-xl transition cursor-pointer ${
                      activeNote.pinned
                        ? 'bg-amber-100 text-amber-600 dark:bg-amber-950/80 dark:text-amber-400'
                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                    title={activeNote.pinned ? 'Unpin Note' : 'Pin to Top'}
                  >
                    <Pin size={15} />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopyNote(activeNote)}
                    className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    title="Copy Note Content"
                  >
                    {copiedId === activeNote.id ? <Check size={15} className="text-emerald-500" /> : <Copy size={15} />}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteNote(activeNote.id)}
                    className="p-2 text-slate-400 hover:text-red-500 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
                    title="Delete Note"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {/* Note Content Area */}
              <div className="flex-1 p-5 sm:p-8 flex flex-col space-y-3 overflow-y-auto">
                
                {/* Note Title Input */}
                <input
                  type="text"
                  value={activeNote.title}
                  onChange={(e) => handleUpdateActiveNote({ title: e.target.value })}
                  placeholder={language === 'am' ? 'የማስታወሻው ርዕስ...' : 'Note Title...'}
                  className="w-full text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-700 bg-transparent outline-none tracking-tight border-none p-0"
                />

                {/* Sub-header timestamp on mobile */}
                <div className="md:hidden text-[11px] font-mono text-slate-400 pb-2 border-b border-slate-100 dark:border-slate-800">
                  {formatFullDate(activeNote.updatedAt)}
                </div>

                {/* Note Body Textarea */}
                <textarea
                  value={activeNote.body}
                  onChange={(e) => handleUpdateActiveNote({ body: e.target.value })}
                  placeholder={language === 'am' ? 'እዚህ መፃፍ ይጀምሩ...' : 'Start typing your note, ideas, checklists, or phone numbers here...'}
                  className="w-full flex-1 min-h-[380px] text-sm sm:text-base font-normal leading-relaxed text-slate-800 dark:text-slate-200 placeholder:text-slate-300 dark:placeholder:text-slate-700 bg-transparent outline-none resize-none p-0 select-text"
                />
              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-3">
              <SquarePen size={32} className="text-amber-500 opacity-60" />
              <p className="text-sm">
                {language === 'am' ? 'ምንም የተመረጠ ማስታወሻ የለም።' : 'Select a note or create a new one.'}
              </p>
              <button
                onClick={handleCreateNote}
                className="px-4 py-2 bg-amber-500 text-white rounded-2xl text-xs font-bold cursor-pointer"
              >
                {language === 'am' ? 'አዲስ ማስታወሻ ፍጠር' : 'Create Note'}
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
