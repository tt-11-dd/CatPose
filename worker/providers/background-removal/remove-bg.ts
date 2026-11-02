import type { BackgroundRemovalProvider } from "./index";

export class RemoveBgProvider implements BackgroundRemovalProvider {
  constructor(private apiKey: string) {}

  async removeBackground(image: ArrayBuffer): Promise<ArrayBuffer> {
    const form = new FormData();
    form.set("image_file", new Blob([image]), "cat.jpg");
    form.set("size", "auto");
    const res = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: { "X-Api-Key": this.apiKey },
      body: form,
    });
    if (!res.ok) throw new Error("AI_PROVIDER_ERROR");
    return res.arrayBuffer();
  }
}
