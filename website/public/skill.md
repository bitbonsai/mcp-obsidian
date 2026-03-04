# Obsidian Skill

Combines MCP server safety with Obsidian app context. One skill that routes each operation to the right backend.

## Install

```
npx skills add bitbonsai/mcp-obsidian
```

## Routing Matrix

Each operation maps to exactly one backend. The skill picks the right one automatically.

| Operation | MCP | Obsidian App | Git | Notes |
|-----------|-----|-------------|-----|-------|
| Read note | yes | — | — | Safe, sandboxed read via MCP |
| Write / patch note | yes | — | — | Atomic writes with validation |
| Search vault | yes | — | — | BM25-ranked full-text search |
| Manage tags / frontmatter | yes | — | — | Safe YAML merge |
| Move / rename files | yes | — | — | Path-confirmed moves |
| Open note in Obsidian | — | yes | — | Requires the desktop app running |
| Trigger plugin commands | — | yes | — | Workspace actions, plugin APIs |
| Export to PDF | — | yes | — | App-level rendering pipeline |
| Sync vault across devices | — | — | yes | Plain git — no Obsidian Sync needed |
| Automated backup | — | — | yes | Cron / launchd, no UI needed |

## What It Is

**MCP Server** — Handles all file I/O: reading, writing, searching, patching, and organizing notes. Enforces path sandboxing, validates inputs, and performs atomic operations. The safe default for any vault mutation.

**Obsidian App** — Bridges the gap for operations that need the running desktop app: opening notes in the editor, triggering plugin commands, exporting to PDF via Obsidian URI schemes.

**Git Sync** — Plain git for vault syncing across devices. No Obsidian Sync subscription required. Works headlessly via cron, launchd, or CI — no app needs to be running.

## Git-Based Vault Sync

An Obsidian vault is just a folder of markdown files. You can `git init` inside it, add a remote, and push/pull like any repo. No proprietary format, no paid service.

### Headless automation

```bash
# cron job or launchd plist
cd /path/to/vault
git add -A
git commit -m "backup $(date +%Y-%m-%d)"
git push
```

No Obsidian app required. Works on servers, NAS, or any headless machine.

### Optional: Obsidian Git plugin

The [Obsidian Git](https://github.com/Vinzent03/obsidian-git) community plugin (8k+ stars) adds GUI-driven auto-sync from within the app: auto-commit on interval, pull on startup, push on close, and a source control sidebar.

### Caveats

- **Not real-time** — git syncs on commit intervals, not instantly
- **Merge conflicts** — editing the same note on two devices before syncing requires manual resolution
- **Large binaries** — images and PDFs aren't great for git; use `.gitignore` or Git LFS
- **Workspace files** — add `.obsidian/workspace.json` to `.gitignore`

Recommended .gitignore:

```
.obsidian/workspace.json
.obsidian/workspace-mobile.json
.obsidian/plugins/obsidian-git/data.json
.trash/
```

## When To Use

**Trigger phrases:**
- "search my vault for..."
- "update the frontmatter on..."
- "open this note in Obsidian"
- "sync my vault"
- "tag all notes about..."
- "move this note to..."

**Not a fit for:**
- General markdown editing (no vault context)
- Non-Obsidian file management
- Web-based Obsidian Publish tasks

## Workflow Patterns

### 1. Sequential Orchestration

Chain MCP reads into app actions. Search for a note via MCP, then open it in Obsidian for visual editing.

Steps: search_notes → read_note → open in Obsidian

### 2. Context-Aware Selection

The skill picks the right backend automatically. File operations route through MCP; app-context actions use Obsidian URI schemes.

Steps: Analyze user intent → Route to MCP or App → Execute with safety checks

### 3. Iterative Refinement

Write a draft via MCP, review in Obsidian, then patch corrections back through MCP.

Steps: write_note → review in editor → patch_note

## Safety Defaults

- **Prefer MCP Writes** — All file mutations go through the MCP server, which validates paths, confirms targets, and performs atomic writes.
- **Confirm Destructive Actions** — Deletes and moves require explicit path confirmation parameters, preventing accidental data loss.
- **No Shell Interpolation** — Commands use structured arguments, never string-interpolated shell input. No injection vectors.
- **Sandbox by Default** — MCP tools are scoped to the vault root. Path traversal is blocked at the server level.

## Quick Start

Skill folder structure:

```
.claude/
  skills/
    obsidian/
      SKILL.md                          # Gotchas, error recovery, index
      resources/
        tool-patterns.md                # Per-tool response shapes and recipes
        obsidian-conventions.md         # Vault structure, wikilinks, tags
```

SKILL.md frontmatter:

```yaml
---
name: obsidian
description: >
  Activate when the user mentions their
  Obsidian vault, notes, tags, frontmatter,
  or daily notes.
metadata:
  version: "2.0"
  author: bitbonsai
---
```
