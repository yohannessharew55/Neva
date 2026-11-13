# Livotion: Deliberate Mastery & Holistic Life Operating System (v2.0)

> **Livotion** is a cross-platform, local-first deliberate practice and holistic life operating system inspired by the Apex Horizon architecture. It synchronizes long-range strategic vision (Yearly, Quarterly, Monthly) with daily tactical execution (Daily Command Cockpit, Focus Stopwatch, Acoustic Triggers, 7-Day Workout Protocols, Precision Nutrition Cadence, and Retrospectives).

---

## 🌟 The 11 Core Domains

1. **Physical Fitness & Conditioning**: 7-day periodized resistance, Zone 2 cardio, mobility, and active recovery routines.
2. **Precision Nutrition & Meal Timing**: 2,400 kcal precision macro template (170g P, 250g C, 75g F) across 5 daily timed meals.
3. **Devotion & Spiritual Anchor**: Morning and evening scripture meditation, contemplative prayer, and gratitude review.
4. **Forex Trading**: High-focus session execution (London Open / NY overlap).
5. **Architectural Design**: Deep-work CAD/BIM modeling and construction detail delivery.
6. **Site Supervision**: Bi-weekly on-site structural inspections, contractor coordination, and punch-list audits.
7. **Chess Mastery**: Tactical calculation sprints, endgame principles (Lucena/Philidor), and master game retrospectives.
8. **Guitar Deliberate Practice**: Metronome ladders (120–145 BPM), arpeggio sweeps, and repertoire performance.
9. **Oil Painting & Fine Art**: Studio atelier sessions, layering chemistry (fat-over-lean), and color harmony.
10. **Content Creation & Distribution**: Multimedia asset creation and architectural publishing.
11. **Open Multipurpose Buffer & Cognitive Slack**: Two dedicated daily slots (75 min total) for emergencies, administrative logistics, and nervous system decompression.

---

## 🚀 Quick Start Guide

### 1. Launch the Local Development Cockpit
```bash
# In the Livotion project root:
npm run dev
```
Open your browser at `http://localhost:3000`.

### 2. Build for Production
```bash
npm run build
npm run preview
```

### 3. PostgreSQL Database Migration
The complete PostgreSQL schema and seed data are located in `packages/database/schema.sql`:
```bash
psql "$DATABASE_URL" -f packages/database/schema.sql
```

---

## 🏛️ Project Architecture & Components

```
Livotion/
├── packages/
│   └── database/
│       └── schema.sql                 # PostgreSQL DDL v2.0 (10 tables, enums, & seed data)
├── apps/
│   └── web/
│       └── src/
│           └── components/
│               └── TodayCockpitV2.tsx  # Spec-compliant cockpit component export
├── src/
│   ├── types/
│   │   └── index.ts                   # TypeScript data contracts & domain models
│   ├── data/
│   │   └── seedData.ts                # Complete 11-domain initial seed data & schedules
│   ├── utils/
│   │   └── audio.ts                   # Web Audio synthesizer (Chime, Tibetan Bowl, Gong, 432Hz)
│   ├── context/
│   │   └── LivotionContext.tsx        # Local-first persistence, focus timer, & reactive state
│   ├── components/
│   │   ├── Navbar.tsx                 # Navigation bar, sound selector & backup/restore
│   │   ├── TodayCockpitV2.tsx         # Daily Command Cockpit (Hero timer, blocks, fuel, buffer)
│   │   ├── MasterScheduleView.tsx     # 24-hour chronological timeline & block editor
│   │   ├── FitnessProtocolView.tsx    # 7-day periodized split with interactive rest timer
│   │   ├── PrecisionNutritionView.tsx # Macro fuel gauges, hydration tracker, & meal cadence
│   │   ├── StrategicHorizonsView.tsx  # Multi-horizon goal planning (Yearly -> Weekly)
│   │   ├── PracticeFlowView.tsx       # Focus stopwatch, Flow State Rating (1–5), & metrics
│   │   ├── RetrospectivesView.tsx     # Weekly & Monthly cycle review builder
│   │   └── DatabaseSchemaView.tsx     # In-app DDL viewer, SQL copy, & download
│   ├── App.tsx                        # Master application layout
│   ├── main.tsx                       # React 19 entrypoint
│   └── index.css                      # Tailwind CSS v4 styling & dark theme
├── vite.config.ts                     # Optimized Vite 8 bundler configuration
├── tsconfig.json                      # Strict TypeScript compiler configuration
└── package.json                       # Scripts and project dependencies
```

---

## 🔔 Acoustic Alarm & Sound Engine
Livotion features a native **Web Audio API synthesizer** (`src/utils/audio.ts`) that runs 100% offline with zero external audio assets:
- **Meditative Chime (528 Hz)**: Crystal harmonics for gentle awakening and transitions.
- **Tibetan Singing Bowl (432 Hz fundamental)**: Pulsating overtones for contemplation and spiritual closeout.
- **Zen Temple Gong (108 Hz)**: Grounding acoustic resonance for entering deep work.
- **Solfeggio Tone (432 Hz)**: Harmonic pulse for starting deliberate focus blocks.
- **Digital Alert**: High-contrast audible cues for rest timer expiration.

---

## 💾 Local-First Persistence & Portability
- **Automatic Sync**: State is continuously preserved in browser storage.
- **Data Export**: Download complete system state as a timestamped JSON file at any time.
- **Data Restore**: Upload a backup JSON file to seamlessly restore state.
- **Reset Option**: One-click restore to blueprint defaults.
