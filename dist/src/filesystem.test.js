import { test, expect, beforeEach, afterEach } from "vitest";
import { FileSystemService } from "./filesystem.js";
import { writeFile, mkdir, rmdir } from "fs/promises";
import { join } from "path";
const testVaultPath = "/tmp/test-vault-filesystem";
let fileSystem;
beforeEach(async () => {
    await mkdir(testVaultPath, { recursive: true });
    fileSystem = new FileSystemService(testVaultPath);
});
afterEach(async () => {
    try {
        await rmdir(testVaultPath, { recursive: true });
    }
    catch (error) {
        // Ignore cleanup errors
    }
});
// ============================================================================
// PATCH TESTS
// ============================================================================
test("patch note with single occurrence", async () => {
    const testPath = "test-note.md";
    const content = "# Test Note\n\nThis is the old content.\n\nMore text here.";
    await writeFile(join(testVaultPath, testPath), content);
    const result = await fileSystem.patchNote({
        path: testPath,
        oldString: "old content",
        newString: "new content",
        replaceAll: false
    });
    expect(result.success).toBe(true);
    expect(result.matchCount).toBe(1);
    expect(result.message).toContain("Successfully replaced 1 occurrence");
    const updatedNote = await fileSystem.readNote(testPath);
    expect(updatedNote.content).toContain("new content");
    expect(updatedNote.content).not.toContain("old content");
});
test("patch note with multiple occurrences requires replaceAll", async () => {
    const testPath = "test-note.md";
    const content = "# Test\n\nrepeat word repeat word repeat";
    await writeFile(join(testVaultPath, testPath), content);
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
    const result = await fileSystem.patchNote({
        path: testPath,
        oldString: "repeat",
        newString: "unique",
        replaceAll: true
    });
    expect(result.success).toBe(true);
    expect(result.matchCount).toBe(3);
    expect(result.message).toContain("Successfully replaced 3 occurrences");
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
test("patch note fails when file doesn't exist", async () => {
    const testPath = "non-existent-note.md";
    const result = await fileSystem.patchNote({
        path: testPath,
        oldString: "old",
        newString: "new",
        replaceAll: false
    });
    expect(result.success).toBe(false);
    expect(result.message).toContain("File not found");
});
test("patch note fails with empty oldString", async () => {
    const testPath = "test-note.md";
    const content = "# Test Note\n\nSome content.";
    await writeFile(join(testVaultPath, testPath), content);
    const result = await fileSystem.patchNote({
        path: testPath,
        oldString: "",
        newString: "new",
        replaceAll: false
    });
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/empty|filled|required/i);
});
test("patch note fails with empty newString", async () => {
    const testPath = "test-note.md";
    const content = "# Test Note\n\nSome content.";
    await writeFile(join(testVaultPath, testPath), content);
    const result = await fileSystem.patchNote({
        path: testPath,
        oldString: "content",
        newString: "",
        replaceAll: false
    });
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/empty|filled|required/i);
});
test("patch note handles regex special characters literally", async () => {
    const testPath = "test-note.md";
    const content = "Price: $10.50 (special)";
    await writeFile(join(testVaultPath, testPath), content);
    const result = await fileSystem.patchNote({
        path: testPath,
        oldString: "$10.50",
        newString: "$15.75",
        replaceAll: false
    });
    expect(result.success).toBe(true);
    const updatedNote = await fileSystem.readNote(testPath);
    expect(updatedNote.content).toContain("$15.75");
    expect(updatedNote.content).not.toContain("$10.50");
});
test("patch note preserves tabs and spaces", async () => {
    const testPath = "test-note.md";
    const content = "Line with\ttabs\n  Line with spaces\n\tTabbed line";
    await writeFile(join(testVaultPath, testPath), content);
    const result = await fileSystem.patchNote({
        path: testPath,
        oldString: "tabs",
        newString: "TABS",
        replaceAll: false
    });
    expect(result.success).toBe(true);
    const updatedNote = await fileSystem.readNote(testPath);
    expect(updatedNote.content).toContain("Line with\tTABS");
    expect(updatedNote.content).toContain("\tTabbed line");
    expect(updatedNote.content).toContain("  Line with spaces");
});
test("patch note is case sensitive", async () => {
    const testPath = "test-note.md";
    const content = "Hello world, hello again";
    await writeFile(join(testVaultPath, testPath), content);
    const result = await fileSystem.patchNote({
        path: testPath,
        oldString: "hello",
        newString: "hi",
        replaceAll: false
    });
    expect(result.success).toBe(true);
    const updatedNote = await fileSystem.readNote(testPath);
    expect(updatedNote.content).toContain("Hello world");
    expect(updatedNote.content).toContain("hi again");
});
test("patch note handles many replacements efficiently", async () => {
    const testPath = "test-note.md";
    const lines = Array.from({ length: 100 }, (_, i) => `Line ${i}: replace_me`);
    const content = lines.join("\n");
    await writeFile(join(testVaultPath, testPath), content);
    const startTime = Date.now();
    const result = await fileSystem.patchNote({
        path: testPath,
        oldString: "replace_me",
        newString: "replaced",
        replaceAll: true
    });
    const duration = Date.now() - startTime;
    expect(result.success).toBe(true);
    expect(result.matchCount).toBe(100);
    expect(duration).toBeLessThan(1000);
    const updatedNote = await fileSystem.readNote(testPath);
    expect(updatedNote.content).not.toContain("replace_me");
    expect(updatedNote.content.match(/replaced/g)?.length).toBe(100);
});
test("patch note works with path containing spaces", async () => {
    const testPath = "folder name/note with spaces.md";
    const content = "# Test Note\n\nOld content here.";
    await mkdir(join(testVaultPath, "folder name"), { recursive: true });
    await writeFile(join(testVaultPath, testPath), content);
    const result = await fileSystem.patchNote({
        path: testPath,
        oldString: "Old content",
        newString: "New content",
        replaceAll: false
    });
    expect(result.success).toBe(true);
    const updatedNote = await fileSystem.readNote(testPath);
    expect(updatedNote.content).toContain("New content");
});
// ============================================================================
// DELETE TESTS
// ============================================================================
test("delete note with correct confirmation", async () => {
    const testPath = "test-note.md";
    const content = "# Test Note\n\nThis is a test note to be deleted.";
    await writeFile(join(testVaultPath, testPath), content);
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
    await writeFile(join(testVaultPath, testPath), content);
    const result = await fileSystem.deleteNote({
        path: testPath,
        confirmPath: "wrong-path.md"
    });
    expect(result.success).toBe(false);
    expect(result.path).toBe(testPath);
    expect(result.message).toContain("confirmation path does not match");
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
    await writeFile(join(testVaultPath, testPath), content);
    const result = await fileSystem.deleteNote({
        path: testPath,
        confirmPath: testPath
    });
    expect(result.success).toBe(true);
    expect(result.path).toBe(testPath);
    expect(result.message).toContain("Successfully deleted");
});
// ============================================================================
// FRONTMATTER INTEGRATION TESTS
// ============================================================================
test("write_note with frontmatter", async () => {
    await fileSystem.writeNote({
        path: "test.md",
        content: "This is test content.",
        frontmatter: {
            title: "Test Note",
            tags: ["test", "example"],
            created: "2023-01-01"
        }
    });
    const note = await fileSystem.readNote("test.md");
    expect(note.frontmatter.title).toBe("Test Note");
    expect(note.frontmatter.tags).toEqual(["test", "example"]);
    expect(note.frontmatter.created).toBe("2023-01-01");
    expect(note.content.trim()).toBe("This is test content.");
});
test("write_note with append mode preserves frontmatter", async () => {
    await fileSystem.writeNote({
        path: "append-test.md",
        content: "Original content.",
        frontmatter: { title: "Original", status: "draft" }
    });
    await fileSystem.writeNote({
        path: "append-test.md",
        content: "\nAppended content.",
        frontmatter: { updated: "2023-12-01" },
        mode: "append"
    });
    const note = await fileSystem.readNote("append-test.md");
    expect(note.frontmatter.title).toBe("Original");
    expect(note.frontmatter.status).toBe("draft");
    expect(note.frontmatter.updated).toBe("2023-12-01");
    expect(note.content.trim()).toBe("Original content.\n\nAppended content.");
});
test("update_frontmatter merges with existing", async () => {
    await fileSystem.writeNote({
        path: "update-test.md",
        content: "Test content.",
        frontmatter: {
            title: "Original Title",
            tags: ["original"],
            status: "draft"
        }
    });
    await fileSystem.updateFrontmatter({
        path: "update-test.md",
        frontmatter: {
            title: "Updated Title",
            priority: "high"
        },
        merge: true
    });
    const note = await fileSystem.readNote("update-test.md");
    expect(note.frontmatter.title).toBe("Updated Title");
    expect(note.frontmatter.tags).toEqual(["original"]);
    expect(note.frontmatter.status).toBe("draft");
    expect(note.frontmatter.priority).toBe("high");
    expect(note.content.trim()).toBe("Test content.");
});
test("update_frontmatter replaces when merge is false", async () => {
    await fileSystem.writeNote({
        path: "replace-test.md",
        content: "Test content.",
        frontmatter: {
            title: "Original Title",
            tags: ["original"],
            status: "draft"
        }
    });
    await fileSystem.updateFrontmatter({
        path: "replace-test.md",
        frontmatter: {
            title: "New Title",
            priority: "high"
        },
        merge: false
    });
    const note = await fileSystem.readNote("replace-test.md");
    expect(note.frontmatter.title).toBe("New Title");
    expect(note.frontmatter.priority).toBe("high");
    expect(note.frontmatter.tags).toBeUndefined();
    expect(note.frontmatter.status).toBeUndefined();
});
test("manage_tags add operation", async () => {
    await fileSystem.writeNote({
        path: "tags-add-test.md",
        content: "Test content.",
        frontmatter: {
            title: "Test",
            tags: ["existing"]
        }
    });
    const result = await fileSystem.manageTags({
        path: "tags-add-test.md",
        operation: "add",
        tags: ["new", "important"]
    });
    expect(result.success).toBe(true);
    expect(result.tags).toEqual(["existing", "new", "important"]);
    const note = await fileSystem.readNote("tags-add-test.md");
    expect(note.frontmatter.tags).toEqual(["existing", "new", "important"]);
});
test("manage_tags remove operation", async () => {
    await fileSystem.writeNote({
        path: "tags-remove-test.md",
        content: "Test content.",
        frontmatter: {
            title: "Test",
            tags: ["keep", "remove1", "remove2"]
        }
    });
    const result = await fileSystem.manageTags({
        path: "tags-remove-test.md",
        operation: "remove",
        tags: ["remove1", "remove2"]
    });
    expect(result.success).toBe(true);
    expect(result.tags).toEqual(["keep"]);
    const note = await fileSystem.readNote("tags-remove-test.md");
    expect(note.frontmatter.tags).toEqual(["keep"]);
});
test("manage_tags list operation", async () => {
    await fileSystem.writeNote({
        path: "tags-list-test.md",
        content: "Test content with #inline-tag.",
        frontmatter: {
            title: "Test",
            tags: ["frontmatter-tag"]
        }
    });
    const result = await fileSystem.manageTags({
        path: "tags-list-test.md",
        operation: "list"
    });
    expect(result.success).toBe(true);
    expect(result.tags).toContain("frontmatter-tag");
    expect(result.tags).toContain("inline-tag");
});
test("manage_tags removes tags array when empty", async () => {
    await fileSystem.writeNote({
        path: "tags-empty-test.md",
        content: "Test content.",
        frontmatter: {
            title: "Test",
            tags: ["remove-me"]
        }
    });
    await fileSystem.manageTags({
        path: "tags-empty-test.md",
        operation: "remove",
        tags: ["remove-me"]
    });
    const note = await fileSystem.readNote("tags-empty-test.md");
    expect(note.frontmatter.tags).toBeUndefined();
    expect(note.frontmatter.title).toBe("Test");
});
test("frontmatter validation with invalid data", async () => {
    await expect(fileSystem.writeNote({
        path: "invalid-test.md",
        content: "Test content.",
        frontmatter: {
            title: "Test",
            invalidFunction: () => "not allowed"
        }
    })).rejects.toThrow(/Invalid frontmatter/);
});
