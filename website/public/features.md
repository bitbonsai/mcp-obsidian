# MCP-Obsidian Features

Designed for safety, performance, and developer experience. Every feature gives AI intelligent access without compromising your data.

## Core Features

### Powerful Search
Fast search across your entire vault. AI can locate notes by name, content, tags, or metadata instantly. Returns token-optimized results with minified field names.

### Safe Frontmatter Handling
YAML parser validates and preserves formatting, ensuring safe atomic updates to note metadata.

### File Operations
Read, write, and manage notes safely. Create, update, and organize your vault with AI assistance.

### Security First
Path traversal protection and safe file operations. Controlled AI access through MCP protocol.

### Node.js Compatible
Built with Node.js for broad compatibility and ecosystem support.

### Token Optimized
Minified JSON field names and compact responses. Less token usage means faster, cheaper API calls.

### TypeScript
Fully typed for excellent developer experience.

### Open Source
MIT licensed and community driven.

### Complete Toolkit
13 MCP tools for vault management: read/write/patch files, search content, manage tags, update frontmatter, vault stats, and more. Built for AI assistant integration.

### Multi-Platform
Works with Claude Desktop, ChatGPT+ Desktop, OpenCode, Cursor IDE, and other MCP-compatible AI platforms.

## Comparison with Alternatives

| Feature | MCP-Obsidian | Other MCP-Obsidian (Plugin-based) | Generic FS MCP | Direct File Access |
|---------|-------------|----------------------------------|----------------|-------------------|
| Setup Complexity | Simple - just point to vault path | Complex - requires Obsidian plugin + API key | Moderate | Variable |
| Obsidian Running Required | No | Yes | No | No |
| Plugin Dependencies | None | Required (Local REST API plugin) | None | None |
| Frontmatter Safety | Protected (advanced YAML parsing) | API-dependent | Can corrupt | Can corrupt |
| Built-in Search | Advanced | Good (via Obsidian API) | None | None |
| Performance | Fast (optimized for large vaults) | API overhead | Slow | Variable |
| Link Handling | Intelligent | Good | Breaks links | Breaks links |
| Reliability | High (direct file access) | Plugin-dependent | Basic | Variable |

**Summary:** 8/8 features with clear advantage. Zero plugin dependencies. Instant setup time.
