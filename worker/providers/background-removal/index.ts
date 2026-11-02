export interface BackgroundRemovalProvider {
  removeBackground(image: ArrayBuffer): Promise<ArrayBuffer>;
}

export { CloudflareAiProvider } from "./cloudflare-ai";
export { RemoveBgProvider } from "./remove-bg";
