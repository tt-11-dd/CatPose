import { Image as ImageIcon, SwitchCamera, X, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CATS } from "../types";
import { setSelectedCat, startFromFile, useApp } from "../lib/state";
import { Screen } from "../ui/AppShell";

function explainCamera(err: unknown): string {
  if (!window.isSecureContext) {
    return "网页摄像头需要 HTTPS。电脑请用 localhost；手机请点快门，会打开系统相机。";
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    return "这个浏览器不支持网页摄像头，点快门会打开系统相机。";
  }
  const name = err instanceof DOMException ? err.name : "";
  if (name === "NotAllowedError" || name === "PermissionDeniedError") {
    return "摄像头权限被拒绝了。请在地址栏允许权限，或点快门用系统相机。";
  }
  if (name === "NotFoundError" || name === "OverconstrainedError") {
    return "没找到可用摄像头，点快门或从相册选一张。";
  }
  if (name === "NotReadableError" || name === "AbortError") {
    return "摄像头正被别的应用占用，关掉后再试，或从相册选一张。";
  }
  return "没法打开实时预览，点快门用系统相机，或从相册选。";
}

async function openStream(facing: "environment" | "user"): Promise<MediaStream> {
  const video = navigator.mediaDevices;
  if (!video?.getUserMedia) {
    throw new DOMException("unsupported", "NotSupportedError");
  }
  try {
    return await video.getUserMedia({
      video: { facingMode: { ideal: facing } },
      audio: false,
    });
  } catch (first) {
    await new Promise((r) => setTimeout(r, 250));
    try {
      return await video.getUserMedia({ video: true, audio: false });
    } catch {
      throw first;
    }
  }
}

export function CapturePage() {
  const { selectedCat } = useApp();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const albumRef = useRef<HTMLInputElement>(null);
  const shotRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facing, setFacing] = useState<"environment" | "user">("environment");
  const [cameraOn, setCameraOn] = useState(false);
  const [hint, setHint] = useState("");
  const [torch, setTorch] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function start() {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
        setCameraOn(false);
        setHint(explainCamera(new DOMException("insecure", "SecurityError")));
        return;
      }
      try {
        const stream = await openStream(facing);
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setCameraOn(true);
        setHint("");
      } catch (err) {
        if (cancelled) return;
        setCameraOn(false);
        setHint(explainCamera(err));
      }
    }
    void start();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [facing]);

  async function useFile(file: Blob) {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    await startFromFile(file);
    navigate("/editor", { replace: true });
  }

  async function snap() {
    const video = videoRef.current;
    if (!video || !cameraOn) {
      shotRef.current?.click();
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 720;
    canvas.height = video.videoHeight || 960;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.92),
    );
    if (blob) await useFile(blob);
  }

  async function toggleTorch() {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    const next = !torch;
    try {
      await track.applyConstraints({ advanced: [{ torch: next } as MediaTrackConstraintSet] });
      setTorch(next);
    } catch {
      setTorch(false);
    }
  }

  return (
    <Screen className="bg-black">
      <div className="relative flex min-h-svh flex-col bg-black">
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className="absolute inset-0 h-full w-full object-cover"
        />
        {!cameraOn && (
          <div className="absolute inset-0 bg-gradient-to-b from-[#d8b48a] to-[#c9a07a]" />
        )}

        <div className="relative z-10 flex items-center justify-between px-4 pt-[max(16px,env(safe-area-inset-top))]">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="grid size-10 place-items-center rounded-full bg-black/25 text-white"
            aria-label="关闭"
          >
            <X className="size-6" />
          </button>
          <button
            type="button"
            onClick={() => void toggleTorch()}
            className={`grid size-10 place-items-center rounded-full bg-black/25 ${torch ? "text-honey" : "text-white"}`}
            aria-label="闪光灯"
          >
            <Zap className="size-6" fill={torch ? "currentColor" : "none"} />
          </button>
        </div>

        <div className="relative z-10 mx-auto mt-6 h-[58svh] w-[78%] max-w-[320px]">
          <span className="absolute top-0 left-0 h-10 w-10 rounded-tl-sm border-t-[3px] border-l-[3px] border-white/90" />
          <span className="absolute top-0 right-0 h-10 w-10 rounded-tr-sm border-t-[3px] border-r-[3px] border-white/90" />
          <span className="absolute bottom-0 left-0 h-10 w-10 rounded-bl-sm border-b-[3px] border-l-[3px] border-white/90" />
          <span className="absolute right-0 bottom-0 h-10 w-10 rounded-br-sm border-r-[3px] border-b-[3px] border-white/90" />
        </div>

        {hint && (
          <p className="relative z-10 mt-4 px-8 text-center text-sm text-white/85">{hint}</p>
        )}

        <div className="relative z-10 mt-auto mb-3 flex justify-center gap-2">
          {CATS.map((c) => (
            <button
              key={c.slug}
              type="button"
              onClick={() => setSelectedCat(c.slug)}
              className={`rounded-full px-5 py-1.5 text-sm font-bold ${
                selectedCat === c.slug ? "bg-honey text-ink" : "bg-white/25 text-white"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        <div className="relative z-10 flex items-center justify-between px-8 pb-[max(28px,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={() => albumRef.current?.click()}
            className="grid size-12 place-items-center rounded-2xl bg-white/20 text-white"
            aria-label="相册"
          >
            <ImageIcon className="size-6" />
          </button>
          <button
            type="button"
            onClick={() => void snap()}
            className="grid size-[74px] place-items-center rounded-full bg-honey shadow-[0_8px_20px_rgba(0,0,0,0.25)]"
            aria-label="拍照"
          >
            <span className="size-16 rounded-full border-[5px] border-white/40 bg-honey" />
          </button>
          <button
            type="button"
            onClick={() => setFacing((f) => (f === "environment" ? "user" : "environment"))}
            className="grid size-12 place-items-center rounded-2xl bg-white/20 text-white"
            aria-label="切换摄像头"
          >
            <SwitchCamera className="size-6" />
          </button>
        </div>

        <input
          ref={albumRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void useFile(file);
          }}
        />
        <input
          ref={shotRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void useFile(file);
          }}
        />
      </div>
    </Screen>
  );
}
