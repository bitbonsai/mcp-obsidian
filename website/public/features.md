# MCP-Obsidian Features

Designed for safety, performance, and developer experience. Every feature gives AI intelligent access without compromising your data.

## Core Features

### Powerful Search
Fast full-text search across your entire vault with multi-word matching and BM25 relevance ranking. AI can locate notes by name, content, tags, or metadata instantly.

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
14 MCP tools for vault management: read/write/patch/move files, search content, manage tags, update frontmatter, vault stats, and more. Built for AI assistant integration.

### Multi-Platform
Works with Claude Desktop, ChatGPT+ Desktop, OpenCode, Gemini CLI, OpenAI Codex, Cursor IDE, Windsurf IDE, IntelliJ IDEA, and other MCP-compatible AI platforms.

## Comparison with Alternatives

| Feature | MCP-Obsidian | Other MCP-Obsidian (Plugin-based) | Generic FS MCP | Direct File Access |
|---------|-------------|----------------------------------|----------------|-------------------|
| Setup Complexity | Simple - just point to vault path | Complex - requires Obsidian plugin + API key | Moderate | Variable |
| Obsidian Running Required | No | Yes | No | No |
| Plugin Dependencies | None | Required (Local REST API plugin) | None | None |
| Frontmatter Safety | Protected (advanced YAML parsing) | API-dependent | Can corrupt | Can corrupt |
| Built-in Search | Advanced (full-text + BM25 ranking) | Good (via Obsidian API) | None | None |
| Performance | Fast (optimized with batch I/O) | API overhead | Slow | Variable |
| Link Handling | Safe (preserves content/frontmatter on move) | Good | Breaks links | Breaks links |
| Reliability | High (direct file access) | Plugin-dependent | Basic | Variable |

**Summary:** 8/8 features with clear advantage. Zero plugin dependencies. Instant setup time.

## FAQ

### Does my data leave my computer?
Vault files stay local. MCP-Obsidian reads and writes files on your machine. Your AI provider only sees content your client sends.

### Does Obsidian need to be running?
No. MCP-Obsidian works via filesystem access, so Obsidian can be closed.

### Can I use multiple vaults?
Yes. Configure multiple MCP server entries, one per vault path.

### What file types are supported?
Read/write tools support `.md`, `.markdown`, and `.txt` notes. `list_directory` may show other filenames (like `.png` or `.pdf`), but non-note files are not read as notes.

### Is search semantic?
No. Search is lexical full-text matching with BM25 ranking, not embedding/vector semantic retrieval.

### What if the AI makes a mistake?
Use backups or version control. Deletions require explicit path confirmation and all operations stay inside your configured vault.
