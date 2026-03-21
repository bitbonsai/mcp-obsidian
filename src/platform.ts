import { execFile, execFileSync } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

/**
 * Platform-specific strategy for resolving CLI binaries and detecting processes.
 * Consumed internally by CLI-based VaultAppProvider implementations.
 */
export interface PlatformStrategy {
  /** Candidate paths for the CLI binary, checked in order. */
  getCliCandidates(): string[];

  /** Check if the application process is running. */
  isProcessRunning(processName: string): Promise<boolean>;

  /** Apply platform-specific environment fixups (e.g., TMPDIR on macOS). */
  ensureEnvironment(): void;
}

export function createPlatformStrategy(): PlatformStrategy {
  switch (process.platform) {
    case "darwin": return new DarwinPlatformStrategy();
    case "linux":  return new LinuxPlatformStrategy();
    case "win32":  return new WindowsPlatformStrategy();
    default:       return new LinuxPlatformStrategy();
  }
}

class DarwinPlatformStrategy implements PlatformStrategy {
  getCliCandidates(): string[] {
    return [
      "obsidian",
      "/Applications/Obsidian.app/Contents/MacOS/obsidian",
    ];
  }

  async isProcessRunning(processName: string): Promise<boolean> {
    try {
      await execFileAsync("pgrep", ["-xiq", processName]);
      return true;
    } catch {
      return false;
    }
  }

  ensureEnvironment(): void {
    if (process.env.TMPDIR) return;
    try {
      const darwinTemp = execFileSync("getconf", ["DARWIN_USER_TEMP_DIR"], {
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
      }).trim();
      if (darwinTemp) {
        process.env.TMPDIR = darwinTemp;
        return;
      }
    } catch {
      // fall through
    }
    process.env.TMPDIR = "/tmp";
  }
}

class LinuxPlatformStrategy implements PlatformStrategy {
  getCliCandidates(): string[] {
    return ["obsidian"];
  }

  async isProcessRunning(processName: string): Promise<boolean> {
    try {
      await execFileAsync("pgrep", ["-xi", processName]);
      return true;
    } catch {
      return false;
    }
  }

  ensureEnvironment(): void {
    // no-op on Linux
  }
}

class WindowsPlatformStrategy implements PlatformStrategy {
  getCliCandidates(): string[] {
    return ["obsidian.exe"];
  }

  async isProcessRunning(processName: string): Promise<boolean> {
    try {
      const { stdout } = await execFileAsync("tasklist", [
        "/FI", `IMAGENAME eq ${processName}.exe`,
        "/NH",
      ]);
      return stdout.toLowerCase().includes(processName.toLowerCase());
    } catch {
      return false;
    }
  }

  ensureEnvironment(): void {
    // no-op on Windows
  }
}
