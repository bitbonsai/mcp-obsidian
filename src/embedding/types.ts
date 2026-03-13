export type EmbeddingInputKind = 'query' | 'document';

export interface EmbeddingRequest {
    kind: EmbeddingInputKind;
}

export interface EmbeddingPreprocessorInput {
    text: string;
    kind: EmbeddingInputKind;
    modelId: string;
}

export type EmbeddingPreprocessor = (input: EmbeddingPreprocessorInput) => string;

export interface EmbeddingAdapterOptions {
    preprocessor?: EmbeddingPreprocessor;
}

export interface EmbeddingAdapter {
    embed(text: string, request: EmbeddingRequest): Promise<Float32Array>;
    readonly dimensions: number;
    readonly modelId: string;
    readonly options: EmbeddingAdapterOptions;
}
