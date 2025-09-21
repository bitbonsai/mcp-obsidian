# MCP-Obsidian

A lightweight Model Context Protocol (MCP) server for safe Obsidian vault access. This server provides Claude with the ability to read and write notes in an Obsidian vault while preventing YAML frontmatter corruption.

## Features

- ✅ Safe frontmatter parsing and validation using gray-matter
- ✅ Path filtering to exclude `.obsidian` directory and other system files
- ✅ Core MCP methods: `read_note`, `write_note`, `list_directory`, `delete_note`
- ✅ Safe deletion with confirmation requirement to prevent accidents
- ✅ TypeScript support with Bun runtime (no compilation needed)
- ✅ Comprehensive error handling and validation

## Prerequisites

- [Bun](https://bun.sh) runtime (v1.0.0 or later)
- An Obsidian vault (local directory with `.md` files)
- Claude Desktop (for MCP integration)

## Installation

### For End Users (Recommended)

No installation needed! Use `bunx` to run directly:

```bash
bunx mcp-obsidian /path/to/your/obsidian/vault
```

### For Developers

1. Clone this repository
2. Install dependencies with Bun:
```bash
bun install
```

## Usage

### Running the Server

**End users:**
```bash
bunx mcp-obsidian /path/to/your/obsidian/vault
```

**Developers:**
```bash
bun server.ts /path/to/your/obsidian/vault
```

### Claude Desktop Configuration

#### Single Vault

Add to your Claude Desktop configuration file:

```json
{
  "mcpServers": {
    "obsidian": {
      "command": "bunx",
      "args": ["mcp-obsidian", "/Users/yourname/Documents/MyVault"]
    }
  }
}
```

#### Multiple Vaults

You can configure multiple vaults by creating separate MCP server entries:

```json
{
  "mcpServers": {
    "obsidian-personal": {
      "command": "bunx",
      "args": ["mcp-obsidian", "/Users/yourname/Documents/PersonalVault"]
    },
    "obsidian-work": {
      "command": "bunx",
      "args": ["mcp-obsidian", "/Users/yourname/Documents/WorkVault"]
    },
    "obsidian-research": {
      "command": "bunx",
      "args": ["mcp-obsidian", "/Users/yourname/Documents/ResearchVault"]
    }
  }
}
```

**Configuration File Locations:**
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux:** `~/.config/Claude/claude_desktop_config.json`

### Examples

#### Ask Claude about your notes:
- "What files are in my Obsidian vault?"
- "Read my note called 'project-ideas.md'"
- "Show me all notes with 'AI' in the title"

#### Have Claude help with note management:
- "Create a new note called 'meeting-notes.md' with today's date in the frontmatter"
- "Update the tags in my 'research.md' note to include 'machine-learning'"
- "List all markdown files in my 'Projects' folder"
- "Delete the old draft note 'draft-ideas.md' (with confirmation)"

## Troubleshooting

### Common Issues

#### "command not found: bunx"
- **Solution:** Install Bun runtime from [bun.sh](https://bun.sh)
- **Alternative:** Use npm: `npx mcp-obsidian /path/to/vault`

#### "Usage: bun server.ts /path/to/vault"
- **Cause:** No vault path provided
- **Solution:** Specify the full path to your Obsidian vault directory

#### "Permission denied" errors
- **Cause:** Insufficient file system permissions
- **Solution:** Ensure the vault directory is readable/writable by your user

#### "Path traversal not allowed"
- **Cause:** Trying to access files outside the vault
- **Solution:** All file paths must be relative to the vault root

#### Claude Desktop not recognizing the server
1. Check the configuration file path is correct for your OS
2. Ensure JSON syntax is valid (use a JSON validator)
3. Restart Claude Desktop after configuration changes
4. Check Claude Desktop logs for error messages

#### ".obsidian files still showing up"
- **Expected:** The path filter automatically excludes `.obsidian/**` patterns
- **If still seeing them:** The filter is working as designed for security

### Debug Mode

Run with error logging:
```bash
bunx mcp-obsidian /path/to/vault 2>debug.log
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
Write a note to the vault with optional frontmatter.

**Request:**
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
    }
  }
}
```

**Response:**
```json
{
  "message": "Successfully wrote note: meeting-notes.md"
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
- **Vault Structure:** Directory structure is visible to Claude
- **File Metadata:** Creation times, file sizes, etc. are accessible

**⚠️ Important:** Only grant vault access to trusted Claude conversations. The server provides full read/write access to your notes within the security boundaries above.

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