import { useEffect, useMemo, useRef, useState } from "react";
import {
  Boxes,
  ChevronLeft,
  ChevronRight,
  CircleUserRound,
  LayoutDashboard,
  Package,
  ShoppingCart,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router";
import useAuthStore from "../store/authStore";
import { useThemeStore } from "../store/useThemeStore";

type MenuItem = {
  label: string;
  icon: LucideIcon;
  path: string;
};

const normalizeRole = (role?: string) =>
  role?.replace(/[\s_-]/g, "").toLowerCase() ?? "";

const roleMenuItems: Record<string, MenuItem[]> = {
  admin: [
    { label: "Dashboard", icon: LayoutDashboard, path: "/" },
    { label: "Product Items", icon: Boxes, path: "/product-items" },
    { label: "Product", icon: Package, path: "/product" },
    { label: "Orders", icon: ShoppingCart, path: "/orders" },
    { label: "Employee", icon: UsersRound, path: "/employee" },
  ],
  cashier: [
    { label: "Dashboard", icon: LayoutDashboard, path: "/" },
    { label: "Orders", icon: ShoppingCart, path: "/orders" },
  ],
  warehousestaff: [
    { label: "Dashboard", icon: LayoutDashboard, path: "/" },
    { label: "Product Items", icon: Boxes, path: "/product-items" },
    { label: "Product", icon: Package, path: "/product" },
  ],
};

const Drawer = () => {
  const { user } = useAuthStore();
  const theme = useThemeStore((state) => state.theme);
  const location = useLocation();
  const navigate = useNavigate();
  const drawerRef = useRef<HTMLElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
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

  useEffect(() => {
    if (!isExpanded) return;

    const closeDrawer = (event: MouseEvent) => {
      if (!drawerRef.current?.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };

    document.addEventListener("mousedown", closeDrawer);

    return () => document.removeEventListener("mousedown", closeDrawer);
  }, [isExpanded]);

  if (!user || isPublicRoute) {
    return null;
  }

  return (
    <aside
      ref={drawerRef}
      className={`sticky top-23 hidden shrink-0 border-r transition-all duration-300 ease-in-out md:flex ${
        isExpanded ? "w-[220px]" : "w-[72px]"
      } ${
        isLight
          ? "border-gray-200 bg-white text-gray-600 shadow-gray-900/5"
          : "border-gray-700 bg-gray-800 text-gray-300 shadow-black/20"
      }`}
    >
      <nav className="flex h-full w-full flex-col items-center gap-2 px-3 py-6">
        <button
          type="button"
          onClick={() => setIsExpanded((expanded) => !expanded)}
          aria-label={isExpanded ? "Collapse drawer" : "Expand drawer"}
          className={`mb-2 flex h-10 w-full items-center rounded-lg text-sm font-bold transition-all duration-300 ease-in-out hover:cursor-pointer ${
            isExpanded ? "justify-between gap-3 px-3" : "justify-center px-0"
          } ${
            isLight
              ? "text-gray-600 hover:bg-gray-100 hover:text-red-600"
              : "text-gray-300 hover:bg-gray-700 hover:text-amber-200"
          }`}
        >
          <span
            className={`overflow-hidden whitespace-nowrap text-[13px] transition-all duration-300 ease-in-out ${
              isExpanded
                ? "max-w-24 translate-x-0 opacity-100"
                : "max-w-0 -translate-x-2 opacity-0"
            }`}
          >
            Menu
          </span>

          {isExpanded ? (
            <ChevronLeft size={20} strokeWidth={2.25} />
          ) : (
            <ChevronRight size={20} strokeWidth={2.25} />
          )}
        </button>

        {menuItems.slice(0, 3).map(({ label, icon: Icon, path }) => {
          const isActive = path === location.pathname;

          return (
            <button
              key={label}
              type="button"
              title={label}
              onClick={() => path && navigate(path)}
              className={`group flex h-11 w-full items-center rounded-lg border border-transparent text-sm font-semibold transition-all duration-300 ease-in-out hover:cursor-pointer ${
                isExpanded ? "justify-start gap-3 px-3" : "justify-center px-0"
              } ${isActive ? activeButtonClass : drawerButtonClass}`}
            >
              <Icon
                size={22}
                strokeWidth={2.25}
                className="shrink-0 transition-transform duration-300 ease-in-out group-hover:scale-105"
              />

              <span
                className={`overflow-hidden whitespace-nowrap text-[13px] transition-all duration-300 ease-in-out ${
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

        {menuItems.slice(3).map(({ label, icon: Icon, path }) => {
          const isActive = path === location.pathname;

          return (
            <button
              key={label}
              type="button"
              title={label}
              onClick={() => path && navigate(path)}
              className={`group flex h-11 w-full items-center rounded-lg border border-transparent text-sm font-semibold transition-all duration-300 ease-in-out hover:cursor-pointer ${
                isExpanded ? "justify-start gap-3 px-3" : "justify-center px-0"
              } ${isActive ? activeButtonClass : drawerButtonClass}`}
            >
              <Icon
                size={22}
                strokeWidth={2.25}
                className="shrink-0 transition-transform duration-300 ease-in-out group-hover:scale-105"
              />

              <span
                className={`overflow-hidden whitespace-nowrap text-[13px] transition-all duration-300 ease-in-out ${
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

        <div className="flex-1" />

        <button
          type="button"
          title="Profile"
          onClick={() => navigate("/profile")}
          className={`group flex h-11 w-full items-center rounded-lg border border-transparent text-sm font-semibold transition-all duration-300 ease-in-out hover:cursor-pointer ${
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
            className="shrink-0 transition-transform duration-300 ease-in-out group-hover:scale-105"
          />

          <span
            className={`overflow-hidden whitespace-nowrap text-[13px] transition-all duration-300 ease-in-out ${
              isExpanded
                ? "max-w-32 translate-x-0 opacity-100"
                : "max-w-0 -translate-x-2 opacity-0"
            }`}
          >
            Profile
          </span>
        </button>
      </nav>
    </aside>
  );
};

export default Drawer;
