import { test, expect, beforeEach, afterEach, describe } from "vitest";
import { mkdtemp, rm, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { handleActiveFile, handleActiveFolder, handleOpen } from "./active.js";
import { FrontmatterHandler } from "./frontmatter.js";
import { FileSystemService } from "./filesystem.js";
import type { VaultAppProvider } from "./vault-app-provider.js";

// --- Mock VaultAppProvider ---

interface MockOptions {
  fileInfo?: Record<string, string | number>;
  fileContent?: string;
  running?: boolean;
  noActiveFile?: boolean;
}

const DEFAULT_FILE_INFO: Record<string, string | number> = {
  path: "Notes/example.md",
  name: "example",
  extension: "md",
  size: 1234,
  created: 1700000000000,
  modified: 1700000001000,
};

const DEFAULT_FILE_CONTENT = `---
title: Example
tags:
  - test
status: draft
---

# Example Note

Some content here.
`;

class MockVaultAppProvider implements VaultAppProvider {
  private readonly fileInfo: Record<string, string | number>;
  private readonly fileContent: string;
  private readonly running: boolean;
  private readonly noActiveFile: boolean;

  constructor(options?: MockOptions) {
    this.fileInfo = options?.fileInfo ?? DEFAULT_FILE_INFO;
    this.fileContent = options?.fileContent ?? DEFAULT_FILE_CONTENT;
    this.running = options?.running ?? true;
    this.noActiveFile = options?.noActiveFile ?? false;
  }

  async getActiveFileInfo(): Promise<Record<string, string | number>> {
    if (!this.running) throw new Error("Obsidian is not running. Start Obsidian and retry.");
    if (this.noActiveFile) throw new Error("No active file. Open a file in Obsidian and retry.");
    return { ...this.fileInfo };
  }

  async readActiveFileContent(): Promise<string> {
    if (!this.running) throw new Error("Obsidian is not running. Start Obsidian and retry.");
    return this.fileContent;
  }

  async isRunning(): Promise<boolean> {
    return this.running;
  }

  async ensureRunning(): Promise<void> {
    if (!this.running) throw new Error("Obsidian is not running. Start Obsidian and retry.");
  }

  async openFile(_path: string, _options?: { newtab?: boolean }): Promise<string> {
    if (!this.running) throw new Error("Obsidian is not running. Start Obsidian and retry.");
    return "";
  }
}

// --- Helpers ---

function parseResult(result: { content: Array<{ type: string; text: string }> }): Record<string, unknown> {
  return JSON.parse(result.content[0]!.text);
}

const frontmatterHandler = new FrontmatterHandler();

// --- active_file tests ---

describe("active_file", () => {
  test("returns metadata and content by default", async () => {
    const mock = new MockVaultAppProvider();
    const result = await handleActiveFile(mock, frontmatterHandler, {});
    const data = parseResult(result);

    expect(data.path).toBe("Notes/example.md");
    expect(data.name).toBe("example");
    expect(data.extension).toBe("md");
    expect(data.content).toContain("# Example Note");
  });

  test("omits content when include_content is false", async () => {
    const mock = new MockVaultAppProvider();
    const result = await handleActiveFile(mock, frontmatterHandler, { include_content: false });
    const data = parseResult(result);

    expect(data.path).toBe("Notes/example.md");
    expect(data.content).toBeUndefined();
  });

  test("returns parsed frontmatter and content with parse_frontmatter", async () => {
    const mock = new MockVaultAppProvider();
    const result = await handleActiveFile(mock, frontmatterHandler, { parse_frontmatter: true });
    const data = parseResult(result);

    expect(data.path).toBe("Notes/example.md");
    expect(data.fm).toBeDefined();
    const fm = data.fm as Record<string, unknown>;
    expect(fm.title).toBe("Example");
    expect(fm.tags).toEqual(["test"]);
    expect(fm.status).toBe("draft");
    expect(data.content).toContain("# Example Note");
    // Content should not include frontmatter fences
    expect(data.content as string).not.toContain("---\ntitle:");
  });

  test("returns only frontmatter with frontmatter_only", async () => {
    const mock = new MockVaultAppProvider();
    const result = await handleActiveFile(mock, frontmatterHandler, { frontmatter_only: true });
    const data = parseResult(result);

    expect(data.path).toBe("Notes/example.md");
    expect(data.fm).toBeDefined();
    const fm = data.fm as Record<string, unknown>;
    expect(fm.title).toBe("Example");
    // Should NOT have content field
    expect(data.content).toBeUndefined();
  });

  test("rejects parse_frontmatter + frontmatter_only together", async () => {
    const mock = new MockVaultAppProvider();
    await expect(
      handleActiveFile(mock, frontmatterHandler, {
        parse_frontmatter: true,
        frontmatter_only: true,
      }),
    ).rejects.toThrow("Cannot specify both");
  });

  test("throws when app is not running", async () => {
    const mock = new MockVaultAppProvider({ running: false });
    await expect(
      handleActiveFile(mock, frontmatterHandler, {}),
    ).rejects.toThrow("Obsidian is not running");
  });

  test("throws when no active file", async () => {
    const mock = new MockVaultAppProvider({ noActiveFile: true });
    await expect(
      handleActiveFile(mock, frontmatterHandler, {}),
    ).rejects.toThrow("No active file");
  });

  test("handles non-markdown file content", async () => {
    const mock = new MockVaultAppProvider({
      fileInfo: { path: "data.csv", name: "data", extension: "csv", size: 50 },
      fileContent: "col1,col2\nval1,val2\n",
    });
    const result = await handleActiveFile(mock, frontmatterHandler, {});
    const data = parseResult(result);

    expect(data.path).toBe("data.csv");
    expect(data.content).toBe("col1,col2\nval1,val2\n");
  });

  test("handles parse_frontmatter on content without frontmatter", async () => {
    const mock = new MockVaultAppProvider({
      fileContent: "Just plain text, no frontmatter.",
    });
    const result = await handleActiveFile(mock, frontmatterHandler, { parse_frontmatter: true });
    const data = parseResult(result);

    expect(data.fm).toBeDefined();
    expect(data.content).toBeDefined();
  });
});

// --- active_folder tests ---

describe("active_folder", () => {
  let testVaultPath: string;
  let fileSystem: FileSystemService;

  beforeEach(async () => {
    testVaultPath = await mkdtemp(join(tmpdir(), "mcpvault-test-"));
    fileSystem = new FileSystemService(testVaultPath);
  });

  afterEach(async () => {
    await rm(testVaultPath, { recursive: true });
  });

  test("returns folder path and active file", async () => {
    const mock = new MockVaultAppProvider();
    const result = await handleActiveFolder(mock, fileSystem, { include_files: false });
    const data = parseResult(result);

    expect(data.dir).toBe("Notes");
    expect(data.active).toBe("Notes/example.md");
    expect(data.files).toBeUndefined();
  });

  test("returns file listing when directory exists", async () => {
    await mkdir(join(testVaultPath, "Notes"), { recursive: true });
    await writeFile(join(testVaultPath, "Notes/example.md"), "# Example");
    await writeFile(join(testVaultPath, "Notes/other.md"), "# Other");

    const mock = new MockVaultAppProvider();
    const result = await handleActiveFolder(mock, fileSystem, {});
    const data = parseResult(result);

    expect(data.dir).toBe("Notes");
    expect(data.active).toBe("Notes/example.md");
    expect(data.files).toContain("example.md");
    expect(data.files).toContain("other.md");
  });

  test("omits file list when include_files is false", async () => {
    const mock = new MockVaultAppProvider();
    const result = await handleActiveFolder(mock, fileSystem, { include_files: false });
    const data = parseResult(result);

    expect(data.dir).toBe("Notes");
    expect(data.active).toBe("Notes/example.md");
    expect(data.files).toBeUndefined();
  });

  test("throws when app is not running", async () => {
    const mock = new MockVaultAppProvider({ running: false });
    await expect(
      handleActiveFolder(mock, fileSystem, {}),
    ).rejects.toThrow("Obsidian is not running");
  });

  test("throws when no active file", async () => {
    const mock = new MockVaultAppProvider({ noActiveFile: true });
    await expect(
      handleActiveFolder(mock, fileSystem, {}),
    ).rejects.toThrow("No active file");
  });

  test("handles vault root file (folder = '.')", async () => {
    const mock = new MockVaultAppProvider({
      fileInfo: { path: "root-note.md", name: "root-note", extension: "md", size: 100 },
    });
    const result = await handleActiveFolder(mock, fileSystem, { include_files: false });
    const data = parseResult(result);

    expect(data.dir).toBe(".");
    expect(data.active).toBe("root-note.md");
  });
});

// --- open tests ---

describe("open", () => {
  test("opens a file and returns the path", async () => {
    const mock = new MockVaultAppProvider();
    const result = await handleOpen(mock, { path: "Notes/example.md" });
    const data = parseResult(result);

    expect(result.isError).toBeUndefined();
    expect(data.opened).toBe("Notes/example.md");
    expect(data.newtab).toBe(true);
  });

  test("opens a file with newtab explicitly true", async () => {
    const mock = new MockVaultAppProvider();
    const result = await handleOpen(mock, { path: "Notes/example.md", newtab: true });
    const data = parseResult(result);

    expect(data.opened).toBe("Notes/example.md");
    expect(data.newtab).toBe(true);
  });

  test("opens a file with newtab false", async () => {
    const mock = new MockVaultAppProvider();
    const result = await handleOpen(mock, { path: "Notes/example.md", newtab: false });
    const data = parseResult(result);

    expect(data.opened).toBe("Notes/example.md");
    expect(data.newtab).toBe(false);
  });

  test("throws when Obsidian is not running", async () => {
    const mock = new MockVaultAppProvider({ running: false });
    await expect(
      handleOpen(mock, { path: "Notes/example.md" }),
    ).rejects.toThrow("Obsidian is not running");
  });

  test("throws for empty path", async () => {
    const mock = new MockVaultAppProvider();
    await expect(
      handleOpen(mock, { path: "" }),
    ).rejects.toThrow("path is required");
  });

  test("throws for whitespace-only path", async () => {
    const mock = new MockVaultAppProvider();
    await expect(
      handleOpen(mock, { path: "   " }),
    ).rejects.toThrow("path is required");
  });
});
