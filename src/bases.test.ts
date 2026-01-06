import { describe, it, expect, beforeEach } from 'vitest';
import { FilterParser } from './filter-parser.js';
import type { NoteContext, FilterGroup } from './types.js';

describe('FilterParser', () => {
  let parser: FilterParser;
  let baseContext: NoteContext;

  beforeEach(() => {
    parser = new FilterParser();
    baseContext = {
      filePath: 'Notes/test-note.md',
      fileName: 'test-note.md',
      frontmatter: {
        tags: ['llms', 'ai/prompts'],
        type: 'Book',
        status: 'active',
        author: 'John Doe',
        date: '2025-01-01',
        source: 'https://github.com/example/repo'
      },
      content: 'Some content with #inline-tag and #another/nested',
      ctime: new Date('2025-01-01'),
      mtime: new Date('2025-01-05'),
      tags: ['llms', 'ai/prompts', 'inline-tag', 'another/nested']
    };
  });

  describe('file.hasTag', () => {
    it('matches exact tag', () => {
      const result = parser.evaluateFilterGroup(
        { and: ['file.hasTag("llms")'] },
        baseContext
      );
      expect(result.matches).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it('matches tag with hash prefix in expression', () => {
      const result = parser.evaluateFilterGroup(
        { and: ['file.hasTag("#llms")'] },
        baseContext
      );
      expect(result.matches).toBe(true);
    });

    it('returns false for missing tag', () => {
      const result = parser.evaluateFilterGroup(
        { and: ['file.hasTag("nonexistent")'] },
        baseContext
      );
      expect(result.matches).toBe(false);
    });
  });

  describe('tags.contains', () => {
    it('matches substring in tag', () => {
      const result = parser.evaluateFilterGroup(
        { and: ['tags.contains("ai/prompts")'] },
        baseContext
      );
      expect(result.matches).toBe(true);
    });

    it('matches partial tag path', () => {
      const result = parser.evaluateFilterGroup(
        { and: ['tags.contains("ai/")'] },
        baseContext
      );
      expect(result.matches).toBe(true);
    });

    it('matches inline tags', () => {
      const result = parser.evaluateFilterGroup(
        { and: ['tags.contains("inline-tag")'] },
        baseContext
      );
      expect(result.matches).toBe(true);
    });
  });

  describe('file.path.startsWith', () => {
    it('matches path prefix', () => {
      const result = parser.evaluateFilterGroup(
        { and: ['file.path.startsWith("Notes/")'] },
        baseContext
      );
      expect(result.matches).toBe(true);
    });

    it('returns false for non-matching prefix', () => {
      const result = parser.evaluateFilterGroup(
        { and: ['file.path.startsWith("Other/")'] },
        baseContext
      );
      expect(result.matches).toBe(false);
    });
  });

  describe('property equality', () => {
    it('matches string property', () => {
      const result = parser.evaluateFilterGroup(
        { and: ['type == "Book"'] },
        baseContext
      );
      expect(result.matches).toBe(true);
    });

    it('handles inequality', () => {
      const result = parser.evaluateFilterGroup(
        { and: ['status != "archived"'] },
        baseContext
      );
      expect(result.matches).toBe(true);
    });

    it('returns false for non-matching value', () => {
      const result = parser.evaluateFilterGroup(
        { and: ['type == "Movie"'] },
        baseContext
      );
      expect(result.matches).toBe(false);
    });
  });

  describe('property.contains', () => {
    it('matches string property containing substring', () => {
      const result = parser.evaluateFilterGroup(
        { and: ['source.contains("github")'] },
        baseContext
      );
      expect(result.matches).toBe(true);
    });

    it('returns false for non-matching substring', () => {
      const result = parser.evaluateFilterGroup(
        { and: ['source.contains("gitlab")'] },
        baseContext
      );
      expect(result.matches).toBe(false);
    });
  });

  describe('property.containsAny', () => {
    it('matches any of multiple substrings', () => {
      const result = parser.evaluateFilterGroup(
        { and: ['source.containsAny("gitlab", "github")'] },
        baseContext
      );
      expect(result.matches).toBe(true);
    });

    it('returns false when none match', () => {
      const result = parser.evaluateFilterGroup(
        { and: ['source.containsAny("gitlab", "bitbucket")'] },
        baseContext
      );
      expect(result.matches).toBe(false);
    });
  });

  describe('property.isEmpty', () => {
    it('returns true for undefined property', () => {
      const result = parser.evaluateFilterGroup(
        { and: ['updated.isEmpty()'] },
        baseContext
      );
      expect(result.matches).toBe(true);
    });

    it('returns false for existing property', () => {
      const result = parser.evaluateFilterGroup(
        { and: ['type.isEmpty()'] },
        baseContext
      );
      expect(result.matches).toBe(false);
    });
  });

  describe('date comparisons', () => {
    it('handles file.ctime comparison with today()', () => {
      const recentContext = {
        ...baseContext,
        ctime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      };
      const result = parser.evaluateFilterGroup(
        { and: ['file.ctime > today() - "7d"'] },
        recentContext
      );
      expect(result.matches).toBe(true);
    });

    it('handles file.mtime comparison', () => {
      const recentContext = {
        ...baseContext,
        mtime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      };
      const result = parser.evaluateFilterGroup(
        { and: ['file.mtime > today() - "7d"'] },
        recentContext
      );
      expect(result.matches).toBe(true);
    });

    it('handles frontmatter date property comparison', () => {
      const recentContext = {
        ...baseContext,
        frontmatter: {
          ...baseContext.frontmatter,
          date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        }
      };
      const result = parser.evaluateFilterGroup(
        { and: ['date > today() - "7d"'] },
        recentContext
      );
      expect(result.matches).toBe(true);
    });
  });

  describe('logical operators', () => {
    it('handles AND with all matching', () => {
      const result = parser.evaluateFilterGroup(
        { and: ['type == "Book"', 'file.hasTag("llms")'] },
        baseContext
      );
      expect(result.matches).toBe(true);
    });

    it('handles AND with one not matching', () => {
      const result = parser.evaluateFilterGroup(
        { and: ['type == "Book"', 'type == "Movie"'] },
        baseContext
      );
      expect(result.matches).toBe(false);
    });

    it('handles OR with one matching', () => {
      const result = parser.evaluateFilterGroup(
        { or: ['type == "Book"', 'type == "Movie"'] },
        baseContext
      );
      expect(result.matches).toBe(true);
    });

    it('handles OR with none matching', () => {
      const result = parser.evaluateFilterGroup(
        { or: ['type == "Movie"', 'type == "Show"'] },
        baseContext
      );
      expect(result.matches).toBe(false);
    });

    it('handles nested groups', () => {
      const group: FilterGroup = {
        and: [
          'type == "Book"',
          { or: ['status == "active"', 'status == "pending"'] }
        ]
      };
      const result = parser.evaluateFilterGroup(group, baseContext);
      expect(result.matches).toBe(true);
    });
  });

  describe('unsupported expressions', () => {
    it('returns warning and matches for unsupported syntax', () => {
      const result = parser.evaluateFilterGroup(
        { and: ['author.contains(link("Dylan Shade", "dpshade"))'] },
        baseContext
      );
      expect(result.matches).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain('Unsupported filter');
    });
  });

  describe('empty/undefined filters', () => {
    it('returns true for undefined filter group', () => {
      const result = parser.evaluateFilterGroup(undefined, baseContext);
      expect(result.matches).toBe(true);
    });

    it('returns true for empty filter group', () => {
      const result = parser.evaluateFilterGroup({}, baseContext);
      expect(result.matches).toBe(true);
    });
  });
});
