import { join } from 'path';
import type { PathFilter } from './pathfilter.js';
import type { SearchParams, SearchResult } from './types.js';

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

    const results: SearchResult[] = [];
    const glob = new Bun.Glob("**/*.md");
    const maxLimit = Math.min(limit, 20);

    for await (const relativePath of glob.scan(this.vaultPath)) {
      if (!this.pathFilter.isAllowed(relativePath)) continue;
      if (results.length >= maxLimit) break;

      const fullPath = join(this.vaultPath, relativePath);
      const file = Bun.file(fullPath);

      try {
        const content = await file.text();
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
          searchableText = frontmatterMatch ? frontmatterMatch[1] : '';
        }

        const searchIn = caseSensitive ? searchableText : searchableText.toLowerCase();
        const searchQuery = caseSensitive ? query : query.toLowerCase();

        const index = searchIn.indexOf(searchQuery);
        if (index !== -1) {
          // Extract excerpt around first match
          const excerptStart = Math.max(0, index - 50);
          const excerptEnd = Math.min(searchableText.length, index + searchQuery.length + 50);
          let excerpt = searchableText.slice(excerptStart, excerptEnd).trim();

          // Add ellipsis if excerpt is truncated
          if (excerptStart > 0) excerpt = '...' + excerpt;
          if (excerptEnd < searchableText.length) excerpt = excerpt + '...';

          // Count total matches
          let matchCount = 0;
          let searchIndex = 0;
          while ((searchIndex = searchIn.indexOf(searchQuery, searchIndex)) !== -1) {
            matchCount++;
            searchIndex += searchQuery.length;
          }

          // Find line number of first match
          const lines = searchableText.slice(0, index).split('\n');
          const lineNumber = lines.length;

          // Extract title from filename
          const title = relativePath.split('/').pop()?.replace(/\.md$/, '') || relativePath;

          results.push({
            path: relativePath,
            title: title,
            excerpt: excerpt,
            matchCount: matchCount,
            lineNumber: lineNumber
          });
        }
      } catch (error) {
        // Skip files that can't be read
        continue;
      }
    }

    return results;
  }
}