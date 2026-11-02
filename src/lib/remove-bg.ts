/**
 * Browser-side background removal (real model, not a fake overlay).
 * Later the same BackgroundRemovalProvider interface lives on the Worker
 * and talks to Cloudflare Workers AI / remove.bg.
 */

export type ProgressFn = (message: string, ratio: number) => void;

export async function removeBackground(image: Blob, onProgress?: ProgressFn): Promise<Blob> {
  let shown = 0;
  let creep: ReturnType<typeof setInterval> | null = null;

  const report = (message: string, ratio: number) => {
    shown = Math.max(shown, Math.min(1, ratio));
    onProgress?.(`${message} ${Math.round(shown * 100)}%`, shown);
  };

  const stopCreep = () => {
    if (creep) {
      clearInterval(creep);
      creep = null;
    }
  };

  const startCreep = (from: number, to: number, message: string) => {
    stopCreep();
    report(message, from);
    const t0 = Date.now();
    const span = 14000;
    creep = setInterval(() => {
      const t = Math.min(1, (Date.now() - t0) / span);
      const eased = 1 - (1 - t) * (1 - t);
      report(message, from + (to - from) * eased);
    }, 100);
  };

  onProgress?.("正在加载抠图模型…", 0.02);
  try {
    const { removeBackground: run } = await import("@imgly/background-removal");
    const result = await run(image, {
      model: "isnet_fp16",
      output: { format: "image/png", quality: 1 },
      progress: (key, current, total) => {
        const raw = total > 0 ? current / total : 0;
        if (key.startsWith("fetch:")) {
          stopCreep();
          report("下载模型", 0.04 + raw * 0.5);
        } else if (key === "compute:decode") {
          stopCreep();
          report("读取照片", Math.max(shown, 0.55));
        } else if (key === "compute:inference") {
          startCreep(Math.max(shown, 0.58), 0.9, "正在抠图");
        } else if (key === "compute:mask") {
          stopCreep();
          report("整理边缘", 0.93);
        } else if (key.startsWith("compute:encode")) {
          stopCreep();
          report("生成透明图", current >= total ? 0.98 : 0.96);
        }
      },
    });
    stopCreep();
    report("抠图完成", 1);
    if (!(result instanceof Blob)) {
      throw new Error("AI_PROVIDER_ERROR");
    }
    return result;
  } finally {
    stopCreep();
  }
}
