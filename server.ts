#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { FileSystemService } from "./src/filesystem.js";
import { FrontmatterHandler } from "./src/frontmatter.js";
import { PathFilter } from "./src/pathfilter.js";
import { SearchService } from "./src/search.js";
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

// Initialize services
const pathFilter = new PathFilter();
const frontmatterHandler = new FrontmatterHandler();
const fileSystem = new FileSystemService(vaultPath, pathFilter, frontmatterHandler);
const searchService = new SearchService(vaultPath, pathFilter);

const server = new Server({
  name: "mcp-obsidian",
  version: VERSION
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
            },
            prettyPrint: {
              type: "boolean",
              description: "Format JSON response with indentation (default: false)",
              default: false
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
            },
            mode: {
              type: "string",
              enum: ["overwrite", "append", "prepend"],
              description: "Write mode: 'overwrite' (default), 'append', or 'prepend'",
              default: "overwrite"
            }
          },
          required: ["path", "content"]
        }
      },
      {
        name: "patch_note",
        description: "Efficiently update part of a note by replacing a specific string. This is more efficient than rewriting the entire note for small changes.",
        inputSchema: {
          type: "object",
          properties: {
            path: {
              type: "string",
              description: "Path to the note relative to vault root"
            },
            oldString: {
              type: "string",
              description: "The exact string to replace. Must match exactly including whitespace and line breaks."
            },
            newString: {
              type: "string",
              description: "The new string to insert in place of oldString"
            },
            replaceAll: {
              type: "boolean",
              description: "If true, replace all occurrences. If false (default), the operation will fail if multiple matches are found to prevent unintended replacements.",
              default: false
            }
          },
          required: ["path", "oldString", "newString"]
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
            },
            prettyPrint: {
              type: "boolean",
              description: "Format JSON response with indentation (default: false)",
              default: false
            }
          }
        }
      },
      {
        name: "delete_note",
        description: "Delete a note from the Obsidian vault (requires confirmation)",
        inputSchema: {
          type: "object",
          properties: {
            path: {
              type: "string",
              description: "Path to the note relative to vault root"
            },
            confirmPath: {
              type: "string",
              description: "Confirmation: must exactly match the path parameter to proceed with deletion"
            }
          },
          required: ["path", "confirmPath"]
        }
      },
      {
        name: "search_notes",
        description: "Search for notes in the vault by content or frontmatter",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Search query text"
            },
            limit: {
              type: "number",
              description: "Maximum number of results (default: 5, max: 20)",
              default: 5
            },
            searchContent: {
              type: "boolean",
              description: "Search in note content (default: true)",
              default: true
            },
            searchFrontmatter: {
              type: "boolean",
              description: "Search in frontmatter (default: false)",
              default: false
            },
            caseSensitive: {
              type: "boolean",
              description: "Case sensitive search (default: false)",
              default: false
            },
            prettyPrint: {
              type: "boolean",
              description: "Format JSON response with indentation (default: false)",
              default: false
            }
          },
          required: ["query"]
        }
      },
      {
        name: "move_note",
        description: "Move or rename a note in the vault",
        inputSchema: {
          type: "object",
          properties: {
            oldPath: {
              type: "string",
              description: "Current path of the note"
            },
            newPath: {
              type: "string",
              description: "New path for the note"
            },
            overwrite: {
              type: "boolean",
              description: "Allow overwriting existing file (default: false)",
              default: false
            }
          },
          required: ["oldPath", "newPath"]
        }
      },
      {
        name: "read_multiple_notes",
        description: "Read multiple notes in a batch (max 10 files)",
        inputSchema: {
          type: "object",
          properties: {
            paths: {
              type: "array",
              items: { type: "string" },
              description: "Array of note paths to read",
              maxItems: 10
            },
            includeContent: {
              type: "boolean",
              description: "Include note content (default: true)",
              default: true
            },
            includeFrontmatter: {
              type: "boolean",
              description: "Include frontmatter (default: true)",
              default: true
            },
            prettyPrint: {
              type: "boolean",
              description: "Format JSON response with indentation (default: false)",
              default: false
            }
          },
          required: ["paths"]
        }
      },
      {
        name: "update_frontmatter",
        description: "Update frontmatter of a note without changing content",
        inputSchema: {
          type: "object",
          properties: {
            path: {
              type: "string",
              description: "Path to the note"
            },
            frontmatter: {
              type: "object",
              description: "Frontmatter object to update"
            },
            merge: {
              type: "boolean",
              description: "Merge with existing frontmatter (default: true)",
              default: true
            }
          },
          required: ["path", "frontmatter"]
        }
      },
      {
        name: "get_notes_info",
        description: "Get metadata for notes without reading full content",
        inputSchema: {
          type: "object",
          properties: {
            paths: {
              type: "array",
              items: { type: "string" },
              description: "Array of note paths to get info for"
            },
            prettyPrint: {
              type: "boolean",
              description: "Format JSON response with indentation (default: false)",
              default: false
            }
          },
          required: ["paths"]
        }
      },
      {
        name: "get_frontmatter",
        description: "Extract frontmatter from a note without reading the content",
        inputSchema: {
          type: "object",
          properties: {
            path: {
              type: "string",
              description: "Path to the note relative to vault root"
            },
            prettyPrint: {
              type: "boolean",
              description: "Format JSON response with indentation (default: false)",
              default: false
            }
          },
          required: ["path"]
        }
      },
      {
        name: "manage_tags",
        description: "Add, remove, or list tags in a note",
        inputSchema: {
          type: "object",
          properties: {
            path: {
              type: "string",
              description: "Path to the note relative to vault root"
            },
            operation: {
              type: "string",
              enum: ["add", "remove", "list"],
              description: "Operation to perform: 'add', 'remove', or 'list'"
            },
            tags: {
              type: "array",
              items: { type: "string" },
              description: "Array of tags (required for 'add' and 'remove' operations)"
            }
          },
          required: ["path", "operation"]
        }
      }
    ]
  };
});

// Helper function to trim path arguments
function trimPaths(args: any): any {
  const trimmed = { ...args };

  // Trim single path properties
  if (trimmed.path && typeof trimmed.path === 'string') {
    trimmed.path = trimmed.path.trim();
  }
  if (trimmed.oldPath && typeof trimmed.oldPath === 'string') {
    trimmed.oldPath = trimmed.oldPath.trim();
  }
  if (trimmed.newPath && typeof trimmed.newPath === 'string') {
    trimmed.newPath = trimmed.newPath.trim();
  }
  if (trimmed.confirmPath && typeof trimmed.confirmPath === 'string') {
    trimmed.confirmPath = trimmed.confirmPath.trim();
  }

  // Trim path arrays
  if (trimmed.paths && Array.isArray(trimmed.paths)) {
    trimmed.paths = trimmed.paths.map((p: any) =>
      typeof p === 'string' ? p.trim() : p
    );
  }

  return trimmed;
}

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const trimmedArgs = trimPaths(args);

  try {
    switch (name) {
      case "read_note": {
        const note = await fileSystem.readNote(trimmedArgs.path);
        const indent = trimmedArgs.prettyPrint ? 2 : undefined;
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                fm: note.frontmatter,
                content: note.content
              }, null, indent)
            }
          ]
        };
      }

      case "write_note": {
        await fileSystem.writeNote({
          path: trimmedArgs.path,
          content: trimmedArgs.content,
          frontmatter: trimmedArgs.frontmatter,
          mode: trimmedArgs.mode || 'overwrite'
        });
        return {
          content: [
            {
              type: "text",
              text: `Successfully wrote note: ${trimmedArgs.path} (mode: ${trimmedArgs.mode || 'overwrite'})`
            }
          ]
        };
      }

      case "patch_note": {
        const result = await fileSystem.patchNote({
          path: trimmedArgs.path,
          oldString: trimmedArgs.oldString,
          newString: trimmedArgs.newString,
          replaceAll: trimmedArgs.replaceAll
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2)
            }
          ],
          isError: !result.success
        };
      }

      case "list_directory": {
        const listing = await fileSystem.listDirectory(trimmedArgs.path || '');
        const indent = trimmedArgs.prettyPrint ? 2 : undefined;
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                dirs: listing.directories,
                files: listing.files
              }, null, indent)
            }
          ]
        };
      }

      case "delete_note": {
        const result = await fileSystem.deleteNote({
          path: trimmedArgs.path,
          confirmPath: trimmedArgs.confirmPath
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2)
            }
          ],
          isError: !result.success
        };
      }

      case "search_notes": {
        const results = await searchService.search({
          query: trimmedArgs.query,
          limit: trimmedArgs.limit,
          searchContent: trimmedArgs.searchContent,
          searchFrontmatter: trimmedArgs.searchFrontmatter,
          caseSensitive: trimmedArgs.caseSensitive
        });
        const indent = trimmedArgs.prettyPrint ? 2 : undefined;
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(results, null, indent)
            }
          ]
        };
      }

      case "move_note": {
        const result = await fileSystem.moveNote({
          oldPath: trimmedArgs.oldPath,
          newPath: trimmedArgs.newPath,
          overwrite: trimmedArgs.overwrite
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2)
            }
          ],
          isError: !result.success
        };
      }

      case "read_multiple_notes": {
        const result = await fileSystem.readMultipleNotes({
          paths: trimmedArgs.paths,
          includeContent: trimmedArgs.includeContent,
          includeFrontmatter: trimmedArgs.includeFrontmatter
        });
        const indent = trimmedArgs.prettyPrint ? 2 : undefined;
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                ok: result.successful,
                err: result.failed
              }, null, indent)
            }
          ]
        };
      }

      case "update_frontmatter": {
        await fileSystem.updateFrontmatter({
          path: trimmedArgs.path,
          frontmatter: trimmedArgs.frontmatter,
          merge: trimmedArgs.merge
        });
        return {
          content: [
            {
              type: "text",
              text: `Successfully updated frontmatter for: ${trimmedArgs.path}`
            }
          ]
        };
      }

      case "get_notes_info": {
        const result = await fileSystem.getNotesInfo(trimmedArgs.paths);
        const indent = trimmedArgs.prettyPrint ? 2 : undefined;
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, indent)
            }
          ]
        };
      }

      case "get_frontmatter": {
        const note = await fileSystem.readNote(trimmedArgs.path);
        const indent = trimmedArgs.prettyPrint ? 2 : undefined;
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(note.frontmatter, null, indent)
            }
          ]
        };
      }

      case "manage_tags": {
        const result = await fileSystem.manageTags({
          path: trimmedArgs.path,
          operation: trimmedArgs.operation,
          tags: trimmedArgs.tags
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2)
            }
          ],
          isError: !result.success
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