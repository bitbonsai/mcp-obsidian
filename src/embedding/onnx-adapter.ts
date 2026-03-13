import type { EmbeddingAdapter } from './types.js';

export class OnnxAdapter implements EmbeddingAdapter {
    private pipeline: any; // lazy-loaded
    private _dimensions = 0;
    readonly modelId: string;

    constructor(modelId: string) {
        this.modelId = modelId;
    }

    get dimensions(): number {
        return this._dimensions;
    }

    async embed(text: string): Promise<Float32Array> {
        if (!this.pipeline) {
            // Dynamic import — optional dependency.
            const { pipeline } = await import('@huggingface/transformers');
            this.pipeline = await pipeline('feature-extraction', this.modelId, {
                dtype: 'q4',
            });
        }

        const output = await this.pipeline(text, { pooling: 'mean', normalize: true });
        const data = output.data as Float32Array;
        this._dimensions = data.length;
        return data;
    }
}
