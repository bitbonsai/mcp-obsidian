import type { EmbeddingAdapter } from './types.js';

export class GgufAdapter implements EmbeddingAdapter {
    private context: any; // lazy-loaded
    private _dimensions = 0;
    readonly modelId: string;
    private readonly ggufFile: string;

    /**
     * @param modelId  HuggingFace repo, e.g. "jinaai/jina-embeddings-v5-text-nano-retrieval-GGUF"
     * @param ggufFile Quantization variant, e.g. "Q4_K_M"
     */
    constructor(modelId: string, ggufFile: string) {
        this.modelId = `${modelId}:${ggufFile}`;
        this.ggufFile = ggufFile;
    }

    get dimensions(): number {
        return this._dimensions;
    }

    async embed(text: string): Promise<Float32Array> {
        if (!this.context) {
            await this.init();
        }

        const embedding = await this.context.getEmbeddingFor(text);
        const vec = new Float32Array(embedding.vector);
        this._dimensions = vec.length;
        return vec;
    }

    private async init(): Promise<void> {
        // Dynamic import — optional dependency.
        const { getLlama, resolveModelFile } = await import('node-llama-cpp');
        const llama = await getLlama();

        const modelPath = await resolveModelFile(
            `hf:${this.modelId.split(':')[0]}:${this.ggufFile}`,
        );

        const model = await llama.loadModel({ modelPath });
        this.context = await model.createEmbeddingContext();
    }
}
