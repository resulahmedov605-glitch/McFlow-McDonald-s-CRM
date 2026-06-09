import { AlertTriangle, ArrowLeft, Home, RefreshCcw } from "lucide-react";
import {
  isRouteErrorResponse,
  useNavigate,
  useRouteError,
} from "react-router";
import { useTranslation } from "react-i18next";
import { useThemeStore } from "../store/useThemeStore";

const ErrorPage = () => {
  const navigate = useNavigate();
  const error = useRouteError();
  const theme = useThemeStore((state) => state.theme);
  const { t } = useTranslation();
  const isLight = theme === "light";
  const status = isRouteErrorResponse(error) ? error.status : 404;
  const isNotFound = status === 404;
  const title = isNotFound
    ? t("errorPage.pageNotFound")
    : t("errorPage.somethingWentWrong");
  const message = isNotFound
    ? t("errorPage.notFoundMessage")
    : t("errorPage.genericMessage");

  return (
    <main
      className={`relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 transition-colors duration-300 ${
        isLight ? "bg-gray-50 text-gray-900" : "bg-gray-900 text-white"
      }`}
    >
      <div className="absolute inset-0 overflow-hidden">
        <span className="mcflow-error-float absolute left-[10%] top-[16%] size-16 rounded-lg border border-amber-300/40" />
        <span className="mcflow-error-float-reverse absolute right-[12%] top-[18%] size-12 rounded-lg border border-red-400/35" />
        <span className="mcflow-error-float-slow absolute bottom-[18%] left-[16%] size-10 rounded-lg border border-red-400/30" />
        <span className="mcflow-error-float-slow-reverse absolute bottom-[14%] right-[18%] size-20 rounded-lg border border-amber-300/30" />
      </div>

      <section
        className={`relative z-10 w-full max-w-2xl rounded-2xl border p-6 text-center shadow-2xl backdrop-blur sm:p-9 ${
          isLight
            ? "border-amber-200 bg-white/90 shadow-gray-900/10"
            : "border-amber-300/30 bg-gray-800/90 shadow-black/40"
        }`}
      >
        <div className="mcflow-error-icon relative mx-auto flex size-24 items-center justify-center rounded-3xl bg-red-500 shadow-xl shadow-red-950/20">
          <div className="mcflow-error-ring absolute inset-0 rounded-3xl border-2 border-amber-300" />
          <AlertTriangle size={38} className="relative text-amber-100" />
        </div>

        <div className="relative mx-auto mt-7 h-24 max-w-sm overflow-hidden rounded-xl border border-dashed border-current/20">
          <div className="absolute inset-0 grid grid-cols-6 gap-2 p-3 opacity-40">
            {Array.from({ length: 18 }).map((_, index) => (
              <span
                key={index}
                className={`rounded ${
                  index % 3 === 0 ? "bg-red-500" : "bg-amber-300"
                }`}
              />
            ))}
          </div>
          <div className="mcflow-error-scan absolute inset-y-0 w-16 bg-linear-to-r from-transparent via-white/40 to-transparent" />
          <p className="relative flex h-full items-center justify-center bg-linear-to-r from-red-500 to-amber-400 bg-clip-text text-6xl font-black text-transparent">
            {status}
          </p>
        </div>

        <h1 className="mt-7 text-3xl font-black">{title}</h1>
        <p
          className={`mx-auto mt-2 max-w-md text-sm font-semibold ${
            isLight ? "text-gray-500" : "text-gray-300"
          }`}
        >
          {message}
        </p>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex h-12 items-center justify-center gap-2 rounded-lg border border-amber-300 bg-red-500 px-5 font-bold text-white shadow-md shadow-red-950/20 transition-all duration-200 hover:cursor-pointer hover:bg-red-600 active:scale-98"
          >
            <Home size={18} />
            {t("errorPage.dashboard")}
          </button>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className={`flex h-12 items-center justify-center gap-2 rounded-lg border px-5 font-bold transition-all duration-200 hover:cursor-pointer active:scale-98 ${
              isLight
                ? "border-gray-200 bg-white hover:bg-gray-100"
                : "border-gray-700 bg-gray-900 hover:bg-gray-700"
            }`}
          >
            <ArrowLeft size={18} />
            {t("errorPage.goBack")}
          </button>

          {!isNotFound && (
            <button
              type="button"
              onClick={() => window.location.reload()}
              className={`flex h-12 items-center justify-center gap-2 rounded-lg border px-5 font-bold transition-all duration-200 hover:cursor-pointer active:scale-98 ${
                isLight
                  ? "border-gray-200 bg-white hover:bg-gray-100"
                  : "border-gray-700 bg-gray-900 hover:bg-gray-700"
              }`}
            >
              <RefreshCcw size={18} />
              {t("errorPage.retry")}
            </button>
          )}
        </div>
      </section>
    </main>
  );
};

export default ErrorPage;
