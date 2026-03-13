import { describe, test, expect, beforeEach, afterEach } from "vitest";
import type { EmbeddingAdapter } from "../embedding/types.js";
import { VectorStore, cosineSimilarity } from "./vector-store.js";
import { writeFile, mkdir, mkdtemp, readFile, rm, utimes } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

class FakeEmbeddingAdapter implements EmbeddingAdapter {
  readonly dimensions = 2;
  readonly modelId: string;
  calls: string[] = [];

  constructor(modelId = "fake-model") {
    this.modelId = modelId;
  }

  async embed(text: string): Promise<Float32Array> {
    this.calls.push(text);

    switch (text) {
      case "alpha body":
        return new Float32Array([1, 0]);
      case "mixed body":
        return new Float32Array([1, 1]);
      case "beta body":
        return new Float32Array([0, 1]);
      case "updated body":
        return new Float32Array([0.5, 0.5]);
      case "alpha query":
        return new Float32Array([1, 0]);
      case "beta query":
        return new Float32Array([0, 1]);
      default:
        return new Float32Array([0, 0]);
    }
  }
}

let testVaultPath: string;
let embedder: FakeEmbeddingAdapter;
let vectorStore: VectorStore;

beforeEach(async () => {
  testVaultPath = await mkdtemp(join(tmpdir(), "mcpvault-vector-store-"));
  embedder = new FakeEmbeddingAdapter();
  vectorStore = new VectorStore(testVaultPath, embedder);
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

describe("cosineSimilarity", () => {
  test("returns 1 for identical vectors", () => {
    const score = cosineSimilarity(
      new Float32Array([1, 0]),
      new Float32Array([1, 0])
    );

    expect(score).toBe(1);
  });

  test("returns 0 for orthogonal vectors", () => {
    const score = cosineSimilarity(
      new Float32Array([1, 0]),
      new Float32Array([0, 1])
    );

    expect(score).toBe(0);
  });

  test("returns 0 when either vector has zero magnitude", () => {
    const score = cosineSimilarity(
      new Float32Array([0, 0]),
      new Float32Array([1, 1])
    );

    expect(score).toBe(0);
  });
});

describe("VectorStore", () => {
  // ============================================================================
  // INDEXING
  // ============================================================================

  test("indexes a note and strips frontmatter before embedding", async () => {
    await writeNote("note.md", "---\ntitle: Hidden\n---\nalpha body");

    await vectorStore.index("note.md");

    expect(vectorStore.size).toBe(1);
    expect(embedder.calls).toEqual(["alpha body"]);
  });

  test("skips re-embedding when a note has not changed", async () => {
    await writeNote("note.md", "alpha body");

    await vectorStore.index("note.md");
    await vectorStore.index("note.md");

    expect(vectorStore.size).toBe(1);
    expect(embedder.calls).toEqual(["alpha body"]);
  });

  test("re-embeds a note after its modified time changes", async () => {
    const fullPath = join(testVaultPath, "note.md");

    await writeNote("note.md", "alpha body");
    await vectorStore.index("note.md");

    await writeFile(fullPath, "updated body");
    const future = new Date(Date.now() + 10_000);
    await utimes(fullPath, future, future);

    await vectorStore.index("note.md");

    expect(embedder.calls).toEqual(["alpha body", "updated body"]);
  });

  test("throws when indexing a missing file", async () => {
    await expect(vectorStore.index("missing.md"))
      .rejects.toThrow();
  });

  // ============================================================================
  // SEARCH
  // ============================================================================

  test("returns results sorted by similarity and respects limit", async () => {
    await writeNote("alpha.md", "alpha body");
    await writeNote("mixed.md", "mixed body");
    await writeNote("beta.md", "beta body");

    await vectorStore.index("alpha.md");
    await vectorStore.index("mixed.md");
    await vectorStore.index("beta.md");

    const results = await vectorStore.search("alpha query", 2);

    expect(results).toHaveLength(2);
    expect(results[0]!.path).toBe("alpha.md");
    expect(results[1]!.path).toBe("mixed.md");
    expect(results[0]!.score).toBeGreaterThan(results[1]!.score);
  });

  test("returns empty array when nothing has been indexed", async () => {
    const results = await vectorStore.search("alpha query", 5);

    expect(results).toHaveLength(0);
  });

  // ============================================================================
  // REMOVE
  // ============================================================================

  test("removes an indexed note", async () => {
    await writeNote("alpha.md", "alpha body");
    await writeNote("beta.md", "beta body");

    await vectorStore.index("alpha.md");
    await vectorStore.index("beta.md");
    vectorStore.remove("alpha.md");

    const results = await vectorStore.search("alpha query", 10);

    expect(vectorStore.size).toBe(1);
    expect(results.map(r => r.path)).not.toContain("alpha.md");
  });

  test("ignores removal of a missing note", () => {
    vectorStore.remove("missing.md");

    expect(vectorStore.size).toBe(0);
  });

  // ============================================================================
  // PERSISTENCE
  // ============================================================================

  test("does not write cache when the store is clean", async () => {
    const cachePath = join(testVaultPath, ".mcpvault", "embeddings.json");

    await vectorStore.saveCache();

    await expect(readFile(cachePath, "utf-8"))
      .rejects.toThrow();
  });

  test("saves cache and restores it for the same model", async () => {
    const cachePath = join(testVaultPath, ".mcpvault", "embeddings.json");

    await writeNote("alpha.md", "alpha body");
    await vectorStore.index("alpha.md");
    await vectorStore.saveCache();

    const cache = JSON.parse(await readFile(cachePath, "utf-8")) as {
      modelId: string;
      entries: Array<{ path: string; vector: number[] }>;
    };

    expect(cache.modelId).toBe(embedder.modelId);
    expect(cache.entries).toHaveLength(1);
    expect(cache.entries[0]!.path).toBe("alpha.md");

    const restoredStore = new VectorStore(
      testVaultPath,
      new FakeEmbeddingAdapter(embedder.modelId)
    );

    await restoredStore.loadCache();

    expect(restoredStore.size).toBe(1);
    const results = await restoredStore.search("alpha query", 10);
    expect(results[0]!.path).toBe("alpha.md");
  });

  test("ignores cache when the model id does not match", async () => {
    await writeNote("alpha.md", "alpha body");
    await vectorStore.index("alpha.md");
    await vectorStore.saveCache();

    const restoredStore = new VectorStore(
      testVaultPath,
      new FakeEmbeddingAdapter("other-model")
    );

    await restoredStore.loadCache();

    expect(restoredStore.size).toBe(0);
  });

  test("ignores missing cache files", async () => {
    await expect(vectorStore.loadCache()).resolves.toBeUndefined();
    expect(vectorStore.size).toBe(0);
  });

  test("ignores malformed cache files", async () => {
    const cacheDir = join(testVaultPath, ".mcpvault");
    const cachePath = join(cacheDir, "embeddings.json");
    await mkdir(cacheDir, { recursive: true });
    await writeFile(cachePath, "{not valid json");

    await expect(vectorStore.loadCache()).resolves.toBeUndefined();
    expect(vectorStore.size).toBe(0);
  });
});
