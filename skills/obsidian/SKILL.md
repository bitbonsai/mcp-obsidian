---
name: obsidian
description: >
  Activate when the user mentions their Obsidian vault, notes, tags,
  frontmatter, daily notes, backup, or sync. Route operations across MCP,
  Obsidian CLI/app actions, and git sync with safe defaults.
metadata:
  version: "2.0"
  author: bitbonsai
---

# Obsidian Skill

## Routing Policy

Use the backend that best matches user intent:

1. **MCP (default for vault data operations)**
   - Read/write/patch/move/search notes
   - Frontmatter and tag updates
   - Metadata and batch note operations

2. **Obsidian CLI/App context (only when app context is needed)**
   - Open a note in Obsidian from URI
   - Trigger app/plugin workflows that MCP cannot perform

3. **CLI git (sync/backup workflows)**
   - Initialize repo, configure remote, commit, pull, push
   - Periodic or manual vault backup/sync requests

When a request is ambiguous, pick MCP first unless the user explicitly asks for sync/backup/git/app behavior.

## Gotchas

1. **patch_note rejects multi-match by default.** With `replaceAll: false`, if `oldString` appears more than once the call fails and returns `matchCount`. Set `replaceAll: true` only when you mean it, or add surrounding context to make the match unique.

2. **patch_note matches inside frontmatter.** The replacement runs against the full file including the YAML block. A generic string like `title:` will match frontmatter fields. Include enough context to target the right occurrence.

3. **patch_note forbids empty strings.** Both `oldString` and `newString` must be non-empty and non-whitespace. To delete text, use `newString` with a single space or restructure the note with `write_note`.

4. **search_notes returns minified JSON.** Fields are abbreviated: `p` (path), `t` (title), `ex` (excerpt), `mc` (matchCount), `ln` (lineNumber), `uri` (obsidianUri). Hard cap of 20 results regardless of `limit`.

5. **search_notes multi-word queries score terms individually AND as a phrase.** Each term is OR-matched, so a document matching any term appears in results. The full phrase gets an additional scoring boost.

6. **write_note auto-creates directories.** Parent folders are created recursively. In `append`/`prepend` mode, if the note doesn't exist it's created. Frontmatter is merged (new keys override) in append/prepend; replaced entirely in overwrite.

7. **delete_note requires exact path confirmation.** `confirmPath` must be character-identical to `path`. No normalization, no trailing-slash tolerance. Mismatch silently fails with `success: false`.

8. **move_file needs double confirmation.** Both `confirmOldPath` and `confirmNewPath` must exactly match their counterparts. Use `move_note` for markdown renames (text-aware, no confirmation needed); use `move_file` only for binary files or when you need binary-safe moves.

9. **manage_tags reads from two sources but writes to one.** `list` merges frontmatter tags + inline `#hashtags`. `add`/`remove` only modify the frontmatter `tags` array. Inline tags are never touched.

10. **read_multiple_notes never rejects.** Uses `allSettled` internally. Failed files appear in the `err` array; successful ones in `ok`. Always check both. Hard limit of 10 paths per call.

## Error Recovery

| Error | Next step |
|-------|-----------|
| patch_note "Found N occurrences" | Add surrounding lines to `oldString` to make it unique, or set `replaceAll: true` |
| delete_note / move_file confirmation mismatch | Re-read the note path with `read_note` or `list_directory`, then retry with the exact string |
| search_notes returns 0 results | Try single keywords instead of phrases, toggle `searchFrontmatter`, or broaden with partial terms |
| read_multiple_notes partial `err` | Verify failed paths with `list_directory`, fix typos or missing extensions, retry only failed ones |

## Git Sync Mode

When the user asks to "sync", "backup", or "store my vault with git", use CLI git with this behavior:

1. Run a **preflight** before changing anything:
   - `git` available
   - current directory is a git repo (or prompt to initialize)
   - `git config user.name` and `git config user.email` are set
   - at least one remote exists for push/pull sync

2. If preflight is incomplete, ask exactly one targeted question with a recommended default.
   - Use askuserquestion for decisions that materially change behavior.
   - Good examples:
     - "No git repo found. Initialize one in this vault now? (Recommended: Yes)"
     - "No remote configured. Set up GitHub remote now via gh if available, or provide remote URL? (Recommended: Set up via gh)"
     - "Local and remote diverged. Try `git pull --rebase` now? (Recommended: Yes)"

3. Safe sync sequence (never force push by default):
   - `git add -A`
   - `git commit -m "vault sync: YYYY-MM-DD HH:mm"` (skip commit if no changes)
   - `git pull --rebase`
   - `git push`

4. `gh` is optional:
   - Use `gh` only for remote bootstrapping (create repo / set origin) when requested.
   - Do not require `gh` for normal sync once remote is configured.

5. Stop on conflicts and report clear next steps.
   - Do not auto-resolve merge conflicts silently.
   - Explain what failed and what user should run next.

## Resources

Load these only when needed, not on every invocation.

- [Tool Patterns](resources/tool-patterns.md) - read when you need a tool's response shape, mode details, or the move_note vs move_file decision
- [Obsidian Conventions](resources/obsidian-conventions.md) - read when creating/writing note content (link syntax, frontmatter fields, daily note format, template variables)
- [Git Sync](resources/git-sync.md) - read when user asks for backup/sync/store-vault workflows with git/gh
