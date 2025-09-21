import { readdir, readFile, writeFile, stat, mkdir, unlink } from 'fs/promises';
import { join, resolve, relative, dirname } from 'path';
import { FrontmatterHandler } from './frontmatter.js';
import { PathFilter } from './pathfilter.js';
import type { ParsedNote, DirectoryListing, NoteWriteParams, DeleteNoteParams, DeleteResult } from './types.js';

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
      const content = await readFile(fullPath, 'utf-8');
      return this.frontmatterHandler.parse(content);
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        if (error.code === 'ENOENT') {
          throw new Error(`File not found: ${path}`);
        }
        if (error.code === 'EACCES') {
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
      // Ensure directory exists
      const dir = dirname(fullPath);
      await mkdir(dir, { recursive: true });

      // Prepare content with frontmatter
      const finalContent = frontmatter
        ? this.frontmatterHandler.stringify(frontmatter, content)
        : content;

      await writeFile(fullPath, finalContent, 'utf-8');
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        if (error.code === 'EACCES') {
          throw new Error(`Permission denied: ${path}`);
        }
        if (error.code === 'ENOSPC') {
          throw new Error(`No space left on device: ${path}`);
        }
      }
      throw new Error(`Failed to write file: ${path} - ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async listDirectory(path: string = ''): Promise<DirectoryListing> {
    const fullPath = this.resolvePath(path);

    try {
      const entries = await readdir(fullPath, { withFileTypes: true });
      const files: string[] = [];
      const directories: string[] = [];

      for (const entry of entries) {
        const entryPath = path ? `${path}/${entry.name}` : entry.name;

        if (!this.pathFilter.isAllowed(entryPath)) {
          continue;
        }

        if (entry.isDirectory()) {
          directories.push(entry.name);
        } else if (entry.isFile()) {
          files.push(entry.name);
        }
      }

      return {
        files: files.sort(),
        directories: directories.sort()
      };
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        if (error.code === 'ENOENT') {
          throw new Error(`Directory not found: ${path}`);
        }
        if (error.code === 'EACCES') {
          throw new Error(`Permission denied: ${path}`);
        }
        if (error.code === 'ENOTDIR') {
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
      await stat(fullPath);
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
      // Check if file exists first
      const stats = await stat(fullPath);
      if (!stats.isFile()) {
        return {
          success: false,
          path: path,
          message: `Cannot delete: ${path} is not a file`
        };
      }

      // Perform the deletion
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

  getVaultPath(): string {
    return this.vaultPath;
  }
}