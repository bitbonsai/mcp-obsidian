import { describe, test, expect, beforeEach, afterEach } from "vitest";
import { SemanticSearchService } from "./index.js";
import type { VectorStore } from "./vector-store.js";
import { PathFilter } from "../pathfilter.js";
import { writeFile, mkdir, mkdtemp, readFile, rm } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

class FakeVectorStore {
  constructor(private readonly vaultPath: string) { }

  private documents = new Map<string, string>();

  async loadCache() { }

  async index(relativePath: string) {
    const fullPath = join(this.vaultPath, relativePath);
    const raw = await readFile(fullPath, "utf-8");
    const frontmatterMatch = raw.match(/^---\n[\s\S]*?\n---\n/);
    const body = frontmatterMatch ? raw.slice(frontmatterMatch[0].length) : raw;
    this.documents.set(relativePath, body);
  }

  async saveCache() { }

  async search(query: string, limit: number) {
    const searchQuery = query.toLowerCase();

    return Array.from(this.documents.entries())
      .filter(([, content]) => content.toLowerCase().includes(searchQuery))
      .sort(([pathA], [pathB]) => pathA.localeCompare(pathB))
      .slice(0, limit)
      .map(([path]) => ({ path, score: 1 }));
  }
}

let testVaultPath: string;
let searchService: SemanticSearchService;

beforeEach(async () => {
  testVaultPath = await mkdtemp(join(tmpdir(), "mcpvault-semantic-search-"));
  const vectorStore = new FakeVectorStore(testVaultPath);
  searchService = new SemanticSearchService(
    testVaultPath,
    new PathFilter(),
    vectorStore as unknown as VectorStore
  );
});

afterEach(async () => {
  try {
    await rm(testVaultPath, { recursive: true });
  } catch {
    // Ignore cleanup errors
  }
});

// Helper to write a note directly to disk
async function writeNote(path: string, content: string) {
  const fullPath = join(testVaultPath, path);
  const dir = fullPath.substring(0, fullPath.lastIndexOf("/"));
  if (dir !== testVaultPath) {
    await mkdir(dir, { recursive: true });
  }
  await writeFile(fullPath, content);
}

describe("SemanticSearchService", () => {
  // ============================================================================
  // Lifecycle Methods
  // ============================================================================

  test("isReady returns false before initialize", () => {
    expect(searchService.isReady()).toBe(false);
  });

  test("isReady returns true after initialize", async () => {
    await writeNote("note.md", "# Note\n\nSome content.");
    await searchService.initialize();

    expect(searchService.isReady()).toBe(true);
  });

  test("search throws if not initialized", async () => {
    await writeNote("note.md", "# Note\n\nkeyword here.");
    await expect(searchService.search({ query: "keyword" }))
      .rejects.toThrow();
  });

  test("search works after initialize", async () => {
    await writeNote("note.md", "# Note\n\nkeyword here.");
    await searchService.initialize();

    const results = await searchService.search({ query: "keyword" });
    expect(results).toHaveLength(1);
  });

  // ============================================================================
  // BASIC SEARCH
  // ============================================================================

  test("finds notes matching a query", async () => {
    await writeNote("alpha.md", "# Alpha\n\nThis note has bananas.");
    await writeNote("beta.md", "# Beta\n\nThis note has oranges.");
    await searchService.initialize();

    const results = await searchService.search({ query: "bananas" });

    expect(results).toHaveLength(1);
    expect(results[0]!.p).toBe("alpha.md");
  });

  test("returns empty array when no matches", async () => {
    await writeNote("note.md", "# Note\n\nNothing relevant here.");
    await searchService.initialize();

    const results = await searchService.search({ query: "zzzznotfound" });

    expect(results).toHaveLength(0);
  });

  test("returns empty array for empty vault", async () => {
    await searchService.initialize();
    const results = await searchService.search({ query: "anything" });

    expect(results).toHaveLength(0);
  });

  test("throws on empty query", async () => {
    await searchService.initialize();
    await expect(searchService.search({ query: "" }))
      .rejects.toThrow(/empty/);
  });

  test("throws on whitespace-only query", async () => {
    await searchService.initialize();
    await expect(searchService.search({ query: "   " }))
      .rejects.toThrow(/empty/);
  });

  // ============================================================================
  // LIMIT
  // ============================================================================

  test("respects limit parameter", async () => {
    for (let i = 0; i < 5; i++) {
      await writeNote(`note-${i}.md`, `# Note ${i}\n\nkeyword here.`);
    }
    await searchService.initialize();

    const results = await searchService.search({ query: "keyword", limit: 2 });

    expect(results).toHaveLength(2);
  });

  test("caps limit at 20", async () => {
    for (let i = 0; i < 25; i++) {
      await writeNote(`note-${i}.md`, `# Note ${i}\n\nkeyword here.`);
    }
    await searchService.initialize();

    const results = await searchService.search({ query: "keyword", limit: 100 });

    expect(results).toHaveLength(20);
  });

  test("defaults limit to 5", async () => {
    for (let i = 0; i < 10; i++) {
      await writeNote(`note-${i}.md`, `# Note ${i}\n\nkeyword here.`);
    }
    await searchService.initialize();

    const results = await searchService.search({ query: "keyword" });

    expect(results).toHaveLength(5);
  });

  // ============================================================================
  // RESULT SHAPE
  // ============================================================================

  test("results include expected fields", async () => {
    await writeNote("folder/note.md", "# My Note\n\nSome content with target word.");
    await searchService.initialize();

    const results = await searchService.search({ query: "target", limit: 10 });

    expect(results).toHaveLength(1);
    const r = results[0]!;
    expect(r.p).toBe("folder/note.md");
    expect(r.t).toBe("note");
    expect(r.ex).toBe("");
    expect(r.mc).toBe(0);
    expect(r.ln).toBe(0);
    expect(r.uri).toMatch(/^obsidian:\/\//);
  });

  // ============================================================================
  // PATH FILTERING
  // ============================================================================

  test("excludes notes in filtered directories", async () => {
    await writeNote("visible.md", "# Visible\n\nvisible keyword here.");
    await writeNote(".obsidian/config.md", "# Hidden\n\nhidden keyword here.");
    await searchService.initialize();

    const hiddenResults = await searchService.search({ query: "hidden", limit: 10 });
    const visibleResults = await searchService.search({ query: "visible", limit: 10 });

    expect(hiddenResults).toHaveLength(0);
    expect(visibleResults).toHaveLength(1);
    expect(visibleResults[0]!.p).toBe("visible.md");
  });

  // ============================================================================
  // FILE TYPES
  // ============================================================================

  test("searches only markdown files", async () => {
    await writeNote("note.txt", "text file keyword here.");
    await writeNote("note.md", "# Note\n\nNo matching content here.");
    await searchService.initialize();

    const results = await searchService.search({ query: "keyword", limit: 10 });

    expect(results).toHaveLength(0);
  });
});
