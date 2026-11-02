import type { BackgroundRemovalProvider } from "./index";

type AiBinding = {
  run: (model: string, input: Record<string, unknown>) => Promise<unknown>;
};

export class CloudflareAiProvider implements BackgroundRemovalProvider {
  constructor(private ai: AiBinding) {}

  async removeBackground(image: ArrayBuffer): Promise<ArrayBuffer> {
    const result = await this.ai.run("bria/remove-background", { image });
    if (result instanceof ArrayBuffer) return result;
    if (result instanceof Uint8Array) {
      return result.buffer.slice(result.byteOffset, result.byteOffset + result.byteLength);
    }
    throw new Error("AI_PROVIDER_ERROR");
  }
}
