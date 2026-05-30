import { useEffect, useState } from "react";
import { useLoadingStore } from "../store/useLoadingStore";
import { useThemeStore } from "../store/useThemeStore";

const PageLoader = () => {
  const isLoading = useLoadingStore((state) => state.isLoading);
  const theme = useThemeStore((state) => state.theme);
  const [shouldRender, setShouldRender] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const isLight = theme === "light";

  useEffect(() => {
    if (isLoading) {
      setShouldRender(true);

      const frame = window.requestAnimationFrame(() => {
        setIsVisible(true);
      });

      return () => window.cancelAnimationFrame(frame);
    }

    setIsVisible(false);

    const timer = window.setTimeout(() => {
      setShouldRender(false);
    }, 250);

    return () => window.clearTimeout(timer);
  }, [isLoading]);

  if (!shouldRender) {
    return null;
  }

  return (
    <div
      role="status"
      aria-label="Loading"
      className={`pointer-events-none fixed inset-x-0 top-23 z-50 transition-all duration-300 ease-out ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div
        className={`h-1 overflow-hidden ${
          isLight ? "bg-gray-100" : "bg-gray-900"
        }`}
      >
        <div className="mcflow-loader h-full w-1/3 rounded-full bg-linear-to-r from-red-500 via-amber-300 to-red-500" />
      </div>

      <div
        className={`fixed inset-x-0 bottom-0 top-24 flex items-center justify-center backdrop-blur-[2px] transition-colors duration-300 ${
          isLight ? "bg-white/45" : "bg-gray-950/30"
        }`}
      >
        <div
          className={`relative flex w-72 flex-col items-center rounded-2xl border px-6 py-7 shadow-2xl transition-all duration-300 ease-out ${
            isVisible ? "translate-y-0 scale-100" : "translate-y-3 scale-95"
          } ${
            isLight
              ? "border-amber-200 bg-white/95 text-gray-900 shadow-gray-900/15"
              : "border-amber-300/30 bg-gray-800/95 text-white shadow-black/40"
          }`}
        >
          <div className="mcflow-pulse absolute -top-5 flex size-10 items-center justify-center rounded-full border border-amber-300 bg-red-500 shadow-lg shadow-red-950/20">
            <div className="size-3 rounded-full bg-amber-200" />
          </div>

          <div className="relative mt-3 flex size-20 items-center justify-center rounded-2xl bg-red-500 shadow-lg shadow-red-950/20">
            <div className="mcflow-ring absolute inset-0 rounded-2xl border-2 border-amber-300" />
            <img
              src="McFlow.svg"
              alt=""
              className="relative size-12 rounded-xl"
            />
          </div>

          <p className="mt-5 bg-linear-to-r from-red-500 to-amber-400 bg-clip-text text-xl font-bold text-transparent">
            McFlow
          </p>
          <p
            className={`mt-1 text-sm font-semibold ${
              isLight ? "text-gray-500" : "text-gray-300"
            }`}
          >
            Preparing your workspace
          </p>

          <div
            className={`mt-5 h-2 w-full overflow-hidden rounded-full ${
              isLight ? "bg-gray-100" : "bg-gray-700"
            }`}
          >
            <div className="mcflow-loader h-full w-2/5 rounded-full bg-linear-to-r from-red-500 via-amber-300 to-red-500" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageLoader;
