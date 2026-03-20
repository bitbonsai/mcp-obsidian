import type { PathFilter } from './pathfilter.js';
import type { SearchParams, SearchResult } from './types.js';
export declare class SearchService {
    private pathFilter;
    private vaultPath;
    constructor(vaultPath: string, pathFilter: PathFilter);
    search(params: SearchParams): Promise<SearchResult[]>;
    private findMarkdownFiles;
    private rerank;
}
//# sourceMappingURL=search.d.ts.map