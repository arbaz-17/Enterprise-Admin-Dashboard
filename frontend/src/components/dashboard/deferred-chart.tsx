
import {
  Suspense,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

interface DeferredChartProps {
  children: ReactNode;
  fallback: ReactNode;
}

export function DeferredChart({
  children,
  fallback,
}: DeferredChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // If IntersectionObserver isn't supported,
  // render the chart immediately.
  const [shouldRender, setShouldRender] = useState(
    () => typeof IntersectionObserver === "undefined",
  );

  useEffect(() => {
    if (shouldRender || typeof IntersectionObserver === "undefined") {
      return;
    }

    const element = containerRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          // Once visible, keep the chart mounted.
          setShouldRender(true);
          observer.disconnect();
        }
      },
      {
        // Start loading before the user reaches the chart.
        rootMargin: "300px 0px",
        threshold: 0,
      },
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [shouldRender]);

  return (
    <div ref={containerRef} className="min-w-0">
      {shouldRender ? (
        <Suspense fallback={fallback}>
          {children}
        </Suspense>
      ) : (
        fallback
      )}
    </div>
  );
}
