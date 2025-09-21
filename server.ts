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
import { SearchService } from "./src/search.js";

const vaultPath = process.argv[2];
if (!vaultPath) {
  console.error("Usage: bun server.ts /path/to/vault");
  process.exit(1);
}

// Initialize services
const pathFilter = new PathFilter();
const frontmatterHandler = new FrontmatterHandler();
const fileSystem = new FileSystemService(vaultPath, pathFilter, frontmatterHandler);
const searchService = new SearchService(vaultPath, pathFilter);

const server = new Server({
  name: "mcp-obsidian",
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
            }
          },
          required: ["paths"]
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

      case "delete_note": {
        const result = await fileSystem.deleteNote({
          path: args.path,
          confirmPath: args.confirmPath
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
          query: args.query,
          limit: args.limit,
          searchContent: args.searchContent,
          searchFrontmatter: args.searchFrontmatter,
          caseSensitive: args.caseSensitive
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                query: args.query,
                resultCount: results.length,
                results: results
              }, null, 2)
            }
          ]
        };
      }

      case "move_note": {
        const result = await fileSystem.moveNote({
          oldPath: args.oldPath,
          newPath: args.newPath,
          overwrite: args.overwrite
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
          paths: args.paths,
          includeContent: args.includeContent,
          includeFrontmatter: args.includeFrontmatter
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                successful: result.successful,
                failed: result.failed,
                summary: {
                  successCount: result.successful.length,
                  failureCount: result.failed.length
                }
              }, null, 2)
            }
          ]
        };
      }

      case "update_frontmatter": {
        await fileSystem.updateFrontmatter({
          path: args.path,
          frontmatter: args.frontmatter,
          merge: args.merge
        });
        return {
          content: [
            {
              type: "text",
              text: `Successfully updated frontmatter for: ${args.path}`
            }
          ]
        };
      }

      case "get_notes_info": {
        const result = await fileSystem.getNotesInfo(args.paths);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                notes: result,
                count: result.length
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