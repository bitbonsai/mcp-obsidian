# MCP-FS-Obsidian

A lightweight Model Context Protocol (MCP) server for safe Obsidian vault access. This server provides Claude with the ability to read and write notes in an Obsidian vault while preventing YAML frontmatter corruption.

## Features

- ✅ Safe frontmatter parsing and validation using gray-matter
- ✅ Path filtering to exclude `.obsidian` directory and other system files
- ✅ Basic MCP methods: `read_note`, `write_note`, `list_directory`
- ✅ TypeScript support with Bun runtime (no compilation needed)
- ✅ Comprehensive error handling and validation

## Installation

### For End Users (Recommended)

No installation needed! Use `bunx` to run directly:

```bash
bunx mcp-fs-obsidian /path/to/your/obsidian/vault
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
bunx mcp-fs-obsidian /path/to/your/obsidian/vault
```

**Developers:**
```bash
bun server.ts /path/to/your/obsidian/vault
```

### With Claude Desktop

Add to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "obsidian": {
      "command": "bunx",
      "args": ["mcp-fs-obsidian", "/path/to/vault"]
    }
  }
}
```

## Testing

Run the test suite:
```bash
bun test
```

## API Methods

### `read_note`
Read a note from the vault with parsed frontmatter.

```json
{
  "name": "read_note",
  "arguments": {
    "path": "my-note.md"
  }
}
```

### `write_note`
Write a note to the vault with optional frontmatter.

```json
{
  "name": "write_note",
  "arguments": {
    "path": "my-note.md",
    "content": "Note content here",
    "frontmatter": {
      "title": "My Note",
      "tags": ["example"]
    }
  }
}
```

### `list_directory`
List files and directories in the vault.

```json
{
  "name": "list_directory",
  "arguments": {
    "path": "subfolder"
  }
}
```

## Architecture

- `server.ts` - MCP server entry point
- `src/frontmatter.ts` - YAML frontmatter handling with gray-matter
- `src/filesystem.ts` - Safe file operations with path validation
- `src/pathfilter.ts` - Directory and file filtering
- `src/types.ts` - TypeScript type definitions

## License

MIT