import type { PathFilter } from './pathfilter.js';
import type { SearchParams, SearchResult } from './types.js';
export declare class SearchService {
    private vaultPath;
    private pathFilter;
    constructor(vaultPath: string, pathFilter: PathFilter);
    search(params: SearchParams): Promise<SearchResult[]>;
    private findMarkdownFiles;
}
