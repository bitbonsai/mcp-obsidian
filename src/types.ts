export interface ParsedNote {
  frontmatter: Record<string, any>;
  content: string;
  originalContent: string;
}

export interface NoteWriteParams {
  path: string;
  content: string;
  frontmatter?: Record<string, any>;
  mode?: 'overwrite' | 'append' | 'prepend';
}

export interface PatchNoteParams {
  path: string;
  oldString: string;
  newString: string;
  replaceAll?: boolean;
}

export interface PatchNoteResult {
  success: boolean;
  path: string;
  message: string;
  matchCount?: number;
}

export interface DeleteNoteParams {
  path: string;
  confirmPath: string;
}

export interface DeleteResult {
  success: boolean;
  path: string;
  message: string;
}

export interface DirectoryListing {
  files: string[];
  directories: string[];
}

export interface FrontmatterValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface PathFilterConfig {
  ignoredPatterns: string[];
  allowedExtensions: string[];
}

// Search types
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

// Move types
export interface MoveNoteParams {
  oldPath: string;
  newPath: string;
  overwrite?: boolean;
}

export interface MoveResult {
  success: boolean;
  oldPath: string;
  newPath: string;
  message: string;
}

// Batch read types
export interface BatchReadParams {
  paths: string[];
  includeContent?: boolean;
  includeFrontmatter?: boolean;
}

export interface BatchReadResult {
  successful: Array<{
    path: string;
    frontmatter?: Record<string, any>;
    content?: string;
    obsidianUri?: string;
  }>;
  failed: Array<{
    path: string;
    error: string;
  }>;
}

// Update frontmatter types
export interface UpdateFrontmatterParams {
  path: string;
  frontmatter: Record<string, any>;
  merge?: boolean;
}

// Note info types
export interface NoteInfo {
  path: string;
  size: number;
  modified: number; // timestamp
  hasFrontmatter: boolean;
  obsidianUri?: string;
}

// Tag management types
export interface TagManagementParams {
  path: string;
  operation: 'add' | 'remove' | 'list';
  tags?: string[];
}

export interface TagManagementResult {
  path: string;
  operation: string;
  tags: string[];
  success: boolean;
  message?: string;
}

// Base types for Obsidian Bases support

export interface BaseFile {
  filters?: FilterGroup;
  views?: BaseView[];
}

export interface FilterGroup {
  and?: FilterItem[];
  or?: FilterItem[];
}

export type FilterItem = string | FilterGroup;

export interface BaseView {
  type: 'table' | 'cards';
  name: string;
  filters?: FilterGroup;
  limit?: number;
  sort?: SortSpec[];
  order?: string[];  // column order (ignored for query)
}

export interface SortSpec {
  property: string;
  direction: 'ASC' | 'DESC';
}

export interface BaseQueryParams {
  path: string;
  view?: string;
  limit?: number;
  includeFrontmatter?: boolean;
}

export interface BaseQueryResult {
  notes: BaseNoteResult[];
  views: string[];
  q: {
    view: string | null;
    limit: number;
    filters: number;  // count of filters applied
  };
  w?: string[];  // warnings
}

export interface BaseNoteResult {
  p: string;   // path
  t: string;   // title
  fm?: Record<string, any>;  // frontmatter (optional)
}

// Context for filter evaluation
export interface NoteContext {
  filePath: string;
  fileName: string;
  frontmatter: Record<string, any>;
  content: string;
  ctime: Date;
  mtime: Date;
  tags: string[];  // extracted from frontmatter + inline
}