/**
 * Generates an Obsidian URI for a given note path.
 * Uses the absolute path format: obsidian:///absolute/path/to/note
 *
 * @param vaultPath - The absolute path to the vault root
 * @param notePath - The relative path to the note within the vault
 * @returns A properly encoded Obsidian URI
 */
export function generateObsidianUri(vaultPath, notePath) {
    // Remove leading slash from notePath if present
    const cleanPath = notePath.startsWith('/') ? notePath.slice(1) : notePath;
    // Construct absolute path
    const absolutePath = `${vaultPath}/${cleanPath}`;
    // Remove .md extension if present (Obsidian handles this automatically)
    const pathWithoutExtension = absolutePath.replace(/\.md$/, '');
    // URI encode the path, but keep slashes as slashes
    const encodedPath = pathWithoutExtension
        .split('/')
        .map(segment => encodeURIComponent(segment))
        .join('/');
    return `obsidian:///${encodedPath}`;
}
