#!/usr/bin/env bun

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { FileSystemService } from "./src/filesystem.js";
import { FrontmatterHandler } from "./src/frontmatter.js";
import { PathFilter } from "./src/pathfilter.js";

const vaultPath = process.argv[2];
if (!vaultPath) {
  console.error("Usage: bun server.ts /path/to/vault");
  process.exit(1);
}

// Initialize services
const pathFilter = new PathFilter();
const frontmatterHandler = new FrontmatterHandler();
const fileSystem = new FileSystemService(vaultPath, pathFilter, frontmatterHandler);

const server = new Server({
  name: "mcp-fs-obsidian",
  version: "0.1.0"
}, {
  capabilities: {
    tools: {},
  },
});

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "read_note",
        description: "Read a note from the Obsidian vault",
        inputSchema: {
          type: "object",
          properties: {
            path: {
              type: "string",
              description: "Path to the note relative to vault root"
            }
          },
          required: ["path"]
        }
      },
      {
        name: "write_note",
        description: "Write a note to the Obsidian vault",
        inputSchema: {
          type: "object",
          properties: {
            path: {
              type: "string",
              description: "Path to the note relative to vault root"
            },
            content: {
              type: "string",
              description: "Content of the note"
            },
            frontmatter: {
              type: "object",
              description: "Frontmatter object (optional)"
            }
          },
          required: ["path", "content"]
        }
      },
      {
        name: "list_directory",
        description: "List files and directories in the vault",
        inputSchema: {
          type: "object",
          properties: {
            path: {
              type: "string",
              description: "Path relative to vault root (default: '/')",
              default: "/"
            }
          }
        }
      }
    ]
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "read_note": {
        const note = await fileSystem.readNote(args.path);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                path: args.path,
                frontmatter: note.frontmatter,
                content: note.content
              }, null, 2)
            }
          ]
        };
      }

      case "write_note": {
        await fileSystem.writeNote({
          path: args.path,
          content: args.content,
          frontmatter: args.frontmatter
        });
        return {
          content: [
            {
              type: "text",
              text: `Successfully wrote note: ${args.path}`
            }
          ]
        };
      }

      case "list_directory": {
        const listing = await fileSystem.listDirectory(args.path || '');
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                path: args.path || '/',
                directories: listing.directories,
                files: listing.files
              }, null, 2)
            }
          ]
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      ],
      isError: true
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);