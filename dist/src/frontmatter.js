import matter from 'gray-matter';
export class FrontmatterHandler {
    parse(content) {
        try {
            const parsed = matter(content);
            return {
                frontmatter: parsed.data,
                content: parsed.content,
                originalContent: content
            };
        }
        catch (error) {
            // If parsing fails, treat as content without frontmatter
            return {
                frontmatter: {},
                content: content,
                originalContent: content
            };
        }
    }
    stringify(frontmatterData, content) {
        try {
            // If no frontmatter, return content as-is
            if (!frontmatterData || Object.keys(frontmatterData).length === 0) {
                return content;
            }
            return matter.stringify(content, frontmatterData);
        }
        catch (error) {
            throw new Error(`Failed to stringify frontmatter: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    validate(frontmatterData) {
        const result = {
            isValid: true,
            errors: [],
            warnings: []
        };
        try {
            // Test if the frontmatter can be serialized to valid YAML using gray-matter
            matter.stringify('', frontmatterData);
        }
        catch (error) {
            result.isValid = false;
            result.errors.push(`Invalid YAML structure: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        // Check for problematic values
        this.checkForProblematicValues(frontmatterData, result, '');
        return result;
    }
    checkForProblematicValues(obj, result, path) {
        if (obj === null || obj === undefined) {
            return;
        }
        if (typeof obj === 'function') {
            result.errors.push(`Functions are not allowed in frontmatter at path: ${path}`);
            result.isValid = false;
            return;
        }
        if (typeof obj === 'symbol') {
            result.errors.push(`Symbols are not allowed in frontmatter at path: ${path}`);
            result.isValid = false;
            return;
        }
        if (obj instanceof Date) {
            // Dates are fine, but warn if they're invalid
            if (isNaN(obj.getTime())) {
                result.warnings.push(`Invalid date at path: ${path}`);
            }
            return;
        }
        if (Array.isArray(obj)) {
            obj.forEach((item, index) => {
                this.checkForProblematicValues(item, result, `${path}[${index}]`);
            });
            return;
        }
        if (typeof obj === 'object' && obj !== null) {
            for (const [key, value] of Object.entries(obj)) {
                const currentPath = path ? `${path}.${key}` : key;
                // Check for problematic keys
                if (typeof key !== 'string') {
                    result.errors.push(`Non-string keys are not allowed: ${key}`);
                    result.isValid = false;
                }
                this.checkForProblematicValues(value, result, currentPath);
            }
        }
    }
    extractFrontmatter(content) {
        const parsed = this.parse(content);
        return parsed.frontmatter;
    }
    updateFrontmatter(content, updates) {
        const parsed = this.parse(content);
        const updatedFrontmatter = { ...parsed.frontmatter, ...updates };
        const validation = this.validate(updatedFrontmatter);
        if (!validation.isValid) {
            throw new Error(`Invalid frontmatter: ${validation.errors.join(', ')}`);
        }
        return this.stringify(updatedFrontmatter, parsed.content);
    }
}
