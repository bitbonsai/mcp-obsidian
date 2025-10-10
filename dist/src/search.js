import { join } from 'path';
import { readFile, readdir } from 'node:fs/promises';
export class SearchService {
    vaultPath;
    pathFilter;
    constructor(vaultPath, pathFilter) {
        this.vaultPath = vaultPath;
        this.pathFilter = pathFilter;
    }
    async search(params) {
        const { query, limit = 5, searchContent = true, searchFrontmatter = false, caseSensitive = false } = params;
        if (!query || query.trim().length === 0) {
            throw new Error('Search query cannot be empty');
        }
        const results = [];
        const maxLimit = Math.min(limit, 20);
        // Recursively find all .md files
        const markdownFiles = await this.findMarkdownFiles(this.vaultPath);
        for (const fullPath of markdownFiles) {
            // Convert absolute path back to relative path
            const relativePath = fullPath.substring(this.vaultPath.length + 1).replace(/\\/g, '/');
            if (!this.pathFilter.isAllowed(relativePath))
                continue;
            if (results.length >= maxLimit)
                break;
            try {
                const content = await readFile(fullPath, 'utf-8');
                let searchableText = '';
                // Prepare search text based on options
                if (searchContent && searchFrontmatter) {
                    searchableText = content;
                }
                else if (searchContent) {
                    // Remove frontmatter from search
                    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n/);
                    searchableText = frontmatterMatch ? content.slice(frontmatterMatch[0].length) : content;
                }
                else if (searchFrontmatter) {
                    // Search only frontmatter
                    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n/);
                    searchableText = frontmatterMatch ? frontmatterMatch[1] || '' : '';
                }
                const searchIn = caseSensitive ? searchableText : searchableText.toLowerCase();
                const searchQuery = caseSensitive ? query : query.toLowerCase();
                const index = searchIn.indexOf(searchQuery);
                if (index !== -1) {
                    // Extract excerpt around first match
                    const excerptStart = Math.max(0, index - 21);
                    const excerptEnd = Math.min(searchableText.length, index + searchQuery.length + 21);
                    let excerpt = searchableText.slice(excerptStart, excerptEnd).trim();
                    // Add ellipsis if excerpt is truncated
                    if (excerptStart > 0)
                        excerpt = '...' + excerpt;
                    if (excerptEnd < searchableText.length)
                        excerpt = excerpt + '...';
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
                        p: relativePath,
                        t: title,
                        ex: excerpt,
                        mc: matchCount,
                        ln: lineNumber
                    });
                }
            }
            catch (error) {
                // Skip files that can't be read
                continue;
            }
        }
        return results;
    }
    async findMarkdownFiles(dirPath) {
        const markdownFiles = [];
        try {
            const entries = await readdir(dirPath, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = join(dirPath, entry.name);
                if (entry.isDirectory()) {
                    // Recursively search subdirectories
                    const subFiles = await this.findMarkdownFiles(fullPath);
                    markdownFiles.push(...subFiles);
                }
                else if (entry.isFile() && entry.name.endsWith('.md')) {
                    markdownFiles.push(fullPath);
                }
            }
        }
        catch (error) {
            // Skip directories that can't be read
        }
        return markdownFiles;
    }
}
