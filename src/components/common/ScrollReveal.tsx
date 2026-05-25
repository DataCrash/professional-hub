import { useEffect, type ReactNode } from "react";
import { useLocation } from "react-router-dom";

export function ScrollReveal({ children }: Readonly<{ children: ReactNode }>) {
  const location = useLocation();

  useEffect(() => {
    const els = document.querySelectorAll("[data-reveal]");
    const io = new IntersectionObserver(
      (entries, observer) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("revealed");
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -30px 0px" },
    );

    els.forEach((el) => io.observe(el));

    return () => io.disconnect();
  }, [location.pathname]);

  return <>{children}</>;
}
