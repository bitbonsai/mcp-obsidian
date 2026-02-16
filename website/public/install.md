# Install MCP-Obsidian

Get MCP-Obsidian running in seconds with any MCP-compatible platform.

## Step 1: Configure Your AI Platform

### Claude Desktop / ChatGPT+

Add to your MCP configuration file:

```json
{
  "mcpServers": {
    "obsidian": {
      "command": "npx",
      "args": ["@mauricio.wolff/mcp-obsidian@latest", "/path/to/your/vault"]
    }
  }
}
```

### Claude Code

```bash
claude mcp add-json obsidian --scope user '{"type":"stdio","command":"npx","args":["@mauricio.wolff/mcp-obsidian@latest","/path/to/your/vault"]}'
```

**Configuration Scopes:**
- `--scope user` - Available across all your projects (recommended)
- `--scope project` - Team-shared via .mcp.json file
- `--scope local` - Current project only (private)

### OpenCode

Add to your `opencode.json` (project root) or `~/.config/opencode/opencode.json` (global):

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "obsidian": {
      "type": "local",
      "command": ["npx", "-y", "@mauricio.wolff/mcp-obsidian@latest", "/path/to/your/vault"]
    }
  }
}
```

### Gemini CLI

```json
{
  "mcpServers": {
    "obsidian": {
      "command": "npx",
      "args": ["@mauricio.wolff/mcp-obsidian@latest", "/path/to/your/vault"]
    }
  }
}
```

### OpenAI Codex (TOML)

```toml
[mcp_servers.obsidian]
command = "npx"
args = ["-y", "@mauricio.wolff/mcp-obsidian@latest", "/path/to/your/vault"]
```

## Config File Locations

| Platform | Path |
|----------|------|
| Claude Desktop (macOS) | ~/Library/Application Support/Claude/claude_desktop_config.json |
| Claude Desktop (Windows) | %APPDATA%\Claude\claude_desktop_config.json |
| Claude Code | ~/.claude.json (user scope) |
| ChatGPT+ (macOS) | ~/Library/Application Support/ChatGPT/chatgpt_config.json |
| ChatGPT+ (Windows) | %APPDATA%\ChatGPT\chatgpt_config.json |
| Gemini CLI | ~/.gemini/settings.json |
| OpenCode (per project) | opencode.json |
| OpenCode (global) | ~/.config/opencode/opencode.json |
| OpenAI Codex (macOS/Linux) | ~/.codex/config.toml |
| OpenAI Codex (Windows) | %USERPROFILE%\.codex\config.toml |

No pre-installation needed! npx automatically downloads and runs the server.

## Step 2: Test with MCP Inspector (Developers)

```bash
npm install -g @modelcontextprotocol/inspector
mcp-inspector npx @mauricio.wolff/mcp-obsidian@latest /path/to/vault
```

Opens interactive web interface at http://localhost:5173 for testing all MCP methods.

## Platform Compatibility

Works with all MCP-compatible platforms: Claude Desktop, ChatGPT+, Claude Code, OpenCode, Gemini CLI, Cursor IDE, Windsurf, and more.

## Privacy

- Your vault files stay on your computer
- We never see, store, or transmit your data
- Only you and your AI assistant can access your notes
- AI providers (Anthropic, OpenAI) process content you share with them
- For commercial Claude users: Your data won't be used for AI training

## You're All Set!

Restart your AI platform and you'll see MCP-Obsidian connected. Your AI assistant can now safely read, search, and manage your Obsidian vault.
