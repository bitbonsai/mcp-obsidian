import { join } from 'path';
import { readFile, readdir } from 'node:fs/promises';
import type { PathFilter } from './pathfilter.js';
import type { RankCandidate, SearchParams, SearchResult } from './types.js';
import { generateObsidianUri } from './uri.js';

export class SearchService {
  constructor(
    private vaultPath: string,
    private pathFilter: PathFilter
  ) {}

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

    for (const fullPath of markdownFiles) {
      // Convert absolute path back to relative path
      const relativePath = fullPath.substring(this.vaultPath.length + 1).replace(/\\/g, '/');

      if (!this.pathFilter.isAllowed(relativePath)) continue;

      try {
        const content = await readFile(fullPath, 'utf-8');
        let searchableText = '';

        // Prepare search text based on options
        if (searchContent && searchFrontmatter) {
          searchableText = content;
        } else if (searchContent) {
          // Remove frontmatter from search
          const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n/);
          searchableText = frontmatterMatch ? content.slice(frontmatterMatch[0].length) : content;
        } else if (searchFrontmatter) {
          // Search only frontmatter
          const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n/);
          searchableText = frontmatterMatch ? frontmatterMatch[1] || '' : '';
        }

        const searchIn = caseSensitive ? searchableText : searchableText.toLowerCase();

        // Collect corpus stats for reranking
        const docLength = searchIn.split(/\s+/).filter(w => w.length > 0).length;
        totalDocLength += docLength;
        docCount++;
        for (const term of scoringTerms) {
          if (searchIn.includes(term)) {
            termDocFreq.set(term, (termDocFreq.get(term) || 0) + 1);
          }
        }

        // Extract title from filename
        const title = relativePath.split('/').pop()?.replace(/\.md$/, '') || relativePath;

        // Check filename match (any term)
        const filenameToSearch = caseSensitive ? title : title.toLowerCase();
        const filenameMatch = terms.some(term => filenameToSearch.includes(term));

        // Check content match (any term)
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
            // Find the term that matched first for excerpt
            const firstTermIdx = termIndices.indexOf(firstIndex);
            const firstTerm = terms[firstTermIdx]!;

            // Extract excerpt around first content match
            const excerptStart = Math.max(0, firstIndex - 21);
            const excerptEnd = Math.min(searchableText.length, firstIndex + firstTerm.length + 21);
            excerpt = searchableText.slice(excerptStart, excerptEnd).trim();

            // Add ellipsis if excerpt is truncated
            if (excerptStart > 0) excerpt = '...' + excerpt;
            if (excerptEnd < searchableText.length) excerpt = excerpt + '...';

            // Count total content matches across all terms
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

            // Find line number of first match
            const lines = searchableText.slice(0, firstIndex).split('\n');
            lineNumber = lines.length;
          } else {
            // Filename-only match: use beginning of content as excerpt
            excerpt = searchableText.slice(0, 50).trim();
            if (searchableText.length > 50) excerpt = excerpt + '...';
            matchCount = 0;
            lineNumber = 0;
          }

          // Add filename match to count
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
      } catch (error) {
        // Skip files that can't be read
        continue;
      }
    }

    const results: SearchResult[] = this.rerank(candidates, scoringTerms, termDocFreq, docCount, totalDocLength, maxLimit);
    return results;
  }

  private async findMarkdownFiles(dirPath: string): Promise<string[]> {
    const markdownFiles: string[] = [];

    try {
      const entries = await readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(dirPath, entry.name);

        if (entry.isDirectory()) {
          // Recursively search subdirectories
          const subFiles = await this.findMarkdownFiles(fullPath);
          markdownFiles.push(...subFiles);
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          markdownFiles.push(fullPath);
        }
      }
    } catch (error) {
      // Skip directories that can't be read
    }

    return markdownFiles;
  }

  private rerank(
    candidates: RankCandidate[],
    terms: string[],
    termDocFreq: Map<string, number>,
    docCount: number,
    totalDocLength: number,
    maxLimit: number
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