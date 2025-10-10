# AI Integration Instructions - Klondike Solitaire

> **Last Updated**: 2025-10-09  
> **Version**: 1.0.0  
> **Status**: Production-ready AI instrumentation layer

---

## 🎯 Overview

This Klondike Solitaire implementation exposes a **non-invasive AI instrumentation layer** that allows automated agents, reinforcement learning systems, and vision models to interact with the game WITHOUT modifying the core game logic or rendering pipeline.

### Key Features:
- ✅ **Hidden DOM state exposure** for AI inspection
- ✅ **Window API** for programmatic control
- ✅ **Game rules embedded** in accessible format
- ✅ **Zero impact** on game functionality
- ✅ **Playwright MCP compatible**

---

## 📋 Table of Contents

1. [Architecture](#architecture)
2. [Accessing Game State](#accessing-game-state)
3. [Controlling the Game](#controlling-the-game)
4. [Playwright Setup](#playwright-setup)
5. [Example AI Workflows](#example-ai-workflows)
6. [Universal Game API Design](#universal-game-api-design)
7. [Training Data Collection](#training-data-collection)

---

## 🏗️ Architecture

### Non-Invasive Design Principles

The AI instrumentation is implemented as an **overlay pattern**:

```
┌─────────────────────────────────────┐
│   React Game Components             │
│   (100% unchanged)                  │
│   - Rendering                       │
│   - Mouse/Touch handlers            │
│   - Game logic                      │
└─────────────────────────────────────┘
           ▲
           │ State flows up
           │
┌─────────────────────────────────────┐
│   GameStateProbe Component          │
│   - Renders hidden JSON             │
│   - Exposes window.__klondike_api__ │
│   - Emits custom events             │
└─────────────────────────────────────┘
```

**Benefits**:
- No changes to existing game logic
- Can be toggled on/off with single prop
- Backwards compatible
- Performance neutral (hidden elements)

### Components

1. **GameStateProbe.tsx** - React component that renders hidden state
2. **window.__klondike_api__** - JavaScript API exposed globally
3. **Hidden `<script>` tags** - JSON data in DOM for scraping

---

## 🔍 Accessing Game State

### 1. DOM-Based State Access (Read-Only)

Three hidden `<script type="application/json">` elements are injected into the DOM:

#### **Visible State** (for perception tasks)
```javascript
const visibleStateEl = document.getElementById('__klondike_state_visible__');
const visibleState = JSON.parse(visibleStateEl.textContent);

console.log(visibleState);
// Output:
// {
//   stock: 24,
//   wasteTop: { suit: "hearts", rank: "5" } | null,
//   foundations: {
//     spades: { suit: "spades", rank: "A" } | null,
//     hearts: null,
//     diamonds: null,
//     clubs: null
//   },
//   tableau: [
//     { faceUp: [{suit: "clubs", rank: "K"}], faceDownCount: 0 },
//     { faceUp: [{suit: "diamonds", rank: "7"}], faceDownCount: 1 },
//     // ... 7 columns total
//   ],
//   moves: 0,
//   time: 12
// }
```

**Use Case**: Train vision models to recognize visible cards and compare against ground truth.

---

#### **Canonical State** (includes hidden cards)
```javascript
const canonicalStateEl = document.getElementById('__klondike_state_canonical__');
const canonicalState = JSON.parse(canonicalStateEl.textContent);

console.log(canonicalState.canonical.tableau[0]);
// Output:
// [
//   { suit: "clubs", rank: "K", faceUp: true },
//   { suit: "hearts", rank: "2", faceUp: false },  // Hidden card!
//   // ...
// ]
```

**Use Case**: Reinforcement learning training, perfect information game solving, memory testing.

---

#### **Game Rules** (static metadata)
```javascript
const rulesEl = document.getElementById('__klondike_rules__');
const rules = JSON.parse(rulesEl.textContent);

console.log(rules);
// Output:
// {
//   name: "Klondike Solitaire",
//   objective: "Move all cards to the four foundation piles...",
//   rules: {
//     tableau: "Build down in alternating colors",
//     foundation: "Build up by suit starting with Ace",
//     stock: "Draw cards one at a time; can recycle when empty",
//     moves: "Only Kings can fill empty tableau columns"
//   },
//   controls: {
//     click_stock: "Draw card from stock to waste",
//     double_click_card: "Auto-move card to foundation if valid",
//     drag_card: "Move card or sequence between piles"
//   },
//   scoring: {
//     foundation_move: 10,
//     reveal_card: 5,
//     waste_to_tableau: 5,
//     tableau_to_foundation: 10
//   }
// }
```

**Use Case**: LLM context injection, hint generation, rule validation.

---

### 2. Window API Access (Read & Control)

The `window.__klondike_api__` object provides programmatic control:

```typescript
interface KlondikeAPI {
  getState: () => GameState;
  clickStock: () => void;
  performDrag: (
    from: { pile: string; index: number }, 
    to: { pile: string; index: number }
  ) => Promise<boolean>;
}
```

#### **Reading State via API**
```javascript
const api = window.__klondike_api__;
const currentState = api.getState();

console.log(currentState.moves);        // 0
console.log(currentState.tableau[0]);   // Full column data
console.log(currentState.foundations);  // Foundation piles
```

#### **Performing Actions**

**Click Stock Pile:**
```javascript
api.clickStock();
// Draws a card from stock to waste
```

**Move Cards:**
```javascript
// Move A♦ from tableau column 4 to foundation
await api.performDrag(
  { pile: 'tableau', index: 4 },
  { pile: 'foundation', index: 0 }
);
// Returns: true (success) or false (invalid move)
```

**Pile Names:**
- `'tableau'` - Columns 0-6
- `'waste'` - Waste pile (index 0)
- `'foundation'` - Foundation piles 0-3

---

## 🎮 Controlling the Game

### Method 1: Window API (Recommended for AI)

**Advantages:**
- ✅ Uses internal game logic directly
- ✅ No DOM manipulation required
- ✅ Validates moves automatically
- ✅ Works with HMR/dev server

**Example: Auto-play Aces**
```javascript
async function moveAllAcesToFoundation() {
  const api = window.__klondike_api__;
  const state = api.getState();
  
  // Check all tableau columns for Aces
  for (let colIdx = 0; colIdx < state.tableau.length; colIdx++) {
    const column = state.tableau[colIdx];
    const topCard = column[column.length - 1];
    
    if (topCard && topCard.faceUp && topCard.rank === 'A') {
      const success = await api.performDrag(
        { pile: 'tableau', index: colIdx },
        { pile: 'foundation', index: 0 }
      );
      console.log(`Moved A${topCard.suit} to foundation:`, success);
    }
  }
}

// Execute
await moveAllAcesToFoundation();
```

---

### Method 2: Click Events (Simple Actions)

For stock pile clicks, you can use standard DOM events:

```javascript
// Playwright/Puppeteer
await page.click('.stock');

// Pure JavaScript
document.querySelector('.stock').click();
```

---

### Method 3: Synthetic Mouse Events (Advanced Drag)

**Problem**: Custom drag handlers don't respond to `.dragTo()` in Playwright.

**Solution**: Simulate mouse events at coordinate level:

```javascript
async function dragCardByCoordinates(page, fromX, fromY, toX, toY) {
  await page.mouse.move(fromX, fromY);
  await page.mouse.down();
  
  // Move in steps for smooth dragging
  const steps = 10;
  for (let i = 0; i <= steps; i++) {
    const x = fromX + (toX - fromX) * (i / steps);
    const y = fromY + (toY - fromY) * (i / steps);
    await page.mouse.move(x, y);
  }
  
  await page.mouse.up();
}

// Get card position from accessibility snapshot
const cardBounds = await page.locator('.card').first().boundingBox();
const foundationBounds = await page.locator('.foundation').first().boundingBox();

await dragCardByCoordinates(
  page,
  cardBounds.x + cardBounds.width / 2,
  cardBounds.y + cardBounds.height / 2,
  foundationBounds.x + foundationBounds.width / 2,
  foundationBounds.y + foundationBounds.height / 2
);
```

**Note**: Window API is preferred as it's more reliable.

---

## 🤖 Playwright Setup

### Installation

```bash
# Install Playwright
npm install -D @playwright/test

# Install Playwright browsers
npx playwright install chromium
```

### Basic Script

Create `playwright-ai/test-game.ts`:

```typescript
import { test, expect } from '@playwright/test';

test('AI can read game state and make moves', async ({ page }) => {
  // Navigate to game
  await page.goto('http://localhost:10010/klondike/');
  
  // Wait for game to load
  await page.waitForSelector('.card');
  
  // Read visible state
  const visibleState = await page.evaluate(() => {
    const el = document.getElementById('__klondike_state_visible__');
    return JSON.parse(el?.textContent || '{}');
  });
  
  console.log('Current tableau:', visibleState.tableau);
  
  // Make a move using API
  const moveResult = await page.evaluate(async () => {
    const api = window.__klondike_api__;
    
    // Find first Ace in tableau
    const state = api.getState();
    for (let i = 0; i < state.tableau.length; i++) {
      const column = state.tableau[i];
      const topCard = column[column.length - 1];
      
      if (topCard?.faceUp && topCard.rank === 'A') {
        return await api.performDrag(
          { pile: 'tableau', index: i },
          { pile: 'foundation', index: 0 }
        );
      }
    }
    return false;
  });
  
  expect(moveResult).toBe(true);
  
  // Verify move counter increased
  const newState = await page.evaluate(() => {
    const el = document.getElementById('__klondike_state_visible__');
    return JSON.parse(el?.textContent || '{}');
  });
  
  expect(newState.moves).toBeGreaterThan(visibleState.moves);
});
```

### Run Test

```bash
npx playwright test playwright-ai/test-game.ts --headed
```

---

## 🧠 Example AI Workflows

### 1. Reinforcement Learning Episode Collection

```javascript
async function collectRLEpisode(page) {
  const episode = [];
  
  while (true) {
    // Get current state
    const state = await page.evaluate(() => {
      const api = window.__klondike_api__;
      return api.getState();
    });
    
    // Check if game won
    if (Object.values(state.foundations).every(f => f.length === 13)) {
      break;
    }
    
    // AI agent selects action (simplified heuristic)
    const action = await selectAction(state);
    
    // Perform action
    const success = await page.evaluate(async (act) => {
      const api = window.__klondike_api__;
      if (act.type === 'draw') {
        api.clickStock();
        return true;
      } else if (act.type === 'move') {
        return await api.performDrag(act.from, act.to);
      }
    }, action);
    
    // Get next state
    const nextState = await page.evaluate(() => {
      const api = window.__klondike_api__;
      return api.getState();
    });
    
    // Calculate reward
    const reward = calculateReward(state, action, nextState, success);
    
    // Store transition
    episode.push({
      state: encodeState(state),
      action: encodeAction(action),
      reward,
      nextState: encodeState(nextState),
      done: isGameWon(nextState)
    });
    
    if (!success) {
      // Try different action or draw from stock
      await page.evaluate(() => window.__klondike_api__.clickStock());
    }
  }
  
  return episode;
}
```

---

### 2. Vision Model Training

```javascript
async function collectVisionDataset(page, numSamples = 1000) {
  const dataset = [];
  
  for (let i = 0; i < numSamples; i++) {
    // Start new game
    await page.click('button:has-text("New Game")');
    await page.waitForTimeout(500);
    
    // Capture screenshot
    const screenshot = await page.screenshot({ type: 'png' });
    
    // Get ground truth from hidden state
    const groundTruth = await page.evaluate(() => {
      const el = document.getElementById('__klondike_state_visible__');
      return JSON.parse(el?.textContent || '{}');
    });
    
    // Get bounding boxes for each card
    const cardBoxes = await page.evaluate(() => {
      const boxes = [];
      document.querySelectorAll('.card').forEach((card, idx) => {
        const rect = card.getBoundingClientRect();
        const img = card.querySelector('img');
        boxes.push({
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
          alt: img?.alt || '',
          visible: !card.classList.contains('card-back')
        });
      });
      return boxes;
    });
    
    dataset.push({
      image: screenshot,
      groundTruth,
      boundingBoxes: cardBoxes,
      timestamp: Date.now()
    });
    
    // Make a few random moves to create variety
    const randomMoves = Math.floor(Math.random() * 5);
    for (let j = 0; j < randomMoves; j++) {
      await page.evaluate(() => window.__klondike_api__.clickStock());
      await page.waitForTimeout(100);
    }
  }
  
  return dataset;
}
```

---

### 3. LLM-Guided Play

```javascript
async function llmGuidedPlay(page, llm) {
  while (true) {
    // Get current state and rules
    const context = await page.evaluate(() => {
      const state = JSON.parse(
        document.getElementById('__klondike_state_visible__').textContent
      );
      const rules = JSON.parse(
        document.getElementById('__klondike_rules__').textContent
      );
      return { state, rules };
    });
    
    // Ask LLM for next move
    const prompt = `
Game: ${context.rules.name}
Rules: ${JSON.stringify(context.rules.rules)}
Current State: ${JSON.stringify(context.state)}

What is the best next move? Return JSON: 
{ "action": "move|draw", "from": {pile, index}, "to": {pile, index}, "reasoning": "..." }
`;
    
    const response = await llm.complete(prompt);
    const decision = JSON.parse(response);
    
    console.log(`LLM Decision: ${decision.reasoning}`);
    
    // Execute move
    const success = await page.evaluate(async (dec) => {
      const api = window.__klondike_api__;
      if (dec.action === 'draw') {
        api.clickStock();
        return true;
      } else {
        return await api.performDrag(dec.from, dec.to);
      }
    }, decision);
    
    if (!success) {
      console.log('Invalid move suggested by LLM');
    }
    
    // Check win condition
    const won = await page.evaluate(() => {
      const state = window.__klondike_api__.getState();
      return Object.values(state.foundations).every(f => f.length === 13);
    });
    
    if (won) {
      console.log('Game won!');
      break;
    }
  }
}
```

---

## 🌐 Universal Game API Design

### Proposed Standard Interface

Based on this implementation, here's a **universal API pattern** for game AI instrumentation:

```typescript
interface UniversalGameAPI<TState, TAction> {
  // Meta information
  meta: {
    name: string;
    version: string;
    type: 'solitaire' | 'puzzle' | 'strategy' | 'action';
  };
  
  // State access
  state: {
    getVisible: () => TState;           // What human player sees
    getCanonical: () => TState;         // Complete state (for training)
    subscribe: (cb: (state: TState) => void) => void;
  };
  
  // Rules & instructions
  rules: {
    objective: string;
    constraints: Record<string, string>;
    controls: Record<string, string>;
    scoring: Record<string, number>;
  };
  
  // Actions
  actions: {
    validate: (action: TAction) => boolean;
    perform: (action: TAction) => Promise<boolean>;
    getValid: (state: TState) => TAction[];
  };
  
  // Utilities
  utils: {
    isTerminal: (state: TState) => boolean;
    getReward: (state: TState, action: TAction, nextState: TState) => number;
    reset: () => void;
    screenshot: () => Promise<Blob>;
  };
}
```

### Example Implementation

```typescript
// window.__game_api__ - Universal interface
window.__game_api__ = {
  meta: {
    name: "Klondike Solitaire",
    version: "1.0.0",
    type: "solitaire"
  },
  
  state: {
    getVisible: () => JSON.parse(
      document.getElementById('__klondike_state_visible__').textContent
    ),
    getCanonical: () => JSON.parse(
      document.getElementById('__klondike_state_canonical__').textContent
    ),
    subscribe: (cb) => {
      window.addEventListener('klondike:state-change', (e) => cb(e.detail));
    }
  },
  
  rules: JSON.parse(
    document.getElementById('__klondike_rules__').textContent
  ),
  
  actions: {
    validate: (action) => { /* ... */ },
    perform: async (action) => {
      if (action.type === 'draw') {
        window.__klondike_api__.clickStock();
        return true;
      }
      return await window.__klondike_api__.performDrag(action.from, action.to);
    },
    getValid: (state) => { /* return all valid moves */ }
  },
  
  utils: {
    isTerminal: (state) => {
      return Object.values(state.foundations).every(f => f?.length === 13);
    },
    getReward: (s, a, ns) => {
      // Foundation move: +10, Reveal card: +5, etc.
      let reward = -1; // Cost per move
      if (ns.foundations !== s.foundations) reward += 10;
      if (ns.tableau.some((col, i) => col.faceDownCount < s.tableau[i].faceDownCount)) {
        reward += 5;
      }
      return reward;
    },
    reset: () => document.querySelector('button:has-text("New Game")').click(),
    screenshot: async () => {
      const canvas = await html2canvas(document.querySelector('.app'));
      return new Promise(resolve => canvas.toBlob(resolve));
    }
  }
};
```

---

## 📊 Training Data Collection

### Telemetry Events

The GameStateProbe emits custom events for real-time tracking:

```javascript
// Listen for state changes
window.addEventListener('klondike:state-change', (event) => {
  console.log('Move #', event.detail.moves, 'at', event.detail.timestamp);
  
  // Send to analytics backend
  fetch('/api/telemetry', {
    method: 'POST',
    body: JSON.stringify({
      eventType: 'state-change',
      moves: event.detail.moves,
      timestamp: event.detail.timestamp
    })
  });
});
```

### Full Game Recording

```javascript
async function recordFullGame(page) {
  const recording = {
    sessionId: crypto.randomUUID(),
    startTime: Date.now(),
    initialState: null,
    transitions: [],
    finalState: null,
    won: false
  };
  
  // Capture initial state
  recording.initialState = await page.evaluate(() => {
    return window.__klondike_api__.getState();
  });
  
  // Listen for moves
  await page.exposeFunction('recordTransition', (transition) => {
    recording.transitions.push(transition);
  });
  
  await page.evaluate(() => {
    window.addEventListener('klondike:state-change', () => {
      const state = window.__klondike_api__.getState();
      window.recordTransition({
        timestamp: Date.now(),
        moves: state.moves,
        state: state
      });
    });
  });
  
  // Play game...
  // ...
  
  // Capture final state
  recording.finalState = await page.evaluate(() => {
    const state = window.__klondike_api__.getState();
    return state;
  });
  
  recording.won = recording.transitions.some(t => 
    Object.values(t.state.foundations).every(f => f.length === 13)
  );
  
  return recording;
}
```

---

## 🔐 Security & Performance

### Best Practices

1. **Disable in Production** (if not needed):
   ```tsx
   <GameStateProbe 
     gameState={gameState} 
     enabled={process.env.NODE_ENV === 'development' || window.location.search.includes('ai-mode')} 
   />
   ```

2. **Rate Limiting**: Add throttling to window API methods
   ```typescript
   let lastCall = 0;
   performDrag: async (from, to) => {
     const now = Date.now();
     if (now - lastCall < 50) return false; // Max 20 actions/sec
     lastCall = now;
     // ... rest of logic
   }
   ```

3. **Privacy**: Scrub any PII before sending telemetry

---

## 📚 References

- [Playwright Documentation](https://playwright.dev/)
- [Reinforcement Learning for Card Games](https://arxiv.org/abs/2106.03563)
- [Model Context Protocol (MCP)](https://modelcontextprotocol.io/)
- [OpenTelemetry for Browser](https://opentelemetry.io/docs/instrumentation/js/)

---

## 🆘 Troubleshooting

### API Not Found

```javascript
// Check if API is loaded
if (!window.__klondike_api__) {
  console.error('API not loaded yet. Wait for React mount.');
  await page.waitForFunction(() => window.__klondike_api__ !== undefined);
}
```

### State Not Updating

```javascript
// Ensure React has rendered
await page.waitForTimeout(100);

// Force re-read from DOM
const freshState = await page.evaluate(() => {
  const el = document.getElementById('__klondike_state_visible__');
  return JSON.parse(el.textContent);
});
```

### Drag Not Working

Use window API instead of Playwright `.dragTo()`:
```javascript
// ❌ Doesn't work:
await page.locator('.card').first().dragTo(page.locator('.foundation'));

// ✅ Works:
await page.evaluate(() => {
  return window.__klondike_api__.performDrag(
    { pile: 'tableau', index: 0 },
    { pile: 'foundation', index: 0 }
  );
});
```

---

## 🚀 Next Steps

1. **Add data-testid attributes** for easier Playwright selection (see TODO.md section 9.2)
2. **Implement hint system** using `getValidMoves()` (see TODO.md section 1.1)
3. **Build MCP server** for external AI agent integration (see TODO.md section 9)
4. **Create vision model** training pipeline (see TODO.md section 5)

---

**Questions?** See `docs/TODO.md` for the full roadmap or open an issue on GitHub.
