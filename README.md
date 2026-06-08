# Code Visualizer 3D

Paste in a chunk of code and explore its structure as an interactive 3D scene. Classes, functions, methods, and variables are parsed into a tree and rendered as a layout of boxes you can orbit around, hover, and click. Select any construct to get a concise, AI-generated explanation of what it does.

## Features

- **Live editing** — a Monaco editor on the left; the scene re-parses and updates as you type.
- **3D structure view** — the parsed tree is laid out in 3D ([react-three-fiber](https://github.com/pmndrs/react-three-fiber) + [three.js](https://threejs.org/)), with depth fanning out by nesting level and box size scaling with the number of source lines.
- **Color-coded by kind** — programs, classes, interfaces/enums, functions, methods, variables, and blocks each get their own color (see the on-screen legend).
- **Hover & select** — hover to highlight, click to select a node and reveal its details.
- **AI explanations** — selecting a node can send its snippet to Claude (`/api/explain`) for a short, plain-language explanation.

## Tech stack

- [Next.js 14](https://nextjs.org/) (App Router) + React 18 + TypeScript
- [@react-three/fiber](https://github.com/pmndrs/react-three-fiber), [drei](https://github.com/pmndrs/drei), and [postprocessing](https://github.com/pmndrs/react-postprocessing) for the 3D scene
- [Monaco Editor](https://github.com/microsoft/monaco-editor) for the code panel
- [Zustand](https://github.com/pmndrs/zustand) for state
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Anthropic SDK](https://github.com/anthropics/anthropic-sdk-typescript) for code explanations

## Getting started

### Prerequisites

- Node.js 18+
- An [Anthropic API key](https://console.anthropic.com/) (only needed for the AI explanation feature)

### Install

```bash
npm install
```

### Configure

The AI explanation route requires an Anthropic API key. Copy the example env file and fill in your key:

```bash
cp .env.local.example .env.local
```

```
# .env.local
ANTHROPIC_API_KEY=sk-ant-...
```

The visualizer itself works without a key — only the "explain" feature needs it.

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app loads with sample code so you can start exploring immediately.

## Scripts

| Command            | Description                          |
| ------------------ | ------------------------------------ |
| `npm run dev`      | Start the dev server                 |
| `npm run build`    | Production build                     |
| `npm run start`    | Serve the production build           |
| `npm run lint`     | Run Next.js lint                     |
| `npm run typecheck`| Type-check with `tsc --noEmit`       |

## Project structure

```
app/
  api/explain/route.ts   # POST endpoint that calls Claude to explain a snippet
  layout.tsx             # Root layout
  page.tsx               # Three-pane UI: editor | 3D scene | info panel
components/
  EditorPanel.tsx        # Monaco code editor
  Scene.tsx              # The react-three-fiber canvas
  NodeBox.tsx            # A single construct rendered as a box
  InfoPanel.tsx          # Details + AI explanation for the selected node
  Legend.tsx             # Color key for node kinds
lib/
  parse.ts               # Regex-based parser → CodeNode tree
  layout.ts              # Positions, sizes, and colors for the 3D layout
  store.ts               # Zustand store (code, tree, selection, explanation)
  sample.ts              # Default sample code
```

## How it works

`lib/parse.ts` does a lightweight, regex-based scan of the source to build a tree of `CodeNode`s (classes, functions, methods, variables, etc.) with line spans and nesting depth. `lib/layout.ts` turns that tree into positioned, sized, and colored boxes — siblings spread horizontally, deeper nodes step back and down. `Scene.tsx` renders the boxes and the edges between parents and children. Selecting a node sends its source snippet to `/api/explain`, which asks Claude for a short explanation that's shown in the info panel.

> Note: parsing is heuristic (regex-based), so it favors broad language coverage and a quick visual over exact, grammar-accurate parsing.
