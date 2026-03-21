/**
 * Behavioral interface for communicating with a running vault application.
 * Tools depend on this interface — never on a specific app or transport.
 */
export interface VaultAppProvider {
  /** Get metadata about the currently active/focused file. */
  getActiveFileInfo(): Promise<Record<string, string | number>>;

  /** Read the content of the currently active/focused file. */
  readActiveFileContent(): Promise<string>;

  /** Check if the vault application is running and reachable. */
  isRunning(): Promise<boolean>;

  /**
   * Ensure the app is running; throw a descriptive error if not.
   * Implementations may cache the result with a short TTL.
   */
  ensureRunning(): Promise<void>;

  /** Open a file in the vault app by vault-relative path. */
  openFile(path: string, options?: { newtab?: boolean }): Promise<string>;
}
