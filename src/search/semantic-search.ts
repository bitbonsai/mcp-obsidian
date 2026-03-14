import { resolve } from 'node:path';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { PathFilter } from '../pathfilter.js';
import type { SearchService, SearchParams, SearchResult } from './types.js';
import type { VectorStore } from './vector-store.js';
import { generateObsidianUri } from '../uri.js';

export class SemanticSearchService implements SearchService {
    private readonly vaultPath: string;
    private indexReady = false;

    constructor(
        vaultPath: string,
        private readonly pathFilter: PathFilter,
        private readonly vectorStore: VectorStore,
    ) {
        this.vaultPath = resolve(vaultPath);
    }

    async initialize(): Promise<void> {
        if (!this.indexReady) {
            await this.buildIndex();
            this.indexReady = true;
        }
    }

    isReady(): boolean {
        return this.indexReady;
    }

    async search(params: SearchParams): Promise<SearchResult[]> {
        const { query, limit = 5 } = params;

        if (!query || query.trim().length === 0) {
            throw new Error('Search query cannot be empty');
        }

        if (!this.indexReady) {
            throw new Error('SearchService is not initialized. Call initialize() first.');
        }

        const maxLimit = Math.min(limit, 20);

        const results = await this.vectorStore.search(query, maxLimit);

        return results.map(r => {
            const title = r.path.split('/').pop()?.replace(/\.md$/, '') || r.path;
            return {
                p: r.path,
                t: title,
                ex: '',
                mc: 0,
                ln: 0,
                uri: generateObsidianUri(this.vaultPath, r.path)
            };
        });
    }

    private async buildIndex(): Promise<void> {
        await this.vectorStore.loadCache();

        const markdownFiles = await this.findMarkdownFiles(this.vaultPath);
        const prefixLen = this.vaultPath.length + 1;

        for (const fullPath of markdownFiles) {
            const relativePath = fullPath.substring(prefixLen).replace(/\\/g, '/');
            if (!this.pathFilter.isAllowed(relativePath)) { continue; }

            try {
                await this.vectorStore.index(relativePath);
            } catch {
                // skip unreadable files
            }
        }

        await this.vectorStore.saveCache();
    }

    private async findMarkdownFiles(dirPath: string): Promise<string[]> {
        const markdownFiles: string[] = [];

        try {
            const entries = await readdir(dirPath, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = join(dirPath, entry.name);
                if (entry.isDirectory()) {
                    const subFiles = await this.findMarkdownFiles(fullPath);
                    markdownFiles.push(...subFiles);
                } else if (entry.isFile() && entry.name.endsWith('.md')) {
                    markdownFiles.push(fullPath);
                }
            }
        } catch {
            // skip unreadable dirs
        }

        return markdownFiles;
    }
}
