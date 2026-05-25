import { useCallback, useEffect, useRef, type ReactNode } from "react";

export function GlowCard({
  children,
  className = "",
}: Readonly<{ children: ReactNode; className?: string }>) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    ref.current.style.setProperty("--gx", `${e.clientX - rect.left}px`);
    ref.current.style.setProperty("--gy", `${e.clientY - rect.top}px`);
  }, []);

  const handleMouseLeave = useCallback(() => {
    ref.current?.style.setProperty("--gx", "-9999px");
    ref.current?.style.setProperty("--gy", "-9999px");
  }, []);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    element.addEventListener("mousemove", handleMouseMove);
    element.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      element.removeEventListener("mousemove", handleMouseMove);
      element.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [handleMouseLeave, handleMouseMove]);

  return (
    <div ref={ref} className={`glow-card ${className}`}>
      {children}
    </div>
  );
}
