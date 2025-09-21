import { minimatch } from "minimatch";
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

  isAllowed(path: string): boolean {
    // Normalize path separators
    const normalizedPath = path.replace(/\\/g, '/');

    // Check if path matches any ignored pattern
    for (const pattern of this.ignoredPatterns) {
      if (minimatch(normalizedPath, pattern, { dot: true })) {
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