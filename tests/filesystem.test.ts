import { test, expect, beforeEach, afterEach } from "bun:test";
import { FileSystemService } from "../src/filesystem.js";
import { writeFile, mkdir, rmdir } from "fs/promises";
import { join } from "path";

const testVaultPath = "/tmp/test-vault-delete";
let fileSystem: FileSystemService;

beforeEach(async () => {
  // Create test vault directory
  await mkdir(testVaultPath, { recursive: true });
  fileSystem = new FileSystemService(testVaultPath);
});

afterEach(async () => {
  // Clean up test vault
  try {
    await rmdir(testVaultPath, { recursive: true });
  } catch (error) {
    // Ignore cleanup errors
  }
});

test("delete note with correct confirmation", async () => {
  const testPath = "test-note.md";
  const content = "# Test Note\n\nThis is a test note to be deleted.";

  // Create the test file
  await writeFile(join(testVaultPath, testPath), content);

  // Delete with correct confirmation
  const result = await fileSystem.deleteNote({
    path: testPath,
    confirmPath: testPath
  });

  expect(result.success).toBe(true);
  expect(result.path).toBe(testPath);
  expect(result.message).toContain("Successfully deleted");
  expect(result.message).toContain("cannot be undone");
});

test("reject deletion with incorrect confirmation", async () => {
  const testPath = "test-note.md";
  const content = "# Test Note\n\nThis note should not be deleted.";

  // Create the test file
  await writeFile(join(testVaultPath, testPath), content);

  // Attempt delete with wrong confirmation
  const result = await fileSystem.deleteNote({
    path: testPath,
    confirmPath: "wrong-path.md"
  });

  expect(result.success).toBe(false);
  expect(result.path).toBe(testPath);
  expect(result.message).toContain("confirmation path does not match");

  // Verify file still exists
  const fileStillExists = await fileSystem.exists(testPath);
  expect(fileStillExists).toBe(true);
});

test("handle deletion of non-existent file", async () => {
  const testPath = "non-existent.md";

  const result = await fileSystem.deleteNote({
    path: testPath,
    confirmPath: testPath
  });

  expect(result.success).toBe(false);
  expect(result.path).toBe(testPath);
  expect(result.message).toContain("File not found");
});

test("reject deletion of filtered paths", async () => {
  const testPath = ".obsidian/app.json";

  const result = await fileSystem.deleteNote({
    path: testPath,
    confirmPath: testPath
  });

  expect(result.success).toBe(false);
  expect(result.path).toBe(testPath);
  expect(result.message).toContain("Access denied");
});

test("handle directory deletion attempt", async () => {
  const testPath = "test-directory";

  // Create a directory instead of a file
  await mkdir(join(testVaultPath, testPath));

  const result = await fileSystem.deleteNote({
    path: testPath,
    confirmPath: testPath
  });

  expect(result.success).toBe(false);
  expect(result.path).toBe(testPath);
  expect(result.message).toContain("is not a file");
});

test("delete note with frontmatter", async () => {
  const testPath = "note-with-frontmatter.md";
  const content = `---
title: Test Note
tags: [test, delete]
---

# Test Note

This note has frontmatter and should be deleted successfully.`;

  // Create the test file
  await writeFile(join(testVaultPath, testPath), content);

  // Delete with correct confirmation
  const result = await fileSystem.deleteNote({
    path: testPath,
    confirmPath: testPath
  });

  expect(result.success).toBe(true);
  expect(result.path).toBe(testPath);
  expect(result.message).toContain("Successfully deleted");
});