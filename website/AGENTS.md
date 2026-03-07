# Website Agent Instructions

## Dual Content Maintenance

This website serves content in two formats. When updating content, **both must be updated together**:

| Format | Location | Audience |
|--------|----------|----------|
| HTML pages | `src/components/*.astro`, `src/components/*.tsx` | Browsers (rich, interactive) |
| Markdown pages | `public/*.md`, `public/llm.txt` | LLMs and AI agents (plain text) |

The markdown files are simplified representations of the same content shown in the HTML pages. They are NOT auto-generated — they are manually maintained static files.

### When adding or changing content:
1. Update the Astro/React component in `src/components/`
2. Update the corresponding `.md` file in `public/`
3. If adding a new page, also update `public/llm.txt` (the index file agents read first)

### File mapping:

| Page | Component(s) | Markdown |
|------|-------------|----------|
| Home `/` | `Hero.astro`, `UpdateCallout.astro` | `public/index.md` |
| Install `/install` | `Terminal.astro` | `public/install.md` |
| Features `/features` | `FeatureGrid.astro`, `ComparisonTable.astro` | `public/features.md` |
| Demo `/demo` | `InteractiveDemo.tsx` | `public/demo.md` |
| How It Works `/how-it-works` | `HowItWorks.astro` | `public/how-it-works.md` |

## Architecture

- **Framework**: Astro 5.x with React islands for interactive components
- **Styling**: Tailwind CSS with custom dark theme (`tailwind.config.mjs`)
- **View Transitions**: Astro `ClientRouter` for SPA-like page transitions
- **Nav**: `Nav.astro` uses `transition:persist` to stay mounted across navigations
- **Layout**: Single `Layout.astro` wraps all pages with shared head, meta tags, background effects

## Key Technical Details

- The version number is read from the root `../../package.json` (monorepo structure)
- The nav version badge and Hero version display both pull from `package.json`
- `InteractiveDemo.tsx` and `ResponseRenderer.tsx` are React client components — use `client:visible` or `client:only="react"` directives
- Theme color is `#0a0a0a` (near-black) — set on `<html>` element, `<meta name="theme-color">`, `<meta name="color-scheme">`, and `::view-transition-group(root)` to prevent white flash during transitions

## Demo Accuracy

The demo examples in `InteractiveDemo.tsx` and `HowItWorks.astro` show actual MCP tool request/response formats. When modifying the MCP server tools (in `server.ts` or `src/`), verify demos still match:

- Tool parameter names and types must match `server.ts` `ListToolsRequestSchema`
- Response formats must match the `CallToolRequestSchema` handler output
- The server currently has **14 tools** — this count appears in `FeatureGrid.astro`, `public/features.md`, `public/llm.txt`, and `public/how-it-works.md`

## Commands

- `npm run dev` — Start dev server (http://localhost:4321)
- `npm run build` — Type-check with `astro check` then build to `dist/`
- From project root: `npm run website` — Starts the dev server
