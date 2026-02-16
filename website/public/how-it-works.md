# How MCP-Obsidian Works

Practical prompts you can try with your AI assistant and MCP-Obsidian.

## Search & Read Notes

**Prompt:** Find my productivity notes and summarize the key concepts

**What happens:**

1. AI calls `search_notes` with query "productivity", limit 5
2. Returns matching notes with paths and match counts
3. AI calls `read_multiple_notes` with the found paths
4. AI analyzes the content and provides a summary

**Example response:**
- Found notes: "Notes/Getting Things Done.md" (5 matches), "Books/Deep Work.md" (4 matches)
- Key concepts: Time blocking, focused work sessions, eliminating distractions, weekly reviews

## Update Metadata

**Prompt:** Mark all my project notes as completed

**What happens:**

1. AI calls `update_frontmatter` for each project note
2. Sets status to "completed" and adds completion date
3. Frontmatter is safely merged with existing fields

**Example request:**
```json
{
  "path": "Projects/Website Redesign.md",
  "frontmatter": {
    "status": "completed",
    "completed": "2025-01-20"
  }
}
```

## Available MCP Tools

| Tool | Description |
|------|-------------|
| read_note | Read a single note with frontmatter |
| write_note | Create or overwrite a note (supports overwrite, append, prepend modes) |
| patch_note | Efficient partial update via find-and-replace |
| list_directory | List files and folders in the vault |
| delete_note | Delete a note (requires path confirmation) |
| search_notes | Full-text search across vault content |
| move_note | Move or rename a note |
| read_multiple_notes | Batch read up to 10 notes |
| update_frontmatter | Safely update YAML frontmatter |
| get_notes_info | Get metadata without reading content |
| get_frontmatter | Extract frontmatter only |
| manage_tags | Add, remove, or list tags |
| get_vault_stats | Vault statistics: total notes, folders, size, recent files |
