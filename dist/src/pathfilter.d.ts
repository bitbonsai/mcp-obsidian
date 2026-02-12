import type { PathFilterConfig } from "./types.js";
export declare class PathFilter {
    private ignoredPatterns;
    private allowedExtensions;
    constructor(config?: Partial<PathFilterConfig>);
    private simpleGlobMatch;
    isAllowed(path: string): boolean;
    private isFile;
    filterPaths(paths: string[]): string[];
}
