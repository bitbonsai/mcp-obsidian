import { execFile, execFileSync } from "node:child_process";
import { existsSync, statSync } from "node:fs";
import { basename, isAbsolute } from "node:path";
import { promisify } from "node:util";
import type { PlatformStrategy } from "./platform.js";
import type { VaultAppProvider } from "./vault-app-provider.js";

const execFileAsync = promisify(execFile);

export interface ExecResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export type CliExecutor = (command: string, args: string[]) => Promise<ExecResult>;

const DEFAULT_TIMEOUT = 30_000;
const CHECK_TTL_MS = 15_000;

export class ObsidianCliVaultAppProvider implements VaultAppProvider {
  private readonly vaultRoot: string;
  private readonly platform: PlatformStrategy;
  private readonly vaultName: string;
  private readonly executor: CliExecutor;
  private readonly hasCustomExecutor: boolean;

  private cachedCliBin: string | null = null;
  private runningCache: { alive: boolean; ts: number } | null = null;

  constructor(
    vaultRoot: string,
    platform: PlatformStrategy,
    executor?: CliExecutor,
  ) {
    this.vaultRoot = vaultRoot;
    this.platform = platform;
    this.vaultName = process.env.OBSIDIAN_VAULT_NAME || basename(vaultRoot);
    this.hasCustomExecutor = executor != null;

    this.executor = executor ?? (async (command, args) => {
      const { stdout, stderr } = await execFileAsync(command, args, {
        timeout: DEFAULT_TIMEOUT,
        cwd: this.vaultRoot,
        env: process.env,
      });
      return { stdout, stderr, exitCode: 0 };
    });
  }

  async getActiveFileInfo(): Promise<Record<string, string | number>> {
    const result = await this.execCli("file", []);
    const trimmed = result.stdout.trim();
    if (!trimmed) {
      throw new Error("No active file. Open a file in Obsidian and retry.");
    }
    return this.parseFileInfo(trimmed);
  }

  async readActiveFileContent(): Promise<string> {
    const result = await this.execCli("read", []);
    return result.stdout;
  }

  async isRunning(): Promise<boolean> {
    if (this.runningCache && Date.now() - this.runningCache.ts < CHECK_TTL_MS) {
      return this.runningCache.alive;
    }

    const alive = await this.platform.isProcessRunning("Obsidian");
    this.runningCache = { alive, ts: Date.now() };
    return alive;
  }

  async ensureRunning(): Promise<void> {
    const running = await this.isRunning();
    if (!running) {
      throw new Error("Obsidian is not running. Start Obsidian and retry.");
    }
  }

  async openFile(path: string, options?: { newtab?: boolean }): Promise<string> {
    const cliArgs = [`path=${path}`];
    if (options?.newtab) cliArgs.push("newtab");
    const result = await this.execCli("open", cliArgs);
    return result.stdout;
  }

  private resolveCliBin(): string {
    if (this.cachedCliBin) return this.cachedCliBin;

    const candidates = this.platform.getCliCandidates();

    // When a custom executor is injected (tests), skip filesystem
    // validation — the executor replaces the real binary call.
    if (this.hasCustomExecutor && candidates.length > 0) {
      this.cachedCliBin = candidates[0]!;
      return candidates[0]!;
    }

    for (const candidate of candidates) {
      try {
        if (isAbsolute(candidate)) {
          if (existsSync(candidate) && statSync(candidate).mode & 0o111) {
            this.cachedCliBin = candidate;
            return candidate;
          }
          continue;
        }
        const resolved = execFileSync("which", [candidate], {
          encoding: "utf-8",
          stdio: ["pipe", "pipe", "pipe"],
        }).trim();
        if (resolved) {
          this.cachedCliBin = resolved;
          return resolved;
        }
      } catch {
        continue;
      }
    }

    throw new Error(
      `Obsidian CLI not found. Searched: ${candidates.join(", ")}. Install the Obsidian CLI or add it to PATH.`,
    );
  }

  private async execCli(command: string, args: string[]): Promise<ExecResult> {
    this.platform.ensureEnvironment();
    const bin = this.resolveCliBin();
    const cliArgs = [`vault=${this.vaultName}`, command, ...args];

    let result: ExecResult;
    try {
      result = await this.executor(bin, cliArgs);
    } catch (error: unknown) {
      const err = error as {
        code?: string;
        killed?: boolean;
        stdout?: string;
        stderr?: string;
      };

      if (err.killed || err.code === "ETIMEDOUT") {
        this.runningCache = null;
        throw new Error(
          `Obsidian CLI timed out after ${DEFAULT_TIMEOUT}ms for command: ${command}`,
        );
      }

      throw new Error(
        err.stderr?.trim() || err.stdout?.trim() || String(error),
      );
    }

    // The Obsidian CLI reports some errors via stdout (exit code 0)
    if (result.stdout.startsWith("Error:")) {
      throw new Error(result.stdout.slice(7).trim());
    }
    if (result.stdout.startsWith("Command line interface is not enabled")) {
      throw new Error(
        "Obsidian CLI is not enabled. Turn it on in Obsidian → Settings → General → Advanced.",
      );
    }

    return result;
  }

  /** Parse tab-separated key\tvalue lines from CLI `file` output. */
  private parseFileInfo(output: string): Record<string, string | number> {
    const result: Record<string, string | number> = {};
    for (const line of output.split("\n")) {
      const sep = line.indexOf("\t");
      if (sep === -1) continue;
      const key = line.slice(0, sep).trim();
      const val = line.slice(sep + 1).trim();
      const num = Number(val);
      result[key] = Number.isFinite(num) && /^\d+$/.test(val) ? num : val;
    }
    return result;
  }
}
