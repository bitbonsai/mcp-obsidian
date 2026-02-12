import type { ParsedNote, FrontmatterValidationResult } from './types.js';
export declare class FrontmatterHandler {
    parse(content: string): ParsedNote;
    stringify(frontmatterData: Record<string, any>, content: string): string;
    validate(frontmatterData: Record<string, any>): FrontmatterValidationResult;
    private checkForProblematicValues;
    extractFrontmatter(content: string): Record<string, any>;
    updateFrontmatter(content: string, updates: Record<string, any>): string;
}
