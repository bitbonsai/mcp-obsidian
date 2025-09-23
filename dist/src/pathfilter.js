export class PathFilter {
    ignoredPatterns;
    allowedExtensions;
    constructor(config) {
        this.ignoredPatterns = [
            '.obsidian/**',
            '.git/**',
            'node_modules/**',
            '.DS_Store',
            'Thumbs.db',
            ...config?.ignoredPatterns || []
        ];
        this.allowedExtensions = [
            '.md',
            '.markdown',
            '.txt',
            ...config?.allowedExtensions || []
        ];
    }
    simpleGlobMatch(pattern, path) {
        // Convert glob pattern to regex
        // Handle ** (any number of directories)
        let regexPattern = pattern
            .replace(/\*\*/g, '.*') // ** matches any number of directories
            .replace(/\*/g, '[^/]*') // * matches anything except /
            .replace(/\?/g, '[^/]') // ? matches single character except /
            .replace(/\./g, '\\.'); // Escape dots
        // Ensure we match the full path
        regexPattern = '^' + regexPattern + '$';
        const regex = new RegExp(regexPattern);
        return regex.test(path);
    }
    isAllowed(path) {
        // Normalize path separators
        const normalizedPath = path.replace(/\\/g, '/');
        // Check if path matches any ignored pattern
        for (const pattern of this.ignoredPatterns) {
            if (this.simpleGlobMatch(pattern, normalizedPath)) {
                return false;
            }
        }
        // For files, check extension if allowedExtensions is configured
        if (this.allowedExtensions.length > 0 && this.isFile(normalizedPath)) {
            const hasAllowedExtension = this.allowedExtensions.some(ext => normalizedPath.toLowerCase().endsWith(ext.toLowerCase()));
            if (!hasAllowedExtension) {
                return false;
            }
        }
        return true;
    }
    isFile(path) {
        return path.includes('.') && !path.endsWith('/');
    }
    filterPaths(paths) {
        return paths.filter(path => this.isAllowed(path));
    }
}
