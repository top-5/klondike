# Klondike Solitaire - Development Instructions

## Project Overview

This is a **Vite + React + TypeScript** Klondike Solitaire game using Unicode colored card glyphs.

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite 5
- **Styling**: Pure CSS (no frameworks)
- **Cards**: Unicode playing card characters (🂡🂱🃁🃑) with CSS coloring
- **Dev Server**: Vite dev server on port 10010

## Development Scripts

### Starting the Development Server

**⚠️ IMPORTANT**: Never run `npm run dev` in the same terminal where you'll execute other commands!

#### Option 1: Using the dev.ps1 script (Recommended)
```powershell
.\dev.ps1 start
```
This opens Vite in a **new window** so your main terminal stays free.

#### Option 2: Manual background start
```powershell
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "npm run dev" -WindowStyle Normal
```

### Other Commands

**Stop the dev server:**
```powershell
.\dev.ps1 stop
```

**Check server status:**
```powershell
.\dev.ps1 status
```

**Build for production:**
```powershell
npm run build
```

**Run tests:**
```powershell
npm test
```

**Preview production build:**
```powershell
npm run preview
```

## Testing with Playwright MCP

**⚠️ KNOWN ISSUE**: Playwright MCP has connection issues with localhost on this system. Use **Simple Browser** instead.

To test the application:

1. **Start the dev server in a separate window:**
   ```powershell
   .\dev.ps1 start
   ```

2. **Wait 3-5 seconds** for Vite to fully initialize

3. **Option A: Use Simple Browser (Recommended)**
   - The Simple Browser can successfully connect to localhost:10010
   - Use VS Code command palette: "Simple Browser: Show"
   - Navigate to `http://localhost:10010/`

4. **Option B: Use regular browser**
   - Open Chrome/Edge/Firefox
   - Navigate to `http://localhost:10010/`

5. **Option C: Test with PowerShell**
   ```powershell
   Invoke-WebRequest -Uri "http://localhost:10010/" -UseBasicParsing
   ```

### Playwright MCP Issue
Playwright's browser automation gets `ERR_CONNECTION_REFUSED` despite the server running and being accessible from:
- PowerShell HTTP requests (confirmed working)
- Simple Browser (confirmed working)
- Regular browsers (confirmed working)

This appears to be a Playwright-specific networking/sandbox restriction on this system.

## Game Rules (Klondike Solitaire)

### Layout
- **7 Tableau columns**: 1-7 cards each, only top card face-up initially
- **Stock**: 24 cards face-down (click to draw)
- **Waste**: Cards drawn from stock
- **4 Foundations**: Build A→K by suit

### Rules
- **Tableau**: Descending rank, alternating colors (Red 6 on Black 7)
- **Foundations**: Ascending by suit (A→2→3...→K)
- **Empty tableau**: Only Kings allowed
- **Stock recycling**: When empty, waste flips back to stock
- **Auto-flip**: Face-down cards flip when uncovered

### Controls
- **Click stock pile** to draw cards
- **Drag and drop** cards between piles
- **New Game button** to restart

## Card Colors

The Unicode card glyphs are colored using CSS:
- **Red suits** (♥️ Hearts, ♦️ Diamonds): `#dc143c` (crimson)
- **Black suits** (♠️ Spades, ♣️ Clubs): `#000` (black)

CSS uses `text-shadow` trick with `color: transparent` to apply colors to the glyphs.

## Project Structure

```
cardserver/
├── index.html              # Entry point
├── vite.config.ts          # Vite configuration
├── dev.ps1                 # Development server control script
├── src/
│   ├── main.tsx            # React bootstrap
│   ├── App.tsx             # Main game component
│   ├── App.css             # Game styling
│   ├── index.css           # Global styles
│   ├── types.ts            # TypeScript types & card glyphs
│   └── gameLogic.ts        # Klondike rules engine
└── .github/
    └── instructions.md     # This file
```

## Common Issues

### "Connection Refused" when testing
- Make sure dev server is running: `.\dev.ps1 status`
- Wait a few seconds after starting before testing
- Verify port 10010 is not in use by another process

### Cards not showing colors
- The Unicode glyphs need emoji font support
- CSS applies colors via `text-shadow` with `data-suit` attributes
- Most modern browsers support this, but very old systems may show monochrome

### Server won't start
- Kill existing Node processes: `.\dev.ps1 stop`
- Check for port conflicts on 10010
- Try clearing node_modules: `Remove-Item node_modules -Recurse; npm install`

## Git Workflow

This project uses the `master` branch. Always commit working changes:

```powershell
git add .
git commit -m "Description of changes"
git push origin master
```

## Notes

- **No backend server needed** - this is purely client-side React app
- **Hot Module Replacement** enabled - changes auto-reload in browser
- **TypeScript strict mode** enabled for type safety
- **Vitest** configured for testing (tests are TODO)
