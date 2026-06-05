import { useEffect, useRef, useState } from "react";
import {
  BarChart3,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  Globe2,
  LayoutGrid,
  Monitor,
  Menu,
  Moon,
  Package,
  Settings,
  SunDim,
  User,
  UsersRound,
  X,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { languageOptions, type LanguageCode } from "../locales/languages";
import { useLanguageStore } from "../store/useLanguageStore";
import {
  useThemeStore,
  type ThemePreference,
} from "../store/useThemeStore";
import useAuthStore from "../store/authStore";

const navItems = [
  { key: "help", labelKey: "nav.help" },
  { key: "contact", labelKey: "nav.contact" },
  { key: "about", labelKey: "nav.about" },
] as const;

const contactLinks = [
  {
    title: "GitHub",
    href: "https://github.com/resulahmedov605-glitch",
  },
  {
    title: "LinkedIn",
    href: "https://www.linkedin.com/in/resul-ahmedov-342933348/",
  },
];

const workspaceItems = [
  { label: "Dashboard", icon: LayoutGrid, path: "/" },
  { label: "Finance", icon: BriefcaseBusiness },
  { label: "Products", icon: Package },
  { label: "Customers", icon: UsersRound },
  { label: "Analytics", icon: BarChart3 },
  { label: "Settings", icon: Settings },
];

const themeOptions = [
  { value: "light", label: "Light", icon: SunDim },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

const Navbar = () => {
  const { user } = useAuthStore();
  const navbarRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPopping, setIsPopping] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
  const theme = useThemeStore((state) => state.theme);
  const themePreference = useThemeStore((state) => state.themePreference);
  const setThemePreference = useThemeStore(
    (state) => state.setThemePreference
  );
  const language = useLanguageStore((state) => state.language);
  const setLanguage = useLanguageStore((state) => state.setLanguage);
  const navigate = useNavigate();
  const isLight = theme === "light";
  const { t, i18n } = useTranslation();
  const activeLanguage =
    languageOptions.find((option) => option.code === language) ??
    languageOptions[0];
  const orderedLanguageOptions = [
    activeLanguage,
    ...languageOptions.filter(
      (language) => language.code !== activeLanguage.code
    ),
  ];

  const handleLanguageChange = (language: LanguageCode) => {
    setLanguage(language);
    void i18n.changeLanguage(language);
    setIsLanguageOpen(false);
  };

  const handleContactToggle = () => {
    setIsContactOpen((open) => !open);
    setIsLanguageOpen(false);
    setIsThemeOpen(false);
  };

  const handleLanguageToggle = () => {
    setIsLanguageOpen((open) => !open);
    setIsContactOpen(false);
    setIsThemeOpen(false);
  };

  const handleThemeToggle = () => {
    setIsThemeOpen((open) => !open);
    setIsLanguageOpen(false);
    setIsContactOpen(false);
  };

  const handleThemeChange = (themePreference: ThemePreference) => {
    setIsPopping(true);
    setThemePreference(themePreference);
    setIsThemeOpen(false);
    setTimeout(() => setIsPopping(false), 160);
  };

  const handleBrandClick = () => {
    navigate("/");
  };

  const handleProfileClick = () => {
    setIsMenuOpen(false);
    setIsContactOpen(false);
    setIsLanguageOpen(false);
    setIsThemeOpen(false);
    setIsWorkspaceOpen(false);
    navigate("/profile");
  };

  const handleWorkspaceItemClick = (path?: string) => {
    if (path) {
      navigate(path);
    }

    setIsWorkspaceOpen(false);
    setIsMenuOpen(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 180);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const closeMenus = (event: MouseEvent) => {
      if (!navbarRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false);
        setIsContactOpen(false);
        setIsLanguageOpen(false);
        setIsThemeOpen(false);
        setIsWorkspaceOpen(false);
      }
    };

    document.addEventListener("mousedown", closeMenus);

    return () => document.removeEventListener("mousedown", closeMenus);
  }, []);

  return (
    <div
      ref={navbarRef}
      className="relative z-40 bg-red-500 w-full h-23 flex items-center justify-start p-2.5"
    >
      <img
        src="McFlow.svg"
        alt="McFlow Logo"
        onClick={handleBrandClick}
        className={`h-16 sm:h-full rounded-3xl ml-1 sm:ml-2 shadow-md shadow-amber-500 hover:cursor-pointer transition-all duration-800 ease-out ${
          isLoaded ? "translate-x-0 opacity-100" : "-translate-x-5 opacity-0"
        }`}
      />

      <div
        onClick={handleBrandClick}
        className={`flex justify-start flex-col ml-3 sm:ml-4.5 gap-1 select-none hover:cursor-pointer transition-all duration-700 ease-out ${
          isLoaded ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"
        }`}
      >
        <p className="bg-linear-to-r from-yellow-200 to-orange-400 bg-clip-text text-transparent text-2xl sm:text-3xl font-bold">
          McFlow
        </p>
        <hr className="border-amber-400 rounded" />
        <span className="hidden text-gray-100 font-semibold sm:block">
          {t("nav.tagline")}
        </span>
      </div>

      <div
        className={`flex justify-end items-center gap-3 sm:gap-6 ml-auto mr-1 sm:mr-4 text-white font-medium text-lg transition-all duration-700 ease-out ${
          isLoaded ? "translate-x-0 opacity-100" : "translate-x-5 opacity-0"
        }`}
      >
        {user && (
          <div
            onClick={handleProfileClick}
            className="group hidden h-12 items-center justify-center gap-0 overflow-hidden rounded-full border-2 border-amber-300 px-3 text-sm font-bold shadow-md transition-all duration-300 ease-in-out hover:cursor-pointer hover:scale-105 hover:gap-2 hover:bg-gray-800 hover:shadow-gray-700 md:flex"
          >
            <span className="flex max-w-0 translate-x-2 scale-90 items-center overflow-hidden opacity-0 transition-all duration-300 ease-out group-hover:max-w-6 group-hover:translate-x-0 group-hover:scale-100 group-hover:opacity-100 motion-reduce:transition-none">
              <User size={20} />
            </span>

            <span className="select-none">{user?.role}</span>
          </div>
        )}

        <div className="relative hidden md:block">
          <button
            type="button"
            onClick={handleLanguageToggle}
            aria-label={t("language.aria")}
            aria-expanded={isLanguageOpen}
            className="flex h-12 items-center justify-center gap-2 rounded-full border-2 border-amber-300 px-3 text-sm font-bold shadow-md transition-all duration-300 ease-in-out hover:cursor-pointer hover:scale-105 hover:bg-gray-800 hover:shadow-gray-700"
          >
            <Globe2 size={17} />
            <ChevronDown
              size={16}
              className={`transition-transform duration-200 ${
                isLanguageOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          <div
            className={`absolute right-0 top-14 z-20 grid w-60 gap-1 rounded-md border p-2 text-sm shadow-lg transition-all duration-200 ease-in-out ${
              isLight
                ? "border-gray-200 bg-white text-gray-800 shadow-gray-900/15"
                : "border-gray-600 bg-gray-800 text-gray-100 shadow-gray-950/40"
            } ${
              isLanguageOpen
                ? "pointer-events-auto translate-y-0 opacity-100"
                : "pointer-events-none -translate-y-2 opacity-0"
            }`}
          >
            {orderedLanguageOptions.map((language) => {
              const isActive = language.code === activeLanguage.code;

              return (
                <button
                  key={language.code}
                  type="button"
                  onClick={() => handleLanguageChange(language.code)}
                  className={`flex items-center gap-3 rounded-md border p-2 text-left transition-all duration-200 ease-in-out hover:cursor-pointer ${
                    isActive
                      ? isLight
                        ? "border-red-300 bg-amber-50 text-red-700"
                        : "border-amber-300 bg-red-500/20 text-amber-100"
                      : isLight
                      ? "border-transparent hover:border-amber-200 hover:bg-amber-50"
                      : "border-transparent hover:border-gray-500 hover:bg-gray-700"
                  }`}
                >
                  <span className="text-lg leading-none">{language.flag}</span>
                  <span className="flex-1">{language.label}</span>
                  {isActive && (
                    <Check
                      size={15}
                      className={isLight ? "text-red-500" : "text-amber-200"}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={handleThemeToggle}
            aria-label="Theme menu"
            aria-expanded={isThemeOpen}
            className="flex size-12 items-center justify-center rounded-full border-2 border-amber-300 shadow-md touch-manipulation transition-all duration-300 ease-in-out hover:cursor-pointer hover:scale-105 hover:bg-gray-800 hover:shadow-gray-700 active:scale-95 active:bg-gray-800"
          >
            <span
              className={`flex items-center justify-center transition-all duration-300 ease-in-out ${
                isLight
                  ? "rotate-180 text-yellow-200"
                  : "-rotate-12 text-blue-100"
              } ${isPopping ? "scale-125" : isLight ? "scale-110" : "scale-100"}`}
            >
              {isLight ? <SunDim size={17} /> : <Moon size={17} />}
            </span>
          </button>

          <div
            className={`absolute right-0 top-14 z-20 grid w-44 gap-1 rounded-md border p-2 text-sm shadow-lg transition-all duration-200 ease-in-out ${
              isLight
                ? "border-gray-200 bg-white text-gray-800 shadow-gray-900/15"
                : "border-gray-600 bg-gray-800 text-gray-100 shadow-gray-950/40"
            } ${
              isThemeOpen
                ? "pointer-events-auto translate-y-0 opacity-100"
                : "pointer-events-none -translate-y-2 opacity-0"
            }`}
          >
            {themeOptions.map(({ value, label, icon: Icon }) => {
              const isActive = themePreference === value;

              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleThemeChange(value)}
                  className={`flex items-center gap-3 rounded-md border p-2 text-left font-semibold transition-all duration-200 ease-in-out hover:cursor-pointer ${
                    isActive
                      ? isLight
                        ? "border-red-300 bg-amber-50 text-red-700"
                        : "border-amber-300 bg-red-500/20 text-amber-100"
                      : isLight
                      ? "border-transparent hover:border-amber-200 hover:bg-amber-50"
                      : "border-transparent hover:border-gray-500 hover:bg-gray-700"
                  }`}
                >
                  <Icon size={16} />
                  <span className="flex-1">{label}</span>
                  {isActive && (
                    <Check
                      size={15}
                      className={isLight ? "text-red-500" : "text-amber-200"}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsMenuOpen((open) => !open)}
          aria-label={isMenuOpen ? t("nav.closeMenu") : t("nav.openMenu")}
          className="flex size-12 items-center justify-center rounded-full border-2 border-amber-300 shadow-md touch-manipulation transition-all duration-300 ease-in-out hover:cursor-pointer hover:scale-105 hover:bg-gray-800 hover:shadow-gray-700 active:scale-95 active:bg-gray-800 md:hidden"
        >
          <Menu size={20} />
        </button>
      </div>

      <div
        className={`absolute left-0 top-23 z-10 flex w-full flex-col gap-2 bg-red-500 px-4 py-3 text-white font-medium shadow-lg transition-all duration-300 ease-in-out md:hidden ${
          isMenuOpen
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-3 opacity-0"
        }`}
      >
        {user && (
          <button
            type="button"
            onClick={handleProfileClick}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-md border-2 border-amber-300 px-3 text-sm font-bold shadow-md touch-manipulation transition-all duration-200 ease-in-out hover:cursor-pointer hover:bg-gray-800 active:scale-95 active:bg-gray-800"
          >
            <User size={18} />
            <span className="select-none">{user?.role}</span>
          </button>
        )}

        {navItems.map((item) => (
          <div key={item.key} className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => item.key === "contact" && handleContactToggle()}
              className="border-2 border-amber-300 rounded-md p-2 text-center select-none touch-manipulation hover:cursor-pointer hover:bg-gray-800 active:scale-95 active:bg-gray-800 transition-all duration-200 ease-in-out"
            >
              {t(item.labelKey)}
            </button>

            {item.key === "contact" && isContactOpen && (
              <div className="flex gap-2 rounded-md bg-red-500 p-2">
                {contactLinks.map((link) => (
                  <a
                    key={link.title}
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full rounded-md border border-amber-300 p-2 text-center text-sm touch-manipulation hover:bg-gray-800 active:scale-95 active:bg-gray-800 transition-all duration-200 ease-in-out"
                  >
                    {link.title}
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}

        <div className="flex flex-col gap-2 pt-1">
          <button
            type="button"
            onClick={handleLanguageToggle}
            aria-label={t("language.aria")}
            aria-expanded={isLanguageOpen}
            className="flex h-11 items-center justify-center gap-2 rounded-md border-2 border-amber-300 px-3 text-sm font-bold touch-manipulation transition-all duration-200 ease-in-out hover:cursor-pointer hover:bg-gray-800 active:scale-95 active:bg-gray-800"
          >
            <Globe2 size={17} />
            <ChevronDown
              size={16}
              className={`transition-transform duration-200 ${
                isLanguageOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          <div
            className={`grid gap-2 overflow-hidden rounded-md border text-sm shadow-md transition-all duration-300 ease-in-out ${
              isLight
                ? "border-gray-200 bg-white text-gray-800"
                : "border-gray-600 bg-gray-800 text-gray-100"
            } ${
              isLanguageOpen
                ? "max-h-120 p-2 opacity-100"
                : "max-h-0 border-transparent p-0 opacity-0"
            }`}
          >
            {orderedLanguageOptions.map((language) => {
              const isActive = language.code === activeLanguage.code;

              return (
                <button
                  key={language.code}
                  type="button"
                  onClick={() => handleLanguageChange(language.code)}
                  aria-label={`${t("language.aria")}: ${language.label}`}
                  className={`flex h-10 items-center gap-3 rounded-md border px-3 text-left font-semibold touch-manipulation transition-all duration-200 ease-in-out hover:cursor-pointer active:scale-98 ${
                    isActive
                      ? isLight
                        ? "border-red-300 bg-amber-50 text-red-700"
                        : "border-amber-300 bg-red-500/20 text-amber-100"
                      : isLight
                      ? "border-transparent hover:border-amber-200 hover:bg-amber-50"
                      : "border-transparent hover:border-gray-500 hover:bg-gray-700"
                  }`}
                >
                  <span className="text-lg leading-none">{language.flag}</span>
                  <span className="flex-1">{language.label}</span>
                  {isActive && (
                    <Check
                      size={15}
                      className={isLight ? "text-red-500" : "text-amber-200"}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {user && (
        <button
          type="button"
          onClick={() => {
            setIsWorkspaceOpen(true);
            setIsMenuOpen(false);
            setIsContactOpen(false);
            setIsLanguageOpen(false);
            setIsThemeOpen(false);
          }}
          aria-label="Open workspace menu"
          className="fixed bottom-42 right-3 z-20 flex size-14 items-center justify-center rounded-full border-2 border-amber-300 bg-red-500 text-white shadow-xl shadow-red-950/25 touch-manipulation transition-all duration-300 ease-out hover:cursor-pointer active:scale-95 md:hidden"
        >
          <LayoutGrid size={23} />
        </button>
      )}

      {user && (
        <div
          onClick={() => setIsWorkspaceOpen(false)}
          aria-hidden={!isWorkspaceOpen}
          className={`fixed inset-0 z-30 bg-black/35 backdrop-blur-[2px] transition-all duration-300 ease-out md:hidden ${
            isWorkspaceOpen
              ? "pointer-events-auto opacity-100"
              : "pointer-events-none opacity-0"
          }`}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            className={`absolute inset-x-0 bottom-0 rounded-t-2xl border-t px-4 pb-5 pt-4 shadow-2xl transition-all duration-300 ease-out ${
              isWorkspaceOpen
                ? "translate-y-0 opacity-100"
                : "translate-y-full opacity-0"
            } ${
              isLight
                ? "border-amber-200 bg-white text-gray-900"
                : "border-amber-300/30 bg-gray-800 text-white"
            }`}
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-lg font-black">Workspace</p>
                <p
                  className={`text-xs font-semibold ${
                    isLight ? "text-gray-500" : "text-gray-300"
                  }`}
                >
                  Quick access
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsWorkspaceOpen(false)}
                aria-label="Close workspace menu"
                className={`flex size-10 items-center justify-center rounded-full border transition-all duration-200 hover:cursor-pointer active:scale-95 ${
                  isLight
                    ? "border-gray-200 hover:bg-gray-100"
                    : "border-gray-700 hover:bg-gray-700"
                }`}
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {workspaceItems.map(({ label, icon: Icon, path }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => handleWorkspaceItemClick(path)}
                  className={`flex h-20 flex-col items-center justify-center gap-2 rounded-lg border text-sm font-bold transition-all duration-200 hover:cursor-pointer active:scale-95 ${
                    isLight
                      ? "border-gray-200 bg-gray-50 hover:border-amber-300 hover:bg-amber-50 hover:text-red-600"
                      : "border-gray-700 bg-gray-900 hover:border-amber-300 hover:bg-gray-700 hover:text-amber-100"
                  }`}
                >
                  <Icon size={22} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Navbar;
