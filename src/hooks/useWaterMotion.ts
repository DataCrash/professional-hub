import {
  useCallback,
  useEffect,
  useRef,
  type PointerEvent as ReactPointerEvent,
} from "react";

export function useWaterMotion() {
  const rippleRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const rippleIndexRef = useRef(0);
  const rippleAnimationsRef = useRef(new Map<HTMLElement, Animation>());
  const lastRippleTriggerRef = useRef(0);
  const reducedMotionRef = useRef(false);

  useEffect(() => {
    const mediaQuery = globalThis.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    );

    if (!mediaQuery) {
      return () => undefined;
    }

    const syncPreference = () => {
      reducedMotionRef.current = mediaQuery.matches;
    };

    syncPreference();
    mediaQuery.addEventListener?.("change", syncPreference);
    const rippleAnimations = rippleAnimationsRef.current;

    return () => {
      mediaQuery.removeEventListener?.("change", syncPreference);
      rippleAnimations.forEach((animation) => animation.cancel());
    };
  }, []);

  const setRippleRef = useCallback(
    (index: number) => (node: HTMLSpanElement | null) => {
      rippleRefs.current[index] = node;
    },
    [],
  );

  const settleWater = useCallback(() => {
    lastRippleTriggerRef.current = 0;
  }, []);

  const triggerRipple = useCallback(
    (clientX: number, clientY: number, energy: number, strong: boolean) => {
      const ripple =
        rippleRefs.current[rippleIndexRef.current % rippleRefs.current.length];

      if (!ripple) {
        return;
      }

      rippleIndexRef.current += 1;

      const size = strong ? 980 + energy * 640 : 760 + energy * 420;
      ripple.style.left = `${clientX}px`;
      ripple.style.top = `${clientY}px`;
      ripple.style.setProperty("--ripple-size", `${size.toFixed(0)}px`);

      rippleAnimationsRef.current.get(ripple)?.cancel();

      const animation = ripple.animate(
        [
          {
            opacity: strong ? 0.52 : 0.36,
            transform: "translate(-50%, -50%) scale(0.12)",
          },
          {
            offset: 0.44,
            opacity: strong ? 0.34 : 0.22,
            transform: "translate(-50%, -50%) scale(0.9)",
          },
          {
            offset: 0.76,
            opacity: strong ? 0.16 : 0.1,
            transform: "translate(-50%, -50%) scale(1.34)",
          },
          {
            opacity: 0,
            transform: "translate(-50%, -50%) scale(1.84)",
          },
        ],
        {
          duration: strong ? 2900 : 2300,
          easing: "cubic-bezier(0.16, 1, 0.3, 1)",
          fill: "both",
        },
      );

      rippleAnimationsRef.current.set(ripple, animation);
    },
    [],
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.pointerType === "touch" || reducedMotionRef.current) {
        return;
      }

      const now = globalThis.performance.now();

      if (now - lastRippleTriggerRef.current >= 224) {
        lastRippleTriggerRef.current = now;
        const energy = Math.min(
          1,
          Math.hypot(event.movementX, event.movementY) / 22,
        );
        triggerRipple(event.clientX, event.clientY, energy, false);
      }
    },
    [triggerRipple],
  );

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.pointerType === "touch" || reducedMotionRef.current) {
        return;
      }

      const energy = Math.min(
        1,
        Math.hypot(event.movementX, event.movementY) / 18,
      );
      triggerRipple(event.clientX, event.clientY, Math.max(0.65, energy), true);
    },
    [triggerRipple],
  );

  const handlePointerLeave = useCallback(() => {
    settleWater();
  }, [settleWater]);

  return {
    handlePointerDown,
    handlePointerLeave,
    handlePointerMove,
    setRippleRef,
  };
}
