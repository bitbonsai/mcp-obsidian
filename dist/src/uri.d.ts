/**
 * Generates an Obsidian URI for a given note path.
 * Uses the absolute path format: obsidian:///absolute/path/to/note
 *
 * @param vaultPath - The absolute path to the vault root
 * @param notePath - The relative path to the note within the vault
 * @returns A properly encoded Obsidian URI
 */
export declare function generateObsidianUri(vaultPath: string, notePath: string): string;
