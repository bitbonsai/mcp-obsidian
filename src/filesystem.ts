import { join, resolve, relative, dirname } from 'path';
import { readdir, stat, readFile, writeFile, unlink, mkdir, access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { FrontmatterHandler } from './frontmatter.js';
import { PathFilter } from './pathfilter.js';
import type { ParsedNote, DirectoryListing, NoteWriteParams, DeleteNoteParams, DeleteResult, MoveNoteParams, MoveResult, BatchReadParams, BatchReadResult, UpdateFrontmatterParams, NoteInfo, TagManagementParams, TagManagementResult, PatchNoteParams, PatchNoteResult } from './types.js';

export class FileSystemService {
  private frontmatterHandler: FrontmatterHandler;
  private pathFilter: PathFilter;

  constructor(
    private vaultPath: string,
    pathFilter?: PathFilter,
    frontmatterHandler?: FrontmatterHandler
  ) {
    this.vaultPath = resolve(vaultPath);
    this.pathFilter = pathFilter || new PathFilter();
    this.frontmatterHandler = frontmatterHandler || new FrontmatterHandler();
  }

  private resolvePath(relativePath: string): string {
    // Handle undefined or null path
    if (!relativePath) {
      relativePath = '';
    }

    // Trim whitespace from path
    relativePath = relativePath.trim();

    // Normalize and resolve the path within the vault
    const normalizedPath = relativePath.startsWith('/')
      ? relativePath.slice(1)
      : relativePath;

    const fullPath = resolve(join(this.vaultPath, normalizedPath));

    // Security check: ensure path is within vault
    const relativeToVault = relative(this.vaultPath, fullPath);
    if (relativeToVault.startsWith('..')) {
      throw new Error(`Path traversal not allowed: ${relativePath}`);
    }

    return fullPath;
  }

  async readNote(path: string): Promise<ParsedNote> {
    const fullPath = this.resolvePath(path);

    if (!this.pathFilter.isAllowed(path)) {
      throw new Error(`Access denied: ${path}`);
    }

    // Check if the path is a directory first
    const isDir = await this.isDirectory(path);
    if (isDir) {
      throw new Error(`Cannot read directory as file: ${path}. Use list_directory tool instead.`);
    }

    try {
      try {
        await access(fullPath, constants.F_OK);
      } catch {
        throw new Error(`File not found: ${path}`);
      }

      const content = await readFile(fullPath, 'utf-8');
      return this.frontmatterHandler.parse(content);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('File not found')) {
          throw error;
        }
        if (error.message.includes('permission') || error.message.includes('access')) {
          throw new Error(`Permission denied: ${path}`);
        }
        if (error.message.includes('Cannot read directory')) {
          throw error;
        }
      }
      throw new Error(`Failed to read file: ${path} - ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async writeNote(params: NoteWriteParams): Promise<void> {
    const { path, content, frontmatter, mode = 'overwrite' } = params;
    const fullPath = this.resolvePath(path);

    if (!this.pathFilter.isAllowed(path)) {
      throw new Error(`Access denied: ${path}`);
    }

    // Validate frontmatter if provided
    if (frontmatter) {
      const validation = this.frontmatterHandler.validate(frontmatter);
      if (!validation.isValid) {
        throw new Error(`Invalid frontmatter: ${validation.errors.join(', ')}`);
      }
    }

    try {
      let finalContent: string;

      if (mode === 'overwrite') {
        // Original behavior - replace entire content
        finalContent = frontmatter
          ? this.frontmatterHandler.stringify(frontmatter, content)
          : content;
      } else {
        // For append/prepend, we need to read existing content
        let existingNote: ParsedNote;
        try {
          existingNote = await this.readNote(path);
        } catch (error) {
          // File doesn't exist, treat as overwrite
          finalContent = frontmatter
            ? this.frontmatterHandler.stringify(frontmatter, content)
            : content;
        }

        if (existingNote!) {
          // Merge frontmatter if provided
          const mergedFrontmatter = frontmatter
            ? { ...existingNote.frontmatter, ...frontmatter }
            : existingNote.frontmatter;

          if (mode === 'append') {
            finalContent = this.frontmatterHandler.stringify(
              mergedFrontmatter,
              existingNote.content + content
            );
          } else if (mode === 'prepend') {
            finalContent = this.frontmatterHandler.stringify(
              mergedFrontmatter,
              content + existingNote.content
            );
          }
        }
      }

      // Create directories if they don't exist
      await mkdir(dirname(fullPath), { recursive: true });
      await writeFile(fullPath, finalContent!, 'utf-8');
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('permission') || error.message.includes('access')) {
          throw new Error(`Permission denied: ${path}`);
        }
        if (error.message.includes('space') || error.message.includes('ENOSPC')) {
          throw new Error(`No space left on device: ${path}`);
        }
      }
      throw new Error(`Failed to write file: ${path} - ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async patchNote(params: PatchNoteParams): Promise<PatchNoteResult> {
    const { path, oldString, newString, replaceAll = false } = params;

    if (!this.pathFilter.isAllowed(path)) {
      return {
        success: false,
        path,
        message: `Access denied: ${path}`
      };
    }

    // Validate that strings are not empty
    if (!oldString || oldString.trim() === '') {
      return {
        success: false,
        path,
        message: 'oldString cannot be empty'
      };
    }

    if (newString === '') {
      return {
        success: false,
        path,
        message: 'newString cannot be empty'
      };
    }

    // Validate that oldString and newString are different
    if (oldString === newString) {
      return {
        success: false,
        path,
        message: 'oldString and newString must be different'
      };
    }

    try {
      // Read the existing note
      const note = await this.readNote(path);

      // Get the full content with frontmatter
      const fullContent = note.originalContent;

      // Count occurrences of oldString
      const occurrences = fullContent.split(oldString).length - 1;

      if (occurrences === 0) {
        return {
          success: false,
          path,
          message: `String not found in note: "${oldString.substring(0, 50)}${oldString.length > 50 ? '...' : ''}"`,
          matchCount: 0
        };
      }

      // If not replaceAll and multiple occurrences exist, fail
      if (!replaceAll && occurrences > 1) {
        return {
          success: false,
          path,
          message: `Found ${occurrences} occurrences of the string. Use replaceAll=true to replace all occurrences, or provide a more specific string to match exactly one occurrence.`,
          matchCount: occurrences
        };
      }

      // Perform the replacement
      const updatedContent = replaceAll
        ? fullContent.split(oldString).join(newString)
        : fullContent.replace(oldString, newString);

      // Write the updated content
      const fullPath = this.resolvePath(path);
      await writeFile(fullPath, updatedContent, 'utf-8');

      return {
        success: true,
        path,
        message: `Successfully replaced ${replaceAll ? occurrences : 1} occurrence${occurrences > 1 ? 's' : ''}`,
        matchCount: occurrences
      };

    } catch (error) {
      return {
        success: false,
        path,
        message: `Failed to patch note: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async listDirectory(path: string = ''): Promise<DirectoryListing> {
    // Normalize path: treat '.' as root directory
    const normalizedPath = path === '.' ? '' : path;
    const fullPath = this.resolvePath(normalizedPath);

    try {
      const entries = await readdir(fullPath, { withFileTypes: true });
      const files: string[] = [];
      const directories: string[] = [];

      for (const entry of entries) {
        const entryPath = normalizedPath ? `${normalizedPath}/${entry.name}` : entry.name;

        if (!this.pathFilter.isAllowed(entryPath)) {
          continue;
        }

        if (entry.isDirectory()) {
          directories.push(entry.name);
        } else if (entry.isFile()) {
          files.push(entry.name);
        }
        // Skip other types (symlinks, etc.)
      }

      return {
        files: files.sort(),
        directories: directories.sort()
      };
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('not found') || error.message.includes('ENOENT')) {
          throw new Error(`Directory not found: ${path}`);
        }
        if (error.message.includes('permission') || error.message.includes('access')) {
          throw new Error(`Permission denied: ${path}`);
        }
        if (error.message.includes('not a directory') || error.message.includes('ENOTDIR')) {
          throw new Error(`Not a directory: ${path}`);
        }
      }
      throw new Error(`Failed to list directory: ${path} - ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async exists(path: string): Promise<boolean> {
    const fullPath = this.resolvePath(path);

    if (!this.pathFilter.isAllowed(path)) {
      return false;
    }

    try {
      await access(fullPath, constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  async isDirectory(path: string): Promise<boolean> {
    const fullPath = this.resolvePath(path);

    if (!this.pathFilter.isAllowed(path)) {
      return false;
    }

    try {
      const stats = await stat(fullPath);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }

  async deleteNote(params: DeleteNoteParams): Promise<DeleteResult> {
    const { path, confirmPath } = params;

    // Confirmation check - paths must match exactly
    if (path !== confirmPath) {
      return {
        success: false,
        path: path,
        message: "Deletion cancelled: confirmation path does not match. For safety, both 'path' and 'confirmPath' must be identical."
      };
    }

    const fullPath = this.resolvePath(path);

    if (!this.pathFilter.isAllowed(path)) {
      return {
        success: false,
        path: path,
        message: `Access denied: ${path}`
      };
    }

    try {
      // Check if it's a directory first (can't delete directories with this method)
      const isDir = await this.isDirectory(path);
      if (isDir) {
        return {
          success: false,
          path: path,
          message: `Cannot delete: ${path} is not a file`
        };
      }

      // Check if file exists
      try {
        await access(fullPath, constants.F_OK);
      } catch {
        return {
          success: false,
          path: path,
          message: `File not found: ${path}`
        };
      }

      // Perform the deletion using Node.js native API
      await unlink(fullPath);

      return {
        success: true,
        path: path,
        message: `Successfully deleted note: ${path}. This action cannot be undone.`
      };

    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        if (error.code === 'ENOENT') {
          return {
            success: false,
            path: path,
            message: `File not found: ${path}`
          };
        }
        if (error.code === 'EACCES') {
          return {
            success: false,
            path: path,
            message: `Permission denied: ${path}`
          };
        }
      }
      return {
        success: false,
        path: path,
        message: `Failed to delete file: ${path} - ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async moveNote(params: MoveNoteParams): Promise<MoveResult> {
    const { oldPath, newPath, overwrite = false } = params;

    if (!this.pathFilter.isAllowed(oldPath)) {
      return {
        success: false,
        oldPath,
        newPath,
        message: `Access denied: ${oldPath}`
      };
    }

    if (!this.pathFilter.isAllowed(newPath)) {
      return {
        success: false,
        oldPath,
        newPath,
        message: `Access denied: ${newPath}`
      };
    }

    const oldFullPath = this.resolvePath(oldPath);
    const newFullPath = this.resolvePath(newPath);

    try {
      // Check if source file exists
      try {
        await access(oldFullPath, constants.F_OK);
      } catch {
        return {
          success: false,
          oldPath,
          newPath,
          message: `Source file not found: ${oldPath}`
        };
      }

      // Check if target already exists
      let targetExists = false;
      try {
        await access(newFullPath, constants.F_OK);
        targetExists = true;
      } catch {
        // Target doesn't exist, which is fine
      }

      if (targetExists && !overwrite) {
        return {
          success: false,
          oldPath,
          newPath,
          message: `Target file already exists: ${newPath}. Use overwrite=true to replace it.`
        };
      }

      // Read source content
      const content = await readFile(oldFullPath, 'utf-8');

      // Write to new location (create directories if they don't exist)
      await mkdir(dirname(newFullPath), { recursive: true });
      await writeFile(newFullPath, content, 'utf-8');

      // Verify the write was successful
      try {
        await access(newFullPath, constants.F_OK);
      } catch {
        return {
          success: false,
          oldPath,
          newPath,
          message: `Failed to create target file: ${newPath}`
        };
      }

      // Delete the source file
      await unlink(oldFullPath);

      return {
        success: true,
        oldPath,
        newPath,
        message: `Successfully moved note from ${oldPath} to ${newPath}`
      };

    } catch (error) {
      return {
        success: false,
        oldPath,
        newPath,
        message: `Failed to move note: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async readMultipleNotes(params: BatchReadParams): Promise<BatchReadResult> {
    const { paths, includeContent = true, includeFrontmatter = true } = params;

    if (paths.length > 10) {
      throw new Error('Maximum 10 files per batch read request');
    }

    const results = await Promise.allSettled(
      paths.map(async (path) => {
        if (!this.pathFilter.isAllowed(path)) {
          throw new Error(`Access denied: ${path}`);
        }

        const note = await this.readNote(path);
        const result: any = { path };

        if (includeFrontmatter) {
          result.frontmatter = note.frontmatter;
        }

        if (includeContent) {
          result.content = note.content;
        }

        return result;
      })
    );

    const successful: Array<{ path: string; frontmatter?: Record<string, any>; content?: string; }> = [];
    const failed: Array<{ path: string; error: string; }> = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        successful.push(result.value);
      } else {
        failed.push({
          path: paths[index] || '',
          error: result.reason instanceof Error ? result.reason.message : 'Unknown error'
        });
      }
    });

    return { successful, failed };
  }

  async updateFrontmatter(params: UpdateFrontmatterParams): Promise<void> {
    const { path, frontmatter, merge = true } = params;

    if (!this.pathFilter.isAllowed(path)) {
      throw new Error(`Access denied: ${path}`);
    }

    // Read the existing note
    const note = await this.readNote(path);

    // Prepare new frontmatter
    const newFrontmatter = merge
      ? { ...note.frontmatter, ...frontmatter }
      : frontmatter;

    // Validate the new frontmatter
    const validation = this.frontmatterHandler.validate(newFrontmatter);
    if (!validation.isValid) {
      throw new Error(`Invalid frontmatter: ${validation.errors.join(', ')}`);
    }

    // Update the note with new frontmatter, preserving content
    await this.writeNote({
      path,
      content: note.content,
      frontmatter: newFrontmatter
    });
  }

  async getNotesInfo(paths: string[]): Promise<NoteInfo[]> {
    const results = await Promise.allSettled(
      paths.map(async (path): Promise<NoteInfo> => {
        if (!this.pathFilter.isAllowed(path)) {
          throw new Error(`Access denied: ${path}`);
        }

        const fullPath = this.resolvePath(path);

        try {
          await access(fullPath, constants.F_OK);
        } catch {
          throw new Error(`File not found: ${path}`);
        }

        const stats = await stat(fullPath);
        const size = stats.size;
        const lastModified = stats.mtime.getTime();

        // Quick check for frontmatter without reading full content
        const file = await readFile(fullPath, 'utf-8');
        const firstChunk = file.slice(0, 100);
        const hasFrontmatter = firstChunk.startsWith('---\n');

        return {
          path,
          size,
          modified: lastModified,
          hasFrontmatter
        };
      })
    );

    // Return only successful results, filter out failed ones
    return results
      .filter((result): result is PromiseFulfilledResult<NoteInfo> => result.status === 'fulfilled')
      .map(result => result.value);
  }

  async manageTags(params: TagManagementParams): Promise<TagManagementResult> {
    const { path, operation, tags = [] } = params;

    if (!this.pathFilter.isAllowed(path)) {
      return {
        path,
        operation,
        tags: [],
        success: false,
        message: `Access denied: ${path}`
      };
    }

    try {
      const note = await this.readNote(path);
      let currentTags: string[] = [];

      // Extract tags from frontmatter
      if (note.frontmatter.tags) {
        if (Array.isArray(note.frontmatter.tags)) {
          currentTags = note.frontmatter.tags;
        } else if (typeof note.frontmatter.tags === 'string') {
          currentTags = [note.frontmatter.tags];
        }
      }

      // Also extract inline tags from content
      const inlineTagMatches = note.content.match(/#[a-zA-Z0-9_-]+/g) || [];
      const inlineTags = inlineTagMatches.map(tag => tag.slice(1)); // Remove #
      currentTags = [...new Set([...currentTags, ...inlineTags])]; // Deduplicate

      if (operation === 'list') {
        return {
          path,
          operation,
          tags: currentTags,
          success: true
        };
      }

      let newTags = [...currentTags];

      if (operation === 'add') {
        for (const tag of tags) {
          if (!newTags.includes(tag)) {
            newTags.push(tag);
          }
        }
      } else if (operation === 'remove') {
        newTags = newTags.filter(tag => !tags.includes(tag));
      }

      // Update frontmatter with new tags
      const updatedFrontmatter: Record<string, any> = {
        ...note.frontmatter
      };

      if (newTags.length > 0) {
        updatedFrontmatter.tags = newTags;
      } else if ('tags' in updatedFrontmatter) {
        delete updatedFrontmatter.tags;
      }

      // Write back the note with updated frontmatter
      await this.writeNote({
        path,
        content: note.content,
        frontmatter: updatedFrontmatter,
        mode: 'overwrite'
      });

      return {
        path,
        operation,
        tags: newTags,
        success: true,
        message: `Successfully ${operation === 'add' ? 'added' : 'removed'} tags`
      };

    } catch (error) {
      return {
        path,
        operation,
        tags: [],
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  getVaultPath(): string {
    return this.vaultPath;
  }
}