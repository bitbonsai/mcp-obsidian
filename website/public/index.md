# MCP-Obsidian - Universal AI Bridge for Obsidian Vaults

**License:** MIT | **Free**

## Your assistant. Your notes. Zero friction.

This MCP server lets Claude, ChatGPT+, and other assistants access your vault. Locally, safe frontmatter, no cloud sync.

- [Get Started](/install) - Install and configure in seconds
- [View on GitHub](https://github.com/bitbonsai/mcp-obsidian)

## Recent Updates

- **v0.8.2 (March 2026):** Trailing-slash vault paths no longer truncate search results ([PR #48](https://github.com/bitbonsai/mcp-obsidian/pull/48)), `get_vault_stats` now handles dotted folder names correctly ([PR #42](https://github.com/bitbonsai/mcp-obsidian/pull/42)), note tools now support `.base` and `.canvas` ([PR #53](https://github.com/bitbonsai/mcp-obsidian/pull/53)), string frontmatter inputs are now handled safely ([PR #47](https://github.com/bitbonsai/mcp-obsidian/pull/47)), vault path is now optional in CLI mode (defaults to current working directory, [#50](https://github.com/bitbonsai/mcp-obsidian/issues/50)), and dependency refreshes for the MCP SDK and Node types are merged ([PR #43](https://github.com/bitbonsai/mcp-obsidian/pull/43), [PR #44](https://github.com/bitbonsai/mcp-obsidian/pull/44))
- **v0.8.1:** Multi-word BM25 search relevance improvements ([PR #38](https://github.com/bitbonsai/mcp-obsidian/pull/38)), patch_note undefined/null validation hardening ([PR #37](https://github.com/bitbonsai/mcp-obsidian/pull/37)), new `move_file` tool for binary-safe file moves with explicit path confirmation, binary filenames now visible in directory listings ([#21](https://github.com/bitbonsai/mcp-obsidian/issues/21))
- **v0.7.5:** Search now matches note filenames ([#30](https://github.com/bitbonsai/mcp-obsidian/issues/30)), hidden directories filtered from listings ([#33](https://github.com/bitbonsai/mcp-obsidian/issues/33)), OpenCode install docs ([#35](https://github.com/bitbonsai/mcp-obsidian/issues/35))
- **v0.7.4:** New get_vault_stats tool + improved error messages with remediation suggestions
- **v0.7.3:** Bug fix for folder detection with dots in names + dependency updates ([PR #15](https://github.com/bitbonsai/mcp-obsidian/pull/15))
- **v0.7.2:** Security hardening - TOCTOU fixes, regex injection prevention, comprehensive CI/CD ([PR #12](https://github.com/bitbonsai/mcp-obsidian/pull/12))

## Navigation

- [Install](/install.md) - Configuration for all supported platforms
- [Features](/features.md) - Core features and comparison with alternatives
- [Demo](/demo.md) - Interactive examples of vault operations
- [How It Works](/how-it-works.md) - Usage examples with real AI conversations
- [Skill](/skill.md) - Obsidian skill routing and workflow patterns

## Links

- Repository: https://github.com/bitbonsai/mcp-obsidian
- npm: https://www.npmjs.com/package/@mauricio.wolff/mcp-obsidian
- Changelog: https://github.com/bitbonsai/mcp-obsidian/blob/main/CHANGELOG.md
- Website: https://mcp-obsidian.org
