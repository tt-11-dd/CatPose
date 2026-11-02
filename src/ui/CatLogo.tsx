export function CatLogo({ size = 48, className = "" }: { size?: number; className?: string }) {
  return (
    <img
      src={`${import.meta.env.BASE_URL}logo.png`}
      width={size}
      height={size}
      alt="CatPose"
      className={`rounded-[22%] object-cover ${className}`}
      draggable={false}
    />
  );
}
