import type { PathFilterConfig } from "./types.js";

export class PathFilter {
  private ignoredPatterns: string[];
  private allowedExtensions: string[];

  constructor(config?: Partial<PathFilterConfig>) {
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

  private simpleGlobMatch(pattern: string, path: string): boolean {
    // Convert glob pattern to regex
    // Handle ** (any number of directories)
    let regexPattern = pattern
      .replace(/\*\*/g, '.*')  // ** matches any number of directories
      .replace(/\*/g, '[^/]*') // * matches anything except /
      .replace(/\?/g, '[^/]')  // ? matches single character except /
      .replace(/\./g, '\\.');   // Escape dots

    // Ensure we match the full path
    regexPattern = '^' + regexPattern + '$';

    const regex = new RegExp(regexPattern);
    return regex.test(path);
  }

  isAllowed(path: string): boolean {
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
      const hasAllowedExtension = this.allowedExtensions.some(ext =>
        normalizedPath.toLowerCase().endsWith(ext.toLowerCase())
      );
      if (!hasAllowedExtension) {
        return false;
      }
    }

    return true;
  }

  private isFile(path: string): boolean {
    return path.includes('.') && !path.endsWith('/');
  }

  filterPaths(paths: string[]): string[] {
    return paths.filter(path => this.isAllowed(path));
  }
}