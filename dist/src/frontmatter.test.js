import { test, expect } from "vitest";
import { FrontmatterHandler } from "./frontmatter.js";
const handler = new FrontmatterHandler();
test("parse note with frontmatter", () => {
    const content = `---
title: Test Note
tags: [test, example]
created: 2023-01-01
---

# Test Note

This is a test note with frontmatter.`;
    const result = handler.parse(content);
    expect(result.frontmatter.title).toBe("Test Note");
    expect(result.frontmatter.tags).toEqual(["test", "example"]);
    expect(result.frontmatter.created).toEqual(new Date("2023-01-01"));
    expect(result.content.trim()).toBe("# Test Note\n\nThis is a test note with frontmatter.");
});
test("parse note without frontmatter", () => {
    const content = `# Test Note

This is a test note without frontmatter.`;
    const result = handler.parse(content);
    expect(result.frontmatter).toEqual({});
    expect(result.content).toBe(content);
});
test("stringify with frontmatter", () => {
    const frontmatter = {
        title: "Test Note",
        tags: ["test", "example"]
    };
    const content = "# Test Note\n\nContent here.";
    const result = handler.stringify(frontmatter, content);
    expect(result).toContain("---");
    expect(result).toContain("title: Test Note");
    expect(result).toContain("tags:");
    expect(result).toContain("# Test Note");
});
test("stringify without frontmatter", () => {
    const content = "# Test Note\n\nContent here.";
    const result = handler.stringify({}, content);
    expect(result).toBe(content);
});
test("validate valid frontmatter", () => {
    const frontmatter = {
        title: "Valid Title",
        tags: ["tag1", "tag2"],
        date: new Date("2023-01-01"),
        count: 42,
        enabled: true
    };
    const result = handler.validate(frontmatter);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
});
test("validate invalid frontmatter with function", () => {
    const frontmatter = {
        title: "Invalid",
        badFunction: () => "not allowed"
    };
    const result = handler.validate(frontmatter);
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    // The specific error message may vary between YAML libraries
    expect(result.errors[0]).toMatch(/Functions are not allowed|Invalid YAML structure/);
});
test("update frontmatter in existing content", () => {
    const content = `---
title: Old Title
tags: [old]
---

# Content

Some content here.`;
    const updates = {
        title: "New Title",
        modified: "2023-12-01"
    };
    const result = handler.updateFrontmatter(content, updates);
    expect(result).toContain("title: New Title");
    expect(result).toContain("modified: '2023-12-01'");
    expect(result).toContain("tags:");
    expect(result).toContain("# Content");
});
