import { test, expect, beforeEach, afterEach } from "vitest";
import { FileSystemService } from "../src/filesystem.js";
import { mkdir, rmdir } from "fs/promises";

const testVaultPath = "/tmp/test-vault-frontmatter";
let fileSystem: FileSystemService;

beforeEach(async () => {
  await mkdir(testVaultPath, { recursive: true });
  fileSystem = new FileSystemService(testVaultPath);
});

afterEach(async () => {
  try {
    await rmdir(testVaultPath, { recursive: true });
  } catch (error) {
    // Ignore cleanup errors
  }
});

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
  // First write
  await fileSystem.writeNote({
    path: "append-test.md",
    content: "Original content.",
    frontmatter: { title: "Original", status: "draft" }
  });

  // Append with new frontmatter
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
  // Gray-matter adds trailing newlines, so expect the actual behavior
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
  expect(note.frontmatter.tags).toEqual(["original"]); // preserved
  expect(note.frontmatter.status).toBe("draft"); // preserved
  expect(note.frontmatter.priority).toBe("high"); // added
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
  expect(note.frontmatter.tags).toBeUndefined(); // removed
  expect(note.frontmatter.status).toBeUndefined(); // removed
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
  expect(note.frontmatter.title).toBe("Test"); // other properties preserved
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