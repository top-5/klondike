# Klondike Solitaire - Enhancement Roadmap

> **Project Status**: Production-ready serverless Klondike Solitaire with React 18 + TypeScript 5.7, custom drag-and-drop, spritesheet rendering, sound effects, and full touch support.
>
> **Vision**: Transform the game into a multi-purpose AI training platform for visual comprehension, reinforcement learning, and multi-variant solitaire experimentation.

---

## 🧠 AI & Machine Learning Features

### 1. AI-Assisted Move System

**Goal**: Help players improve strategy while generating supervised learning datasets.

#### 1.1 Hint System (Heuristic-Based)
- [ ] Implement `getValidMoves(state: GameState): Move[]` in `gameLogic.ts`
- [ ] Add move ranking heuristic (prioritize: reveal hidden cards > build foundations > uncover tableau)
- [ ] Create `HintEngine` class in `src/ai/hintEngine.ts`
- [ ] Add UI hint button component (show top 3 suggested moves)
- [ ] Display explainable hints: "Moving ♣6 opens a hidden card on pile 3"
- [ ] Track hint acceptance rate in telemetry

**Technical Notes**:
- Extend `GameState` interface to include `suggestedMoves?: Move[]`
- Use existing `canPlaceOnTableau()` and `canPlaceOnFoundation()` validators
- Hint overlay should highlight source/target piles with CSS animation

#### 1.2 Reinforcement Learning Mode
- [ ] Create `AIAgent` interface in `src/ai/types.ts`
- [ ] Implement `playAutonomously(agent: AIAgent, state: GameState): Observable<Move>`
- [ ] Add configurable playback speed (1x, 2x, 10x, instant)
- [ ] Log full state transitions: `(state, action, reward, next_state)`
- [ ] Export RL episodes as JSON for external training
- [ ] Add visual indicator when AI is playing

**Technical Notes**:
- Reward function: +10 for foundation move, +5 for reveal, -1 per move
- Use existing `moveCards()` and `drawFromStock()` logic
- Store episodes in IndexedDB for large datasets

#### 1.3 Policy Network Integration
- [ ] Define `PolicyModel` interface (input: state vector, output: move probabilities)
- [ ] Add ONNX.js runtime for in-browser model inference
- [ ] Create state vectorizer: `encodeState(state: GameState): Float32Array`
- [ ] Implement model-driven hint system (replace heuristics)
- [ ] Add A/B testing framework to compare heuristic vs. ML hints

**Dependencies**: `onnxruntime-web`, state encoding research

---

### 2. AI-Generated Card Decks

**Goal**: Procedurally generate themed card decks for personalization and style transfer research.

#### 2.1 Theme System Architecture
- [ ] Create `DeckTheme` interface in `src/types.ts`:
  ```typescript
  interface DeckTheme {
    id: string;
    name: string;
    style: 'abstract' | 'watercolor' | 'pixel' | 'cyberpunk' | 'retro' | 'custom';
    generator?: 'procedural' | 'ai-model' | 'user-upload';
    sprites: CardImageMap;
  }
  ```
- [ ] Add theme selector dropdown in header
- [ ] Implement theme loader in `cardSprites.ts` (extend `loadCardSprites()`)
- [ ] Store selected theme in localStorage

#### 2.2 Procedural SVG Generation
- [ ] Create `ProceduralDeckGenerator` class in `src/themes/procedural.ts`
- [ ] Implement parametric SVG card templates (vary colors, patterns, suit symbols)
- [ ] Add 5 preset themes: Classic, Neon, Minimalist, Watercolor, Retro MS Solitaire
- [ ] Generate deck on-the-fly from theme parameters

**Technical Notes**:
- Use Canvas API or SVG.js for runtime rendering
- Cache generated decks in IndexedDB (avoid regeneration)

#### 2.3 AI Model Integration (Future)
- [ ] Research local SDXL-Turbo or DALL·E mini integration
- [ ] Create prompt templates: "pixel art {rank} of {suit}, retro gaming style"
- [ ] Add user upvote system for generated decks
- [ ] Collect preference data for fine-tuning aesthetic models

**Dependencies**: Consider WebGPU support for local diffusion models

---

### 3. AI Commentary & Coaching

**Goal**: Provide natural language feedback on player strategy using local LLM.

- [ ] Integrate lightweight LLM (e.g., Phi-3 via transformers.js or Ollama API)
- [ ] Implement `StrategyAnalyzer` class that parses move history
- [ ] Generate contextual feedback:
  - "You're favoring pile 7; try recycling stock earlier"
  - "Good! You revealed 3 hidden cards this game"
- [ ] Display commentary in collapsible sidebar
- [ ] Log (game_state, natural_language_feedback) pairs for supervised training

**Technical Notes**:
- Use 4k token context window LLM
- Run inference on worker thread to avoid UI blocking
- Store commentary prompts as templates in `src/ai/prompts/`

---

## 📊 Telemetry & Instrumentation

### 4. Comprehensive Event Tracking

**Goal**: Capture fine-grained interaction data for model training and UX analysis.

#### 4.1 Telemetry Schema
- [ ] Define `TelemetryEvent` types in `src/telemetry/types.ts`:
  ```typescript
  type TelemetryEvent =
    | { t: 'move'; ts: number; from: string; to: string; valid: boolean; revealed?: string | null; }
    | { t: 'capture'; ts: number; fullPage: boolean; w: number; h: number; }
    | { t: 'hint'; ts: number; policy: 'heuristic' | 'llm'; accepted: boolean; }
    | { t: 'gesture'; ts: number; type: 'drag' | 'touch' | 'click'; duration: number; precision: number; }
    | { t: 'eval'; ts: number; metric: 'vision-acc' | 'policy-winrate'; value: number; deckId: string; };
  ```

#### 4.2 Telemetry Infrastructure
- [ ] Create `TelemetryService` class in `src/telemetry/service.ts`
- [ ] Implement `track(event: TelemetryEvent): void` wrapper
- [ ] Add batching and local storage buffer (send every 50 events or 30s)
- [ ] Integrate OpenTelemetry exporter (optional: export to Supabase/PostHog)
- [ ] Add telemetry toggle in settings (GDPR compliance)

#### 4.3 Instrumentation Points
- [ ] Wrap all `setGameState()` calls with move tracking
- [ ] Track drag gesture metrics: `{ startX, startY, endX, endY, duration, path[] }`
- [ ] Log invalid move attempts (useful for UX improvement)
- [ ] Track undo frequency (if undo feature added)
- [ ] Capture per-game summary: `{ moves, time, hintsUsed, winRate }`

**Technical Notes**:
- Use `navigator.sendBeacon()` for reliable event delivery
- Compress telemetry JSON with gzip before sending
- Store locally in IndexedDB if backend unavailable

---

### 5. Visual Perception Dataset

**Goal**: Generate labeled datasets for computer vision model training.

#### 5.1 DOM State Exposure
- [ ] Create `GameStateProbe` component in `src/components/GameStateProbe.tsx`
- [ ] Render hidden JSON in DOM:
  ```html
  <script id="__solitaire_state_truth__" type="application/json">
    {"deckId":"123","visible":[["5♦"],["6♣","Q♠"]], ...}
  </script>
  ```
- [ ] Include visible-only and canonical (full) state
- [ ] Add `?debug=1` flag to enable truth exposure (disable in production)

#### 5.2 Capture API
- [ ] Add `/api/capture` endpoint (or Playwright MCP integration)
- [ ] Return PNG/JPG snapshot + bounding box metadata:
  ```json
  {
    "image": "data:image/png;base64,...",
    "cards": [{"suit":"♠","rank":"Q","x":420,"y":180,"visible":true}]
  }
  ```
- [ ] Generate bounding boxes from rendered card positions
- [ ] Include occlusion metadata (partially overlapped cards)

#### 5.3 Vision Evaluation Loop
- [ ] Implement `compareVisionToTruth(prediction, truth): Diff[]`
- [ ] Track perception accuracy metrics:
  - Card recognition rate (suit/rank)
  - Pile structure accuracy (order, count)
  - Occlusion reasoning (hidden card inference)
- [ ] Log hallucination cases for model debugging

---

## 🎮 User-Facing Enhancements

### 6. Gameplay Features

#### 6.1 Undo/Redo System
- [ ] Implement move history stack in `GameState`
- [ ] Add undo/redo buttons in header
- [ ] Track undo frequency in telemetry
- [ ] Disable undo in "AI Training Mode"

#### 6.2 Statistics & Analytics Dashboard
- [ ] Create `StatsView` component with charts (use Chart.js or Recharts)
- [ ] Display metrics:
  - Win rate by session
  - Average moves/time per game
  - Move efficiency histogram
  - Hint acceptance rate
- [ ] Store historical data in IndexedDB
- [ ] Export stats as CSV/JSON

#### 6.3 Game Modes
- [ ] Add mode selector: "Classic", "Arcade", "AI Lab"
- [ ] **Classic**: Standard Klondike rules
- [ ] **Arcade**: Timed mode, scoring system
- [ ] **AI Lab Mode**: Visible model predictions, state inspector, telemetry overlay

#### 6.4 Custom Deck Upload
- [ ] Add file upload button for PNG spritesheet
- [ ] Validate spritesheet dimensions (4x13 grid)
- [ ] AI auto-generate missing cards (e.g., if user uploads partial deck)
- [ ] Store custom decks in IndexedDB

---

### 7. Social & Competitive Features

- [ ] Add leaderboard (integrate Supabase or Firebase)
- [ ] Track global stats: fastest win, fewest moves
- [ ] Add daily challenge mode (same seed for all players)
- [ ] Replay viewer: save and share game replays
- [ ] Multi-agent experiment mode: side-by-side AI strategy comparison

---

## 🧩 Multi-Variant Solitaire Support

### 8. Modular Game Engine

**Goal**: Refactor core logic to support multiple solitaire variants (Spider, FreeCell, Pyramid, etc.)

#### 8.1 Abstract Game Engine
- [ ] Create `GameEngine` interface in `src/engine/types.ts`:
  ```typescript
  interface GameEngine<TState> {
    id: string;
    name: string;
    createInitialState(): TState;
    isValidMove(state: TState, move: Move): boolean;
    applyMove(state: TState, move: Move): TState | null;
    isWon(state: TState): boolean;
    getAvailableMoves(state: TState): Move[];
  }
  ```
- [ ] Extract Klondike logic into `KlondikeEngine` class
- [ ] Migrate `gameLogic.ts` functions into engine class methods

#### 8.2 Variant Registry
- [ ] Create `VariantRegistry` in `src/engine/registry.ts`
- [ ] Implement dynamic variant loading:
  ```typescript
  registry.register(new KlondikeEngine());
  registry.register(new SpiderEngine());
  const engine = registry.get('klondike');
  ```
- [ ] Add variant selector in UI

#### 8.3 Variant Implementations

##### Spider Solitaire
- [ ] Create `SpiderEngine` in `src/variants/spider.ts`
- [ ] Unique rules: 2 decks, build sequences in suit, tableau refill logic
- [ ] Adjust UI for 10 tableau columns
- [ ] Estimated effort: **2-3 days**

##### FreeCell
- [ ] Create `FreeCellEngine` in `src/variants/freecell.ts`
- [ ] Unique rules: no hidden cards, 4 free cells, no stock/waste
- [ ] Adjust UI for free cell slots
- [ ] Estimated effort: **2 days**

##### Pyramid
- [ ] Create `PyramidEngine` in `src/variants/pyramid.ts`
- [ ] Unique rules: pair sums to 13, pyramid layout
- [ ] Custom tableau renderer (tree structure)
- [ ] Estimated effort: **2-3 days**

##### TriPeaks / Golf
- [ ] Create `TriPeaksEngine` and `GolfEngine`
- [ ] Sequential rank building with discard piles
- [ ] Estimated effort: **1-2 days each**

**Technical Notes**:
- Abstract pile rendering: `<Pile layout={engine.getPileLayout()} />`
- Reuse existing `Card`, `Move`, telemetry infrastructure
- Each variant shares the same AI/telemetry/theme systems

---

## 🔌 API & Integration Layer

### 9. Playwright MCP Integration

**Goal**: Expose structured APIs for external AI agents via Model Context Protocol.

#### 9.1 MCP Server Setup
- [ ] Create `mcp/solitaire-playwright/` directory
- [ ] Implement `server.ts` with Playwright browser automation
- [ ] Define MCP tools (see detailed implementation in ChatGPT response):
  - `get_visible_state`: Return visible game state from DOM
  - `get_truth_state`: Return canonical state (debug mode only)
  - `capture_image`: Screenshot + bounding box metadata
  - `play_move`: Perform move via drag-and-drop simulation
  - `new_game`: Start new game session
  - `compare_vision_to_truth`: Evaluate CV model predictions

#### 9.2 DOM Instrumentation
- [ ] Add `data-testid` attributes to all interactive elements:
  ```html
  <div data-testid="pile-0">
  <div data-testid="stock">
  <div data-testid="foundation-S">
  ```
- [ ] Integrate `GameStateProbe` component (see section 5.1)
- [ ] Expose optional `window.__solitaire_newGame__()` API for MCP

#### 9.3 Security & Configuration
- [ ] Gate `get_truth_state` behind `?debug=1` query param
- [ ] Rate-limit `capture_image` (max 10 req/min)
- [ ] Add CORS headers for localhost MCP connections
- [ ] Document MCP setup in `docs/MCP_INTEGRATION.md`

**Technical Notes**:
- MCP server runs as separate Node.js process
- Playwright connects to dev server at `http://localhost:10010`
- Use headless mode for training, headful for debugging

---

### 10. REST API (Optional)

**Goal**: Provide HTTP endpoints for non-MCP integrations.

- [ ] Create `src/api/` directory with Vite serverless functions
- [ ] Endpoints:
  - `GET /api/session/current`: Get current session metadata
  - `POST /api/session/new`: Start new game, return deck ID + layout
  - `GET /api/state`: Current game state JSON
  - `POST /api/action`: Perform move
  - `GET /api/history`: Full move log
  - `GET /api/capture`: PNG snapshot + metadata
- [ ] Use existing `gameLogic.ts` functions as backend
- [ ] Add authentication (if storing user data)

**Alternative**: Use Supabase Edge Functions or Cloudflare Workers

---

## 🎨 UI/UX Improvements

### 11. Accessibility & Responsiveness

- [ ] Add keyboard navigation (arrow keys to move focus, Enter to select)
- [ ] Improve screen reader support (ARIA labels, live regions)
- [ ] Add color-blind mode (alternative suit symbols/colors)
- [ ] Optimize for tablet landscape mode (current layout works best portrait)

### 12. Advanced Animations

- [ ] Add card flip animation (3D CSS transform)
- [ ] Particle effects on foundation completion (confetti)
- [ ] Smooth card stacking transitions
- [ ] Replay mode with variable speed playback

### 13. Settings Panel

- [ ] Create settings modal:
  - Sound volume slider
  - Animation speed
  - Theme selection
  - Telemetry opt-in/out
  - AI hint difficulty
- [ ] Persist settings in localStorage

---

## 🧪 Testing & Quality

### 14. Test Coverage

- [ ] Increase unit test coverage (currently minimal):
  - `gameLogic.ts`: Test all move validation functions
  - `cardSprites.ts`: Mock spritesheet loading
  - `soundEffects.ts`: Test audio playback
- [ ] Add integration tests with React Testing Library
- [ ] Playwright E2E tests:
  - Complete game playthrough
  - Drag-and-drop on desktop/mobile
  - Theme switching
  - AI hint acceptance

### 15. Performance Optimization

- [ ] Profile React re-renders (use React DevTools Profiler)
- [ ] Memoize card rendering (React.memo on card components)
- [ ] Lazy-load AI models (defer until hint button clicked)
- [ ] Optimize spritesheet size (WebP format, resolution tuning)
- [ ] Add service worker for offline gameplay

---

## 📚 Documentation

### 16. Developer Documentation

- [ ] Create `docs/ARCHITECTURE.md`: System design, component hierarchy
- [ ] Create `docs/AI_TRAINING.md`: How to use telemetry data, model integration guide
- [ ] Create `docs/VARIANT_GUIDE.md`: How to add new solitaire variants
- [ ] Create `docs/MCP_INTEGRATION.md`: Playwright MCP setup instructions
- [ ] Update `README.md` with new features and roadmap

### 17. User Documentation

- [ ] Add in-game tutorial (first-time user onboarding)
- [ ] Create `docs/GAME_RULES.md`: Klondike rules, strategy tips
- [ ] Add FAQ section

---

## 🚀 Deployment & Infrastructure

### 18. CI/CD Enhancements

- [ ] Add automated testing to GitHub Actions workflow
- [ ] Add bundle size monitoring (warn if >500KB)
- [ ] Add Lighthouse performance audits on PR
- [ ] Deploy preview builds for PRs (Vercel/Netlify preview)

### 19. Analytics & Monitoring

- [ ] Integrate privacy-friendly analytics (Plausible or Fathom)
- [ ] Add error tracking (Sentry or Rollbar)
- [ ] Monitor WebVitals (CLS, LCP, FID)

---

## 🔮 Future Research Directions

### 20. Advanced AI Experiments

- [ ] Self-play RL training pipeline (collect millions of games)
- [ ] Imitation learning from human expert replays
- [ ] Multi-objective optimization (minimize moves AND time)
- [ ] Transfer learning across solitaire variants
- [ ] Visual attention heatmaps (where do humans look during play?)

### 21. Generative Models

- [ ] Fine-tune diffusion model on solitaire card datasets
- [ ] Text-to-deck generation ("cyberpunk neon cards")
- [ ] Style transfer between deck themes

### 22. Multimodal Experiments

- [ ] Voice commands ("move red 7 to black 8")
- [ ] Gaze tracking for accessibility research
- [ ] Gesture recognition (custom hand poses for moves)

---

## 📋 Implementation Priority Matrix

### Phase 1: Core AI Infrastructure (4-6 weeks)
1. Telemetry system (section 4)
2. DOM state exposure (section 5.1)
3. Heuristic hint system (section 1.1)
4. Basic statistics dashboard (section 6.2)

### Phase 2: MCP & Vision (3-4 weeks)
1. Playwright MCP server (section 9)
2. Capture API + bounding boxes (section 5.2)
3. Vision evaluation loop (section 5.3)
4. Undo/redo system (section 6.1)

### Phase 3: Variant Support (4-6 weeks)
1. Abstract game engine (section 8.1-8.2)
2. FreeCell variant (section 8.3)
3. Spider variant (section 8.3)
4. Theme system (section 2.1-2.2)

### Phase 4: Advanced AI (6-8 weeks)
1. Policy network integration (section 1.3)
2. RL mode (section 1.2)
3. AI commentary (section 3)
4. Procedural deck generation (section 2.2)

---

## 🛠️ Technical Debt & Refactoring

### Current Code Structure (✅ = Good, ⚠️ = Needs Work)

- ✅ **Types** (`types.ts`): Clean, well-defined interfaces
- ✅ **Game Logic** (`gameLogic.ts`): Pure functions, testable
- ✅ **Rendering** (`cardSprites.ts`): Efficient spritesheet extraction
- ⚠️ **App Component** (`App.tsx`): ~400 lines, needs decomposition
  - Extract `<TableauColumn>`, `<StockPile>`, `<FoundationPile>` components
  - Move drag-and-drop logic to custom hook (`useDragAndDrop.ts`)
- ⚠️ **State Management**: useState is sufficient now, but consider Zustand/Jotai for multi-variant support
- ⚠️ **Error Handling**: Add try-catch blocks around card sprite loading

### Suggested Refactoring
```
src/
├── components/
│   ├── game/
│   │   ├── TableauColumn.tsx
│   │   ├── StockPile.tsx
│   │   ├── FoundationPile.tsx
│   │   └── CardRenderer.tsx
│   ├── ui/
│   │   ├── Header.tsx
│   │   ├── StatsPanel.tsx
│   │   └── SettingsModal.tsx
│   └── GameStateProbe.tsx
├── hooks/
│   ├── useDragAndDrop.ts
│   ├── useGameState.ts
│   └── useTelemetry.ts
├── engine/
│   ├── types.ts (GameEngine interface)
│   ├── registry.ts
│   └── klondike.ts (refactored gameLogic.ts)
├── variants/
│   ├── spider.ts
│   ├── freecell.ts
│   └── pyramid.ts
├── ai/
│   ├── hintEngine.ts
│   ├── policyModel.ts
│   └── prompts/
├── telemetry/
│   ├── types.ts
│   └── service.ts
└── themes/
    ├── procedural.ts
    └── loader.ts
```

---

## ✅ Current Strengths (Keep Intact)

1. **Custom Drag-and-Drop**: Robust mouse + touch support with precise positioning
2. **Spritesheet Rendering**: Efficient, scalable for theme swapping
3. **Sound Integration**: Clean `SoundManager` abstraction
4. **Serverless Architecture**: No backend dependencies (perfect for GitHub Pages)
5. **TypeScript Strictness**: Strong typing prevents runtime errors
6. **Build Pipeline**: Vite + GitHub Actions CI/CD working smoothly

---

## 📝 Notes on Difficulty Estimates

**Adding New Solitaire Variants**:
- **Easy** (1-2 days): Golf, TriPeaks (simple rule variations)
- **Medium** (2-3 days): Spider, FreeCell (new pile types, UI adjustments)
- **Hard** (4-5 days): Pyramid (custom layout renderer)

**AI Integration Complexity**:
- **Heuristic hints**: Low (use existing move validators)
- **RL training loop**: Medium (state encoding, reward design)
- **Vision model**: High (requires bounding box generation, CV model selection)
- **Local LLM commentary**: High (4GB+ model, worker thread management)

**MCP vs. REST API**:
- **MCP**: Better for AI agent integration (structured tools, stdio protocol)
- **REST**: Better for web/mobile apps, third-party integrations
- **Recommendation**: Start with MCP for training, add REST if public API needed

---

## 🎯 Success Metrics

### AI Training Platform
- [ ] 1000+ recorded games in telemetry database
- [ ] Vision model achieves >95% card recognition accuracy
- [ ] RL agent wins >50% of games (vs. 20% random baseline)
- [ ] Hint acceptance rate >60%

### User Engagement
- [ ] 10,000+ games played (GitHub Pages analytics)
- [ ] Average session time >5 minutes
- [ ] User-submitted custom themes (if upload feature added)

### Code Quality
- [ ] 80%+ test coverage
- [ ] <300ms page load time (Lighthouse)
- [ ] Zero critical accessibility violations (aXe audit)

---

## 🤝 Contributing

This roadmap is living documentation. Priorities may shift based on:
- User feedback
- AI research advancements
- Performance profiling results
- External integrations (e.g., new MCP capabilities)

For questions or suggestions, open an issue on GitHub.

---

**Last Updated**: 2025-10-09  
**Maintained By**: Top-5  
**License**: SEE LICENSE IN LICENSE
