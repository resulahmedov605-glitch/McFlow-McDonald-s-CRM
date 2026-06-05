import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  CalendarDays,
  CircleHelp,
  Clock3,
  HardHat,
  ImagePlus,
  LockKeyhole,
  Mail,
  RefreshCcw,
  Search,
  ShieldAlert,
  ShieldCheck,
  ShoppingCart,
  Pencil,
  Trash2,
  UserRound,
  UsersRound,
  X,
  type LucideIcon,
} from "lucide-react";

import {
  changeUserProfilePic,
  getUsers,
  type AdminUser,
} from "../lib/services/adminService";
import { getProfilePictureUrl } from "../lib/profilePicture";
import useAuthStore from "../store/authStore";
import { useThemeStore } from "../store/useThemeStore";

const normalizeRole = (role?: string) =>
  role?.replace(/[\s_-]/g, "").toLowerCase() ?? "";

const formatRole = (role?: string | null) => {
  if (!role) return "Unknown";

  return role
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
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

const formatDate = (value?: string | null) => {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not available";

  return new Intl.DateTimeFormat("en", {
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

const Employee = () => {
  const currentUser = useAuthStore((state) => state.user);
  const theme = useThemeStore((state) => state.theme);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [photoDialogUser, setPhotoDialogUser] = useState<AdminUser | null>(
    null
  );
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState("");
  const [photoErrorMessage, setPhotoErrorMessage] = useState("");
  const [isPhotoSaving, setIsPhotoSaving] = useState(false);
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const photoPreviewUrlRef = useRef("");
  const isLight = theme === "light";
  const isAdmin = ["admin", "administrator"].includes(
    normalizeRole(currentUser?.role)
  );
  const isPhotoDialogOpen = Boolean(photoDialogUser);
  const photoDialogProfilePictureUrl = getProfilePictureUrl(
    photoDialogUser,
    photoDialogUser?.updatedAt
  );

  const loadUsers = async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await getUsers();
      setUsers(response);
    } catch {
      setErrorMessage("Employees could not be loaded. Please try again.");
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
          setErrorMessage("Employees could not be loaded. Please try again.");
        }
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [isAdmin]);

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

  const clearSelectedPhoto = useCallback(() => {
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
  }, []);

  const openPhotoDialog = useCallback(
    (user: AdminUser) => {
      clearSelectedPhoto();
      setPhotoDialogUser(user);
    },
    [clearSelectedPhoto]
  );

  const closePhotoDialog = useCallback(() => {
    if (isPhotoSaving) return;

    clearSelectedPhoto();
    setPhotoDialogUser(null);
  }, [clearSelectedPhoto, isPhotoSaving]);

  const handlePhotoSelect = (file?: File) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setPhotoErrorMessage("Please choose a valid image file.");
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
      setPhotoErrorMessage("Please choose a photo first.");
      return;
    }

    setIsPhotoSaving(true);
    setPhotoErrorMessage("");

    try {
      await changeUserProfilePic(photoDialogUser.id, selectedPhoto);
      await loadUsers();
      closePhotoDialog();
    } catch {
      setPhotoErrorMessage(
        "Profile picture could not be updated. Please try again."
      );
    } finally {
      setIsPhotoSaving(false);
    }
  };

  useEffect(() => {
    if (!isPhotoDialogOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closePhotoDialog();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closePhotoDialog, isPhotoDialogOpen]);

  useEffect(() => {
    return () => {
      if (photoPreviewUrlRef.current) {
        window.URL.revokeObjectURL(photoPreviewUrlRef.current);
      }
    };
  }, []);

  const filteredUsers = useMemo(() => {
    const query = debouncedSearch.toLowerCase();

    if (!query) return users;

    return users.filter((user) =>
      [user.fullName, user.username, user.email, user.role].some((value) =>
        value?.toLowerCase().includes(query)
      )
    );
  }, [debouncedSearch, users]);

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
          <h1 className="mt-5 text-2xl font-black">Admin access required</h1>
          <p
            className={`mt-2 text-sm font-semibold ${
              isLight ? "text-gray-500" : "text-gray-300"
            }`}
          >
            Only administrators can view the employee list.
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
                  Administration
                </p>
                <h1 className="text-3xl font-black">Employees</h1>
              </div>
            </div>
            <p
              className={`mt-3 text-sm font-semibold ${
                isLight ? "text-gray-500" : "text-gray-400"
              }`}
            >
              View all users registered in the McFlow workspace.
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
                Total users
              </p>
              <p className="text-xl font-black">{users.length}</p>
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
            className={`flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between ${
              isLight ? "border-gray-200" : "border-gray-700"
            }`}
          >
            <div className="w-full sm:max-w-sm">
              <div className="relative">
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
                  placeholder="Search employees"
                  className={`h-11 w-full rounded-lg border pl-10 pr-12 text-sm font-semibold outline-none transition-all duration-200 ${
                    isLight
                      ? "border-gray-200 bg-gray-50 placeholder:text-gray-400 focus:border-amber-400"
                      : "border-gray-600 bg-gray-900 placeholder:text-gray-500 focus:border-amber-400"
                  }`}
                />
                <button
                  type="button"
                  onClick={handleSearchClear}
                  aria-label="Clear employee search"
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

              <p
                className={`mt-1.5 min-h-4 text-xs font-semibold transition-all duration-200 ${
                  trimmedSearch.length === 1 || isSearchPending
                    ? "translate-y-0 opacity-100"
                    : "-translate-y-1 opacity-0"
                } ${isLight ? "text-gray-500" : "text-gray-400"}`}
              >
                {trimmedSearch.length === 1
                  ? "Type one more character to search"
                  : "Searching..."}
              </p>
            </div>

            <p
              className={`text-sm font-semibold ${
                isLight ? "text-gray-500" : "text-gray-400"
              }`}
            >
              Showing {filteredUsers.length} of {users.length}
            </p>
          </div>

          {isLoading ? (
            <div className="flex min-h-64 items-center justify-center p-6">
              <p
                className={`font-semibold ${
                  isLight ? "text-gray-500" : "text-gray-400"
                }`}
              >
                Loading employees...
              </p>
            </div>
          ) : errorMessage ? (
            <div className="flex min-h-64 flex-col items-center justify-center p-6 text-center">
              <p className="font-bold text-red-500">{errorMessage}</p>
              <button
                type="button"
                onClick={() => void loadUsers()}
                className="mt-4 flex h-11 items-center justify-center gap-2 rounded-lg bg-red-500 px-4 font-bold text-white transition-all duration-200 hover:cursor-pointer hover:bg-red-600 active:scale-98"
              >
                <RefreshCcw size={17} />
                Retry
              </button>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center p-6 text-center">
              <UserRound
                size={36}
                className={isLight ? "text-gray-300" : "text-gray-600"}
              />
              <p className="mt-3 font-bold">No employees found</p>
              <p
                className={`mt-1 text-sm font-semibold ${
                  isLight ? "text-gray-500" : "text-gray-400"
                }`}
              >
                Try a different search term.
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
                    className={`grid gap-4 p-4 transition-colors duration-200 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1.25fr)_minmax(130px,0.7fr)] sm:items-center ${
                      isLight ? "hover:bg-amber-50/50" : "hover:bg-gray-700/50"
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <button
                        type="button"
                        onClick={() => openPhotoDialog(user)}
                        aria-label={`Change profile picture for ${
                          user.fullName || user.username || "employee"
                        }`}
                        className={`group relative flex size-11 shrink-0 overflow-hidden rounded-full border-2 bg-red-500 text-sm font-black text-white shadow-sm shadow-red-950/20 ring-2 ring-transparent transition-all duration-200 hover:cursor-pointer hover:scale-105 hover:border-amber-300 hover:ring-amber-300/35 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-transparent active:scale-95 ${
                          isLight ? "border-white" : "border-gray-700"
                        }`}
                      >
                        <span className="flex size-full items-center justify-center transition-all duration-200 group-hover:scale-105 group-hover:opacity-45 group-hover:blur-[1px]">
                          {getInitials(user.fullName, user.username)}
                        </span>
                        {profilePictureUrl && (
                          <img
                            key={profilePictureUrl}
                            src={profilePictureUrl}
                            alt={user.fullName || user.username || "Employee"}
                            className="absolute inset-0 size-full object-cover transition-all duration-200 group-hover:scale-105 group-hover:opacity-45 group-hover:blur-[1px]"
                            onError={(event) => {
                              event.currentTarget.style.display = "none";
                            }}
                          />
                        )}
                        <span className="absolute inset-0 flex items-center justify-center bg-gray-950/55 opacity-0 backdrop-blur-[1px] transition-all duration-200 group-hover:opacity-100">
                          <Pencil size={17} strokeWidth={2.7} />
                        </span>
                      </button>
                      <div className="min-w-0">
                        <h2 className="truncate font-black">
                          {user.fullName || "Unnamed user"}
                        </h2>
                        <p
                          className={`truncate text-sm font-semibold ${
                            isLight ? "text-gray-500" : "text-gray-400"
                          }`}
                        >
                          @{user.username || "unknown"}
                        </p>
                      </div>
                    </div>

                    <div className="min-w-0 space-y-2">
                      <p
                        className={`flex min-w-0 items-center gap-2 text-sm font-semibold ${
                          isLight ? "text-gray-600" : "text-gray-300"
                        }`}
                      >
                        <Mail size={16} className="shrink-0 text-red-500" />
                        <span className="truncate">{user.email || "-"}</span>
                      </p>
                      <p
                        className={`flex items-center gap-2 text-xs font-semibold ${
                          isLight ? "text-gray-500" : "text-gray-400"
                        }`}
                      >
                        <CalendarDays size={15} className="shrink-0" />
                        Created {formatDate(user.createdAt)}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-black ${roleStyle.className}`}
                      >
                        <RoleIcon size={14} />
                        {formatRole(user.role)}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                          isLight ? "text-gray-500" : "text-gray-400"
                        }`}
                      >
                        <Clock3 size={14} />
                        {formatDate(user.loginedAt)}
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <div
        role="presentation"
        aria-hidden={!isPhotoDialogOpen}
        onClick={closePhotoDialog}
        className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-[3px] transition-all duration-300 ease-out ${
          isPhotoDialogOpen
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
            isPhotoDialogOpen
              ? "translate-y-0 scale-100 opacity-100"
              : "translate-y-3 scale-95 opacity-0"
          } ${
            isLight
              ? "border-gray-200 bg-white text-gray-900 shadow-gray-950/20 ring-white/80"
              : "border-gray-700 bg-gray-800 text-white shadow-black/40 ring-white/10"
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
                Change profile picture
              </h2>
              <p
                className={`mt-1 truncate text-sm font-semibold ${
                  isLight ? "text-gray-500" : "text-gray-400"
                }`}
              >
                {photoDialogUser?.fullName ||
                  photoDialogUser?.username ||
                  "Employee"}
              </p>
            </div>
          </div>

          <div className="mt-7 grid gap-6 sm:grid-cols-[176px_minmax(0,1fr)] sm:items-center">
            <div
              className={`relative mx-auto flex size-44 overflow-hidden rounded-full border-4 bg-red-500 text-5xl font-black text-white shadow-xl shadow-red-950/20 ring-4 ring-red-500/15 sm:mx-0 ${
                isLight ? "border-white" : "border-gray-700"
              }`}
            >
              {photoPreviewUrl ? (
                <img
                  src={photoPreviewUrl}
                  alt="Selected profile preview"
                  className="size-full object-cover"
                />
              ) : (
                <>
                  <span className="flex size-full items-center justify-center">
                    {getInitials(
                      photoDialogUser?.fullName,
                      photoDialogUser?.username
                    )}
                  </span>
                  {photoDialogProfilePictureUrl && (
                    <img
                      key={photoDialogProfilePictureUrl}
                      src={photoDialogProfilePictureUrl}
                      alt={
                        photoDialogUser?.fullName ||
                        photoDialogUser?.username ||
                        "Employee"
                      }
                      className="absolute inset-0 size-full object-cover"
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                      }}
                    />
                  )}
                </>
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
                  <p className="font-black">Upload new photo</p>
                  <p
                    className={`mt-1 text-sm font-semibold ${
                      isLight ? "text-gray-500" : "text-gray-400"
                    }`}
                  >
                    {selectedPhoto
                      ? selectedPhoto.name
                      : "JPG, PNG, or WebP. Recommended size is 512x512."}
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
                  Choose photo
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
                  Remove
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
                {photoErrorMessage ||
                  (isPhotoSaving
                    ? "Uploading profile picture..."
                    : selectedPhoto
                    ? "Ready to save."
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
              onClick={closePhotoDialog}
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
              Cancel
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
              {isPhotoSaving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
};

export default Employee;
