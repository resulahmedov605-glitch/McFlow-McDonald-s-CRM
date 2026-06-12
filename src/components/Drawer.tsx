import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";
import {
  Boxes,
  BriefcaseBusiness,
  ChevronLeft,
  ChevronRight,
  CircleUserRound,
  Code2,
  LayoutDashboard,
  Package,
  Send,
  ShoppingCart,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import useAuthStore from "../store/authStore";
import { useThemeStore } from "../store/useThemeStore";

type MenuItem = {
  labelKey: string;
  icon: LucideIcon;
  path: string;
};

const normalizeRole = (role?: string) =>
  role?.replace(/[\s_-]/g, "").toLowerCase() ?? "";

const roleMenuItems: Record<string, MenuItem[]> = {
  admin: [
    { labelKey: "drawer.dashboard", icon: LayoutDashboard, path: "/" },
    { labelKey: "drawer.productItems", icon: Boxes, path: "/product-items" },
    { labelKey: "drawer.products", icon: Package, path: "/Products" },
    { labelKey: "drawer.orders", icon: ShoppingCart, path: "/orders" },
    { labelKey: "drawer.employee", icon: UsersRound, path: "/employee" },
  ],
  cashier: [
    { labelKey: "drawer.dashboard", icon: LayoutDashboard, path: "/" },
    { labelKey: "drawer.orders", icon: ShoppingCart, path: "/orders" },
  ],
  warehousestaff: [
    { labelKey: "drawer.dashboard", icon: LayoutDashboard, path: "/" },
    { labelKey: "drawer.productItems", icon: Boxes, path: "/product-items" },
    { labelKey: "drawer.products", icon: Package, path: "/product" },
  ],
};

const creatorLinks = [
  {
    title: "GitHub",
    href: "https://github.com/resulahmedov605-glitch",
    icon: Code2,
  },
  {
    title: "LinkedIn",
    href: "https://www.linkedin.com/in/resul-ahmedov-342933348/",
    icon: BriefcaseBusiness,
  },
];

const Drawer = () => {
  const { user } = useAuthStore();
  const theme = useThemeStore((state) => state.theme);
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const drawerRef = useRef<HTMLElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const isLight = theme === "light";
  const isPublicRoute =
    location.pathname === "/login" || location.pathname.includes("/verify");
  const drawerButtonClass = isLight
    ? "text-gray-600 hover:bg-amber-50 hover:text-red-600"
    : "text-gray-300 hover:bg-gray-700 hover:text-amber-200";
  const activeButtonClass = isLight
    ? "border-amber-300 bg-red-50 text-red-600 shadow-sm shadow-red-900/5"
    : "border-amber-300 bg-red-500/15 text-amber-100 shadow-sm shadow-black/20";

  const menuItems = useMemo(() => {
    const role = normalizeRole(user?.role);
    const roleItems =
      role === "administrator" ? roleMenuItems.admin : roleMenuItems[role] ?? [];

    return roleItems;
  }, [user?.role]);

  const closeExpandedDrawer = () => {
    setIsExpanded(false);
    setIsContactOpen(false);
  };

  const toggleDrawer = () => {
    if (isExpanded) {
      closeExpandedDrawer();
      return;
    }

    setIsExpanded(true);
  };

  const handleDrawerBlankClick = (event: ReactMouseEvent<HTMLElement>) => {
    if (
      !isExpanded ||
      !isContactOpen ||
      event.target !== event.currentTarget
    ) {
      return;
    }

    setIsContactOpen(false);
  };

  useEffect(() => {
    if (!isExpanded) return;

    const closeDrawer = (event: MouseEvent) => {
      if (!drawerRef.current?.contains(event.target as Node)) {
        closeExpandedDrawer();
      }
    };

    document.addEventListener("mousedown", closeDrawer);

    return () => document.removeEventListener("mousedown", closeDrawer);
  }, [isExpanded]);

  if (!user || isPublicRoute) {
    return null;
  }

  const handleContactToggle = () => {
    if (!isExpanded) {
      setIsExpanded(true);
      setIsContactOpen(true);
      return;
    }

    setIsContactOpen((open) => !open);
  };

  return (
    <aside
      ref={drawerRef}
      onClick={handleDrawerBlankClick}
      className={`sticky top-23 hidden shrink-0 border-r transition-all duration-[350ms] ease-in-out md:flex ${
        isExpanded ? "w-[220px]" : "w-[72px]"
      } ${
        isLight
          ? "border-gray-200 bg-white text-gray-600 shadow-gray-900/5"
          : "border-gray-700 bg-gray-800 text-gray-300 shadow-black/20"
      }`}
    >
      <nav
        onClick={handleDrawerBlankClick}
        className="flex h-full w-full flex-col items-center gap-2 px-3 py-6"
      >
        <button
          type="button"
          onClick={toggleDrawer}
          aria-label={isExpanded ? t("drawer.collapse") : t("drawer.expand")}
          className={`mb-2 flex h-10 w-full items-center rounded-lg text-sm font-bold transition-all duration-[350ms] ease-in-out hover:cursor-pointer ${
            isExpanded ? "justify-between gap-3 px-3" : "justify-center px-0"
          } ${
            isLight
              ? "text-gray-600 hover:bg-gray-100 hover:text-red-600"
              : "text-gray-300 hover:bg-gray-700 hover:text-amber-200"
          }`}
        >
          <span
            className={`overflow-hidden whitespace-nowrap text-[13px] transition-all duration-[350ms] ease-in-out ${
              isExpanded
                ? "max-w-24 translate-x-0 opacity-100"
                : "max-w-0 -translate-x-2 opacity-0"
            }`}
          >
            {t("drawer.menu")}
          </span>

          {isExpanded ? (
            <ChevronLeft size={20} strokeWidth={2.25} />
          ) : (
            <ChevronRight size={20} strokeWidth={2.25} />
          )}
        </button>

        {menuItems.slice(0, 3).map(({ labelKey, icon: Icon, path }) => {
          const isActive = path === location.pathname;
          const label = t(labelKey);

          return (
            <button
              key={labelKey}
              type="button"
              title={label}
              onClick={() => path && navigate(path)}
              className={`group flex h-11 w-full items-center rounded-lg border border-transparent text-sm font-semibold transition-all duration-[350ms] ease-in-out hover:cursor-pointer ${
                isExpanded ? "justify-start gap-3 px-3" : "justify-center px-0"
              } ${isActive ? activeButtonClass : drawerButtonClass}`}
            >
              <Icon
                size={22}
                strokeWidth={2.25}
                className="shrink-0 transition-transform duration-[350ms] ease-in-out group-hover:scale-105"
              />

              <span
                className={`overflow-hidden whitespace-nowrap text-[13px] transition-all duration-[350ms] ease-in-out ${
                  isExpanded
                    ? "max-w-32 translate-x-0 opacity-100"
                    : "max-w-0 -translate-x-2 opacity-0"
                }`}
              >
                {label}
              </span>
            </button>
          );
        })}

        {menuItems.length > 3 && (
          <div
            className={`my-3 h-px w-10 rounded-full ${
              isLight ? "bg-gray-200" : "bg-gray-700"
            }`}
          />
        )}

        {menuItems.slice(3).map(({ labelKey, icon: Icon, path }) => {
          const isActive = path === location.pathname;
          const label = t(labelKey);

          return (
            <button
              key={labelKey}
              type="button"
              title={label}
              onClick={() => path && navigate(path)}
              className={`group flex h-11 w-full items-center rounded-lg border border-transparent text-sm font-semibold transition-all duration-[350ms] ease-in-out hover:cursor-pointer ${
                isExpanded ? "justify-start gap-3 px-3" : "justify-center px-0"
              } ${isActive ? activeButtonClass : drawerButtonClass}`}
            >
              <Icon
                size={22}
                strokeWidth={2.25}
                className="shrink-0 transition-transform duration-[350ms] ease-in-out group-hover:scale-105"
              />

              <span
                className={`overflow-hidden whitespace-nowrap text-[13px] transition-all duration-[350ms] ease-in-out ${
                  isExpanded
                    ? "max-w-32 translate-x-0 opacity-100"
                    : "max-w-0 -translate-x-2 opacity-0"
                }`}
              >
                {label}
              </span>
            </button>
          );
        })}

        <div
          aria-hidden="true"
          onClick={() => setIsContactOpen(false)}
          className="w-full flex-1"
        />

        <div className="w-full">
          <button
            type="button"
            title="Contact creator"
            onClick={handleContactToggle}
            aria-expanded={isExpanded && isContactOpen}
            className={`group flex h-11 w-full items-center rounded-lg border border-transparent text-sm font-semibold transition-all duration-[350ms] ease-in-out hover:cursor-pointer ${
              isExpanded ? "justify-start gap-3 px-3" : "justify-center"
            } ${drawerButtonClass}`}
          >
            <Send
              size={22}
              strokeWidth={2.25}
              className="shrink-0 transition-transform duration-[350ms] ease-in-out group-hover:scale-105"
            />

            {isExpanded && (
              <>
                <span className="min-w-0 flex-1 overflow-hidden whitespace-nowrap text-left text-[13px]">
                  Contact creator
                </span>

                <ChevronRight
                  size={16}
                  strokeWidth={2.4}
                  className={`shrink-0 transition-transform duration-[350ms] ease-in-out ${
                    isContactOpen ? "rotate-90" : ""
                  }`}
                />
              </>
            )}
          </button>

          {isExpanded && (
            <div
              className={`grid overflow-hidden rounded-xl border shadow-sm transition-all duration-[350ms] ease-in-out ${
                isLight
                  ? "border-gray-200 bg-white shadow-gray-900/5"
                  : "border-gray-700 bg-gray-800/80 shadow-black/10"
              } ${
                isContactOpen
                  ? "mt-1 max-h-24 translate-y-0 p-1 opacity-100"
                  : "mt-0 max-h-0 -translate-y-1 p-0 opacity-0"
              }`}
            >
              {creatorLinks.map(({ title, href, icon: Icon }) => (
                <a
                  key={title}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className={`group flex h-9 items-center gap-2 rounded-lg px-3 text-xs font-bold transition-all duration-200 hover:cursor-pointer ${
                    isLight
                      ? "text-gray-600 hover:bg-amber-50 hover:text-red-600"
                      : "text-gray-300 hover:bg-gray-700 hover:text-amber-100"
                  }`}
                >
                  <Icon
                    size={17}
                    strokeWidth={2.25}
                    className="shrink-0 transition-transform duration-200 group-hover:scale-105"
                  />
                  <span>{title}</span>
                </a>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          title={t("drawer.profile")}
          onClick={() => navigate("/profile")}
          className={`group flex h-11 w-full items-center rounded-lg border border-transparent text-sm font-semibold transition-all duration-[350ms] ease-in-out hover:cursor-pointer ${
            isExpanded ? "justify-start gap-3 px-3" : "justify-center px-0"
          } ${
            location.pathname === "/profile"
              ? activeButtonClass
              : drawerButtonClass
          }`}
        >
          <CircleUserRound
            size={22}
            strokeWidth={2.25}
            className="shrink-0 transition-transform duration-[350ms] ease-in-out group-hover:scale-105"
          />

          <span
            className={`overflow-hidden whitespace-nowrap text-[13px] transition-all duration-[350ms] ease-in-out ${
              isExpanded
                ? "max-w-32 translate-x-0 opacity-100"
                : "max-w-0 -translate-x-2 opacity-0"
            }`}
          >
            {t("drawer.profile")}
          </span>
        </button>
      </nav>
    </aside>
  );
};

export default Drawer;
