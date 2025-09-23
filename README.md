# MCP-Obsidian

A lightweight Model Context Protocol (MCP) server for safe Obsidian vault access. This server provides AI assistants with the ability to read and write notes in an Obsidian vault while preventing YAML frontmatter corruption.

**Supported AI Platforms:** Claude Desktop, Claude Code, ChatGPT Desktop (Enterprise+), IntelliJ IDEA 2025.1+, Cursor IDE, and other MCP-compatible clients.

## Quick Start (5 minutes)

1. **Install Bun runtime:**
   ```bash
   curl -fsSL https://bun.sh/install | bash
   ```

2. **Test the server:**

   If using the published package:
   ```bash
   bunx @modelcontextprotocol/inspector @mauricio.wolff/mcp-obsidian /path/to/your/vault
   ```

3. **Configure your AI client:**

   **Claude Desktop** - Copy this to `claude_desktop_config.json`:
   ```json
   {
     "mcpServers": {
       "obsidian": {
         "command": "bunx",
         "args": ["@mauricio.wolff/mcp-obsidian", "/path/to/your/vault"]
       }
     }
   }
   ```

   **Claude Code** - Copy this to `~/.claude.json`:
   ```json
   {
     "mcpServers": {
       "obsidian": {
         "command": "bunx",
         "args": ["@mauricio.wolff/mcp-obsidian", "/path/to/your/vault"],
         "env": {}
       }
     }
   }
   ```

   Replace `/path/to/your/vault` with your actual Obsidian vault path.

   For other platforms, see [detailed configuration guides](#ai-client-configuration) below.

4. **Test with your AI:**
   - "List files in my Obsidian vault"
   - "Read my note called 'project-ideas.md'"
   - "Create a new note with today's date"

**Success indicators:** Your AI should be able to list files and read notes from your vault.

## Features

- ✅ Safe frontmatter parsing and validation using gray-matter
- ✅ Path filtering to exclude `.obsidian` directory and other system files
- ✅ **Complete MCP toolkit**: 11 methods covering all vault operations
  - File operations: `read_note`, `write_note`, `delete_note`, `move_note`
  - Directory operations: `list_directory`
  - Batch operations: `read_multiple_notes`
  - Search: `search_notes` with content and frontmatter support
  - Metadata: `get_frontmatter`, `update_frontmatter`, `get_notes_info`
  - Tag management: `manage_tags` (add, remove, list)
- ✅ **NEW:** Write modes: `overwrite`, `append`, `prepend` for flexible content editing
- ✅ **NEW:** Tag management: add, remove, and list tags in notes
- ✅ Safe deletion with confirmation requirement to prevent accidents
- ✅ Automatic path trimming to handle whitespace in inputs
- ✅ TypeScript support with Bun runtime (no compilation needed)
- ✅ Comprehensive error handling and validation

## Prerequisites

- [Bun](https://bun.sh) runtime (v1.0.0 or later)
- An Obsidian vault (local directory with `.md` files)
- MCP-compatible AI client (Claude Desktop, ChatGPT Desktop, Claude Code, etc.)

## Installation

### For End Users (Recommended)

No installation needed! Use `bunx` to run directly:

```bash
bunx @mauricio.wolff/mcp-obsidian /path/to/your/obsidian/vault
```

### For Developers

1. Clone this repository
2. Install dependencies with Bun:
```bash
bun install
```

3. Test locally with MCP inspector:
```bash
bunx @modelcontextprotocol/inspector bun server.ts /path/to/your/vault
```

## Usage

### Running the Server

**End users:**
```bash
bunx @mauricio.wolff/mcp-obsidian /path/to/your/obsidian/vault
```

**Developers:**
```bash
bun server.ts /path/to/your/obsidian/vault
```

### AI Client Configuration

#### Claude Desktop

Add to your Claude Desktop configuration file:

**Single Vault:**
```json
{
  "mcpServers": {
    "obsidian": {
      "command": "bunx",
      "args": ["@mauricio.wolff/mcp-obsidian", "/Users/yourname/Documents/MyVault"]
    }
  }
}
```

**Multiple Vaults:**
```json
{
  "mcpServers": {
    "obsidian-personal": {
      "command": "bunx",
      "args": ["@mauricio.wolff/mcp-obsidian", "/Users/yourname/Documents/PersonalVault"]
    },
    "obsidian-work": {
      "command": "bunx",
      "args": ["@mauricio.wolff/mcp-obsidian", "/Users/yourname/Documents/WorkVault"]
    }
  }
}
```

**Configuration File Locations:**
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `C:\Users\{username}\AppData\Roaming\Claude\claude_desktop_config.json`
- **Linux:** `~/.config/Claude/claude_desktop_config.json`

*You can also access this through Claude Desktop → Settings → Developer → Edit Config*

#### ChatGPT Desktop

**Requirements:** ChatGPT Enterprise, Education, or Team subscription (not available for individual Plus users)

ChatGPT uses MCP through Deep Research and developer mode. Configuration is done through the ChatGPT interface:

1. Access ChatGPT developer mode (beta feature)
2. Configure MCP servers through the built-in MCP client
3. Create custom connectors for your organization

*Note: ChatGPT Desktop's MCP integration is currently limited to enterprise subscriptions and uses a different setup process than file-based configuration.*

#### Claude Code

Claude Code uses `.claude.json` configuration file:

**User-scoped (recommended):**
Edit `~/.claude.json`:
```json
{
  "mcpServers": {
    "obsidian": {
      "command": "bunx",
      "args": ["@mauricio.wolff/mcp-obsidian", "/path/to/your/vault"],
      "env": {}
    }
  }
}
```

**Project-scoped:**
Edit `.claude.json` in your project or add to the projects section:
```json
{
  "projects": {
    "/path/to/your/project": {
      "mcpServers": {
        "obsidian": {
          "command": "bunx",
          "args": ["@mauricio.wolff/mcp-obsidian", "/path/to/your/vault"]
        }
      }
    }
  }
}
```

**Using Claude Code CLI:**
```bash
claude mcp add obsidian --scope user bunx @mauricio.wolff/mcp-obsidian /path/to/your/vault
```

#### Other MCP-Compatible Clients (2025)

**Confirmed MCP Support:**
- **IntelliJ IDEA 2025.1+** - Native MCP client support
- **Cursor IDE** - Built-in MCP compatibility
- **Zed, Replit, Codeium, Sourcegraph** - In development
- **Microsoft Copilot Studio** - Native MCP support with one-click server connections

Most modern MCP clients use similar JSON configuration patterns. Refer to your specific client's documentation for exact setup instructions.

### Examples

#### Ask your AI assistant about your notes:
- "What files are in my Obsidian vault?"
- "Read my note called 'project-ideas.md'"
- "Show me all notes with 'AI' in the title"

#### Have your AI assistant help with note management:
- "Create a new note called 'meeting-notes.md' with today's date in the frontmatter"
- "Append today's journal entry to my daily note"
- "Prepend an urgent task to my todo list"
- "Add the tags 'project' and 'urgent' to my task note"
- "List all tags in my research note"
- "Remove the 'draft' tag from my completed article"
- "List all markdown files in my 'Projects' folder"
- "Delete the old draft note 'draft-ideas.md' (with confirmation)"

## Troubleshooting

### Common Issues

#### "command not found: bunx"
- **Solution:** Install Bun runtime from [bun.sh](https://bun.sh)
- **Alternative:** Use npm: `npx @mauricio.wolff/mcp-obsidian /path/to/vault`

#### "Usage: bun server.ts /path/to/vault"
- **Cause:** No vault path provided
- **Solution:** Specify the full path to your Obsidian vault directory

#### "Permission denied" errors
- **Cause:** Insufficient file system permissions
- **Solution:** Ensure the vault directory is readable/writable by your user

#### "Path traversal not allowed"
- **Cause:** Trying to access files outside the vault
- **Solution:** All file paths must be relative to the vault root

#### AI client not recognizing the server
1. Check the configuration file path is correct for your OS
2. Ensure JSON syntax is valid (use a JSON validator)
3. Restart your AI client after configuration changes
4. Check your AI client's logs for error messages
5. Verify your AI client supports MCP (Model Context Protocol)

#### ".obsidian files still showing up"
- **Expected:** The path filter automatically excludes `.obsidian/**` patterns
- **If still seeing them:** The filter is working as designed for security

### Debug Mode

Run with error logging:
```bash
bunx @mauricio.wolff/mcp-obsidian /path/to/vault 2>debug.log
```

### Getting Help

- [Open an issue](https://github.com/bitbonsai/mcp-obsidian/issues) on GitHub
- Include your OS, Bun version, and error messages
- Provide the vault directory structure (without sensitive content)

## Testing

Run the test suite:
```bash
bun test
```

## API Methods

### `read_note`
Read a note from the vault with parsed frontmatter.

**Request:**
```json
{
  "name": "read_note",
  "arguments": {
    "path": "project-ideas.md"
  }
}
```

**Response:**
```json
{
  "path": "project-ideas.md",
  "frontmatter": {
    "title": "Project Ideas",
    "tags": ["projects", "brainstorming"],
    "created": "2023-01-15T10:30:00.000Z"
  },
  "content": "# Project Ideas\n\n## AI Tools\n- MCP server for Obsidian\n- Voice note transcription\n\n## Web Apps\n- Task management system"
}
```

### `write_note`
Write a note to the vault with optional frontmatter and write mode.

**Write Modes:**
- `overwrite` (default): Replace entire file content
- `append`: Add content to the end of existing file
- `prepend`: Add content to the beginning of existing file

**Request (Overwrite):**
```json
{
  "name": "write_note",
  "arguments": {
    "path": "meeting-notes.md",
    "content": "# Team Meeting\n\n## Agenda\n- Project updates\n- Next milestones",
    "frontmatter": {
      "title": "Team Meeting Notes",
      "date": "2023-12-01",
      "tags": ["meetings", "team"]
    },
    "mode": "overwrite"
  }
}
```

**Request (Append):**
```json
{
  "name": "write_note",
  "arguments": {
    "path": "daily-log.md",
    "content": "\n\n## 3:00 PM Update\n- Completed project review\n- Started new feature",
    "mode": "append"
  }
}
```

**Response:**
```json
{
  "message": "Successfully wrote note: meeting-notes.md (mode: overwrite)"
}
```

### `list_directory`
List files and directories in the vault.

**Request:**
```json
{
  "name": "list_directory",
  "arguments": {
    "path": "Projects"
  }
}
```

**Response:**
```json
{
  "path": "Projects",
  "directories": [
    "AI-Tools",
    "Web-Development"
  ],
  "files": [
    "project-template.md",
    "roadmap.md"
  ]
}
```

### `delete_note`
Delete a note from the vault (requires confirmation for safety).

**Request:**
```json
{
  "name": "delete_note",
  "arguments": {
    "path": "old-draft.md",
    "confirmPath": "old-draft.md"
  }
}
```

**Response (Success):**
```json
{
  "success": true,
  "path": "old-draft.md",
  "message": "Successfully deleted note: old-draft.md. This action cannot be undone."
}
```

**Response (Confirmation Failed):**
```json
{
  "success": false,
  "path": "old-draft.md",
  "message": "Deletion cancelled: confirmation path does not match. For safety, both 'path' and 'confirmPath' must be identical."
}
```

**⚠️ Safety Note:** The `confirmPath` parameter must exactly match the `path` parameter to proceed with deletion. This prevents accidental deletions.

### `get_frontmatter`
Extract only the frontmatter from a note without reading the full content.

**Request:**
```json
{
  "name": "get_frontmatter",
  "arguments": {
    "path": "project-ideas.md"
  }
}
```

**Response:**
```json
{
  "path": "project-ideas.md",
  "frontmatter": {
    "title": "Project Ideas",
    "tags": ["projects", "brainstorming"],
    "created": "2023-01-15T10:30:00.000Z"
  }
}
```

### `manage_tags`
Add, remove, or list tags in a note. Tags are managed in the frontmatter and inline tags are detected.

**Request (List Tags):**
```json
{
  "name": "manage_tags",
  "arguments": {
    "path": "research-notes.md",
    "operation": "list"
  }
}
```

**Request (Add Tags):**
```json
{
  "name": "manage_tags",
  "arguments": {
    "path": "research-notes.md",
    "operation": "add",
    "tags": ["machine-learning", "ai", "important"]
  }
}
```

**Request (Remove Tags):**
```json
{
  "name": "manage_tags",
  "arguments": {
    "path": "research-notes.md",
    "operation": "remove",
    "tags": ["draft", "temporary"]
  }
}
```

**Response:**
```json
{
  "path": "research-notes.md",
  "operation": "add",
  "tags": ["research", "ai", "machine-learning", "important"],
  "success": true,
  "message": "Successfully added tags"
}
```

### `search_notes`
Search for notes in the vault by content or frontmatter.

**Request:**
```json
{
  "name": "search_notes",
  "arguments": {
    "query": "machine learning",
    "limit": 5,
    "searchContent": true,
    "searchFrontmatter": false,
    "caseSensitive": false
  }
}
```

**Response:**
```json
{
  "query": "machine learning",
  "resultCount": 3,
  "results": [
    {
      "path": "ai-research.md",
      "title": "AI Research Notes",
      "excerpt": "...machine learning algorithms are...",
      "matchCount": 2,
      "lineNumber": 15
    }
  ]
}
```

### `move_note`
Move or rename a note in the vault.

**Request:**
```json
{
  "name": "move_note",
  "arguments": {
    "oldPath": "drafts/article.md",
    "newPath": "published/article.md",
    "overwrite": false
  }
}
```

**Response:**
```json
{
  "success": true,
  "oldPath": "drafts/article.md",
  "newPath": "published/article.md",
  "message": "Successfully moved note from drafts/article.md to published/article.md"
}
```

### `read_multiple_notes`
Read multiple notes in a batch (maximum 10 files).

**Request:**
```json
{
  "name": "read_multiple_notes",
  "arguments": {
    "paths": ["note1.md", "note2.md", "note3.md"],
    "includeContent": true,
    "includeFrontmatter": true
  }
}
```

**Response:**
```json
{
  "successful": [
    {
      "path": "note1.md",
      "frontmatter": {"title": "Note 1"},
      "content": "# Note 1\n\nContent here..."
    }
  ],
  "failed": [
    {
      "path": "note2.md",
      "error": "File not found"
    }
  ],
  "summary": {
    "successCount": 1,
    "failureCount": 1
  }
}
```

### `update_frontmatter`
Update frontmatter of a note without changing content.

**Request:**
```json
{
  "name": "update_frontmatter",
  "arguments": {
    "path": "research-note.md",
    "frontmatter": {
      "status": "completed",
      "updated": "2025-09-23"
    },
    "merge": true
  }
}
```

**Response:**
```json
{
  "message": "Successfully updated frontmatter for: research-note.md"
}
```

### `get_notes_info`
Get metadata for notes without reading full content.

**Request:**
```json
{
  "name": "get_notes_info",
  "arguments": {
    "paths": ["note1.md", "note2.md"]
  }
}
```

**Response:**
```json
{
  "notes": [
    {
      "path": "note1.md",
      "size": 1024,
      "modified": 1695456000000,
      "hasFrontmatter": true
    }
  ],
  "count": 1
}
```

## Security Considerations

This MCP server implements several security measures to protect your Obsidian vault:

### Path Security
- **Path Traversal Protection:** All file paths are validated to prevent access outside the vault
- **Relative Path Enforcement:** Paths are normalized and restricted to the vault directory
- **Symbolic Link Safety:** Resolved paths are checked against vault boundaries

### File Filtering
- **Automatic Exclusions:** `.obsidian`, `.git`, `node_modules`, and system files are filtered
- **Extension Whitelist:** Only `.md`, `.markdown`, and `.txt` files are accessible by default
- **Hidden File Protection:** Dot files and system directories are automatically excluded

### Content Validation
- **YAML Frontmatter Validation:** Frontmatter is parsed and validated before writing
- **Function/Symbol Prevention:** Dangerous JavaScript objects are blocked from frontmatter
- **Data Type Checking:** Only safe data types (strings, numbers, arrays, objects) allowed

### Best Practices
- **Least Privilege:** Server only accesses the specified vault directory
- **Read-Only by Default:** Consider running with read-only permissions for sensitive vaults
- **Backup Recommended:** Always backup your vault before using write operations
- **Network Isolation:** Server uses stdio transport (no network exposure)

### What's NOT Protected
- **File Content:** The server can read/write any allowed file content
- **Vault Structure:** Directory structure is visible to AI assistants
- **File Metadata:** Creation times, file sizes, etc. are accessible

**⚠️ Important:** Only grant vault access to trusted AI conversations. The server provides full read/write access to your notes within the security boundaries above.

## Architecture

- `server.ts` - MCP server entry point
- `src/frontmatter.ts` - YAML frontmatter handling with gray-matter
- `src/filesystem.ts` - Safe file operations with path validation
- `src/pathfilter.ts` - Directory and file filtering
- `src/types.ts` - TypeScript type definitions

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and add tests
4. Ensure all tests pass: `bun test`
5. Submit a pull request

## License

MIT