import { join, resolve, relative } from 'path';
import { readFile, readdir, stat } from 'node:fs/promises';
import { parse as parseYaml } from 'yaml';
import type { PathFilter } from './pathfilter.js';
import type { FrontmatterHandler } from './frontmatter.js';
import type { 
  BaseFile, 
  BaseView, 
  BaseQueryParams, 
  BaseQueryResult, 
  BaseNoteResult,
  NoteContext,
  FilterGroup,
  SortSpec
} from './types.js';
import { FilterParser } from './filter-parser.js';

export class BasesService {
  private filterParser: FilterParser;

  constructor(
    private vaultPath: string,
    private pathFilter: PathFilter,
    private frontmatterHandler: FrontmatterHandler
  ) {
    this.vaultPath = resolve(vaultPath);
    this.filterParser = new FilterParser();
  }

  async readBase(basePath: string): Promise<BaseFile> {
    const fullPath = this.resolvePath(basePath);
    
    if (!basePath.endsWith('.base')) {
      throw new Error(`Not a base file: ${basePath}`);
    }

    const content = await readFile(fullPath, 'utf-8');
    const parsed = parseYaml(content) as BaseFile;
    
    return parsed || { views: [] };
  }

  async queryBase(params: BaseQueryParams): Promise<BaseQueryResult> {
    const { path: basePath, view: viewName, limit, includeFrontmatter } = params;
    
    const base = await this.readBase(basePath);
    const availableViews = base.views?.map(v => v.name) || [];
    const allWarnings: string[] = [];

    let targetView: BaseView | undefined;
    if (viewName) {
      targetView = base.views?.find(v => v.name === viewName);
      if (!targetView) {
        throw new Error(
          `View "${viewName}" not found. Available views: ${availableViews.join(', ') || 'none'}`
        );
      }
    }

    const allNotes = await this.getAllNoteContexts();
    
    let matchingNotes = allNotes.filter(note => {
      const result = this.filterParser.evaluateFilterGroup(base.filters, note);
      allWarnings.push(...result.warnings);
      return result.matches;
    });

    let filtersApplied = this.countFilters(base.filters);

    if (targetView?.filters) {
      matchingNotes = matchingNotes.filter(note => {
        const result = this.filterParser.evaluateFilterGroup(targetView!.filters, note);
        allWarnings.push(...result.warnings);
        return result.matches;
      });
      filtersApplied += this.countFilters(targetView.filters);
    }

    if (targetView?.sort) {
      matchingNotes = this.sortNotes(matchingNotes, targetView.sort);
    }

    const effectiveLimit = Math.min(limit ?? targetView?.limit ?? 50, 100);
    matchingNotes = matchingNotes.slice(0, effectiveLimit);

    const notes: BaseNoteResult[] = matchingNotes.map(note => {
      const result: BaseNoteResult = {
        p: note.filePath,
        t: note.fileName.replace(/\.md$/, '')
      };
      if (includeFrontmatter) {
        result.fm = note.frontmatter;
      }
      return result;
    });

    const uniqueWarnings = [...new Set(allWarnings)];

    const result: BaseQueryResult = {
      notes,
      views: availableViews,
      q: {
        view: viewName || null,
        limit: effectiveLimit,
        filters: filtersApplied
      }
    };

    if (uniqueWarnings.length > 0) {
      result.w = uniqueWarnings;
    }

    return result;
  }

  private async getAllNoteContexts(): Promise<NoteContext[]> {
    const markdownFiles = await this.findMarkdownFiles(this.vaultPath);
    const contexts: NoteContext[] = [];

    for (const fullPath of markdownFiles) {
      const relativePath = fullPath.substring(this.vaultPath.length + 1).replace(/\\/g, '/');
      
      if (!this.pathFilter.isAllowed(relativePath)) continue;
      if (relativePath.endsWith('.base')) continue;

      try {
        const content = await readFile(fullPath, 'utf-8');
        const stats = await stat(fullPath);
        const parsed = this.frontmatterHandler.parse(content);
        
        const tags = this.extractTags(parsed.frontmatter, parsed.content);
        const fileName = relativePath.split('/').pop() || relativePath;

        contexts.push({
          filePath: relativePath,
          fileName,
          frontmatter: parsed.frontmatter,
          content: parsed.content,
          ctime: stats.birthtime,
          mtime: stats.mtime,
          tags
        });
      } catch {
        continue;
      }
    }

    return contexts;
  }

  private extractTags(frontmatter: Record<string, any>, content: string): string[] {
    const tags: string[] = [];

    if (frontmatter.tags) {
      if (Array.isArray(frontmatter.tags)) {
        for (const t of frontmatter.tags) {
          if (typeof t === 'string') {
            tags.push(t);
          }
        }
      } else if (typeof frontmatter.tags === 'string') {
        tags.push(frontmatter.tags);
      }
    }

    const inlineMatches = content.match(/#[a-zA-Z0-9_\-/]+/g) || [];
    const inlineTags = inlineMatches.map(tag => tag.slice(1));
    tags.push(...inlineTags);

    return [...new Set(tags)];
  }

  private sortNotes(notes: NoteContext[], sorts: SortSpec[]): NoteContext[] {
    return [...notes].sort((a, b) => {
      for (const sort of sorts) {
        const aVal = this.getSortValue(a, sort.property);
        const bVal = this.getSortValue(b, sort.property);
        
        const cmp = this.compareValues(aVal, bVal);
        if (cmp !== 0) {
          return sort.direction === 'DESC' ? -cmp : cmp;
        }
      }
      return 0;
    });
  }

  private getSortValue(note: NoteContext, prop: string): any {
    if (prop.startsWith('file.')) {
      const field = prop.slice(5);
      switch (field) {
        case 'name': return note.fileName;
        case 'path': return note.filePath;
        case 'ctime': return note.ctime;
        case 'mtime': return note.mtime;
      }
    }
    if (prop.startsWith('property.')) {
      return note.frontmatter[prop.slice(9)];
    }
    return note.frontmatter[prop];
  }

  private compareValues(a: any, b: any): number {
    if (a === undefined && b === undefined) return 0;
    if (a === undefined) return 1;
    if (b === undefined) return -1;

    if (a instanceof Date && b instanceof Date) {
      return a.getTime() - b.getTime();
    }

    if (typeof a === 'number' && typeof b === 'number') {
      return a - b;
    }

    return String(a).localeCompare(String(b));
  }

  private countFilters(group: FilterGroup | undefined): number {
    if (!group) return 0;
    
    let count = 0;
    const items = group.and || group.or || [];
    for (const item of items) {
      if (typeof item === 'string') {
        count++;
      } else {
        count += this.countFilters(item);
      }
    }
    return count;
  }

  private async findMarkdownFiles(dirPath: string): Promise<string[]> {
    const files: string[] = [];

    try {
      const entries = await readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(dirPath, entry.name);

        if (entry.isDirectory()) {
          if (entry.name.startsWith('.') || entry.name === 'node_modules') {
            continue;
          }
          const subFiles = await this.findMarkdownFiles(fullPath);
          files.push(...subFiles);
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          files.push(fullPath);
        }
      }
    } catch {
    }

    return files;
  }

  private resolvePath(relativePath: string): string {
    const normalizedPath = relativePath.startsWith('/')
      ? relativePath.slice(1)
      : relativePath;

    const fullPath = resolve(join(this.vaultPath, normalizedPath));

    const relativeToVault = relative(this.vaultPath, fullPath);
    if (relativeToVault.startsWith('..')) {
      throw new Error(`Path traversal not allowed: ${relativePath}`);
    }

    return fullPath;
  }
}
