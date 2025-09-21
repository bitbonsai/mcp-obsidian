export interface ParsedNote {
  frontmatter: Record<string, any>;
  content: string;
  originalContent: string;
}

export interface NoteWriteParams {
  path: string;
  content: string;
  frontmatter?: Record<string, any>;
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