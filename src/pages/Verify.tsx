import {
  type ChangeEvent,
  type ClipboardEvent,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import toast, { Toaster } from "react-hot-toast";
import { useThemeStore } from "../store/useThemeStore";
import { useLocation, useNavigate, useSearchParams } from "react-router";
import { verify } from "../lib/services/authService";

const OTP_LENGTH = 6;

const VerifyQR = () => {
  const [isIntroLoaded, setIsIntroLoaded] = useState(false);
  const [verificationCode, setVerificationCode] = useState<string[]>(
    Array(OTP_LENGTH).fill(""),
  );
  const [isVerifying, setIsVerifying] = useState(false);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const submittedCodeRef = useRef<string | null>(null);
  const theme = useThemeStore((state) => state.theme);
  const isLight = theme === "light";
  const { t } = useTranslation();

  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const userState = location.state as
    | { usernameOrEmail: string; url: string }
    | null;
  const qrCodeUrl = userState?.url ?? null;
  const usernameOrEmail =
    searchParams.get("usernameOrEmail") ?? userState?.usernameOrEmail ?? "";
  const codeValue = verificationCode.join("");
  const isCodeComplete = verificationCode.every(Boolean);

  useEffect(() => {
    const timer = setTimeout(() => setIsIntroLoaded(true), 120);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      inputRefs.current[0]?.focus({ preventScroll: true });
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const submitVerification = useCallback(
    (code: string) => {
      if (code.length !== OTP_LENGTH || isVerifying) return;
      if (submittedCodeRef.current === code) return;

      submittedCodeRef.current = code;
      setIsVerifying(true);

      const verifyPromise = verify({
        code,
        usernameOrEmail,
      })
        .finally(() => {
          setIsVerifying(false);
        });

      toast.promise(verifyPromise, {
        loading: t("verify.toast.loading"),
        success: (result) => {
          localStorage.setItem("mcflow_access_token", result.accessToken);
          localStorage.setItem("mcflow_refresh_token", result.refreshToken);

          setTimeout(() => {
            navigate("/");
          }, 1000);

          return t("verify.toast.success");
        },
        error: t("verify.toast.error"),
      });
    },
    [isVerifying, navigate, t, usernameOrEmail],
  );

  useEffect(() => {
    if (!isCodeComplete) {
      submittedCodeRef.current = null;
      return;
    }

    submitVerification(codeValue);
  }, [codeValue, isCodeComplete, submitVerification]);

  const focusInput = (index: number) => {
    inputRefs.current[index]?.focus();
  };

  const updateCode = (index: number, digits: string[]) => {
    const nextCode = [...verificationCode];

    digits.forEach((digit, digitIndex) => {
      const targetIndex = index + digitIndex;

      if (targetIndex < OTP_LENGTH) {
        nextCode[targetIndex] = digit;
      }
    });

    setVerificationCode(nextCode);
  };

  const handleCodeChange = (
    index: number,
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const digits = event.target.value.replace(/\D/g, "").split("");

    if (!digits.length) {
      const nextCode = [...verificationCode];
      nextCode[index] = "";
      setVerificationCode(nextCode);
      return;
    }

    updateCode(index, digits);

    const nextIndex = Math.min(index + digits.length, OTP_LENGTH - 1);

    if (index + digits.length < OTP_LENGTH) {
      focusInput(nextIndex);
    }
  };

  const handleCodeKeyDown = (
    index: number,
    event: KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key !== "Backspace" || verificationCode[index]) return;

    event.preventDefault();

    if (index > 0) {
      const nextCode = [...verificationCode];
      nextCode[index - 1] = "";
      setVerificationCode(nextCode);
      focusInput(index - 1);
    }
  };

  const handleCodePaste = (
    index: number,
    event: ClipboardEvent<HTMLInputElement>,
  ) => {
    event.preventDefault();

    const digits = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH - index)
      .split("");

    if (!digits.length) return;

    updateCode(index, digits);

    const nextIndex = Math.min(index + digits.length, OTP_LENGTH - 1);
    focusInput(nextIndex);
  };

  const inputClassName = `w-full rounded-lg border px-4 py-3 text-lg font-medium outline-none transition-colors duration-200 ${
    isLight
      ? "border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-amber-400"
      : "border-gray-600 bg-gray-700 text-white placeholder:text-gray-400 focus:border-amber-400"
  }`;
  const labelClassName = `mb-2 block text-sm font-semibold ${
    isLight ? "text-gray-600" : "text-gray-300"
  }`;

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
            alt={t("common.logoAlt")}
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
            {t("verify.title")}
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
            {t("verify.subtitle")}
          </p>
        </div>

        {qrCodeUrl && (
          <div className="mb-6 flex justify-center">
            <img
              src={qrCodeUrl}
              alt={t("verify.qrAlt")}
              className={`size-52 rounded-xl border p-3 ${
                isLight
                  ? "border-gray-200 bg-white"
                  : "border-gray-600 bg-white"
              }`}
            />
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="username-or-email" className={labelClassName}>
              {t("verify.usernameOrEmail")}
            </label>
            <input
              id="username-or-email"
              type="text"
              value={usernameOrEmail}
              placeholder={t("login.username")}
              disabled
              className={`${inputClassName} cursor-not-allowed opacity-80 disabled:cursor-not-allowed`}
            />
          </div>

          <div>
            <label id="verify-code-label" className={labelClassName}>
              {t("verify.code")}
            </label>
            <div
              className="grid grid-cols-6 gap-2 sm:gap-3"
              aria-labelledby="verify-code-label"
            >
              {verificationCode.map((digit, index) => (
                <input
                  key={index}
                  ref={(input) => {
                    inputRefs.current[index] = input;
                  }}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete={index === 0 ? "one-time-code" : "off"}
                  value={digit}
                  maxLength={1}
                  aria-label={t("verify.digitAria", { index: index + 1 })}
                  onChange={(event) => handleCodeChange(index, event)}
                  onKeyDown={(event) => handleCodeKeyDown(index, event)}
                  onPaste={(event) => handleCodePaste(index, event)}
                  className={`${inputClassName} px-0 text-center text-2xl`}
                  disabled={isVerifying}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyQR;
