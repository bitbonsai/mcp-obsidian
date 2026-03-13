import { describe, expect, test } from 'vitest';
import {
    createRolePrefixedPreprocessor,
    jinaRetrievalPreprocessor,
    preprocessEmbeddingText,
    qwen3RetrievalPreprocessor,
} from './preprocessing.js';

describe('preprocessEmbeddingText', () => {
    test('returns the original text when no preprocessor is configured', () => {
        expect(preprocessEmbeddingText('plain text', 'query', 'model-id')).toBe('plain text');
    });

    test('passes query and document kinds through the configured preprocessor', () => {
        const preprocessor = createRolePrefixedPreprocessor({
            queryPrefix: 'Q: ',
            documentPrefix: 'D: ',
        });

        expect(preprocessEmbeddingText('search terms', 'query', 'model-id', preprocessor))
            .toBe('Q: search terms');
        expect(preprocessEmbeddingText('note body', 'document', 'model-id', preprocessor))
            .toBe('D: note body');
    });

    test('provides the built-in Jina retrieval prefixes', () => {
        expect(preprocessEmbeddingText('diabetes symptoms', 'query', 'jina-model', jinaRetrievalPreprocessor))
            .toBe('Query: diabetes symptoms');
        expect(preprocessEmbeddingText('clinical note', 'document', 'jina-model', jinaRetrievalPreprocessor))
            .toBe('Document: clinical note');
    });

    test('provides the built-in Qwen retrieval query prompt and leaves documents unchanged', () => {
        expect(preprocessEmbeddingText('diabetes symptoms', 'query', 'qwen-model', qwen3RetrievalPreprocessor))
            .toBe('Instruct: Given a web search query, retrieve relevant passages that answer the query\nQuery:diabetes symptoms');
        expect(preprocessEmbeddingText('clinical note', 'document', 'qwen-model', qwen3RetrievalPreprocessor))
            .toBe('clinical note');
    });
});
