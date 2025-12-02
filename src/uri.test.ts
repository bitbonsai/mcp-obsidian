import { describe, it, expect } from 'vitest';
import { generateObsidianUri } from './uri.js';

describe('generateObsidianUri', () => {
  it('generates URI with absolute path', () => {
    const vaultPath = '/Users/test/vault';
    const notePath = 'folder/note.md';
    const uri = generateObsidianUri(vaultPath, notePath);

    expect(uri).toBe('obsidian:////Users/test/vault/folder/note');
  });

  it('handles paths with leading slash', () => {
    const vaultPath = '/Users/test/vault';
    const notePath = '/folder/note.md';
    const uri = generateObsidianUri(vaultPath, notePath);

    expect(uri).toBe('obsidian:////Users/test/vault/folder/note');
  });

  it('removes .md extension', () => {
    const vaultPath = '/Users/test/vault';
    const notePath = 'note.md';
    const uri = generateObsidianUri(vaultPath, notePath);

    expect(uri).toBe('obsidian:////Users/test/vault/note');
  });

  it('encodes special characters', () => {
    const vaultPath = '/Users/test/vault';
    const notePath = 'folder/my note with spaces.md';
    const uri = generateObsidianUri(vaultPath, notePath);

    expect(uri).toBe('obsidian:////Users/test/vault/folder/my%20note%20with%20spaces');
  });

  it('handles notes in root directory', () => {
    const vaultPath = '/Users/test/vault';
    const notePath = 'note.md';
    const uri = generateObsidianUri(vaultPath, notePath);

    expect(uri).toBe('obsidian:////Users/test/vault/note');
  });

  it('handles nested directories', () => {
    const vaultPath = '/Users/test/vault';
    const notePath = 'folder1/folder2/folder3/note.md';
    const uri = generateObsidianUri(vaultPath, notePath);

    expect(uri).toBe('obsidian:////Users/test/vault/folder1/folder2/folder3/note');
  });

  it('encodes special characters in directory names', () => {
    const vaultPath = '/Users/test/vault';
    const notePath = 'my folder/sub folder/note.md';
    const uri = generateObsidianUri(vaultPath, notePath);

    expect(uri).toBe('obsidian:////Users/test/vault/my%20folder/sub%20folder/note');
  });
});
