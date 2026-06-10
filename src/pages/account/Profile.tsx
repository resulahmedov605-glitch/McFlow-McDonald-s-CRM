import { useState } from "react";
import {
  CalendarDays,
  Clock3,
  HardHat,
  LogOut,
  Mail,
  RefreshCcw,
  ShieldAlert,
  ShieldCheck,
  ShoppingCart,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import useAuthStore from "../store/authStore";
import { useThemeStore } from "../store/useThemeStore";

type RoleProfile = {
  labelKey: string;
  descriptionKey: string;
  icon: LucideIcon;
  accentText: string;
  accentBg: string;
  accentBorder: string;
  softBg: string;
};

const roleProfiles: Record<string, RoleProfile> = {
  admin: {
    labelKey: "profile.roles.admin.label",
    descriptionKey: "profile.roles.admin.description",
    icon: ShieldCheck,
    accentText: "text-red-600",
    accentBg: "bg-red-500",
    accentBorder: "border-red-300",
    softBg: "bg-red-50",
  },
  administrator: {
    labelKey: "profile.roles.administrator.label",
    descriptionKey: "profile.roles.administrator.description",
    icon: ShieldCheck,
    accentText: "text-red-600",
    accentBg: "bg-red-500",
    accentBorder: "border-red-300",
    softBg: "bg-red-50",
  },
  cashier: {
    labelKey: "profile.roles.cashier.label",
    descriptionKey: "profile.roles.cashier.description",
    icon: ShoppingCart,
    accentText: "text-emerald-700",
    accentBg: "bg-emerald-500",
    accentBorder: "border-emerald-300",
    softBg: "bg-emerald-50",
  },
  warehousestaff: {
    labelKey: "profile.roles.warehousestaff.label",
    descriptionKey: "profile.roles.warehousestaff.description",
    icon: HardHat,
    accentText: "text-blue-700",
    accentBg: "bg-blue-500",
    accentBorder: "border-blue-300",
    softBg: "bg-blue-50",
  },
  untrusted: {
    labelKey: "profile.roles.untrusted.label",
    descriptionKey: "profile.roles.untrusted.description",
    icon: ShieldAlert,
    accentText: "text-amber-700",
    accentBg: "bg-amber-500",
    accentBorder: "border-amber-300",
    softBg: "bg-amber-50",
  },
};

const normalizeRole = (role?: string) =>
  role?.replace(/[\s_-]/g, "").toLowerCase() ?? "";

const formatDate = (
  value: string | undefined,
  locale: string,
  fallback: string
) => {
  if (!value) return fallback;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return fallback;

  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const getInitials = (fullName?: string, username?: string) => {
  const source = fullName?.trim() || username?.trim() || "U";

  return source
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
};

const Profile = () => {
  const { user, setUser } = useAuthStore();
  const theme = useThemeStore((state) => state.theme);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const isLight = theme === "light";
  const roleProfile =
    roleProfiles[normalizeRole(user?.role)] ?? roleProfiles.untrusted;
  const RoleIcon = roleProfile.icon;
  const locale = i18n.resolvedLanguage ?? i18n.language;
  const roleLabel = t(roleProfile.labelKey);
  const roleDescription = t(roleProfile.descriptionKey);
  const roleTooltipId = "profile-role-tooltip";

  const handleLogout = () => {
    localStorage.removeItem("mcflow_access_token");
    localStorage.removeItem("mcflow_refresh_token");
    setUser(null);
    navigate("/login", { replace: true });
  };

  const openLogoutDialog = () => {
    setIsLogoutDialogOpen(true);
  };

  const closeLogoutDialog = () => {
    setIsLogoutDialogOpen(false);
  };

  const identityDetails = [
    {
      label: t("profile.username"),
      value: user?.username ?? "-",
      icon: UserRound,
    },
    {
      label: t("profile.emailAddress"),
      value: user?.email ?? "-",
      icon: Mail,
    },
    {
      label: t("profile.role"),
      value: roleLabel,
      icon: RoleIcon,
    },
  ];

  const activityDetails = [
    {
      label: t("profile.accountCreated"),
      value: formatDate(user?.createdAt, locale, t("common.notAvailable")),
      icon: CalendarDays,
    },
    {
      label: t("profile.lastUpdated"),
      value: formatDate(user?.updatedAt, locale, t("common.notAvailable")),
      icon: RefreshCcw,
    },
    {
      label: t("profile.lastLogin"),
      value: formatDate(user?.loginedAt, locale, t("common.notAvailable")),
      icon: Clock3,
    },
  ];

  const detailSection = (
    title: string,
    subtitle: string,
    details: typeof identityDetails
  ) => (
    <section>
      <div>
        <p
          className={`text-xs font-black uppercase tracking-[0.18em] ${roleProfile.accentText}`}
        >
          {subtitle}
        </p>
        <h2 className="mt-1 text-xl font-black">{title}</h2>
      </div>

      <div
        className={`mt-4 border-y ${
          isLight ? "border-gray-200" : "border-gray-700"
        }`}
      >
        {details.map(({ label, value, icon: Icon }, index) => (
          <div
            key={label}
            className={`flex min-w-0 items-start gap-3 py-4 ${
              index < details.length - 1
                ? isLight
                  ? "border-b border-gray-200"
                  : "border-b border-gray-700"
                : ""
            }`}
          >
            <span
              className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg ${
                isLight ? "bg-gray-100" : "bg-gray-800"
              } ${roleProfile.accentText}`}
            >
              <Icon size={17} />
            </span>
            <div className="min-w-0">
              <p
                className={`text-xs font-black uppercase tracking-wide ${
                  isLight ? "text-gray-500" : "text-gray-400"
                }`}
              >
                {label}
              </p>
              <p className="mt-1 break-words font-bold">{value}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );

  return (
    <main
      className={`flex flex-1 flex-col px-4 py-8 transition-colors duration-300 sm:px-6 lg:px-8 ${
        isLight ? "bg-gray-50 text-gray-900" : "bg-gray-900 text-white"
      }`}
    >
      <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col">
        <header
          className={`border-b pb-7 ${
            isLight ? "border-gray-200" : "border-gray-700"
          }`}
        >
          <p
            className={`text-xs font-black uppercase tracking-[0.2em] ${roleProfile.accentText}`}
          >
            {t("profile.eyebrow")}
          </p>

          <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-center">
              <div
                className={`flex size-24 shrink-0 items-center justify-center rounded-2xl text-3xl font-black text-white shadow-lg shadow-gray-950/15 ${roleProfile.accentBg}`}
              >
                {getInitials(user?.fullName, user?.username)}
              </div>

              <div className="min-w-0">
                <h1 className="break-words text-3xl font-black sm:text-4xl">
                  {user?.fullName ?? t("profile.fallbackTitle")}
                </h1>
                <p
                  className={`mt-1 break-words text-sm font-semibold sm:text-base ${
                    isLight ? "text-gray-500" : "text-gray-400"
                  }`}
                >
                  {user?.email ?? t("profile.fallbackSubtitle")}
                </p>
              </div>
            </div>

            <div
              tabIndex={0}
              aria-describedby={roleTooltipId}
              aria-label={t("profile.roleAria", {
                role: roleLabel,
                description: roleDescription,
              })}
              className={`group relative inline-flex self-start overflow-visible select-none rounded-xl border shadow-sm shadow-gray-950/5 outline-none transition-transform duration-200 focus-visible:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-offset-2 lg:self-center ${
                isLight
                  ? "focus-visible:ring-red-300 focus-visible:ring-offset-gray-50"
                  : "focus-visible:ring-amber-300 focus-visible:ring-offset-gray-900"
              } ${roleProfile.accentBorder}`}
            >
              <span
                className={`flex size-12 items-center justify-center rounded-l-[11px] text-white ${roleProfile.accentBg}`}
              >
                <RoleIcon size={22} />
              </span>
              <span
                className={`flex flex-col justify-center rounded-r-[11px] px-3 py-1.5 ${roleProfile.softBg}`}
              >
                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">
                  {t("profile.accessRole")}
                </span>
                <span
                  className={`text-sm font-black leading-tight ${roleProfile.accentText}`}
                >
                  {roleLabel}
                </span>
              </span>

              <span
                id={roleTooltipId}
                role="tooltip"
                className={`pointer-events-none absolute right-0 top-full z-20 mt-3 w-64 max-w-[calc(100vw-2rem)] rounded-lg border px-3 py-2 text-left text-xs font-semibold leading-relaxed opacity-0 shadow-xl delay-0 transition-all duration-200 ease-out group-hover:translate-y-0 group-hover:opacity-100 group-hover:delay-400 group-focus-visible:translate-y-0 group-focus-visible:opacity-100 group-focus-visible:delay-400 ${
                  isLight
                    ? "translate-y-1 border-gray-200 bg-white text-gray-700 shadow-gray-950/15"
                    : "translate-y-1 border-gray-700 bg-gray-800 text-gray-100 shadow-black/35"
                }`}
              >
                <span
                  className={`absolute -top-1.5 right-6 size-3 rotate-45 border-l border-t ${
                    isLight
                      ? "border-gray-200 bg-white"
                      : "border-gray-700 bg-gray-800"
                  }`}
                />
                <span className="relative block">{roleDescription}</span>
              </span>
            </div>
            
          </div>
        </header>

        <div className="mt-8 grid gap-9 lg:grid-cols-2 lg:gap-16">
          {detailSection(
            t("profile.identity"),
            t("profile.identitySubtitle"),
            identityDetails
          )}
          {detailSection(
            t("profile.activity"),
            t("profile.activitySubtitle"),
            activityDetails
          )}
        </div>

        <div
          className={`mt-auto flex flex-col gap-4 border-t pt-6 sm:flex-row sm:items-center sm:justify-between ${
            isLight ? "border-gray-200" : "border-gray-700"
          }`}
        >
          <div>
            <p className="text-sm font-black">{t("profile.session")}</p>
            <p
              className={`mt-1 text-sm font-semibold ${
                isLight ? "text-gray-500" : "text-gray-400"
              }`}
            >
              {t("profile.sessionHelp")}
            </p>
          </div>


          <button
            type="button"
            onClick={openLogoutDialog}
            className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-red-300 bg-transparent px-5 font-bold text-red-500 transition-all duration-200 hover:cursor-pointer hover:bg-red-500 hover:text-white hover:shadow-md hover:shadow-red-950/20 active:scale-99 sm:w-auto"
          >
            <span className="flex size-7 items-center justify-center rounded-lg bg-red-500 text-white transition-all duration-200 group-hover:bg-white group-hover:text-red-500">
              <LogOut size={16} />
            </span>
            {t("profile.logout")}
          </button>
        </div>
      </section>

      <div
        role="presentation"
        aria-hidden={!isLogoutDialogOpen}
        onClick={closeLogoutDialog}
        className={`fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 backdrop-blur-[2px] transition-all duration-300 ease-out ${
          isLogoutDialogOpen
            ? "pointer-events-auto opacity-100 backdrop-blur-[2px]"
            : "pointer-events-none opacity-0 backdrop-blur-0"
        }`}
      >
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="logout-dialog-title"
          onClick={(event) => event.stopPropagation()}
          className={`w-full max-w-md rounded-2xl border p-5 shadow-2xl transition-all duration-300 ease-out ${
            isLogoutDialogOpen
              ? "translate-y-0 scale-100 opacity-100"
              : "translate-y-3 scale-95 opacity-0"
          } ${
            isLight
              ? "border-gray-200 bg-white text-gray-900 shadow-gray-950/20"
              : "border-gray-700 bg-gray-800 text-white shadow-black/40"
          }`}
        >
          <div className="flex items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-red-500 text-white shadow-md shadow-red-950/20">
              <LogOut size={20} />
            </span>

            <div className="min-w-0">
              <h2 id="logout-dialog-title" className="text-xl font-black">
                {t("profile.signOutTitle")}
              </h2>
              <p
                className={`mt-1 text-sm font-semibold ${
                  isLight ? "text-gray-500" : "text-gray-400"
                }`}
              >
                {t("profile.signOutMessage")}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={closeLogoutDialog}
              className={`h-11 rounded-xl border px-4 font-bold transition-all duration-200 hover:cursor-pointer active:scale-98 ${
                isLight
                  ? "border-gray-200 bg-white hover:bg-gray-100"
                  : "border-gray-700 bg-gray-900 hover:bg-gray-700"
              }`}
            >
              {t("common.cancel")}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="h-11 rounded-xl bg-red-500 px-4 font-bold text-white shadow-md shadow-red-950/20 transition-all duration-200 hover:cursor-pointer hover:bg-red-600 active:scale-98"
            >
              {t("profile.confirmLogout")}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
};

export default Profile;
