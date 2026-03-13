import { preprocessEmbeddingText } from './preprocessing.js';
import type {
    EmbeddingAdapter,
    EmbeddingAdapterOptions,
    EmbeddingRequest,
} from './types.js';

export class OnnxAdapter implements EmbeddingAdapter {
    private pipeline: any; // lazy-loaded
    private _dimensions = 0;
    readonly modelId: string;
    readonly options: EmbeddingAdapterOptions;

    constructor(modelId: string, options: EmbeddingAdapterOptions = {}) {
        this.modelId = modelId;
        this.options = options;
    }

    get dimensions(): number {
        return this._dimensions;
    }

    async embed(text: string, request: EmbeddingRequest): Promise<Float32Array> {
        if (!this.pipeline) {
            // Dynamic import — optional dependency.
            const { pipeline } = await import('@huggingface/transformers');
            this.pipeline = await pipeline('feature-extraction', this.modelId, {
                dtype: 'q4',
            });
        }

        const formattedText = preprocessEmbeddingText(
            text,
            request.kind,
            this.modelId,
            this.options.preprocessor,
        );
        const output = await this.pipeline(formattedText, { pooling: 'mean', normalize: true });
        const data = output.data as Float32Array;
        this._dimensions = data.length;
        return data;
    }
}
