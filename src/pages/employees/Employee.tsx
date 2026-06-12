import { useEffect, useMemo, useRef, useState } from "react";

import {
  CalendarDays,
  ChevronDown,
  CircleHelp,
  Clock3,
  HardHat,
  ImagePlus,
  LockKeyhole,
  LoaderCircle,
  Mail,
  Plus,
  SlidersHorizontal,
  RefreshCcw,
  Search,
  ShieldAlert,
  ShieldCheck,
  ShoppingCart,
  Pencil,
  Trash2,
  UserPlus,
  UserRound,
  UsersRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";

import {
  changeUserProfilePic,
  createUser,
  getUsers,
  type AdminUser,
} from "../../lib/services/adminService";
import { getProfilePictureUrl } from "../../lib/profilePicture";
import useAuthStore from "../../store/authStore";
import { useThemeStore } from "../../store/useThemeStore";

const normalizeRole = (role?: string) =>
  role?.replace(/[\s_-]/g, "").toLowerCase() ?? "";

const formatRole = (
  role: string | null | undefined,
  t: (key: string, options?: Record<string, unknown>) => string
) => {
  if (!role) return t("common.unknown");

  const fallback = role
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

  return t(`profile.roles.${normalizeRole(role)}.label`, {
    defaultValue: fallback,
  });
};

type RoleStyle = {
  icon: LucideIcon;
  className: string;
};

const roleStyles: Record<string, RoleStyle> = {
  admin: {
    icon: ShieldCheck,
    className: "border-red-300 bg-red-50 text-red-600",
  },
  administrator: {
    icon: ShieldCheck,
    className: "border-red-300 bg-red-50 text-red-600",
  },
  cashier: {
    icon: ShoppingCart,
    className: "border-emerald-300 bg-emerald-50 text-emerald-700",
  },
  warehousestaff: {
    icon: HardHat,
    className: "border-blue-300 bg-blue-50 text-blue-700",
  },
  untrusted: {
    icon: ShieldAlert,
    className: "border-amber-300 bg-amber-50 text-amber-700",
  },
};

const getRoleStyle = (role?: string | null): RoleStyle =>
  roleStyles[normalizeRole(role ?? undefined)] ?? {
    icon: CircleHelp,
    className: "border-gray-300 bg-gray-50 text-gray-600",
  };

const formatDate = (
  value: string | null | undefined,
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
  }).format(date);
};

const getInitials = (fullName?: string | null, username?: string | null) => {
  const source = fullName?.trim() || username?.trim() || "U";

  return source
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
};

const defaultCreateUserForm = {
  fullName: "",
  username: "",
  email: "",
  password: "",
};

type CreateUserForm = typeof defaultCreateUserForm;
const DIALOG_ANIMATION_MS = 220;

const Employee = () => {
  const currentUser = useAuthStore((state) => state.user);
  const theme = useThemeStore((state) => state.theme);
  const { t, i18n } = useTranslation();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [photoDialogUser, setPhotoDialogUser] = useState<AdminUser | null>(
    null
  );
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState("");
  const [photoErrorMessage, setPhotoErrorMessage] = useState("");
  const [isPhotoSaving, setIsPhotoSaving] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreateDialogVisible, setIsCreateDialogVisible] = useState(false);
  const [isPhotoDialogVisible, setIsPhotoDialogVisible] = useState(false);
  const [createUserForm, setCreateUserForm] = useState(defaultCreateUserForm);
  const [createUserErrorMessage, setCreateUserErrorMessage] = useState("");
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const photoPreviewUrlRef = useRef("");
  const createDialogCloseTimerRef = useRef<number | null>(null);
  const photoDialogCloseTimerRef = useRef<number | null>(null);
  const isLight = theme === "light";
  const locale = i18n.resolvedLanguage ?? i18n.language;
  const isAdmin = ["admin", "administrator"].includes(
    normalizeRole(currentUser?.role)
  );
  const photoDialogProfilePictureUrl = getProfilePictureUrl(
    photoDialogUser,
    photoDialogUser?.updatedAt
  );

  const resetCreateUserForm = () => {
    setCreateUserForm(defaultCreateUserForm);
    setCreateUserErrorMessage("");
  };

  const loadUsers = async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await getUsers();
      setUsers(response);
    } catch {
      setErrorMessage("employee.loadError");
      toast.error(t("employee.loadError"), { id: "employee-load-error" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) return;

    let isActive = true;

    getUsers()
      .then((response) => {
        if (isActive) setUsers(response);
      })
      .catch(() => {
        if (isActive) {
          setErrorMessage("employee.loadError");
          toast.error(t("employee.loadError"), { id: "employee-load-error" });
        }
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [isAdmin, t]);

  useEffect(() => {
    const query = search.trim();

    if (query.length < 2) return;

    const timer = window.setTimeout(() => {
      setDebouncedSearch(query);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [search]);

  const handleSearchChange = (value: string) => {
    setSearch(value);

    if (value.trim().length < 2) {
      setDebouncedSearch("");
    }
  };

  const handleSearchClear = () => {
    setSearch("");
    setDebouncedSearch("");
  };

  const openCreateDialog = () => {
    if (createDialogCloseTimerRef.current) {
      window.clearTimeout(createDialogCloseTimerRef.current);
    }

    resetCreateUserForm();
    setIsCreateDialogOpen(true);
    setIsCreateDialogVisible(false);
    window.requestAnimationFrame(() => setIsCreateDialogVisible(true));
  };

  const closeCreateDialog = (force = false) => {
    if (isCreatingUser && !force) return;

    setIsCreateDialogVisible(false);

    createDialogCloseTimerRef.current = window.setTimeout(() => {
      setIsCreateDialogOpen(false);
      resetCreateUserForm();
    }, DIALOG_ANIMATION_MS);
  };

  const handleCreateUserFieldChange = (
    field: keyof CreateUserForm,
    value: string
  ) => {
    setCreateUserForm((current) => ({ ...current, [field]: value }));
    setCreateUserErrorMessage("");
  };

  const showCreateUserError = (messageKey: string) => {
    setCreateUserErrorMessage(messageKey);
    toast.error(t(messageKey));
  };

  const handleCreateUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedForm = {
      fullName: createUserForm.fullName.trim(),
      username: createUserForm.username.trim(),
      email: createUserForm.email.trim(),
      password: createUserForm.password,
    };

    if (
      !trimmedForm.fullName ||
      !trimmedForm.username ||
      !trimmedForm.email ||
      !trimmedForm.password
    ) {
      showCreateUserError("employee.createDialog.required");
      return;
    }

    if (!trimmedForm.email.includes("@")) {
      showCreateUserError("employee.createDialog.invalidEmail");
      return;
    }

    if (trimmedForm.password.length < 6) {
      showCreateUserError("employee.createDialog.passwordShort");
      return;
    }

    setIsCreatingUser(true);
    setCreateUserErrorMessage("");

    try {
      await createUser(trimmedForm);
      await loadUsers();
      toast.success(t("employee.createDialog.success"));
      closeCreateDialog(true);
    } catch {
      setCreateUserErrorMessage("employee.createDialog.createError");
      toast.error(t("employee.createDialog.createError"));
    } finally {
      setIsCreatingUser(false);
    }
  };

  const clearSelectedPhoto = () => {
    if (photoPreviewUrlRef.current) {
      window.URL.revokeObjectURL(photoPreviewUrlRef.current);
      photoPreviewUrlRef.current = "";
    }

    setSelectedPhoto(null);
    setPhotoPreviewUrl("");
    setPhotoErrorMessage("");

    if (photoInputRef.current) {
      photoInputRef.current.value = "";
    }
  };

  const openPhotoDialog = (user: AdminUser) => {
    if (photoDialogCloseTimerRef.current) {
      window.clearTimeout(photoDialogCloseTimerRef.current);
    }

    clearSelectedPhoto();
    setPhotoDialogUser(user);
    setIsPhotoDialogVisible(false);
    window.requestAnimationFrame(() => setIsPhotoDialogVisible(true));
  };

  const closePhotoDialog = (force = false) => {
    if (isPhotoSaving && !force) return;

    setIsPhotoDialogVisible(false);

    photoDialogCloseTimerRef.current = window.setTimeout(() => {
      clearSelectedPhoto();
      setPhotoDialogUser(null);
    }, DIALOG_ANIMATION_MS);
  };

  const handlePhotoSelect = (file?: File) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setPhotoErrorMessage("employee.photoDialog.invalidImage");
      toast.error(t("employee.photoDialog.invalidImage"));
      return;
    }

    if (photoPreviewUrlRef.current) {
      window.URL.revokeObjectURL(photoPreviewUrlRef.current);
    }

    const previewUrl = window.URL.createObjectURL(file);
    photoPreviewUrlRef.current = previewUrl;
    setSelectedPhoto(file);
    setPhotoPreviewUrl(previewUrl);
    setPhotoErrorMessage("");
  };

  const handlePhotoSave = async () => {
    if (!photoDialogUser || !selectedPhoto) {
      setPhotoErrorMessage("employee.photoDialog.chooseFirst");
      toast.error(t("employee.photoDialog.chooseFirst"));
      return;
    }

    setIsPhotoSaving(true);
    setPhotoErrorMessage("");

    try {
      await changeUserProfilePic(photoDialogUser.id, selectedPhoto);
      await loadUsers();
      toast.success(t("employee.photoDialog.updateSuccess"));
      closePhotoDialog(true);
    } catch {
      setPhotoErrorMessage("employee.photoDialog.updateError");
      toast.error(t("employee.photoDialog.updateError"));
    } finally {
      setIsPhotoSaving(false);
    }
  };

  useEffect(() => {
    return () => {
      if (photoPreviewUrlRef.current) {
        window.URL.revokeObjectURL(photoPreviewUrlRef.current);
      }

      if (createDialogCloseTimerRef.current) {
        window.clearTimeout(createDialogCloseTimerRef.current);
      }

      if (photoDialogCloseTimerRef.current) {
        window.clearTimeout(photoDialogCloseTimerRef.current);
      }
    };
  }, []);

  const filteredUsers = useMemo(() => {
    const query = debouncedSearch.toLowerCase();
    const byRole =
      roleFilter === "all"
        ? users
        : users.filter((user) => normalizeRole(user.role ?? "") === roleFilter);

    if (!query) return byRole;

    return byRole.filter((user) =>
      [user.fullName, user.username, user.email, user.role].some((value) =>
        value?.toLowerCase().includes(query)
      )
    );
  }, [debouncedSearch, roleFilter, users]);

  const roleFilterOptions = useMemo(() => {
    const roles = users
      .map((user) => user.role)
      .filter((role): role is string => Boolean(role))
      .reduce<string[]>((uniqueRoles, role) => {
        const normalizedRole = normalizeRole(role);

        if (!normalizedRole || uniqueRoles.includes(normalizedRole)) {
          return uniqueRoles;
        }

        return [...uniqueRoles, normalizedRole];
      }, []);

    return ["all", ...roles];
  }, [users]);

  const trimmedSearch = search.trim();
  const isSearchPending =
    trimmedSearch.length >= 2 && trimmedSearch !== debouncedSearch;

  if (!isAdmin) {
    return (
      <main
        className={`flex flex-1 items-center justify-center px-4 py-10 transition-colors duration-300 ${
          isLight ? "bg-gray-50 text-gray-900" : "bg-gray-900 text-white"
        }`}
      >
        <section
          className={`w-full max-w-lg rounded-2xl border p-7 text-center shadow-xl ${
            isLight
              ? "border-gray-200 bg-white shadow-gray-900/10"
              : "border-gray-700 bg-gray-800 shadow-black/30"
          }`}
        >
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-red-500 text-white shadow-lg shadow-red-950/20">
            <LockKeyhole size={28} />
          </div>
          <h1 className="mt-5 text-2xl font-black">
            {t("employee.adminRequiredTitle")}
          </h1>
          <p
            className={`mt-2 text-sm font-semibold ${
              isLight ? "text-gray-500" : "text-gray-300"
            }`}
          >
            {t("employee.adminRequiredMessage")}
          </p>
        </section>
      </main>
    );
  }

  return (
    <main
      className={`flex flex-1 flex-col px-4 py-8 transition-colors duration-300 sm:px-6 lg:px-8 ${
        isLight ? "bg-gray-50 text-gray-900" : "bg-gray-900 text-white"
      }`}
    >
      <section className="mx-auto w-full max-w-6xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-xl bg-red-500 text-white shadow-md shadow-red-950/20">
                <UsersRound size={23} />
              </span>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-red-500">
                  {t("employee.eyebrow")}
                </p>
                <h1 className="text-3xl font-black">{t("employee.title")}</h1>
              </div>
            </div>
            <p
              className={`mt-3 text-sm font-semibold ${
                isLight ? "text-gray-500" : "text-gray-400"
              }`}
            >
              {t("employee.subtitle")}
            </p>
          </div>

          <div
            className={`flex items-center gap-3 rounded-xl border px-4 py-3 shadow-sm ${
              isLight
                ? "border-gray-200 bg-white"
                : "border-gray-700 bg-gray-800"
            }`}
          >
            <UsersRound size={20} className="text-red-500" />
            <div>
              <p
                className={`text-xs font-bold uppercase ${
                  isLight ? "text-gray-500" : "text-gray-400"
                }`}
              >
                {t("employee.totalUsers")}
              </p>
              <p className="text-xl font-black">{filteredUsers.length}</p>
            </div>
          </div>
        </div>

        <div
          className={`mt-7 overflow-hidden rounded-2xl border shadow-lg ${
            isLight
              ? "border-gray-200 bg-white shadow-gray-900/5"
              : "border-gray-700 bg-gray-800 shadow-black/20"
          }`}
        >
          <div
            className={`flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-start lg:justify-between ${
              isLight ? "border-gray-200" : "border-gray-700"
            }`}
          >
            <div className="w-full lg:max-w-2xl">
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative min-w-0 flex-1">
                  <Search
                    size={18}
                    className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200 ${
                      search
                        ? "text-red-500"
                        : isLight
                        ? "text-gray-400"
                        : "text-gray-500"
                    }`}
                  />
                  <input
                    type="text"
                    value={search}
                    onChange={(event) => handleSearchChange(event.target.value)}
                    placeholder={t("employee.searchPlaceholder")}
                    className={`h-11 w-full rounded-lg border pl-10 pr-12 text-sm font-semibold outline-none transition-all duration-200 ${
                      isLight
                        ? "border-gray-200 bg-gray-50 placeholder:text-gray-400 focus:border-amber-400"
                        : "border-gray-600 bg-gray-900 placeholder:text-gray-500 focus:border-amber-400"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={handleSearchClear}
                    aria-label={t("employee.clearSearch")}
                    className={`absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full border transition-all duration-200 ease-out ${
                      search
                        ? "pointer-events-auto scale-100 opacity-100 hover:cursor-pointer hover:scale-105 active:scale-95"
                        : "pointer-events-none scale-75 opacity-0"
                    } ${
                      isLight
                        ? "border-gray-300 bg-white text-gray-600 shadow-sm hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                        : "border-gray-600 bg-gray-800 text-gray-300 shadow-sm hover:border-red-400 hover:bg-red-500/15 hover:text-red-300"
                    }`}
                  >
                    <X size={15} strokeWidth={2.5} />
                  </button>
                </div>

                <div className="relative sm:w-56">
                  <SlidersHorizontal
                    size={17}
                    className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 ${
                      roleFilter === "all"
                        ? isLight
                          ? "text-gray-400"
                          : "text-gray-500"
                        : "text-red-500"
                    }`}
                  />
                  <select
                    value={roleFilter}
                    onChange={(event) => setRoleFilter(event.target.value)}
                    aria-label={t("employee.roleFilterAria")}
                    className={`h-11 w-full appearance-none rounded-lg border pl-10 pr-10 text-sm font-black outline-none transition-all duration-200 hover:cursor-pointer ${
                      isLight
                        ? "border-gray-200 bg-gray-50 text-gray-800 shadow-sm focus:border-amber-400 hover:border-amber-300"
                        : "border-gray-600 bg-gray-900 text-gray-100 shadow-sm shadow-black/10 focus:border-amber-400 hover:border-amber-300"
                    }`}
                  >
                    {roleFilterOptions.map((role) => (
                      <option key={role} value={role}>
                        {role === "all"
                          ? t("employee.allRoles")
                          : formatRole(role, t)}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={17}
                    className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 ${
                      isLight ? "text-gray-500" : "text-gray-300"
                    }`}
                  />
                </div>
              </div>

              <p
                className={`mt-1.5 min-h-4 text-xs font-semibold transition-all duration-200 ${
                  trimmedSearch.length === 1 || isSearchPending
                    ? "translate-y-0 opacity-100"
                    : "-translate-y-1 opacity-0"
                } ${isLight ? "text-gray-500" : "text-gray-400"}`}
              >
                {trimmedSearch.length === 1
                  ? t("common.typeMoreToSearch")
                  : t("common.searching")}
              </p>
            </div>

            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-end">
              <p
                className={`text-sm font-semibold ${
                  isLight ? "text-gray-500" : "text-gray-400"
                }`}
              >
                {t("common.showingOf", {
                  shown: filteredUsers.length,
                  total: users.length,
                })}
              </p>
              <button
                type="button"
                onClick={openCreateDialog}
                className="flex h-11 items-center justify-center gap-2 rounded-xl bg-red-500 px-4 text-sm font-black text-white shadow-md shadow-red-950/15 transition-all duration-200 hover:cursor-pointer hover:bg-red-600 active:scale-95"
                aria-label={t("employee.createDialog.openAria", {
                  defaultValue: "Create employee",
                })}
              >
                <Plus size={20} strokeWidth={2.7} />
                {t("employee.createDialog.button", {
                  defaultValue: "New user",
                })}
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex min-h-64 items-center justify-center p-6">
              <p
                className={`font-semibold ${
                  isLight ? "text-gray-500" : "text-gray-400"
                }`}
              >
                {t("employee.loading")}
              </p>
            </div>
          ) : errorMessage ? (
            <div className="flex min-h-64 flex-col items-center justify-center p-6 text-center">
              <p className="font-bold text-red-500">{t(errorMessage)}</p>
              <button
                type="button"
                onClick={() => void loadUsers()}
                className="mt-4 flex h-11 items-center justify-center gap-2 rounded-lg bg-red-500 px-4 font-bold text-white transition-all duration-200 hover:cursor-pointer hover:bg-red-600 active:scale-98"
              >
                <RefreshCcw size={17} />
                {t("common.retry")}
              </button>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center p-6 text-center">
              <UserRound
                size={36}
                className={isLight ? "text-gray-300" : "text-gray-600"}
              />
              <p className="mt-3 font-bold">{t("employee.emptyTitle")}</p>
              <p
                className={`mt-1 text-sm font-semibold ${
                  isLight ? "text-gray-500" : "text-gray-400"
                }`}
              >
                {t("employee.emptyMessage")}
              </p>
            </div>
          ) : (
            <div
              className={`divide-y ${
                isLight ? "divide-gray-200" : "divide-gray-700"
              }`}
            >
              {filteredUsers.map((user) => {
                const roleStyle = getRoleStyle(user.role);
                const RoleIcon = roleStyle.icon;
                const profilePictureUrl = getProfilePictureUrl(
                  user,
                  user.updatedAt
                );

                return (
                  <article
                    key={user.id}
                    className={`grid gap-4 p-4 transition-colors duration-200 sm:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)_minmax(190px,0.75fr)] sm:items-center ${
                      isLight ? "hover:bg-amber-50/50" : "hover:bg-gray-700/50"
                    }`}
                  >
                    <div className="flex min-w-0 items-start justify-between gap-3 sm:items-center">
                      <div className="flex min-w-0 items-center gap-3">
                        <button
                          type="button"
                          onClick={() => openPhotoDialog(user)}
                          aria-label={t("employee.changePhotoAria", {
                            name:
                              user.fullName ||
                              user.username ||
                              t("common.employeeAlt"),
                          })}
                          className={`group relative flex size-11 shrink-0 overflow-hidden rounded-full border-2 text-sm font-black text-white shadow-sm ring-2 ring-transparent transition-all duration-200 hover:cursor-pointer hover:scale-105 hover:border-amber-300 hover:ring-amber-300/35 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-transparent active:scale-95 ${
                            profilePictureUrl
                              ? "bg-transparent shadow-gray-950/10"
                              : "bg-red-500 shadow-red-950/20"
                          } ${
                            isLight ? "border-white" : "border-gray-700"
                          }`}
                        >
                          {profilePictureUrl ? (
                            <img
                              key={profilePictureUrl}
                              src={profilePictureUrl}
                              alt={
                                user.fullName ||
                                user.username ||
                                t("common.employeeAlt")
                              }
                              className="size-full object-cover transition-all duration-200 group-hover:scale-105 group-hover:opacity-45 group-hover:blur-[1px]"
                              onError={(event) => {
                                event.currentTarget.style.display = "none";
                              }}
                            />
                          ) : (
                            <span className="flex size-full items-center justify-center transition-all duration-200 group-hover:scale-105 group-hover:opacity-45 group-hover:blur-[1px]">
                              {getInitials(user.fullName, user.username)}
                            </span>
                          )}
                          <span className="absolute inset-0 flex items-center justify-center bg-gray-950/55 opacity-0 backdrop-blur-[1px] transition-all duration-200 group-hover:opacity-100">
                            <Pencil size={17} strokeWidth={2.7} />
                          </span>
                        </button>
                        <div className="min-w-0">
                          <h2 className="truncate font-black">
                            {user.fullName || t("common.unnamedUser")}
                          </h2>
                          <p
                            className={`truncate text-sm font-semibold ${
                              isLight ? "text-gray-500" : "text-gray-400"
                            }`}
                          >
                            @{user.username || t("common.unknown")}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`inline-flex min-h-5 shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-black sm:hidden ${roleStyle.className}`}
                      >
                        <RoleIcon size={16} strokeWidth={2.6} />
                        {formatRole(user.role, t)}
                      </span>
                    </div>

                    <div className="grid min-w-0 gap-2 sm:block sm:space-y-2">
                      <p
                        className={`flex min-w-0 items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0 ${
                          isLight
                            ? "border-gray-200 bg-gray-50 text-gray-600"
                            : "border-gray-700 bg-gray-900 text-gray-300"
                        }`}
                      >
                        <Mail size={16} className="shrink-0 text-red-500" />
                        <span className="truncate">{user.email || "-"}</span>
                      </p>
                      <p
                        className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0 ${
                          isLight
                            ? "border-gray-200 bg-gray-50 text-gray-500"
                            : "border-gray-700 bg-gray-900 text-gray-400"
                        }`}
                      >
                        <CalendarDays size={15} className="shrink-0" />
                        {t("employee.created", {
                          date: formatDate(
                            user.createdAt,
                            locale,
                            t("common.notAvailable")
                          ),
                        })}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-2 sm:flex-col sm:items-end sm:justify-center">
                      <span
                        className={`hidden min-h-5 items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-black sm:inline-flex ${roleStyle.className}`}
                      >
                        <RoleIcon size={16} strokeWidth={2.6} />
                        {formatRole(user.role, t)}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold sm:rounded-none sm:border-0 sm:p-0 ${
                          isLight
                            ? "border-gray-200 bg-gray-50 text-gray-500"
                            : "border-gray-700 bg-gray-900 text-gray-400"
                        }`}
                      >
                        <Clock3 size={14} />
                        {formatDate(
                          user.loginedAt,
                          locale,
                          t("common.notAvailable")
                        )}
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {isCreateDialogOpen && (
        <div
          role="presentation"
          onClick={() => closeCreateDialog()}
          className={`fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-black/50 px-4 py-5 transition-all duration-300 ease-out sm:items-center ${
            isCreateDialogVisible
              ? "pointer-events-auto opacity-100 backdrop-blur-[3px]"
              : "pointer-events-none opacity-0 backdrop-blur-0"
          }`}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-user-dialog-title"
            onClick={(event) => event.stopPropagation()}
            className={`w-full max-w-xl rounded-2xl border p-5 shadow-2xl ring-1 transition-all duration-300 ease-out sm:p-6 ${
              isLight
                ? "border-gray-200 bg-white text-gray-900 shadow-gray-950/20 ring-white/80"
                : "border-gray-700 bg-gray-800 text-white shadow-black/40 ring-white/10"
            } ${
              isCreateDialogVisible
                ? "translate-y-0 scale-100 opacity-100"
                : "translate-y-4 scale-[0.98] opacity-0"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-3">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-red-500 text-white shadow-md shadow-red-950/20">
                  <UserPlus size={22} />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-red-500">
                    {t("employee.createDialog.eyebrow", {
                      defaultValue: "Administration",
                    })}
                  </p>
                  <h2
                    id="create-user-dialog-title"
                    className="mt-1 text-2xl font-black"
                  >
                    {t("employee.createDialog.title", {
                      defaultValue: "Create user",
                    })}
                  </h2>
                </div>
              </div>

              <button
                type="button"
                onClick={() => closeCreateDialog()}
                disabled={isCreatingUser}
                aria-label={t("employee.createDialog.closeAria", {
                  defaultValue: "Close create user dialog",
                })}
                className={`flex size-10 shrink-0 items-center justify-center rounded-full border transition-all duration-200 hover:cursor-pointer active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 ${
                  isLight
                    ? "border-gray-200 bg-gray-50 text-gray-600 hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                    : "border-gray-700 bg-gray-900 text-gray-300 hover:border-red-400 hover:bg-red-500/15 hover:text-red-300"
                }`}
              >
                <X size={18} strokeWidth={2.6} />
              </button>
            </div>

            <form className="mt-6 grid gap-4" onSubmit={handleCreateUser}>
              <label className="grid gap-2">
                <span
                  className={`text-xs font-black uppercase ${
                    isLight ? "text-gray-500" : "text-gray-400"
                  }`}
                >
                  {t("employee.createDialog.fullName", {
                    defaultValue: "Full name",
                  })}
                </span>
                <div className="relative">
                  <UserRound
                    size={18}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-red-500"
                  />
                  <input
                    type="text"
                    value={createUserForm.fullName}
                    onChange={(event) =>
                      handleCreateUserFieldChange(
                        "fullName",
                        event.currentTarget.value
                      )
                    }
                    disabled={isCreatingUser}
                    autoComplete="name"
                    className={`h-11 w-full rounded-xl border pl-10 pr-3 text-sm font-semibold outline-none transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${
                      isLight
                        ? "border-gray-200 bg-gray-50 focus:border-amber-400"
                        : "border-gray-700 bg-gray-900 focus:border-amber-400"
                    }`}
                  />
                </div>
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2">
                  <span
                    className={`text-xs font-black uppercase ${
                      isLight ? "text-gray-500" : "text-gray-400"
                    }`}
                  >
                    {t("employee.createDialog.username", {
                      defaultValue: "Username",
                    })}
                  </span>
                  <input
                    type="text"
                    value={createUserForm.username}
                    onChange={(event) =>
                      handleCreateUserFieldChange(
                        "username",
                        event.currentTarget.value
                      )
                    }
                    disabled={isCreatingUser}
                    autoComplete="username"
                    className={`h-11 w-full rounded-xl border px-3 text-sm font-semibold outline-none transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${
                      isLight
                        ? "border-gray-200 bg-gray-50 focus:border-amber-400"
                        : "border-gray-700 bg-gray-900 focus:border-amber-400"
                    }`}
                  />
                </label>

                <label className="grid gap-2">
                  <span
                    className={`text-xs font-black uppercase ${
                      isLight ? "text-gray-500" : "text-gray-400"
                    }`}
                  >
                    {t("employee.createDialog.email", {
                      defaultValue: "Email",
                    })}
                  </span>
                  <div className="relative">
                    <Mail
                      size={17}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-red-500"
                    />
                    <input
                      type="email"
                      value={createUserForm.email}
                      onChange={(event) =>
                        handleCreateUserFieldChange(
                          "email",
                          event.currentTarget.value
                        )
                      }
                      disabled={isCreatingUser}
                      autoComplete="email"
                      className={`h-11 w-full rounded-xl border pl-10 pr-3 text-sm font-semibold outline-none transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${
                        isLight
                          ? "border-gray-200 bg-gray-50 focus:border-amber-400"
                          : "border-gray-700 bg-gray-900 focus:border-amber-400"
                      }`}
                    />
                  </div>
                </label>
              </div>

              <label className="grid gap-2">
                <span
                  className={`text-xs font-black uppercase ${
                    isLight ? "text-gray-500" : "text-gray-400"
                  }`}
                >
                  {t("employee.createDialog.password", {
                    defaultValue: "Password",
                  })}
                </span>
                <div className="relative">
                  <LockKeyhole
                    size={17}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-red-500"
                  />
                  <input
                    type="password"
                    value={createUserForm.password}
                    onChange={(event) =>
                      handleCreateUserFieldChange(
                        "password",
                        event.currentTarget.value
                      )
                    }
                    disabled={isCreatingUser}
                    autoComplete="new-password"
                    className={`h-11 w-full rounded-xl border pl-10 pr-3 text-sm font-semibold outline-none transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${
                      isLight
                        ? "border-gray-200 bg-gray-50 focus:border-amber-400"
                        : "border-gray-700 bg-gray-900 focus:border-amber-400"
                    }`}
                  />
                </div>
              </label>

              <p
                className={`min-h-5 text-sm font-semibold ${
                  createUserErrorMessage
                    ? "text-red-500"
                    : isLight
                    ? "text-gray-500"
                    : "text-gray-400"
                }`}
              >
                {createUserErrorMessage
                  ? t(createUserErrorMessage)
                  : isCreatingUser
                  ? t("employee.createDialog.creating", {
                      defaultValue: "Creating user...",
                    })
                  : t("employee.createDialog.ready", {
                      defaultValue: "Ready to create.",
                    })}
              </p>

              <div
                className={`flex flex-col-reverse gap-3 border-t pt-4 sm:flex-row sm:justify-end ${
                  isLight ? "border-gray-200" : "border-gray-700"
                }`}
              >
                <button
                  type="button"
                  onClick={() => closeCreateDialog()}
                  disabled={isCreatingUser}
                  className={`h-11 rounded-xl border px-5 font-bold transition-all duration-200 hover:cursor-pointer active:scale-98 disabled:cursor-not-allowed disabled:opacity-60 ${
                    isLight
                      ? "border-gray-200 bg-white hover:bg-gray-100"
                      : "border-gray-700 bg-gray-900 hover:bg-gray-700"
                  }`}
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={isCreatingUser}
                  className="flex h-11 items-center justify-center gap-2 rounded-xl bg-red-500 px-5 font-bold text-white shadow-md shadow-red-950/20 transition-all duration-200 hover:cursor-pointer hover:bg-red-600 active:scale-98 disabled:cursor-not-allowed disabled:bg-red-300"
                >
                  {isCreatingUser && (
                    <LoaderCircle size={17} className="animate-spin" />
                  )}
                  {t("employee.createDialog.submit", {
                    defaultValue: "Create user",
                  })}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {photoDialogUser && (
        <div
          role="presentation"
          onClick={() => closePhotoDialog()}
          className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 transition-all duration-300 ease-out ${
            isPhotoDialogVisible
              ? "pointer-events-auto opacity-100 backdrop-blur-[3px]"
              : "pointer-events-none opacity-0 backdrop-blur-0"
          }`}
        >
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="profile-photo-dialog-title"
          onClick={(event) => event.stopPropagation()}
          className={`w-full max-w-2xl rounded-2xl border p-6 shadow-2xl ring-1 transition-all duration-300 ease-out sm:p-7 ${
            isLight
              ? "border-gray-200 bg-white text-gray-900 shadow-gray-950/20 ring-white/80"
              : "border-gray-700 bg-gray-800 text-white shadow-black/40 ring-white/10"
          } ${
            isPhotoDialogVisible
              ? "translate-y-0 scale-100 opacity-100"
              : "translate-y-3 scale-95 opacity-0"
          }`}
        >
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-red-500 text-white shadow-md shadow-red-950/20">
              <ImagePlus size={22} />
            </span>

            <div className="min-w-0">
              <h2
                id="profile-photo-dialog-title"
                className="text-2xl font-black"
              >
                {t("employee.photoDialog.title")}
              </h2>
              <p
                className={`mt-1 truncate text-sm font-semibold ${
                  isLight ? "text-gray-500" : "text-gray-400"
                }`}
              >
                {photoDialogUser?.fullName ||
                  photoDialogUser?.username ||
                  t("common.employeeAlt")}
              </p>
            </div>
          </div>

          <div className="mt-7 grid gap-6 sm:grid-cols-[176px_minmax(0,1fr)] sm:items-center">
            <div
              className={`relative mx-auto flex size-44 overflow-hidden rounded-full border-4 text-5xl font-black text-white shadow-xl ring-4 sm:mx-0 ${
                photoPreviewUrl || photoDialogProfilePictureUrl
                  ? "bg-transparent shadow-gray-950/10 ring-gray-500/10"
                  : "bg-red-500 shadow-red-950/20 ring-red-500/15"
              } ${
                isLight ? "border-white" : "border-gray-700"
              }`}
            >
              {photoPreviewUrl ? (
                <img
                  src={photoPreviewUrl}
                  alt={t("common.selectedProfilePreviewAlt")}
                  className="size-full object-cover"
                />
              ) : photoDialogProfilePictureUrl ? (
                <img
                  key={photoDialogProfilePictureUrl}
                  src={photoDialogProfilePictureUrl}
                  alt={
                    photoDialogUser?.fullName ||
                    photoDialogUser?.username ||
                    t("common.employeeAlt")
                  }
                  className="size-full object-cover"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <span className="flex size-full items-center justify-center">
                  {getInitials(
                    photoDialogUser?.fullName,
                    photoDialogUser?.username
                  )}
                </span>
              )}
            </div>

            <div
              className={`rounded-2xl border border-dashed p-5 shadow-inner ${
                isLight
                  ? "border-gray-300 bg-gray-50 shadow-white"
                  : "border-gray-600 bg-gray-900 shadow-black/20"
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-400 text-gray-950">
                  <ImagePlus size={20} />
                </span>
                <div className="min-w-0">
                  <p className="font-black">{t("employee.photoDialog.uploadTitle")}</p>
                  <p
                    className={`mt-1 text-sm font-semibold ${
                      isLight ? "text-gray-500" : "text-gray-400"
                    }`}
                  >
                    {selectedPhoto
                      ? selectedPhoto.name
                      : t("employee.photoDialog.uploadHelp")}
                  </p>
                </div>
              </div>

              <input
                ref={photoInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(event) =>
                  handlePhotoSelect(event.currentTarget.files?.[0])
                }
              />

              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  disabled={isPhotoSaving}
                  className={`flex h-11 flex-1 items-center justify-center gap-2 rounded-xl px-4 font-bold text-white shadow-md shadow-red-950/20 transition-all duration-200 active:scale-98 ${
                    isPhotoSaving
                      ? "cursor-not-allowed bg-red-300"
                      : "bg-red-500 hover:cursor-pointer hover:bg-red-600"
                  }`}
                >
                  <ImagePlus size={17} />
                  {t("employee.photoDialog.choosePhoto")}
                </button>
                <button
                  type="button"
                  onClick={clearSelectedPhoto}
                  disabled={isPhotoSaving || !selectedPhoto}
                  className={`flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border px-4 font-bold transition-all duration-200 active:scale-98 ${
                    selectedPhoto && !isPhotoSaving
                      ? isLight
                        ? "border-gray-200 bg-white text-gray-700 hover:cursor-pointer hover:bg-gray-100"
                        : "border-gray-700 bg-gray-800 text-gray-200 hover:cursor-pointer hover:bg-gray-700"
                      : isLight
                      ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                      : "cursor-not-allowed border-gray-700 bg-gray-800 text-gray-500"
                  }`}
                >
                  <Trash2 size={17} />
                  {t("employee.photoDialog.remove")}
                </button>
              </div>

              <p
                className={`mt-3 min-h-5 text-sm font-semibold ${
                  photoErrorMessage
                    ? "text-red-500"
                    : isLight
                    ? "text-gray-500"
                    : "text-gray-400"
                }`}
              >
                {photoErrorMessage
                  ? t(photoErrorMessage)
                  :
                  (isPhotoSaving
                    ? t("employee.photoDialog.uploading")
                    : selectedPhoto
                    ? t("employee.photoDialog.readyToSave")
                    : "")}
              </p>
            </div>
          </div>

          <div
            className={`mt-6 flex flex-col gap-3 border-t pt-5 sm:flex-row sm:justify-end ${
              isLight ? "border-gray-200" : "border-gray-700"
            }`}
          >
            <button
              type="button"
              onClick={() => closePhotoDialog()}
              disabled={isPhotoSaving}
              className={`h-11 rounded-xl border px-5 font-bold transition-all duration-200 hover:cursor-pointer active:scale-98 ${
                isPhotoSaving
                  ? isLight
                    ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                    : "cursor-not-allowed border-gray-700 bg-gray-800 text-gray-500"
                  : isLight
                  ? "border-gray-200 bg-white hover:bg-gray-100"
                  : "border-gray-700 bg-gray-900 hover:bg-gray-700"
              }`}
            >
              {t("common.cancel")}
            </button>
            <button
              type="button"
              onClick={() => void handlePhotoSave()}
              disabled={isPhotoSaving || !selectedPhoto}
              className={`h-11 rounded-xl px-5 font-bold text-white shadow-md shadow-red-950/20 transition-all duration-200 active:scale-98 ${
                isPhotoSaving || !selectedPhoto
                  ? "cursor-not-allowed bg-red-300"
                  : "bg-red-500 hover:cursor-pointer hover:bg-red-600"
              }`}
            >
              {isPhotoSaving
                ? t("employee.photoDialog.saving")
                : t("employee.photoDialog.saveChanges")}
            </button>
          </div>
          </section>
        </div>
      )}
    </main>
  );
};

export default Employee;
