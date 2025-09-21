import { join, resolve, relative, dirname } from 'path';
import { FrontmatterHandler } from './frontmatter.js';
import { PathFilter } from './pathfilter.js';
import type { ParsedNote, DirectoryListing, NoteWriteParams, DeleteNoteParams, DeleteResult, MoveNoteParams, MoveResult, BatchReadParams, BatchReadResult, UpdateFrontmatterParams, NoteInfo } from './types.js';

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

    try {
      const file = Bun.file(fullPath);
      const exists = await file.exists();

      if (!exists) {
        throw new Error(`File not found: ${path}`);
      }

      const content = await file.text();
      return this.frontmatterHandler.parse(content);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('File not found')) {
          throw error;
        }
        if (error.message.includes('permission') || error.message.includes('access')) {
          throw new Error(`Permission denied: ${path}`);
        }
      }
      throw new Error(`Failed to read file: ${path} - ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async writeNote(params: NoteWriteParams): Promise<void> {
    const { path, content, frontmatter } = params;
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
      // Prepare content with frontmatter
      const finalContent = frontmatter
        ? this.frontmatterHandler.stringify(frontmatter, content)
        : content;

      // Bun.write automatically creates directories if they don't exist
      await Bun.write(fullPath, finalContent);
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

  async listDirectory(path: string = ''): Promise<DirectoryListing> {
    const fullPath = this.resolvePath(path);

    try {
      const glob = new Bun.Glob("*");
      const files: string[] = [];
      const directories: string[] = [];

      for await (const entry of glob.scan(fullPath)) {
        const entryPath = path ? `${path}/${entry}` : entry;

        if (!this.pathFilter.isAllowed(entryPath)) {
          continue;
        }

        const entryFullPath = join(fullPath, entry);

        // Use Bun to determine if it's a file or directory
        const file = Bun.file(entryFullPath);
        const exists = await file.exists();

        if (exists) {
          // If it's a file that exists according to Bun.file, it's a regular file
          files.push(entry);
        } else {
          // Check if it might be a directory by trying to scan it
          try {
            const testGlob = new Bun.Glob("*");
            const testScan = testGlob.scan(entryFullPath);
            // If we can start scanning, it's a directory
            await testScan.next();
            directories.push(entry);
          } catch {
            // If we can't scan it, skip it (might be a special file or no permissions)
            continue;
          }
        }
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
      const file = Bun.file(fullPath);
      return await file.exists();
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
      // Try to scan as directory using Bun's glob
      const glob = new Bun.Glob("*");
      const iter = glob.scan(fullPath);
      await iter.next();
      return true;
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
      const file = Bun.file(fullPath);
      const exists = await file.exists();

      if (!exists) {
        return {
          success: false,
          path: path,
          message: `File not found: ${path}`
        };
      }

      // Perform the deletion using Bun's native API
      await Bun.file(fullPath).delete();

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
      const sourceFile = Bun.file(oldFullPath);
      const sourceExists = await sourceFile.exists();

      if (!sourceExists) {
        return {
          success: false,
          oldPath,
          newPath,
          message: `Source file not found: ${oldPath}`
        };
      }

      // Check if target already exists
      const targetFile = Bun.file(newFullPath);
      const targetExists = await targetFile.exists();

      if (targetExists && !overwrite) {
        return {
          success: false,
          oldPath,
          newPath,
          message: `Target file already exists: ${newPath}. Use overwrite=true to replace it.`
        };
      }

      // Read source content
      const content = await sourceFile.text();

      // Write to new location (auto-creates directories)
      await Bun.write(newFullPath, content);

      // Verify the write was successful
      const newFile = Bun.file(newFullPath);
      const newExists = await newFile.exists();

      if (!newExists) {
        return {
          success: false,
          oldPath,
          newPath,
          message: `Failed to create target file: ${newPath}`
        };
      }

      // Delete the source file
      await sourceFile.delete();

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
          path: paths[index],
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
        const file = Bun.file(fullPath);

        const exists = await file.exists();
        if (!exists) {
          throw new Error(`File not found: ${path}`);
        }

        const size = file.size;
        const lastModified = file.lastModified;

        // Quick check for frontmatter without reading full content
        const firstChunk = await file.slice(0, 100).text();
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

  getVaultPath(): string {
    return this.vaultPath;
  }
}