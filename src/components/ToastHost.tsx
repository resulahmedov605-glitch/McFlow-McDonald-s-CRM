import { Toaster } from "react-hot-toast";
import { useThemeStore } from "../store/useThemeStore";

const ToastHost = () => {
  const theme = useThemeStore((state) => state.theme);
  const isLight = theme === "light";

  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 2600,
        style: {
          borderRadius: "25px",
          border: isLight ? "2px solid #e5e7eb" : "2px solid #4b5563",
          background: isLight ? "#ffffff" : "#1f2937",
          color: isLight ? "#111827" : "#f9fafb",
        },
        success: {
          iconTheme: {
            primary: "#22c55e",
            secondary: "#f0fdf4",
          },
        },
        error: {
          iconTheme: {
            primary: "#ef4444",
            secondary: "#fff7ed",
          },
        },
      }}
    />
  );
};

export default ToastHost;
