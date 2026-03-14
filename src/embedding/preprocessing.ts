import type {
    EmbeddingInputKind,
    EmbeddingPreprocessor,
} from './types.js';

const QWEN3_RETRIEVAL_INSTRUCTION =
    'Given a web search query, retrieve relevant passages that answer the query';

export function preprocessEmbeddingText(
    text: string,
    kind: EmbeddingInputKind,
    modelId: string,
    preprocessor?: EmbeddingPreprocessor,
): string {
    if (!preprocessor) {
        return text;
    }

    return preprocessor({ text, kind, modelId });
}

export function createRolePrefixedPreprocessor(prefixes: {
    queryPrefix: string;
    documentPrefix: string;
}): EmbeddingPreprocessor {
    return ({ text, kind }) =>
        `${kind === 'query' ? prefixes.queryPrefix : prefixes.documentPrefix}${text}`;
}

export const jinaRetrievalPreprocessor = createRolePrefixedPreprocessor({
    queryPrefix: 'Query: ',
    documentPrefix: 'Document: ',
});

export const qwen3RetrievalPreprocessor: EmbeddingPreprocessor = ({ text, kind }) =>
    kind === 'query'
        ? `Instruct: ${QWEN3_RETRIEVAL_INSTRUCTION}\nQuery:${text}`
        : text;
