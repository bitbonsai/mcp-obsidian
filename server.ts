#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./src/createServer.js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Get package.json version
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(
  readFileSync(join(__dirname, "../package.json"), "utf-8")
);
const VERSION = packageJson.version;

// Handle --version and --help flags
const arg = process.argv[2];
if (arg === "--version" || arg === "-v") {
  console.log(VERSION);
  process.exit(0);
}

if (arg === "--help" || arg === "-h") {
  console.log(`
@mauricio.wolff/mcp-obsidian v${VERSION}

Universal AI bridge for Obsidian vaults - connect any MCP-compatible assistant

Usage:
  npx @mauricio.wolff/mcp-obsidian <vault-path>

Arguments:
  <vault-path>    Path to your Obsidian vault directory

Options:
  --version, -v   Show version number
  --help, -h      Show this help message

Examples:
  npx @mauricio.wolff/mcp-obsidian ~/Documents/MyVault
  npx @mauricio.wolff/mcp-obsidian /path/to/obsidian/vault
`);
  process.exit(0);
}

const vaultPath = arg;
if (!vaultPath) {
  console.error("Usage: npx @mauricio.wolff/mcp-obsidian /path/to/vault");
  console.error("Run 'npx @mauricio.wolff/mcp-obsidian --help' for more information");
  process.exit(1);
}

const server = createServer(vaultPath, { version: VERSION });
const transport = new StdioServerTransport();
await server.connect(transport);
