/**
 * In-memory vector store with disk cache and brute-force cosine search.
 */

import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import type { EmbeddingAdapter } from '../embedding/types.js';

export function cosineSimilarity(a: Float32Array, b: Float32Array): number {
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
        dot += a[i]! * b[i]!;
        normA += a[i]! * a[i]!;
        normB += b[i]! * b[i]!;
    }
    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom === 0 ? 0 : dot / denom;
}

interface VectorEntry {
    path: string;
    mtime: number;
    vector: number[];
}

interface CacheFile {
    modelId: string;
    entries: VectorEntry[];
}

export interface VectorSearchResult {
    path: string;
    score: number;
}

export class VectorStore {
    private vectors = new Map<string, { mtime: number; vector: Float32Array }>();
    private readonly cachePath: string;
    private dirty = false;

    constructor(
        private readonly vaultPath: string,
        private readonly embedder: EmbeddingAdapter,
    ) {
        this.cachePath = join(vaultPath, '.mcpvault', 'embeddings.json');
    }

    /** Ensure a document is indexed. Reads file, strips frontmatter, embeds. Skips if up-to-date. */
    async index(relativePath: string): Promise<void> {
        const modifiedTime = await this.getFileModifiedTime(relativePath);
        const existing = this.vectors.get(relativePath);
        if (existing && existing.mtime >= modifiedTime) { return; }

        const fullPath = join(this.vaultPath, relativePath);
        const raw = await readFile(fullPath, 'utf-8');
        const frontmatterMatch = raw.match(/^---\n[\s\S]*?\n---\n/);
        const body = frontmatterMatch ? raw.slice(frontmatterMatch[0].length) : raw;

        const vector = await this.embedder.embed(body, { kind: 'document' });
        this.vectors.set(relativePath, { mtime: modifiedTime, vector });
        this.dirty = true;
    }

    /** Search for top-K most similar documents. */
    async search(query: string, limit: number): Promise<VectorSearchResult[]> {
        const queryVec = await this.embedder.embed(query, { kind: 'query' });

        const scored: VectorSearchResult[] = [];
        for (const [path, entry] of this.vectors) {
            const score = cosineSimilarity(queryVec, entry.vector);
            scored.push({ path, score });
        }

        scored.sort((a, b) => b.score - a.score);
        return scored.slice(0, limit);
    }

    /** Remove a path from the index. */
    remove(relativePath: string): void {
        if (this.vectors.delete(relativePath)) {
            this.dirty = true;
        }
    }

    get size(): number {
        return this.vectors.size;
    }

    // ---- Persistence ----

    async loadCache(): Promise<void> {
        try {
            const raw = await readFile(this.cachePath, 'utf-8');
            const cache: CacheFile = JSON.parse(raw);

            if (cache.modelId !== this.embedder.modelId) return; // model changed

            for (const entry of cache.entries) {
                this.vectors.set(entry.path, {
                    mtime: entry.mtime,
                    vector: new Float32Array(entry.vector),
                });
            }
        } catch {
            // no cache or parse error
        }
    }

    async saveCache(): Promise<void> {
        if (!this.dirty) { return; }

        const entries: VectorEntry[] = [];
        for (const [path, entry] of this.vectors) {
            entries.push({
                path,
                mtime: entry.mtime,
                vector: Array.from(entry.vector),
            });
        }

        const cache: CacheFile = { modelId: this.embedder.modelId, entries };
        await mkdir(dirname(this.cachePath), { recursive: true });
        await writeFile(this.cachePath, JSON.stringify(cache));
        this.dirty = false;
    }

    private async getFileModifiedTime(relativePath: string): Promise<number> {
        try {
            const s = await stat(join(this.vaultPath, relativePath));
            return s.mtimeMs;
        } catch {
            return 0;
        }
    }
}
