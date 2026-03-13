export interface EmbeddingAdapter {
    embed(text: string): Promise<Float32Array>;
    readonly dimensions: number;
    readonly modelId: string;
}
