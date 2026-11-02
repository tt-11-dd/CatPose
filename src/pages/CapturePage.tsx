import { Image as ImageIcon, SwitchCamera, X, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { startFromFile } from "../lib/state";
import { Screen } from "../ui/AppShell";

export function CapturePage() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facing, setFacing] = useState<"environment" | "user">("environment");
  const [cameraOn, setCameraOn] = useState(false);
  const [hint, setHint] = useState("打开摄像头，或从相册选一张");
  const [torch, setTorch] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function start() {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: facing }, width: { ideal: 1280 } },
          audio: false,
        });
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
      } catch {
        setCameraOn(false);
        setHint("摄像头不可用，从相册选一张猫咪照片吧");
      }
    }
    void start();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
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
      inputRef.current?.click();
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

        <div className="relative z-10 mt-auto flex items-center justify-between px-8 pb-[max(28px,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
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
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
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
