import { join, resolve } from 'node:path';
import { readFile, readdir } from 'node:fs/promises';
import type { PathFilter } from '../pathfilter.js';
import type { SearchService, SearchParams, SearchResult } from './types.js';
import { generateObsidianUri } from '../uri.js';

interface RankCandidate {
    result: SearchResult;
    termFreqs: Map<string, number>;
    docLength: number;
}

export class KeywordSearchService implements SearchService {
    private readonly vaultPath: string;

    constructor(
        vaultPath: string,
        private readonly pathFilter: PathFilter,
    ) {
        this.vaultPath = resolve(vaultPath);
    }

    async search(params: SearchParams): Promise<SearchResult[]> {
        const {
            query,
            limit = 5,
            searchContent = true,
            searchFrontmatter = false,
            caseSensitive = false
        } = params;

        if (!query || query.trim().length === 0) {
            throw new Error('Search query cannot be empty');
        }

        const maxLimit = Math.min(limit, 20);

        // Corpus stats for reranking
        let totalDocLength = 0;
        let docCount = 0;
        const termDocFreq = new Map<string, number>();
        const candidates: RankCandidate[] = [];
        const searchQuery = caseSensitive ? query : query.toLowerCase();
        const terms = searchQuery.split(/\s+/).filter(t => t.length > 0);
        const scoringTerms = terms.length > 1 ? [...terms, searchQuery] : terms;

        // Recursively find all .md files
        const markdownFiles = await this.findMarkdownFiles(this.vaultPath);

        // Pre-filter by pathFilter before I/O
        const prefixLen = this.vaultPath.length + 1;
        const allowedFiles: { fullPath: string; relativePath: string }[] = [];
        for (const fullPath of markdownFiles) {
            const relativePath = fullPath.substring(prefixLen).replace(/\\/g, '/');
            if (this.pathFilter.isAllowed(relativePath)) {
                allowedFiles.push({ fullPath, relativePath });
            }
        }

        // Read files in parallel batches
        const BATCH_SIZE = 5;
        for (let start = 0; start < allowedFiles.length; start += BATCH_SIZE) {
            const batch = allowedFiles.slice(start, start + BATCH_SIZE);
            const contents = await Promise.all(
                batch.map(f => readFile(f.fullPath, 'utf-8').catch(() => null))
            );

            for (let i = 0; i < batch.length; i++) {
                const content = contents[i];
                if (content === null || content === undefined) continue;

                const { relativePath } = batch[i]!;
                let searchableText = '';

                if (searchContent && searchFrontmatter) {
                    searchableText = content;
                } else if (searchContent) {
                    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n/);
                    searchableText = frontmatterMatch ? content.slice(frontmatterMatch[0].length) : content;
                } else if (searchFrontmatter) {
                    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n/);
                    searchableText = frontmatterMatch ? frontmatterMatch[1] || '' : '';
                }

                const searchIn = caseSensitive ? searchableText : searchableText.toLowerCase();

                const docLength = searchIn.split(/\s+/).filter(w => w.length > 0).length;
                totalDocLength += docLength;
                docCount++;
                for (const term of scoringTerms) {
                    if (searchIn.includes(term)) {
                        termDocFreq.set(term, (termDocFreq.get(term) || 0) + 1);
                    }
                }

                const title = relativePath.split('/').pop()?.replace(/\.md$/, '') || relativePath;
                const filenameToSearch = caseSensitive ? title : title.toLowerCase();
                const filenameMatch = terms.some(term => filenameToSearch.includes(term));

                const termIndices = terms.map(term => searchIn.indexOf(term));
                const anyTermFound = termIndices.some(idx => idx !== -1);
                const firstIndex = anyTermFound
                    ? Math.min(...termIndices.filter(idx => idx !== -1))
                    : -1;

                if (firstIndex !== -1 || filenameMatch) {
                    let excerpt: string;
                    let matchCount = 0;
                    let lineNumber = 0;
                    const termFreqs = new Map<string, number>();

                    if (firstIndex !== -1) {
                        const firstTermIdx = termIndices.indexOf(firstIndex);
                        const firstTerm = terms[firstTermIdx]!;

                        const excerptStart = Math.max(0, firstIndex - 21);
                        const excerptEnd = Math.min(searchableText.length, firstIndex + firstTerm.length + 21);
                        excerpt = searchableText.slice(excerptStart, excerptEnd).trim();

                        if (excerptStart > 0) excerpt = '...' + excerpt;
                        if (excerptEnd < searchableText.length) excerpt = excerpt + '...';

                        for (const term of scoringTerms) {
                            let count = 0;
                            let searchIndex = 0;
                            while ((searchIndex = searchIn.indexOf(term, searchIndex)) !== -1) {
                                count++;
                                searchIndex += term.length;
                            }
                            termFreqs.set(term, count);
                            matchCount += count;
                        }

                        const lines = searchableText.slice(0, firstIndex).split('\n');
                        lineNumber = lines.length;
                    } else {
                        excerpt = searchableText.slice(0, 50).trim();
                        if (searchableText.length > 50) excerpt = excerpt + '...';
                        matchCount = 0;
                        lineNumber = 0;
                    }

                    if (filenameMatch) matchCount++;

                    candidates.push({
                        result: {
                            p: relativePath,
                            t: title,
                            ex: excerpt,
                            mc: matchCount,
                            ln: lineNumber,
                            uri: generateObsidianUri(this.vaultPath, relativePath)
                        },
                        termFreqs,
                        docLength
                    });
                }
            }
        }

        return this.rerank(candidates, scoringTerms, termDocFreq, docCount, totalDocLength, maxLimit);
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

    private rerank(
        candidates: RankCandidate[],
        terms: string[],
        termDocFreq: Map<string, number>,
        docCount: number,
        totalDocLength: number,
        maxLimit: number,
    ): SearchResult[] {
        const avgdl = docCount > 0 ? totalDocLength / docCount : 1;
        const k1 = 1.2;
        const b = 0.75;

        const scored = candidates.map(c => {
            let score = 0;
            for (const term of terms) {
                const tf = c.termFreqs.get(term) || 0;
                const df = termDocFreq.get(term) || 0;
                const idf = Math.log(1 + (docCount - df + 0.5) / (df + 0.5));
                score += idf * (tf * (k1 + 1)) / (tf + k1 * (1 - b + b * c.docLength / avgdl));
            }
            return { score, result: c.result };
        });

        scored.sort((a, b) => b.score - a.score);
        return scored.slice(0, maxLimit).map(s => s.result);
    }
}
