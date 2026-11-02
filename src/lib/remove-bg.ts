/**
 * Browser-side background removal (real model, not a fake overlay).
 * Later the same BackgroundRemovalProvider interface lives on the Worker
 * and talks to Cloudflare Workers AI / remove.bg.
 */

export type ProgressFn = (message: string) => void;

export async function removeBackground(image: Blob, onProgress?: ProgressFn): Promise<Blob> {
  onProgress?.("正在加载抠图模型…");
  const { removeBackground: run } = await import("@imgly/background-removal");
  const result = await run(image, {
    model: "isnet_quint8",
    output: { format: "image/png", quality: 1 },
    progress: (key, current, total) => {
      const pct = total > 0 ? Math.round((current / total) * 100) : 0;
      if (key.includes("fetch") || key.includes("download")) {
        onProgress?.(`下载模型 ${pct}%`);
      } else if (key.includes("compute") || key.includes("process")) {
        onProgress?.(`正在抠出猫咪 ${pct}%`);
      } else {
        onProgress?.(`处理中 ${pct}%`);
      }
    },
  });
  if (!(result instanceof Blob)) {
    throw new Error("AI_PROVIDER_ERROR");
  }
  return result;
}
