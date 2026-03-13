export interface SearchService {
    search(params: SearchParams): Promise<SearchResult[]>;
}

export interface SearchParams {
    query: string;
    limit?: number;
    searchContent?: boolean;
    searchFrontmatter?: boolean;
    caseSensitive?: boolean;
}

export interface SearchResult {
    p: string;        // path
    t: string;        // title
    ex: string;       // excerpt
    mc: number;       // matchCount
    ln?: number;      // lineNumber
    uri?: string;     // obsidianUri
}
