import { useEffect, useState } from "react";
import { useForm } from "@tanstack/react-form";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import toast, { Toaster } from "react-hot-toast";
import { useThemeStore } from "../store/useThemeStore";
import { login } from "../lib/services/authService";
import { useNavigate } from "react-router";

const Login = () => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isIntroLoaded, setIsIntroLoaded] = useState(false);
  const theme = useThemeStore((state) => state.theme);
  const isLight = theme === "light";
  const { t } = useTranslation();

  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => setIsIntroLoaded(true), 120);

    return () => clearTimeout(timer);
  }, []);

  const validateUsername = (value: string) => {
    if (!value.trim()) return t("login.validation.usernameRequired");
    if (value.trim().length < 3) return t("login.validation.usernameMin");
    return undefined;
  };

  const validatePassword = (value: string) => {
    if (!value.trim()) return t("login.validation.passwordRequired");
    if (value.trim().length < 6) return t("login.validation.passwordMin");
    return undefined;
  };

  const form = useForm({
    defaultValues: {
      username: "",
      password: "",
    },
    onSubmitInvalid: () => {
      toast.error(t("login.toast.invalid"));
    },
    onSubmit: async ({ value }) => {
      const usernameOrEmail = value.username.trim();
      const loginPromise = login({
        usernameOrEmail,
        password: value.password,
      }).then((url) => {
        const user = {
          usernameOrEmail,
          url,
        };
        const verifyPath = `/verify?usernameOrEmail=${encodeURIComponent(usernameOrEmail)}`;

        navigate(verifyPath, {
          state: user,
        });
      });

      await toast.promise(loginPromise, {
        loading: t("login.toast.loading"),
        success: t("login.toast.success"),
        error: t("login.toast.error"),
      });
    },
  });

  const inputClassName = `w-full rounded-lg border px-4 py-3 text-lg font-medium outline-none transition-colors duration-200 ${
    isLight
      ? "border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-amber-400"
      : "border-gray-600 bg-gray-700 text-white placeholder:text-gray-400 focus:border-amber-400"
  }`;

  const errorClassName = "mt-1 text-sm font-medium text-red-400";

  return (
    <div
      className={`flex flex-1 w-full items-center justify-center px-4 py-8 transition-colors duration-300 ${
        isLight ? "bg-white" : "bg-gray-700"
      }`}
    >
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

      <div
        className={`w-full max-w-xl rounded-2xl border p-7 shadow-xl transition-colors duration-300 sm:p-10 ${
          isLight
            ? "border-gray-200 bg-gray-50 text-gray-900 shadow-gray-200"
            : "border-gray-600 bg-gray-800 text-white shadow-gray-900/40"
        }`}
      >
        <div className="mb-8 flex items-center gap-3">
          <img
            src="McFlow.svg"
            alt="McFlow Logo"
            className="size-14 rounded-2xl"
          />

          <div>
            <p className="bg-linear-to-r from-red-500 to-amber-400 bg-clip-text text-4xl font-bold text-transparent">
              McFlow
            </p>
            <p
              className={`text-sm font-medium ${
                isLight ? "text-gray-500" : "text-gray-400"
              }`}
            >
              {t("login.eyebrow")}
            </p>
          </div>
        </div>
        <div className="mb-8 overflow-hidden">
          <h1
            className={`text-2xl font-bold transition-all duration-700 ease-out ${
              isIntroLoaded
                ? "translate-y-0 opacity-100"
                : "translate-y-4 opacity-0"
            }`}
          >
            {t("login.title")}
          </h1>
          <p
            className={`mt-1 font-medium transition-all delay-100 duration-700 ease-out ${
              isLight ? "text-gray-500" : "text-gray-400"
            } ${
              isIntroLoaded
                ? "translate-y-0 opacity-100"
                : "translate-y-4 opacity-0"
            }`}
          >
            {t("login.subtitle")}
          </p>
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            void form.handleSubmit();
          }}
          className="space-y-4"
        >
          <form.Field
            name="username"
            validators={{
              onChange: ({ value }) => validateUsername(value),
              onSubmit: ({ value }) => validateUsername(value),
            }}
          >
            {(field) => (
              <div>
                <input
                  type="text"
                  name={field.name}
                  value={field.state.value}
                  placeholder={t("login.username")}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  className={inputClassName}
                />

                {field.state.meta.errors[0] && (
                  <p className={errorClassName}>
                    {String(field.state.meta.errors[0])}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          <form.Field
            name="password"
            validators={{
              onChange: ({ value }) => validatePassword(value),
              onSubmit: ({ value }) => validatePassword(value),
            }}
          >
            {(field) => (
              <div>
                <div className="relative">
                  <input
                    type={isPasswordVisible ? "text" : "password"}
                    name={field.name}
                    value={field.state.value}
                    placeholder={t("login.password")}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    className={`${inputClassName} pr-12`}
                  />

                  <button
                    type="button"
                    onClick={() => setIsPasswordVisible((visible) => !visible)}
                    aria-label={
                      isPasswordVisible
                        ? t("login.hidePassword")
                        : t("login.showPassword")
                    }
                    className={`absolute right-3 top-1/2 -translate-y-1/2 transition-all duration-200 hover:cursor-pointer hover:scale-110 ${
                      isLight
                        ? "text-gray-500 hover:text-gray-800"
                        : "text-gray-300 hover:text-white"
                    }`}
                  >
                    {isPasswordVisible ? (
                      <EyeOff size={21} />
                    ) : (
                      <Eye size={21} />
                    )}
                  </button>
                </div>

                {field.state.meta.errors[0] && (
                  <p className={errorClassName}>
                    {String(field.state.meta.errors[0])}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
          >
            {([canSubmit, isSubmitting]) => (
              <button
                type="submit"
                disabled={!canSubmit || isSubmitting}
                className="group flex w-full items-center justify-center rounded-lg border border-amber-300 bg-red-500 px-4 py-3 text-lg font-bold text-white shadow-md transition-all duration-200 ease-in-out hover:cursor-pointer hover:scale-101 hover:bg-red-600 hover:shadow-amber-500/20 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100"
              >
                <span>
                  {isSubmitting ? t("login.checking") : t("login.submit")}
                </span>
                <span className="flex w-0 translate-x-0 overflow-hidden opacity-0 transition-all duration-300 ease-in-out group-hover:w-6 group-hover:translate-x-2 group-hover:opacity-100">
                  <ArrowRight size={22} />
                </span>
              </button>
            )}
          </form.Subscribe>
        </form>

      </div>
    </div>
  );
};

export default Login;
