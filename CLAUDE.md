# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MCP-Obsidian is a Model Context Protocol (MCP) server that provides a universal AI bridge for Obsidian vaults. It enables any MCP-compatible AI assistant (Claude, ChatGPT, etc.) to safely read and write notes in Obsidian vaults while preserving YAML frontmatter and enforcing security boundaries.

## Development Commands

### Build and Test
- `npm run build` - Compile TypeScript to JavaScript (output to `dist/`)
- `npm test` - Run test suite with Vitest
- `npm run test:watch` - Run tests in watch mode
- `npm start /path/to/vault` - Run the server locally with tsx (development)

### Running a Single Test
```bash
npm test -- path/to/test-file.test.ts
npm test -- -t "test name pattern"
```

### Publishing
- `npm run publish:dry` - Test publish without actually publishing
- `npm run publish:beta` - Publish to npm with beta tag
- `npm run publish:latest` - Publish to npm as latest version
- `npm run prepublishOnly` - Automatically runs build and tests before publish

### Testing with MCP Inspector
```bash
npx @modelcontextprotocol/inspector npm start /path/to/test/vault
# OR for published package:
npx @modelcontextprotocol/inspector npx @mauricio.wolff/mcp-obsidian@latest /path/to/vault
```

## Architecture

### Core Components

**server.ts** - MCP server entry point
- Handles command-line arguments (--help, --version, vault path)
- Initializes all services (PathFilter, FrontmatterHandler, FileSystemService, SearchService)
- Registers 12 MCP tools (read_note, write_note, patch_note, list_directory, delete_note, search_notes, move_note, read_multiple_notes, update_frontmatter, get_notes_info, get_frontmatter, manage_tags)
- Implements request handlers for ListTools and CallTool
- Provides automatic path trimming for all path arguments

**src/filesystem.ts** - FileSystemService class
- Orchestrates all file operations with security enforcement
- Path resolution and security validation (prevents path traversal)
- Implements all note operations: read, write, patch, delete, move, list
- Batch operations: read multiple notes, get notes info
- Tag management in frontmatter and inline tags
- Uses native Node.js fs/promises APIs

**src/frontmatter.ts** - FrontmatterHandler class
- Uses `gray-matter` library for parsing/stringifying YAML frontmatter
- Validates frontmatter structure (blocks functions, symbols, invalid types)
- Gracefully handles notes without frontmatter
- Preserves original content with `originalContent` field

**src/pathfilter.ts** - PathFilter class
- Security layer that filters allowed paths and file types
- Blocks: `.obsidian/`, `.git/`, `node_modules/`, system files, dot files
- Allows: `.md`, `.markdown`, `.txt` files
- Works on relative paths (path components checked independently)

**src/search.ts** - SearchService class
- Content and frontmatter search with configurable case sensitivity
- Returns token-optimized results with minified field names (p, t, ex, mc, ln)
- Configurable search limits (max 20 results)

**src/types.ts** - TypeScript type definitions
- All interfaces for parameters, results, and data structures
- Defines ParsedNote, NoteWriteParams, SearchResult, etc.

### Key Design Patterns

**Service Layer Architecture**
- Each service (FileSystem, Frontmatter, PathFilter, Search) has a single responsibility
- Services are dependency-injected into server.ts
- Services can be tested independently

**Security-First Design**
- All paths validated through PathFilter before any operation
- Path traversal prevention via relative path checking
- Confirmation required for destructive operations (delete requires confirmPath match)
- Read-only system directories automatically filtered

**Token Optimization**
- JSON responses use minified field names by default (e.g., `fm` instead of `frontmatter`)
- Optional `prettyPrint` parameter for human-readable debugging
- Search results use compact format: `{p, t, ex, mc, ln}`

**Error Handling**
- Comprehensive error messages with context
- Operations return structured results with `success` boolean
- Failed batch operations return partial results (successful + failed arrays)

### Write Modes
Three modes for writing notes:
1. **overwrite** (default) - Replace entire file
2. **append** - Add content to end, merge frontmatter
3. **prepend** - Add content to beginning, merge frontmatter

### Patch Operation
The `patch_note` tool efficiently updates parts of a note:
- Finds and replaces exact string matches (including whitespace/newlines)
- `replaceAll: false` (default) fails if multiple matches found (prevents accidents)
- `replaceAll: true` replaces all occurrences
- Operates on full content including frontmatter

## Important Implementation Details

### Path Handling
- All paths are relative to vault root
- Leading slashes are stripped automatically
- Whitespace is trimmed from all path arguments (server.ts trimPaths helper)
- Paths are resolved and checked against vault boundaries

### Frontmatter Preservation
- Always use FrontmatterHandler for reading/writing notes
- `originalContent` field contains raw file content
- Writing with frontmatter automatically formats YAML delimiters
- Empty frontmatter objects result in no frontmatter block

### Version Management
- Version is read from package.json at runtime
- Used in MCP server initialization and --version flag
- Package version is also used in website (via monorepo setup)

## Configuration Files

**tsconfig.json** - Main TypeScript config (strict mode, ES2022)
**tsconfig.build.json** - Build-specific config (excludes tests)
**vitest.config.ts** - Test configuration (globals enabled, node environment)

## Testing

Tests use Vitest with:
- Globals enabled (describe, it, expect available without imports)
- Node environment
- Test files: `*.test.ts` in src/

When writing tests:
- Test both success and error cases
- Test path security (path traversal, access denied)
- Test frontmatter parsing edge cases
- Use Promise.allSettled patterns for batch operations

## Security Considerations

When modifying file operations:
- Always validate paths through PathFilter
- Always use resolvePath() to prevent traversal
- Never expose system directories or configuration
- Validate frontmatter before writing
- Require confirmation for destructive operations

## Monorepo Structure

The repository contains a `website/` subdirectory (separate monorepo project) for documentation. The main package.json contains the MCP server. The website dynamically reads the version from the main package.json.
