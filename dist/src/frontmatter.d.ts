import type { ParsedNote, FrontmatterValidationResult } from './types.js';
/**
 * Parse a frontmatter value that may be a JSON string (LLM clients sometimes
 * pass frontmatter as a serialized JSON string instead of an object).
 * Returns undefined if the value is null/undefined, or throws if invalid.
 */
export declare function parseFrontmatter(value: any): Record<string, any> | undefined;
export declare class FrontmatterHandler {
    parse(content: string): ParsedNote;
    stringify(frontmatterData: Record<string, any>, content: string): string;
    validate(frontmatterData: Record<string, any>): FrontmatterValidationResult;
    private checkForProblematicValues;
    extractFrontmatter(content: string): Record<string, any>;
    updateFrontmatter(content: string, updates: Record<string, any>): string;
}
//# sourceMappingURL=frontmatter.d.ts.map