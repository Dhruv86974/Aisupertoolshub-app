# AI Super Chat 4.0 Setup & Integration

This document outlines the architecture, layout, API connection, and capabilities of the highly integrated **AI Super Chat 4** module.

## Core Features
1. **Multi-Turn Chat History**: Leverages direct browser-level standard `localStorage` persistence, enabling seamless roundtrips across site reloads and user authentication updates.
2. **Generative Multi-Model Integration**: Connects dynamically with:
   - `gemini-2.5-flash` for high-frequency low-latency conversions.
   - `gemini-2.5-pro` for deep intellectual code blocks or content synthesis.
   - `deepseek-v3` for optimized programming instruction blocks.
3. **Immersive Audio Feedback**: Fully wired to the global `playSynthSound` retro & ambient procedural synthesizer.
4. **Gamified Rewards System**: Calls the parent-level `addXPPoints` callback upon successful multi-turn queries, encouraging high user engagement and retention.
5. **Localization support**: Native English and Gujarati language translations built-in.
6. **Voice Synthesis / Web Speech API**: Includes a premium client-side Text-To-Speech engine that deciphers markdown blocks dynamically.

## Code Integration
Mount the `AISuperChat4` component into any route or tab container by supplying the standard interface:

```typescript
import AISuperChat4 from './components/AISuperChat4';

<AISuperChat4
  lang={lang}
  theme={theme}
  playSynthSound={playSynthSound}
  addXPPoints={addXPPoints}
/>
```
