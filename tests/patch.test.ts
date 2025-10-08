import { test, expect, beforeEach, afterEach } from "vitest";
import { FileSystemService } from "../src/filesystem.js";
import { writeFile, mkdir, rmdir } from "fs/promises";
import { join } from "path";

const testVaultPath = "/tmp/test-vault-patch";
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

test("patch note with single occurrence", async () => {
  const testPath = "test-note.md";
  const content = "# Test Note\n\nThis is the old content.\n\nMore text here.";

  // Create the test file
  await writeFile(join(testVaultPath, testPath), content);

  // Patch the note
  const result = await fileSystem.patchNote({
    path: testPath,
    oldString: "old content",
    newString: "new content",
    replaceAll: false
  });

  expect(result.success).toBe(true);
  expect(result.matchCount).toBe(1);
  expect(result.message).toContain("Successfully replaced 1 occurrence");

  // Verify the content was updated
  const updatedNote = await fileSystem.readNote(testPath);
  expect(updatedNote.content).toContain("new content");
  expect(updatedNote.content).not.toContain("old content");
});

test("patch note with multiple occurrences requires replaceAll", async () => {
  const testPath = "test-note.md";
  const content = "# Test\n\nrepeat word repeat word repeat";

  await writeFile(join(testVaultPath, testPath), content);

  // Should fail without replaceAll
  const result = await fileSystem.patchNote({
    path: testPath,
    oldString: "repeat",
    newString: "unique",
    replaceAll: false
  });

  expect(result.success).toBe(false);
  expect(result.matchCount).toBe(3);
  expect(result.message).toContain("Found 3 occurrences");
  expect(result.message).toContain("Use replaceAll=true");
});

test("patch note with replaceAll replaces all occurrences", async () => {
  const testPath = "test-note.md";
  const content = "# Test\n\nrepeat word repeat word repeat";

  await writeFile(join(testVaultPath, testPath), content);

  // Should succeed with replaceAll
  const result = await fileSystem.patchNote({
    path: testPath,
    oldString: "repeat",
    newString: "unique",
    replaceAll: true
  });

  expect(result.success).toBe(true);
  expect(result.matchCount).toBe(3);
  expect(result.message).toContain("Successfully replaced 3 occurrences");

  // Verify all occurrences were replaced
  const updatedNote = await fileSystem.readNote(testPath);
  expect(updatedNote.content).not.toContain("repeat");
  expect(updatedNote.content.match(/unique/g)?.length).toBe(3);
});

test("patch note fails when string not found", async () => {
  const testPath = "test-note.md";
  const content = "# Test Note\n\nSome content here.";

  await writeFile(join(testVaultPath, testPath), content);

  const result = await fileSystem.patchNote({
    path: testPath,
    oldString: "non-existent string",
    newString: "replacement",
    replaceAll: false
  });

  expect(result.success).toBe(false);
  expect(result.matchCount).toBe(0);
  expect(result.message).toContain("String not found");
});

test("patch note with multiline replacement", async () => {
  const testPath = "test-note.md";
  const content = "# Test\n\n## Section A\nOld content\nOld lines\n\n## Section B\nOther content";

  await writeFile(join(testVaultPath, testPath), content);

  const result = await fileSystem.patchNote({
    path: testPath,
    oldString: "## Section A\nOld content\nOld lines",
    newString: "## Section A\nNew content\nNew improved lines",
    replaceAll: false
  });

  expect(result.success).toBe(true);
  expect(result.matchCount).toBe(1);

  // Verify multiline replacement worked
  const updatedNote = await fileSystem.readNote(testPath);
  expect(updatedNote.content).toContain("New content");
  expect(updatedNote.content).toContain("New improved lines");
  expect(updatedNote.content).not.toContain("Old content");
});

test("patch note with frontmatter preserved", async () => {
  const testPath = "test-note.md";
  const content = `---
title: My Note
tags: [test]
---

# Content

Old text here.`;

  await writeFile(join(testVaultPath, testPath), content);

  const result = await fileSystem.patchNote({
    path: testPath,
    oldString: "Old text here.",
    newString: "New text here.",
    replaceAll: false
  });

  expect(result.success).toBe(true);

  // Verify frontmatter was preserved
  const updatedNote = await fileSystem.readNote(testPath);
  expect(updatedNote.frontmatter.title).toBe("My Note");
  expect(updatedNote.frontmatter.tags).toEqual(["test"]);
  expect(updatedNote.content).toContain("New text here.");
});

test("patch note fails when oldString equals newString", async () => {
  const testPath = "test-note.md";
  const content = "# Test\n\nSome content";

  await writeFile(join(testVaultPath, testPath), content);

  const result = await fileSystem.patchNote({
    path: testPath,
    oldString: "same",
    newString: "same",
    replaceAll: false
  });

  expect(result.success).toBe(false);
  expect(result.message).toContain("must be different");
});

test("patch note fails for filtered paths", async () => {
  const testPath = ".obsidian/config.json";

  const result = await fileSystem.patchNote({
    path: testPath,
    oldString: "old",
    newString: "new",
    replaceAll: false
  });

  expect(result.success).toBe(false);
  expect(result.message).toContain("Access denied");
});
