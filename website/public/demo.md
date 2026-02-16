# MCP-Obsidian Interactive Demo

See how AI assistants intelligently interact with your Obsidian vault. These examples show real conversations and outcomes.

## Efficient Editing (patch_note)

**User:** Add the equation for energy-mass equivalence to my physics notes

**AI uses patch_note:**
```json
{
  "path": "Physics/Relativity.md",
  "oldString": "## Energy and Mass",
  "newString": "## Energy and Mass\n\nE = mc²"
}
```

**Result:** Only the specific section was updated - no full file rewrite needed. 10x faster than rewriting entire file.

## Create Notes (write_note)

**User:** Create a quick note about today's meeting

**AI uses write_note:**
```json
{
  "path": "Meetings/Team Sync.md",
  "content": "# Team Sync\n\n- Discussed Q1 goals\n- Action items assigned"
}
```

**Result:** File created atomically with proper formatting. Ready to open in Obsidian.

## Read Multiple Notes (read_multiple_notes)

**User:** Read all my book club notes and give me a summary

**AI uses read_multiple_notes:**
```json
{
  "paths": [
    "Reading/The Phoenix Project.md",
    "Reading/Atomic Habits.md",
    "Reading/Deep Work.md"
  ]
}
```

**Result:** All 3 notes read in a single request. AI analyzes across multiple documents efficiently.

## Manage Frontmatter (update_frontmatter)

**User:** Update the status and add tags to my project planning note

**AI uses update_frontmatter:**
```json
{
  "path": "Projects/Website Redesign.md",
  "frontmatter": {
    "tags": ["project", "web-design", "priority-high"],
    "status": "in-progress",
    "created": "2025-01-15",
    "updated": "2025-01-20"
  }
}
```

**Result:** YAML frontmatter safely updated. Existing fields preserved. Note content untouched.

## Search Content (search_notes)

**User:** Search for "React hooks" in my notes

**AI uses search_notes:**
```json
{
  "query": "React hooks",
  "limit": 10
}
```

**Response:**
```json
[
  {
    "p": "Development/React Best Practices.md",
    "t": "React Best Practices",
    "ex": "...State **React hooks** provide...",
    "mc": 8,
    "ln": 42
  },
  {
    "p": "Learning/Modern JavaScript.md",
    "t": "Modern JavaScript",
    "ex": "...useEffect are common **React hooks**...",
    "mc": 3,
    "ln": 156
  }
]
```

**Result:** Found 2 notes with 11 total matches. Token-optimized response with minified field names (p=path, t=title, ex=excerpt, mc=matchCount, ln=lineNumber).

## Technical Notes

- `prettyPrint` defaults to false for minimal token usage
- All operations are performed atomically
- Frontmatter is always validated before writing
- Search returns 21-char context excerpts around matches
