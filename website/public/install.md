# Install MCP-Vault

Get MCP-Vault running in seconds with any MCP-compatible platform.

## Step 1: Configure Your AI Platform

### Claude Desktop / ChatGPT+

Add to your MCP configuration file:

```json
{
  "mcpServers": {
    "obsidian": {
      "command": "npx",
      "args": ["mcpvault@latest", "/path/to/your/vault"]
    }
  }
}
```

### Claude Code

```bash
claude mcp add-json obsidian --scope user '{"type":"stdio","command":"npx","args":["mcpvault@latest","/path/to/your/vault"]}'
```

**Configuration Scopes:**
- `--scope user` - Available across all your projects (recommended)
- `--scope project` - Team-shared via .mcp.json file
- `--scope local` - Current project only (private)

### OpenCode

**Option 1: CLI (interactive)**

```bash
opencode mcp add
```

Select **local**, then enter the command: `npx -y mcpvault@latest /path/to/your/vault`

**Option 2: Config file**

Add to your `opencode.json` (project root) or `~/.config/opencode/opencode.json` (global):

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "obsidian": {
      "type": "local",
      "command": ["npx", "-y", "mcpvault@latest", "/path/to/your/vault"]
    }
  }
}
```

### Gemini CLI

**Option 1: CLI**

```bash
gemini mcp add obsidian -- npx mcpvault@latest /path/to/your/vault
```

**Option 2: Config file**

Add to `~/.gemini/settings.json`:

```json
{
  "mcpServers": {
    "obsidian": {
      "command": "npx",
      "args": ["mcpvault@latest", "/path/to/your/vault"]
    }
  }
}
```

### OpenAI Codex (TOML)

```toml
[mcp_servers.obsidian]
command = "npx"
args = ["-y", "mcpvault@latest", "/path/to/your/vault"]
```

### Optional no-path mode (uses current directory)

If your client launches MCP-Vault from inside your vault folder, you can omit the vault path.

```bash
npx mcpvault@latest
```

```json
"args": ["mcpvault@latest"]
```

Supported note file types: `.md`, `.markdown`, `.txt`, `.base`, `.canvas`.

<details>
<summary>Config File Locations (optional)</summary>

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

</details>

<details>
<summary>Need your vault path? (optional)</summary>

- macOS: In Finder, right-click your vault folder while holding `Option`, then choose `Copy "..." as Pathname`.
- Windows: In File Explorer, hold `Shift`, right-click your vault folder, then choose `Copy as path`.
- Linux: Open a terminal in your vault folder and run `pwd`.

Replace `/path/to/your/vault` with the full absolute path.

</details>

No pre-installation needed! npx automatically downloads and runs the server.

## Step 2: Test with MCP Inspector (Developers)

```bash
npm install -g @modelcontextprotocol/inspector
mcp-inspector npx mcpvault@latest /path/to/vault
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

Restart your AI platform and you'll see MCP-Vault connected. Your AI assistant can now safely read, search, and manage your Obsidian vault.
