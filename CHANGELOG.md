# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.6.3] - 2025-10-10

### Added
- **Token optimization**: New `prettyPrint` parameter for all JSON responses (default: false)
  - Applies to: `read_note`, `search_notes`, `list_directory`, `read_multiple_notes`, `get_notes_info`, `get_frontmatter`
  - Reduces token usage by ~30-40% when disabled

### Changed
- **Response optimization**: Removed redundant fields from responses to reduce token count
  - `read_note`: Removed redundant `path` field, shortened `frontmatter` to `fm`
  - `list_directory`: Shortened `directories` to `dirs`, removed redundant `path` field
  - `search_notes`: Removed redundant `query` and `resultCount` wrapper
  - `read_multiple_notes`: Shortened fields to `ok`/`err`, removed redundant summary
  - `get_notes_info`: Returns array directly without wrapper
  - `get_frontmatter`: Returns frontmatter directly without wrapper
- **Search results**: Minified field names for 40-60% token reduction
  - `path` → `p`
  - `title` → `t`
  - `excerpt` → `ex`
  - `matchCount` → `mc`
  - `lineNumber` → `ln`
- **Search excerpt**: Reduced context from 50 to 21 characters before/after match
- **JSON formatting**: Default to compact (no pretty-printing) to save tokens

### Performance
- **Overall token reduction**: 40-60% fewer tokens in typical responses
- **Search operations**: Significantly faster with smaller excerpts and minified fields
- **API responses**: More efficient for high-volume operations

## [0.6.1] - 2025-10-09

### Added
- **Comprehensive patch_note testing**: Added 16 tests covering all edge cases
  - Single and multiple occurrence handling
  - Empty string validation
  - Special character handling (regex chars treated literally)
  - Whitespace preservation (tabs and spaces)
  - Case sensitivity verification
  - Performance testing (100+ replacements)
  - Path handling with spaces
- **Test reorganization**: Moved tests from `tests/` to `src/` for better co-location
  - Merged filesystem, patch, and integration tests into single file
  - All 38 tests passing

### Fixed
- **patch_note validation**: Added validation for empty `oldString` and `newString` parameters
- **Error messages**: Improved error messages for empty string parameters

### Changed
- **Test structure**: Reorganized test files to be co-located with source files
  - `src/filesystem.test.ts` (30 tests)
  - `src/frontmatter.test.ts` (8 tests)

## [0.6.0] - 2025-10-08

### Added
- **patch_note tool**: Efficient partial note updates by replacing specific strings
  - Replace single or multiple occurrences
  - Multiline string support
  - Safety checks for multiple matches
  - Preserves frontmatter
  - More efficient than rewriting entire files

## [0.5.4] - 2025-09-23

### Fixed
- **YAML frontmatter operations**: Fixed critical "yaml.dump is not a function" errors in `write_note`, `update_frontmatter`, and `manage_tags` tools
- **Dependency cleanup**: Removed js-yaml dependency entirely, now using gray-matter for all YAML operations
- **list_directory**: Fixed handling of "." path to properly return root directory contents including both files and directories

### Added
- **Comprehensive test suite**: Added 22 integration tests covering all frontmatter operations
- **Test coverage**: Added tests for write_note with frontmatter, append/prepend modes, update operations, and tag management
- **Error validation**: Added edge case testing for tag management and frontmatter validation

### Changed
- **YAML handling**: Migrated all YAML serialization to use gray-matter consistently
- **Validation**: Updated frontmatter validation to use `matter.stringify()` instead of `yaml.dump()`
- **Package.json**: Updated main field to point to correct compiled output

## [0.5.1] - 2025-09-23

### Fixed
- **Package configuration**: Fixed package.json main field to point to `dist/server.js`
- **Executable permissions**: Fixed executable permissions for compiled JavaScript output
- **Usage message**: Fixed usage message in compiled JavaScript to show correct npm command
- **Claude Desktop compatibility**: Fixed "env: bun: No such file or directory" error

### Added
- **TypeScript compilation**: Added proper TypeScript build process for npm distribution
- **Distribution files**: Added compiled JavaScript files to dist/ directory

## [0.5.0] - 2025-09-23

### Changed
- **🚨 BREAKING**: Complete migration from Bun to npm/Node.js runtime
- **Runtime**: Replaced all Bun APIs with Node.js equivalents
- **Package manager**: Converted from Bun to npm package management
- **Build system**: Added TypeScript compilation for distribution

### Added
- **Node.js compatibility**: Full Node.js runtime support (v18.0.0+)
- **npm distribution**: Published as npm package `@mauricio.wolff/mcp-obsidian`
- **TypeScript tooling**: Added tsx for development and tsc for building
- **Vitest testing**: Replaced Bun test with Vitest test runner

### Removed
- **Bun dependencies**: Removed all Bun-specific APIs and runtime dependencies
- **Bun.file(), Bun.write()**: Replaced with Node.js fs functions
- **Bun.Glob()**: Replaced with recursive directory scanning

## [0.3.0] - 2025-09-23

### Added
- **Write modes**: Added `append`, `prepend`, and `overwrite` modes for flexible content editing
- **Tag management**: Complete tag management system with add, remove, and list operations
- **get_frontmatter**: New tool for metadata-only extraction without reading full content
- **Path trimming**: Automatic whitespace handling in path inputs
- **API documentation**: Complete documentation for all 11 MCP methods
- **Quick Start guide**: 5-minute setup guide for immediate use
- **Multi-platform support**: Claude Desktop, Claude Code, ChatGPT Desktop, IntelliJ IDEA support

### Changed
- **Package scope**: Migrated to scoped npm package `@mauricio.wolff/mcp-obsidian`
- **Documentation**: Made README AI-agnostic with comprehensive examples
- **Version consistency**: Synchronized version across all files

### Fixed
- **API documentation**: Added missing docs for search_notes, move_note, read_multiple_notes, update_frontmatter, get_notes_info
- **MCP inspector**: Fixed command syntax for testing

## [0.2.x] - 2025-09-21/22

### Added
- **delete_note**: Safe deletion with confirmation requirement
- **Path security**: Enhanced path validation and traversal protection
- **Error handling**: Improved error messages and validation

### Changed
- **Project name**: Renamed from mcp-fs-obsidian to mcp-obsidian
- **Bun optimization**: Pure Bun implementation with native APIs
- **Documentation**: Significantly improved README with examples

### Fixed
- **Command usage**: Fixed README to use bunx for end users
- **File filtering**: Added .tmp files to gitignore

## [0.1.0] - 2025-09-21

### Added
- **Initial release**: Basic MCP server for Obsidian vault access
- **Core tools**: read_note, write_note, list_directory, search_notes
- **Security**: Path filtering and vault boundary protection
- **Frontmatter**: YAML frontmatter parsing and validation
- **MCP protocol**: Model Context Protocol server implementation

### Features
- Obsidian vault integration
- Safe file operations
- Frontmatter handling
- Directory listing
- Content search

---

## Migration Notes

### From Bun to Node.js (v0.5.0)
If you were using the Bun version, update your configuration:

**Old (Bun):**
```json
{
  "command": "bunx",
  "args": ["mcp-obsidian", "/path/to/vault"]
}
```

**New (Node.js):**
```json
{
  "command": "npx",
  "args": ["@mauricio.wolff/mcp-obsidian@latest", "/path/to/vault"]
}
```

### Package Name Change (v0.3.0)
The package was renamed and moved to a scoped package for better npm distribution.

## Security Updates

All versions include security measures:
- Path traversal protection
- File type filtering
- YAML validation
- Vault boundary enforcement

## Support

- **Node.js**: v18.0.0 or later required
- **MCP Clients**: Claude Desktop, Claude Code, ChatGPT Desktop, IntelliJ IDEA 2025.1+
- **File Types**: .md, .markdown, .txt files supported