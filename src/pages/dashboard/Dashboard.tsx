import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Boxes,
  CalendarDays,
  ChevronDown,
  CircleDollarSign,
  ClipboardList,
  ListChecks,
  LoaderCircle,
  Package,
  RefreshCcw,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  UsersRound,
  Warehouse,
  type LucideIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import toast from "react-hot-toast";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { getOrders, type Order } from "../../lib/services/orderService";
import {
  getProductItems,
  type ProductItem,
} from "../../lib/services/productItemsService";
import { getProducts, type Product } from "../../lib/services/productService";
import { getProfilePictureUrl } from "../../lib/profilePicture";
import useAuthStore from "../../store/authStore";
import { useThemeStore } from "../../store/useThemeStore";

type QuickNavKey = "productItems" | "products" | "orders" | "employee" | "profile";

type QuickNavConfig = {
  key: QuickNavKey;
  labelKey: string;
  path: string;
  icon: LucideIcon;
};

type MetricCard = {
  label: string;
  value: string;
  helper: string;
  icon: LucideIcon;
  accentClassName: string;
  iconClassName: string;
  showCurrencySelect?: boolean;
};

type DashboardAlertTone = "danger" | "warning" | "success" | "info";

type DashboardAlert = {
  key: string;
  title: string;
  helper: string;
  tone: DashboardAlertTone;
  icon: LucideIcon;
  path?: string;
};

type FocusCard = {
  key: string;
  label: string;
  value: string;
  helper: string;
  icon: LucideIcon;
  path: string;
};

type DashboardCurrency = "AZN" | "USD" | "EUR";
type DashboardTrendRange = "week" | "month";

const lowStockThreshold = 10;

const currencyOptions: Array<{ label: string; value: DashboardCurrency }> = [
  { label: "AZN", value: "AZN" },
  { label: "USD $", value: "USD" },
  { label: "EUR €", value: "EUR" },
];

const currencyRatesFromAzn: Record<DashboardCurrency, number> = {
  AZN: 1,
  USD: 0.59,
  EUR: 0.54,
};

const trendRangeDayCount: Record<DashboardTrendRange, number> = {
  week: 7,
  month: 30,
};

const quickNavByRole: Record<string, QuickNavConfig[]> = {
  admin: [
    {
      key: "productItems",
      labelKey: "drawer.productItems",
      path: "/product-items",
      icon: Boxes,
    },
    {
      key: "products",
      labelKey: "drawer.products",
      path: "/Products",
      icon: Package,
    },
    {
      key: "orders",
      labelKey: "drawer.orders",
      path: "/orders",
      icon: ShoppingCart,
    },
    {
      key: "employee",
      labelKey: "drawer.employee",
      path: "/employee",
      icon: UsersRound,
    },
    {
      key: "profile",
      labelKey: "drawer.profile",
      path: "/profile",
      icon: BadgeCheck,
    },
  ],
  cashier: [
    {
      key: "orders",
      labelKey: "drawer.orders",
      path: "/orders",
      icon: ShoppingCart,
    },
    {
      key: "profile",
      labelKey: "drawer.profile",
      path: "/profile",
      icon: BadgeCheck,
    },
  ],
  warehousestaff: [
    {
      key: "productItems",
      labelKey: "drawer.productItems",
      path: "/product-items",
      icon: Boxes,
    },
    {
      key: "products",
      labelKey: "drawer.products",
      path: "/product",
      icon: Package,
    },
    {
      key: "profile",
      labelKey: "drawer.profile",
      path: "/profile",
      icon: BadgeCheck,
    },
  ],
};

const orderStatusOrder = [
  "Created",
  "Approved",
  "InProgress",
  "Completed",
  "Rejected",
] as const;

const orderStatusColors: Record<string, string> = {
  created: "#f59e0b",
  approved: "#3b82f6",
  inprogress: "#8b5cf6",
  completed: "#10b981",
  rejected: "#ef4444",
};

const chartPalette = ["#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6"];
const mcdonaldsRed = "#DA291C";

const normalizeRole = (role?: string) =>
  role?.replace(/[\s_-]/g, "").toLowerCase() ?? "";

const getRoleQuickNav = (role?: string) => {
  const normalizedRole = normalizeRole(role);
  const roleKey = normalizedRole === "administrator" ? "admin" : normalizedRole;

  return quickNavByRole[roleKey] ?? quickNavByRole.admin;
};

const normalizeStatus = (status: string) =>
  status.replace(/[\s_-]/g, "").toLowerCase();

const getStatusTranslationKey = (status: string) => {
  const normalizedStatus = normalizeStatus(status);

  if (normalizedStatus === "created") return "Created";
  if (normalizedStatus === "approved") return "Approved";
  if (normalizedStatus === "inprogress") return "inProgress";
  if (normalizedStatus === "completed") return "Completed";
  if (normalizedStatus === "rejected") return "Rejected";

  return status;
};

const getOrderTotal = (order: Order) =>
  (order.items ?? []).reduce(
    (total, item) => total + (item.price || 0) * (item.quantity || 0),
    0
  );

const convertFromAzn = (
  value: number | null | undefined,
  currency: DashboardCurrency
) => (Number.isFinite(value ?? NaN) ? value ?? 0 : 0) * currencyRatesFromAzn[currency];

const formatCurrency = (
  value: number | null | undefined,
  locale: string,
  currency: DashboardCurrency
) =>
  new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value ?? NaN) ? value ?? 0 : 0);

const formatNumber = (value: number | null | undefined, locale: string) =>
  new Intl.NumberFormat(locale, {
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value ?? NaN) ? value ?? 0 : 0);

const formatCompactNumber = (value: number | null | undefined, locale: string) =>
  new Intl.NumberFormat(locale, {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Number.isFinite(value ?? NaN) ? value ?? 0 : 0);

const formatPercent = (value: number, locale: string) =>
  `${formatNumber(value, locale)}%`;

const formatSignedPercent = (value: number, locale: string) =>
  `${value > 0 ? "+" : ""}${formatPercent(value, locale)}`;

const capitalizeFirst = (value: string) =>
  value ? `${value.charAt(0).toUpperCase()}${value.slice(1)}` : value;

const getValidDate = (value: string | null | undefined) => {
  if (!value) return null;

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
};

const getDateKey = (date: Date) =>
  [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");

const formatDateTime = (
  value: string | null | undefined,
  locale: string,
  fallback: string
) => {
  const date = getValidDate(value);

  if (!date) return fallback;

  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const trimChartLabel = (value: string, maxLength = 14) =>
  value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;

const getStatusPillClassName = (status: string, isLight: boolean) => {
  const normalizedStatus = normalizeStatus(status);

  if (normalizedStatus === "completed") {
    return isLight
      ? "border-emerald-300 bg-emerald-50 text-emerald-700"
      : "border-emerald-300/60 bg-emerald-500/15 text-emerald-100";
  }

  if (normalizedStatus === "approved" || normalizedStatus === "inprogress") {
    return isLight
      ? "border-blue-300 bg-blue-50 text-blue-700"
      : "border-blue-300/60 bg-blue-500/15 text-blue-100";
  }

  if (normalizedStatus === "rejected") {
    return isLight
      ? "border-red-300 bg-red-50 text-red-700"
      : "border-red-400/60 bg-red-500/15 text-red-200";
  }

  return isLight
    ? "border-amber-300 bg-amber-50 text-amber-700"
    : "border-amber-300/70 bg-amber-500/15 text-amber-100";
};

const getAlertToneClassName = (tone: DashboardAlertTone, isLight: boolean) => {
  if (tone === "danger") {
    return isLight
      ? "border-red-200 bg-red-50 text-red-700"
      : "border-red-400/40 bg-red-500/15 text-red-100";
  }

  if (tone === "warning") {
    return isLight
      ? "border-amber-200 bg-amber-50 text-amber-800"
      : "border-amber-300/50 bg-amber-500/15 text-amber-100";
  }

  if (tone === "success") {
    return isLight
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : "border-emerald-300/40 bg-emerald-500/15 text-emerald-100";
  }

  return isLight
    ? "border-blue-200 bg-blue-50 text-blue-700"
    : "border-blue-300/40 bg-blue-500/15 text-blue-100";
};

const Dashboard = () => {
  const theme = useThemeStore((state) => state.theme);
  const currentUser = useAuthStore((state) => state.user);
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [productItems, setProductItems] = useState<ProductItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [warningMessage, setWarningMessage] = useState("");
  const [brokenProfilePictureUrl, setBrokenProfilePictureUrl] = useState("");
  const [selectedCurrency, setSelectedCurrency] =
    useState<DashboardCurrency>("AZN");
  const [selectedTrendRange, setSelectedTrendRange] =
    useState<DashboardTrendRange>("week");
  const isLight = theme === "light";
  const locale = i18n.resolvedLanguage ?? i18n.language;
  const selectedTrendDayCount = trendRangeDayCount[selectedTrendRange];
  const userDisplayName = currentUser?.fullName || t("common.unnamedUser");
  const userInitials = userDisplayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((name) => name[0]?.toUpperCase())
    .join("");
  const profilePictureUrl = getProfilePictureUrl(
    currentUser,
    currentUser?.updatedAt
  );
  const shouldShowProfilePicture =
    profilePictureUrl && profilePictureUrl !== brokenProfilePictureUrl;
  const normalizedUserRole = normalizeRole(currentUser?.role);
  const userRoleKey = [
    "admin",
    "administrator",
    "cashier",
    "warehousestaff",
  ].includes(normalizedUserRole)
    ? normalizedUserRole
    : "untrusted";
  const userRole = t(`profile.roles.${userRoleKey}.label`, {
    defaultValue: currentUser?.role || t("common.notAvailable"),
  });
  const userRoleDescription = t(`profile.roles.${userRoleKey}.description`, {
    defaultValue: "",
  });
  const userRoleTooltipId = "dashboard-user-role-tooltip";
  const chartTextColor = isLight ? "#6b7280" : "#9ca3af";
  const chartGridColor = isLight ? "#e5e7eb" : "#374151";
  const tooltipStyle = {
    border: `1px solid ${isLight ? "#e5e7eb" : "#374151"}`,
    borderRadius: 12,
    background: isLight ? "#ffffff" : "#111827",
    color: isLight ? "#111827" : "#f9fafb",
    boxShadow: "0 12px 30px rgb(15 23 42 / 0.14)",
    fontWeight: 700,
  };
  const tooltipLabelStyle = {
    color: isLight ? "#111827" : "#f9fafb",
    fontWeight: 800,
  };
  const tooltipItemStyle = {
    color: isLight ? "#111827" : "#f9fafb",
    fontWeight: 700,
  };

  const getTranslatedStatusLabel = useCallback(
    (status: string) =>
      t(`orders.status.${getStatusTranslationKey(status)}`, {
        defaultValue:
          normalizeStatus(status) === "inprogress" ? "In Progress" : status,
      }),
    [t]
  );

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");
    setWarningMessage("");

    const results = await Promise.allSettled([
      getOrders(),
      getProducts(),
      getProductItems(),
    ]);

    const [ordersResult, productsResult, productItemsResult] = results;
    const allFailed = results.every((result) => result.status === "rejected");

    if (allFailed) {
      setOrders([]);
      setProducts([]);
      setProductItems([]);
      setErrorMessage("dashboard.loadError");
      toast.error(t("dashboard.loadError"), { id: "dashboard-load-error" });
      setIsLoading(false);
      return;
    }

    setOrders(ordersResult.status === "fulfilled" ? ordersResult.value : []);
    setProducts(
      productsResult.status === "fulfilled" ? productsResult.value : []
    );
    setProductItems(
      productItemsResult.status === "fulfilled" ? productItemsResult.value : []
    );
    setWarningMessage(
      results.some((result) => result.status === "rejected")
        ? "dashboard.partialLoadError"
        : ""
    );
    setIsLoading(false);
  }, [t]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      void loadDashboard();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [loadDashboard]);

  const productById = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products]
  );

  const dashboardStats = useMemo(() => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const todayKey = getDateKey(today);
    const yesterdayKey = getDateKey(yesterday);
    const totalRevenue = orders.reduce(
      (total, order) => total + getOrderTotal(order),
      0
    );
    const todayOrders = orders.filter((order) => {
      const date = getValidDate(order.createdAt);

      return date ? getDateKey(date) === todayKey : false;
    });
    const yesterdayOrders = orders.filter((order) => {
      const date = getValidDate(order.createdAt);

      return date ? getDateKey(date) === yesterdayKey : false;
    });
    const todayRevenue = todayOrders.reduce(
      (total, order) => total + getOrderTotal(order),
      0
    );
    const yesterdayRevenue = yesterdayOrders.reduce(
      (total, order) => total + getOrderTotal(order),
      0
    );
    const completedOrders = orders.filter(
      (order) => normalizeStatus(order.status) === "completed"
    ).length;
    const activeOrders = orders.filter((order) =>
      ["created", "approved", "inprogress"].includes(
        normalizeStatus(order.status)
      )
    ).length;
    const inventoryValue = productItems.reduce(
      (total, item) => total + (item.pricePerUnit || 0) * (item.stock || 0),
      0
    );
    const lowStockItems = productItems.filter(
      (item) => (item.stock || 0) <= lowStockThreshold
    ).length;
    const averageOrderValue = orders.length ? totalRevenue / orders.length : 0;
    const completedRate = orders.length
      ? (completedOrders / orders.length) * 100
      : 0;

    return {
      activeOrders,
      averageOrderValue,
      completedOrders,
      completedRate,
      inventoryValue,
      lowStockItems,
      todayOrders: todayOrders.length,
      todayRevenue,
      totalRevenue,
      yesterdayOrders: yesterdayOrders.length,
      yesterdayRevenue,
    };
  }, [orders, productItems]);

  const quickNavigation = useMemo(() => {
    const getHelper = (key: QuickNavKey) => {
      if (key === "productItems") {
        return t("dashboard.quickNav.itemCount", {
          count: productItems.length,
        });
      }

      if (key === "products") {
        return t("dashboard.quickNav.productCount", {
          count: products.length,
        });
      }

      if (key === "orders") {
        return t("dashboard.quickNav.orderCount", {
          count: orders.length,
        });
      }

      if (key === "employee") {
        return t("dashboard.quickNav.employeeMeta");
      }

      return currentUser?.role || t("common.profile");
    };

    return getRoleQuickNav(currentUser?.role).map((item) => ({
      ...item,
      helper: getHelper(item.key),
    }));
  }, [currentUser?.role, orders.length, productItems.length, products.length, t]);

  const revenueTrendData = useMemo(() => {
    const today = new Date();
    const revenueByDay = new Map<string, { orders: number; revenue: number }>();

    orders.forEach((order) => {
      const date = getValidDate(order.createdAt);

      if (!date) return;

      const key = getDateKey(date);
      const current = revenueByDay.get(key) ?? { orders: 0, revenue: 0 };
      current.orders += 1;
      current.revenue += getOrderTotal(order);
      revenueByDay.set(key, current);
    });

    return Array.from({ length: selectedTrendDayCount }, (_, index) => {
      const date = new Date(today);
      date.setHours(0, 0, 0, 0);
      date.setDate(today.getDate() - (selectedTrendDayCount - 1 - index));

      const key = getDateKey(date);
      const value = revenueByDay.get(key) ?? { orders: 0, revenue: 0 };
      const month = t(
        `dashboard.months.${String(date.getMonth() + 1).padStart(2, "0")}`,
        {
          defaultValue: new Intl.DateTimeFormat(locale, {
            month: "long",
          }).format(date),
        }
      );

      return {
        label: `${date.getDate()} ${capitalizeFirst(month)} ${date.getFullYear()}`,
        orders: value.orders,
        revenue: Number(convertFromAzn(value.revenue, selectedCurrency).toFixed(2)),
      };
    });
  }, [locale, orders, selectedCurrency, selectedTrendDayCount, t]);

  const orderStatusData = useMemo(
    () =>
      orderStatusOrder
        .map((status) => {
          const normalizedStatus = normalizeStatus(status);

          return {
            name: getTranslatedStatusLabel(status),
            value: orders.filter(
              (order) => normalizeStatus(order.status) === normalizedStatus
            ).length,
            color: orderStatusColors[normalizedStatus] ?? "#6b7280",
          };
        })
        .filter((item) => item.value > 0),
    [getTranslatedStatusLabel, orders]
  );

  const topProductData = useMemo(() => {
    const productPerformance = new Map<
      string,
      { name: string; quantity: number; revenue: number }
    >();

    orders.forEach((order) => {
      (order.items ?? []).forEach((item) => {
        const product = productById.get(item.productId);
        const fallbackName = item.productId
          ? `#${item.productId.slice(0, 6)}`
          : t("common.unnamedProduct");
        const current = productPerformance.get(item.productId) ?? {
          name: product?.name || fallbackName,
          quantity: 0,
          revenue: 0,
        };

        current.quantity += item.quantity || 0;
        current.revenue += (item.price || 0) * (item.quantity || 0);
        productPerformance.set(item.productId, current);
      });
    });

    return Array.from(productPerformance.values())
      .sort((left, right) => right.revenue - left.revenue)
      .slice(0, 5)
      .map((item) => ({
        ...item,
        name: trimChartLabel(item.name),
        revenue: Number(convertFromAzn(item.revenue, selectedCurrency).toFixed(2)),
      }));
  }, [orders, productById, selectedCurrency, t]);

  const topSellingProductData = useMemo(() => {
    const productPerformance = new Map<
      string,
      { name: string; quantity: number; revenue: number }
    >();

    orders.forEach((order) => {
      (order.items ?? []).forEach((item) => {
        const product = productById.get(item.productId);
        const fallbackName = item.productId
          ? `#${item.productId.slice(0, 6)}`
          : t("common.unnamedProduct");
        const current = productPerformance.get(item.productId) ?? {
          name: product?.name || fallbackName,
          quantity: 0,
          revenue: 0,
        };

        current.quantity += item.quantity || 0;
        current.revenue += (item.price || 0) * (item.quantity || 0);
        productPerformance.set(item.productId, current);
      });
    });

    return Array.from(productPerformance.values())
      .sort((left, right) => right.quantity - left.quantity)
      .slice(0, 5)
      .map((item) => ({
        ...item,
        name: trimChartLabel(item.name, 18),
        revenue: Number(convertFromAzn(item.revenue, selectedCurrency).toFixed(2)),
      }));
  }, [orders, productById, selectedCurrency, t]);

  const stockByUnitData = useMemo(() => {
    const unitSummary = new Map<string, { stock: number; value: number }>();

    productItems.forEach((item) => {
      const current = unitSummary.get(item.unit) ?? { stock: 0, value: 0 };
      current.stock += item.stock || 0;
      current.value += (item.pricePerUnit || 0) * (item.stock || 0);
      unitSummary.set(item.unit, current);
    });

    return Array.from(unitSummary.entries())
      .map(([unit, summary]) => ({
        unit: t(`units.${unit}`, { defaultValue: unit }),
        stock: Number(summary.stock.toFixed(2)),
        value: Number(convertFromAzn(summary.value, selectedCurrency).toFixed(2)),
      }))
      .sort((left, right) => right.value - left.value)
      .slice(0, 6);
  }, [productItems, selectedCurrency, t]);

  const recentOrders = useMemo(
    () =>
      [...orders]
        .sort(
          (left, right) =>
            (getValidDate(right.createdAt)?.getTime() ?? 0) -
            (getValidDate(left.createdAt)?.getTime() ?? 0)
        )
        .slice(0, 5),
    [orders]
  );

  const todaySalesChange = dashboardStats.yesterdayRevenue
    ? ((dashboardStats.todayRevenue - dashboardStats.yesterdayRevenue) /
        dashboardStats.yesterdayRevenue) *
      100
    : dashboardStats.todayRevenue > 0
      ? 100
      : 0;
  const todaySalesHelper =
    dashboardStats.yesterdayRevenue > 0
      ? t("dashboard.metrics.todaySalesCompare", {
          value: formatSignedPercent(todaySalesChange, locale),
        })
      : dashboardStats.todayRevenue > 0
        ? t("dashboard.metrics.todaySalesNoYesterday")
        : t("dashboard.metrics.todaySalesEmpty");

  const dashboardAlerts = useMemo<DashboardAlert[]>(() => {
    const alerts: DashboardAlert[] = [];

    if (dashboardStats.lowStockItems > 0) {
      alerts.push({
        key: "lowStock",
        title: t("dashboard.alerts.lowStockTitle", {
          count: dashboardStats.lowStockItems,
        }),
        helper: t("dashboard.alerts.lowStockHelp"),
        tone: "danger",
        icon: AlertTriangle,
        path: "/product-items",
      });
    }

    if (dashboardStats.activeOrders > 0) {
      alerts.push({
        key: "openOrders",
        title: t("dashboard.alerts.openOrdersTitle", {
          count: dashboardStats.activeOrders,
        }),
        helper: t("dashboard.alerts.openOrdersHelp"),
        tone: "warning",
        icon: ListChecks,
        path: "/orders",
      });
    }

    if (dashboardStats.todayOrders === 0) {
      alerts.push({
        key: "noTodayOrders",
        title: t("dashboard.alerts.noTodayOrdersTitle"),
        helper: t("dashboard.alerts.noTodayOrdersHelp"),
        tone: "info",
        icon: CalendarDays,
        path: "/orders",
      });
    }

    if (
      dashboardStats.todayRevenue > dashboardStats.yesterdayRevenue &&
      dashboardStats.yesterdayRevenue > 0
    ) {
      alerts.push({
        key: "todaySalesUp",
        title: t("dashboard.alerts.todaySalesUpTitle", {
          value: formatSignedPercent(todaySalesChange, locale),
        }),
        helper: t("dashboard.alerts.todaySalesUpHelp"),
        tone: "success",
        icon: TrendingUp,
      });
    }

    if (!alerts.length) {
      alerts.push({
        key: "allGood",
        title: t("dashboard.alerts.allGoodTitle"),
        helper: t("dashboard.alerts.allGoodHelp"),
        tone: "success",
        icon: BadgeCheck,
      });
    }

    return alerts.slice(0, 3);
  }, [
    dashboardStats.activeOrders,
    dashboardStats.lowStockItems,
    dashboardStats.todayOrders,
    dashboardStats.todayRevenue,
    dashboardStats.yesterdayRevenue,
    locale,
    t,
    todaySalesChange,
  ]);

  const roleFocusCards = useMemo<FocusCard[]>(() => {
    const roleKey =
      normalizedUserRole === "administrator" ? "admin" : normalizedUserRole;

    if (roleKey === "cashier") {
      return [
        {
          key: "todayOrders",
          label: t("dashboard.roleFocus.cashier.todayOrders"),
          value: formatNumber(dashboardStats.todayOrders, locale),
          helper: t("dashboard.roleFocus.cashier.todayOrdersHelp"),
          icon: ShoppingCart,
          path: "/orders",
        },
        {
          key: "openOrders",
          label: t("dashboard.roleFocus.cashier.openOrders"),
          value: formatNumber(dashboardStats.activeOrders, locale),
          helper: t("dashboard.roleFocus.cashier.openOrdersHelp"),
          icon: ListChecks,
          path: "/orders",
        },
        {
          key: "todaySales",
          label: t("dashboard.roleFocus.cashier.todaySales"),
          value: formatCurrency(
            convertFromAzn(dashboardStats.todayRevenue, selectedCurrency),
            locale,
            selectedCurrency
          ),
          helper: todaySalesHelper,
          icon: CircleDollarSign,
          path: "/orders",
        },
      ];
    }

    if (roleKey === "warehousestaff") {
      return [
        {
          key: "lowStock",
          label: t("dashboard.roleFocus.warehouse.lowStock"),
          value: formatNumber(dashboardStats.lowStockItems, locale),
          helper: t("dashboard.roleFocus.warehouse.lowStockHelp"),
          icon: AlertTriangle,
          path: "/product-items",
        },
        {
          key: "storedItems",
          label: t("dashboard.roleFocus.warehouse.storedItems"),
          value: formatNumber(productItems.length, locale),
          helper: t("dashboard.roleFocus.warehouse.storedItemsHelp"),
          icon: Boxes,
          path: "/product-items",
        },
        {
          key: "inventoryValue",
          label: t("dashboard.roleFocus.warehouse.inventoryValue"),
          value: formatCurrency(
            convertFromAzn(dashboardStats.inventoryValue, selectedCurrency),
            locale,
            selectedCurrency
          ),
          helper: t("dashboard.roleFocus.warehouse.inventoryValueHelp"),
          icon: Warehouse,
          path: "/product-items",
        },
      ];
    }

    return [
      {
        key: "todaySales",
        label: t("dashboard.roleFocus.admin.todaySales"),
        value: formatCurrency(
          convertFromAzn(dashboardStats.todayRevenue, selectedCurrency),
          locale,
          selectedCurrency
        ),
        helper: todaySalesHelper,
        icon: CircleDollarSign,
        path: "/orders",
      },
      {
        key: "openOrders",
        label: t("dashboard.roleFocus.admin.openOrders"),
        value: formatNumber(dashboardStats.activeOrders, locale),
        helper: t("dashboard.roleFocus.admin.openOrdersHelp"),
        icon: ListChecks,
        path: "/orders",
      },
      {
        key: "lowStock",
        label: t("dashboard.roleFocus.admin.lowStock"),
        value: formatNumber(dashboardStats.lowStockItems, locale),
        helper: t("dashboard.roleFocus.admin.lowStockHelp"),
        icon: AlertTriangle,
        path: "/product-items",
      },
    ];
  }, [
    dashboardStats.activeOrders,
    dashboardStats.inventoryValue,
    dashboardStats.lowStockItems,
    dashboardStats.todayOrders,
    dashboardStats.todayRevenue,
    locale,
    normalizedUserRole,
    productItems.length,
    selectedCurrency,
    t,
    todaySalesHelper,
  ]);

  const metricCards: MetricCard[] = [
    {
      label: t("dashboard.metrics.todaySales"),
      value: formatCurrency(
        convertFromAzn(dashboardStats.todayRevenue, selectedCurrency),
        locale,
        selectedCurrency
      ),
      helper: todaySalesHelper,
      icon: CalendarDays,
      accentClassName:
        todaySalesChange >= 0 ? "bg-emerald-500" : "bg-red-500",
      iconClassName:
        todaySalesChange >= 0 ? "text-emerald-500" : "text-red-500",
      showCurrencySelect: true,
    },
    {
      label: t("dashboard.metrics.revenue"),
      value: formatCurrency(
        convertFromAzn(dashboardStats.totalRevenue, selectedCurrency),
        locale,
        selectedCurrency
      ),
      helper: t("dashboard.metrics.revenueHelp", {
        count: orders.length,
      }),
      icon: todaySalesChange >= 0 ? CircleDollarSign : TrendingDown,
      accentClassName: "bg-emerald-500",
      iconClassName: "text-emerald-500",
    },
    {
      label: t("dashboard.metrics.orders"),
      value: formatNumber(orders.length, locale),
      helper: t("dashboard.metrics.ordersHelp", {
        count: dashboardStats.activeOrders,
      }),
      icon: ClipboardList,
      accentClassName: "bg-blue-500",
      iconClassName: "text-blue-500",
    },
    {
      label: t("dashboard.metrics.inventoryValue"),
      value: formatCurrency(
        convertFromAzn(dashboardStats.inventoryValue, selectedCurrency),
        locale,
        selectedCurrency
      ),
      helper: t("dashboard.metrics.inventoryValueHelp", {
        count: productItems.length,
      }),
      icon: Warehouse,
      accentClassName: "bg-amber-500",
      iconClassName: "text-amber-500",
    },
    {
      label: t("dashboard.metrics.avgOrder"),
      value: formatCurrency(
        convertFromAzn(dashboardStats.averageOrderValue, selectedCurrency),
        locale,
        selectedCurrency
      ),
      helper: t("dashboard.metrics.avgOrderHelp"),
      icon: TrendingUp,
      accentClassName: "bg-violet-500",
      iconClassName: "text-violet-500",
    },
    {
      label: t("dashboard.metrics.completedRate"),
      value: formatPercent(dashboardStats.completedRate, locale),
      helper: t("dashboard.metrics.completedRateHelp", {
        count: dashboardStats.completedOrders,
      }),
      icon: BadgeCheck,
      accentClassName: "bg-cyan-500",
      iconClassName: "text-cyan-500",
    },
  ];

  const hasTrendData = revenueTrendData.some(
    (item) => item.revenue > 0 || item.orders > 0
  );
  const hasTopProductData = topProductData.length > 0;
  const hasTopSellingProductData = topSellingProductData.length > 0;
  const hasStockByUnitData = stockByUnitData.length > 0;
  const maxTopSellingQuantity = topSellingProductData[0]?.quantity || 1;

  if (isLoading) {
    return (
      <main
        className={`flex min-h-0 flex-1 items-center justify-center px-4 py-8 transition-colors duration-300 ${
          isLight ? "bg-gray-50 text-gray-900" : "bg-gray-900 text-white"
        }`}
      >
        <div className="flex items-center gap-3 text-sm font-black">
          <LoaderCircle size={20} className="animate-spin text-red-500" />
          {t("dashboard.loading")}
        </div>
      </main>
    );
  }

  return (
    <main
      className={`flex min-h-0 flex-1 flex-col px-4 py-6 transition-colors duration-300 sm:px-6 lg:px-8 ${
        isLight ? "bg-gray-50 text-gray-900" : "bg-gray-900 text-white"
      }`}
    >
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-xl bg-red-500 text-white shadow-md shadow-red-950/20">
                <TrendingUp size={23} />
              </span>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-red-500">
                  {t("dashboard.eyebrow")}
                </p>
                <h1 className="text-3xl font-black">{t("dashboard.title")}</h1>
              </div>
            </div>
            <p
              className={`mt-3 max-w-3xl text-sm font-semibold ${
                isLight ? "text-gray-500" : "text-gray-400"
              }`}
            >
              {t("dashboard.subtitle")}
            </p>
          </div>

          <div
            tabIndex={0}
            aria-describedby={userRoleTooltipId}
            aria-label={t("profile.roleAria", {
              role: userRole,
              description: userRoleDescription || t("common.notAvailable"),
            })}
            className={`group relative flex min-w-0 items-center gap-1 rounded-full border px-2.5 py-2 text-left shadow-sm outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 ${
              isLight
                ? "border-gray-200 bg-white focus-visible:ring-red-300 focus-visible:ring-offset-gray-50"
                : "border-gray-700 bg-gray-800 focus-visible:ring-amber-300 focus-visible:ring-offset-gray-900"
            }`}
          >
            <span className="mr-3 flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-red-500 text-sm font-black text-white shadow-sm shadow-red-950/15">
              {shouldShowProfilePicture ? (
                <img
                  key={profilePictureUrl}
                  src={profilePictureUrl}
                  alt={userDisplayName}
                  className="size-full object-cover"
                  onError={() => setBrokenProfilePictureUrl(profilePictureUrl)}
                />
              ) : (
                userInitials || "MC"
              )}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-black">{userDisplayName}</p>
              <p
                className="truncate text-xs font-bold"
                style={{ color: mcdonaldsRed }}
              >
                {userRole}
              </p>
            </div>
            <span
              id={userRoleTooltipId}
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
              <span
                className="relative block font-black"
                style={{ color: mcdonaldsRed }}
              >
                {userRole}
              </span>
              <span className="relative mt-1 block">
                {userRoleDescription || t("common.notAvailable")}
              </span>
            </span>
          </div>
        </div>

        {errorMessage ? (
          <div
            className={`flex min-h-96 flex-col items-center justify-center rounded-2xl border p-6 text-center shadow-lg ${
              isLight
                ? "border-gray-200 bg-white shadow-gray-900/5"
                : "border-gray-700 bg-gray-800 shadow-black/20"
            }`}
          >
            <p className="font-black text-red-500">{t(errorMessage)}</p>
            <button
              type="button"
              onClick={() => void loadDashboard()}
              className="mt-4 flex h-11 items-center justify-center gap-2 rounded-lg bg-red-500 px-4 font-bold text-white transition-all duration-200 hover:cursor-pointer hover:bg-red-600 active:scale-98"
            >
              <RefreshCcw size={17} />
              {t("common.retry")}
            </button>
          </div>
        ) : (
          <>
            {warningMessage && (
              <div
                className={`rounded-xl border px-4 py-3 text-sm font-bold ${
                  isLight
                    ? "border-amber-300 bg-amber-50 text-amber-800"
                    : "border-amber-300/60 bg-amber-500/15 text-amber-100"
                }`}
              >
                {t(warningMessage)}
              </div>
            )}

            <div
              className={`rounded-2xl border p-4 shadow-lg ${
                isLight
                  ? "border-gray-200 bg-white shadow-gray-900/5"
                  : "border-gray-700 bg-gray-800 shadow-black/20"
              }`}
            >
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                {quickNavigation.map(({ helper, icon: Icon, key, labelKey, path }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => navigate(path)}
                    className={`group flex min-h-24 items-center justify-between gap-3 rounded-xl border p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:cursor-pointer ${
                      isLight
                        ? "border-gray-200 bg-gray-50 hover:border-amber-300 hover:bg-white hover:shadow-gray-900/10"
                        : "border-gray-700 bg-gray-900 hover:border-amber-300 hover:bg-gray-800 hover:shadow-black/30"
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="flex size-10 items-center justify-center rounded-lg bg-red-500 text-white shadow-sm shadow-red-950/15">
                        <Icon size={20} strokeWidth={2.5} />
                      </span>
                      <span className="mt-3 block text-sm font-black">
                        {t(labelKey)}
                      </span>
                      <span
                        className={`mt-1 block truncate text-xs font-bold ${
                          isLight ? "text-gray-500" : "text-gray-400"
                        }`}
                      >
                        {helper}
                      </span>
                    </span>
                    <ArrowRight
                      size={18}
                      className={`shrink-0 transition-transform duration-200 group-hover:translate-x-1 ${
                        isLight ? "text-gray-400" : "text-gray-500"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {metricCards.map(
                ({
                  accentClassName,
                  helper,
                  icon: Icon,
                  iconClassName,
                  label,
                  showCurrencySelect,
                  value,
                }) => (
                  <article
                    key={label}
                    className={`relative overflow-hidden rounded-xl border p-4 shadow-sm ${
                      isLight
                        ? "border-gray-200 bg-white"
                        : "border-gray-700 bg-gray-800"
                    }`}
                  >
                    <span
                      className={`absolute inset-y-0 left-0 w-1 ${accentClassName}`}
                    />
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p
                          className={`text-xs font-black uppercase ${
                            isLight ? "text-gray-500" : "text-gray-400"
                          }`}
                        >
                          {label}
                        </p>
                        <p className="mt-2 truncate text-2xl font-black">
                          {value}
                        </p>
                        <p
                          className={`mt-1 text-xs font-bold ${
                            isLight ? "text-gray-500" : "text-gray-400"
                          }`}
                        >
                          {helper}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {showCurrencySelect && (
                          <div className="relative">
                            <select
                              value={selectedCurrency}
                              onChange={(event) =>
                                setSelectedCurrency(
                                  event.target.value as DashboardCurrency
                                )
                              }
                              aria-label={t("dashboard.currency.aria", {
                                defaultValue: "Choose currency",
                              })}
                              className={`h-9 appearance-none rounded-lg border pl-3 pr-7 text-xs font-black outline-none transition-all duration-200 hover:cursor-pointer ${
                                isLight
                                  ? "border-gray-200 bg-white text-gray-700 hover:border-amber-300"
                                  : "border-gray-700 bg-gray-900 text-gray-100 hover:border-amber-300"
                              }`}
                            >
                              {currencyOptions.map((currency) => (
                                <option
                                  key={currency.value}
                                  value={currency.value}
                                >
                                  {currency.label}
                                </option>
                              ))}
                            </select>
                            <ChevronDown
                              size={16}
                              strokeWidth={2.6}
                              className={`pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 ${
                                isLight ? "text-gray-500" : "text-gray-200"
                              }`}
                            />
                          </div>
                        )}
                        <span
                          className={`flex size-11 items-center justify-center rounded-xl ${
                            isLight ? "bg-gray-50" : "bg-gray-900"
                          }`}
                        >
                          <Icon size={22} className={iconClassName} />
                        </span>
                      </div>
                    </div>
                  </article>
                )
              )}
            </div>

            <section
              className={`rounded-2xl border p-4 shadow-lg ${
                isLight
                  ? "border-gray-200 bg-white shadow-gray-900/5"
                  : "border-gray-700 bg-gray-800 shadow-black/20"
              }`}
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-lg font-black">
                    {t("dashboard.roleFocus.title")}
                  </h2>
                  <p
                    className={`text-sm font-semibold ${
                      isLight ? "text-gray-500" : "text-gray-400"
                    }`}
                  >
                    {t("dashboard.roleFocus.subtitle")}
                  </p>
                </div>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {roleFocusCards.map(({ helper, icon: Icon, key, label, path, value }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => navigate(path)}
                    className={`group flex min-h-24 items-center justify-between gap-3 rounded-xl border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:cursor-pointer ${
                      isLight
                        ? "border-gray-200 bg-gray-50 hover:border-amber-300 hover:bg-white"
                        : "border-gray-700 bg-gray-900 hover:border-amber-300 hover:bg-gray-800"
                    }`}
                  >
                    <span className="min-w-0">
                      <span
                        className={`flex size-10 items-center justify-center rounded-lg ${
                          isLight
                            ? "bg-white text-red-500"
                            : "bg-gray-800 text-amber-300"
                        }`}
                      >
                        <Icon size={20} strokeWidth={2.5} />
                      </span>
                      <span className="mt-3 block truncate text-sm font-black">
                        {label}
                      </span>
                      <span
                        className={`mt-1 block text-2xl font-black ${
                          isLight ? "text-gray-950" : "text-white"
                        }`}
                      >
                        {value}
                      </span>
                      <span
                        className={`mt-1 block truncate text-xs font-bold ${
                          isLight ? "text-gray-500" : "text-gray-400"
                        }`}
                      >
                        {helper}
                      </span>
                    </span>
                    <ArrowRight
                      size={18}
                      className={`shrink-0 transition-transform duration-200 group-hover:translate-x-1 ${
                        isLight ? "text-gray-400" : "text-gray-500"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </section>

            <section
              className={`rounded-2xl border p-4 shadow-lg ${
                isLight
                  ? "border-gray-200 bg-white shadow-gray-900/5"
                  : "border-gray-700 bg-gray-800 shadow-black/20"
              }`}
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-lg font-black">
                    {t("dashboard.alerts.title")}
                  </h2>
                  <p
                    className={`text-sm font-semibold ${
                      isLight ? "text-gray-500" : "text-gray-400"
                    }`}
                  >
                    {t("dashboard.alerts.subtitle")}
                  </p>
                </div>
              </div>
              <div className="mt-4 grid gap-3 lg:grid-cols-3">
                {dashboardAlerts.map(({ helper, icon: Icon, key, path, title, tone }) => {
                  const content = (
                    <>
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-current/10">
                        <Icon size={20} strokeWidth={2.5} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-black">{title}</span>
                        <span className="mt-1 block text-xs font-bold leading-5 opacity-80">
                          {helper}
                        </span>
                      </span>
                    </>
                  );

                  return path ? (
                    <button
                      key={key}
                      type="button"
                      onClick={() => navigate(path)}
                      className={`flex min-h-20 items-center gap-3 rounded-xl border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:cursor-pointer ${getAlertToneClassName(
                        tone,
                        isLight
                      )}`}
                    >
                      {content}
                    </button>
                  ) : (
                    <article
                      key={key}
                      className={`flex min-h-20 items-center gap-3 rounded-xl border p-4 ${getAlertToneClassName(
                        tone,
                        isLight
                      )}`}
                    >
                      {content}
                    </article>
                  );
                })}
              </div>
            </section>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.85fr)]">
              <section
                className={`rounded-2xl border p-4 shadow-lg ${
                  isLight
                    ? "border-gray-200 bg-white shadow-gray-900/5"
                    : "border-gray-700 bg-gray-800 shadow-black/20"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-black">
                      {t(`dashboard.charts.salesTrendTitle.${selectedTrendRange}`)}
                    </h2>
                    <p
                      className={`text-sm font-semibold ${
                        isLight ? "text-gray-500" : "text-gray-400"
                      }`}
                    >
                      {t("dashboard.charts.salesTrendHelp")}
                    </p>
                  </div>
                  <div
                    className={`flex shrink-0 rounded-lg border p-1 ${
                      isLight
                        ? "border-gray-200 bg-gray-50"
                        : "border-gray-700 bg-gray-900"
                    }`}
                  >
                    {(["week", "month"] as DashboardTrendRange[]).map(
                      (range) => {
                        const isActive = selectedTrendRange === range;

                        return (
                          <button
                            key={range}
                            type="button"
                            onClick={() => setSelectedTrendRange(range)}
                            className={`h-8 rounded-md px-3 text-xs font-black transition-colors duration-200 hover:cursor-pointer ${
                              isActive
                                ? "bg-red-500 text-white"
                                : isLight
                                  ? "text-gray-500 hover:bg-white hover:text-red-600"
                                  : "text-gray-400 hover:bg-gray-800 hover:text-amber-100"
                            }`}
                          >
                            {t(`dashboard.charts.salesRange.${range}`)}
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>

                <div className="mt-5 h-72">
                  {hasTrendData ? (
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                      minWidth={0}
                      minHeight={0}
                    >
                      <AreaChart data={revenueTrendData}>
                        <defs>
                          <linearGradient id="salesRevenue" x1="0" x2="0" y1="0" y2="1">
                            <stop
                              offset="5%"
                              stopColor="#ef4444"
                              stopOpacity={0.42}
                            />
                            <stop
                              offset="95%"
                              stopColor="#ef4444"
                              stopOpacity={0.02}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          stroke={chartGridColor}
                          strokeDasharray="4 4"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="label"
                          tick={{ fill: chartTextColor, fontSize: 12 }}
                          tickLine={false}
                          axisLine={false}
                          interval={
                            selectedTrendRange === "month"
                              ? "preserveStartEnd"
                              : 0
                          }
                        />
                        <YAxis
                          tick={{ fill: chartTextColor, fontSize: 12 }}
                          tickFormatter={(value) =>
                            formatCompactNumber(Number(value), locale)
                          }
                          tickLine={false}
                          axisLine={false}
                          width={44}
                        />
                        <Tooltip
                          contentStyle={tooltipStyle}
                          itemStyle={tooltipItemStyle}
                          labelStyle={tooltipLabelStyle}
                          cursor={{ stroke: "#ef4444", strokeWidth: 1 }}
                          formatter={(value, name) =>
                            name === "revenue"
                              ? formatCurrency(
                                  Number(value),
                                  locale,
                                  selectedCurrency
                                )
                              : formatNumber(Number(value), locale)
                          }
                        />
                        <Area
                          type="monotone"
                          dataKey="revenue"
                          name={t("dashboard.metrics.revenue")}
                          stroke="#ef4444"
                          strokeWidth={3}
                          fill="url(#salesRevenue)"
                        />
                        <Area
                          type="monotone"
                          dataKey="orders"
                          name={t("dashboard.metrics.orders")}
                          stroke="#3b82f6"
                          strokeWidth={2}
                          fill="transparent"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div
                      className={`flex size-full items-center justify-center rounded-xl border text-sm font-bold ${
                        isLight
                          ? "border-gray-200 bg-gray-50 text-gray-500"
                          : "border-gray-700 bg-gray-900 text-gray-400"
                      }`}
                    >
                      {t("dashboard.charts.noChartData")}
                    </div>
                  )}
                </div>
              </section>

              <section
                className={`rounded-2xl border p-4 shadow-lg ${
                  isLight
                    ? "border-gray-200 bg-white shadow-gray-900/5"
                    : "border-gray-700 bg-gray-800 shadow-black/20"
                }`}
              >
                <h2 className="text-lg font-black">
                  {t("dashboard.charts.orderStatus")}
                </h2>
                <p
                  className={`text-sm font-semibold ${
                    isLight ? "text-gray-500" : "text-gray-400"
                  }`}
                >
                  {t("dashboard.charts.orderStatusHelp")}
                </p>

                <div className="mt-5 h-72">
                  {orderStatusData.length > 0 ? (
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                      minWidth={0}
                      minHeight={0}
                    >
                      <PieChart>
                        <Pie
                          data={orderStatusData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={56}
                          outerRadius={92}
                          paddingAngle={3}
                        >
                          {orderStatusData.map((entry) => (
                            <Cell key={entry.name} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={tooltipStyle}
                          itemStyle={tooltipItemStyle}
                          labelStyle={tooltipLabelStyle}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div
                      className={`flex size-full items-center justify-center rounded-xl border text-sm font-bold ${
                        isLight
                          ? "border-gray-200 bg-gray-50 text-gray-500"
                          : "border-gray-700 bg-gray-900 text-gray-400"
                      }`}
                    >
                      {t("dashboard.charts.noChartData")}
                    </div>
                  )}
                </div>

                <div className="grid gap-2">
                  {orderStatusData.map((item) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between gap-3 text-sm font-bold"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <span
                          className="size-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="truncate">{item.name}</span>
                      </span>
                      <span>{formatNumber(item.value, locale)}</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <section
                className={`rounded-2xl border p-4 shadow-lg ${
                  isLight
                    ? "border-gray-200 bg-white shadow-gray-900/5"
                    : "border-gray-700 bg-gray-800 shadow-black/20"
                }`}
              >
                <h2 className="text-lg font-black">
                  {t("dashboard.charts.topProducts")}
                </h2>
                <p
                  className={`text-sm font-semibold ${
                    isLight ? "text-gray-500" : "text-gray-400"
                  }`}
                >
                  {t("dashboard.charts.topProductsHelp")}
                </p>

                <div className="mt-5 h-72">
                  {hasTopProductData ? (
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                      minWidth={0}
                      minHeight={0}
                    >
                      <BarChart data={topProductData} layout="vertical">
                        <CartesianGrid
                          stroke={chartGridColor}
                          strokeDasharray="4 4"
                          horizontal={false}
                        />
                        <XAxis
                          type="number"
                          tick={{ fill: chartTextColor, fontSize: 12 }}
                          tickFormatter={(value) =>
                            formatCompactNumber(Number(value), locale)
                          }
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          tick={{ fill: chartTextColor, fontSize: 12 }}
                          tickLine={false}
                          axisLine={false}
                          width={94}
                        />
                        <Tooltip
                          contentStyle={tooltipStyle}
                          itemStyle={tooltipItemStyle}
                          labelStyle={tooltipLabelStyle}
                          cursor={{ fill: isLight ? "#fef2f2" : "#1f2937" }}
                          formatter={(value, name) =>
                            name === "revenue"
                              ? formatCurrency(
                                  Number(value),
                                  locale,
                                  selectedCurrency
                                )
                              : formatNumber(Number(value), locale)
                          }
                        />
                        <Bar
                          dataKey="revenue"
                          name={t("dashboard.metrics.revenue")}
                          fill="#ef4444"
                          radius={[0, 8, 8, 0]}
                          barSize={18}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div
                      className={`flex size-full items-center justify-center rounded-xl border text-sm font-bold ${
                        isLight
                          ? "border-gray-200 bg-gray-50 text-gray-500"
                          : "border-gray-700 bg-gray-900 text-gray-400"
                      }`}
                    >
                      {t("dashboard.charts.noChartData")}
                    </div>
                  )}
                </div>
              </section>

              <section
                className={`rounded-2xl border p-4 shadow-lg ${
                  isLight
                    ? "border-gray-200 bg-white shadow-gray-900/5"
                    : "border-gray-700 bg-gray-800 shadow-black/20"
                }`}
              >
                <h2 className="text-lg font-black">
                  {t("dashboard.charts.stockByUnit")}
                </h2>
                <p
                  className={`text-sm font-semibold ${
                    isLight ? "text-gray-500" : "text-gray-400"
                  }`}
                >
                  {t("dashboard.charts.stockByUnitHelp")}
                </p>

                <div className="mt-5 h-72">
                  {hasStockByUnitData ? (
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                      minWidth={0}
                      minHeight={0}
                    >
                      <BarChart data={stockByUnitData}>
                        <CartesianGrid
                          stroke={chartGridColor}
                          strokeDasharray="4 4"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="unit"
                          tick={{ fill: chartTextColor, fontSize: 12 }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          tick={{ fill: chartTextColor, fontSize: 12 }}
                          tickFormatter={(value) =>
                            formatCompactNumber(Number(value), locale)
                          }
                          tickLine={false}
                          axisLine={false}
                          width={44}
                        />
                        <Tooltip
                          contentStyle={tooltipStyle}
                          itemStyle={tooltipItemStyle}
                          labelStyle={tooltipLabelStyle}
                          cursor={{ fill: isLight ? "#fffbeb" : "#1f2937" }}
                          formatter={(value, name) =>
                            name === "value"
                              ? formatCurrency(
                                  Number(value),
                                  locale,
                                  selectedCurrency
                                )
                              : formatNumber(Number(value), locale)
                          }
                        />
                        <Bar
                          dataKey="value"
                          name={t("dashboard.metrics.inventoryValue")}
                          radius={[8, 8, 0, 0]}
                          barSize={34}
                        >
                          {stockByUnitData.map((entry, index) => (
                            <Cell
                              key={entry.unit}
                              fill={chartPalette[index % chartPalette.length]}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div
                      className={`flex size-full items-center justify-center rounded-xl border text-sm font-bold ${
                        isLight
                          ? "border-gray-200 bg-gray-50 text-gray-500"
                          : "border-gray-700 bg-gray-900 text-gray-400"
                      }`}
                    >
                      {t("dashboard.charts.noChartData")}
                    </div>
                  )}
                </div>
              </section>
            </div>

            <div>
              <section
                className={`rounded-2xl border shadow-lg ${
                  isLight
                    ? "border-gray-200 bg-white shadow-gray-900/5"
                    : "border-gray-700 bg-gray-800 shadow-black/20"
                }`}
              >
                <div
                  className={`flex flex-col gap-2 border-b p-4 sm:flex-row sm:items-end sm:justify-between ${
                    isLight ? "border-gray-200" : "border-gray-700"
                  }`}
                >
                  <div>
                    <h2 className="text-lg font-black">
                      {t("dashboard.bestSelling.title")}
                    </h2>
                    <p
                      className={`text-sm font-semibold ${
                        isLight ? "text-gray-500" : "text-gray-400"
                      }`}
                    >
                      {t("dashboard.bestSelling.subtitle")}
                    </p>
                  </div>
                </div>

                {hasTopSellingProductData ? (
                  <div className="grid gap-4 p-4">
                    {topSellingProductData.map((item, index) => (
                      <article key={item.name} className="grid gap-2">
                        <div className="flex items-center justify-between gap-3">
                          <span className="flex min-w-0 items-center gap-3">
                            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-red-500 text-xs font-black text-white">
                              {index + 1}
                            </span>
                            <span className="truncate text-sm font-black">
                              {item.name}
                            </span>
                          </span>
                          <span className="shrink-0 text-sm font-black">
                            {t("dashboard.bestSelling.sold", {
                              count: formatNumber(item.quantity, locale),
                            })}
                          </span>
                        </div>
                        <div
                          className={`h-2 overflow-hidden rounded-full ${
                            isLight ? "bg-gray-100" : "bg-gray-900"
                          }`}
                        >
                          <div
                            className="h-full rounded-full bg-red-500"
                            style={{
                              width: `${Math.max(
                                8,
                                (item.quantity / maxTopSellingQuantity) * 100
                              )}%`,
                            }}
                          />
                        </div>
                        <p
                          className={`text-xs font-bold ${
                            isLight ? "text-gray-500" : "text-gray-400"
                          }`}
                        >
                          {t("dashboard.bestSelling.money", {
                            value: formatCurrency(
                              item.revenue,
                              locale,
                              selectedCurrency
                            ),
                          })}
                        </p>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div
                    className={`flex min-h-44 items-center justify-center p-6 text-center text-sm font-bold ${
                      isLight ? "text-gray-500" : "text-gray-400"
                    }`}
                  >
                    {t("dashboard.bestSelling.empty")}
                  </div>
                )}
              </section>
            </div>

            <section
              className={`rounded-2xl border shadow-lg ${
                isLight
                  ? "border-gray-200 bg-white shadow-gray-900/5"
                  : "border-gray-700 bg-gray-800 shadow-black/20"
              }`}
            >
              <div
                className={`flex flex-col gap-2 border-b p-4 sm:flex-row sm:items-end sm:justify-between ${
                  isLight ? "border-gray-200" : "border-gray-700"
                }`}
              >
                <div>
                  <h2 className="text-lg font-black">
                    {t("dashboard.recent.title")}
                  </h2>
                  <p
                    className={`text-sm font-semibold ${
                      isLight ? "text-gray-500" : "text-gray-400"
                    }`}
                  >
                    {t("dashboard.recent.subtitle")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/orders")}
                  className={`flex h-10 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-black transition-all duration-200 hover:cursor-pointer ${
                    isLight
                      ? "border-gray-200 bg-gray-50 text-gray-600 hover:border-amber-300 hover:bg-amber-50 hover:text-red-600"
                      : "border-gray-700 bg-gray-900 text-gray-300 hover:border-amber-300 hover:bg-gray-800 hover:text-amber-100"
                  }`}
                >
                  {t("drawer.orders")}
                  <ArrowRight size={16} />
                </button>
              </div>

              {recentOrders.length > 0 ? (
                <div className="grid gap-3 p-4">
                  {recentOrders.map((order) => (
                    <article
                      key={order.id}
                      className={`grid gap-3 rounded-xl border p-4 transition-all duration-200 lg:grid-cols-[minmax(0,1fr)_140px_140px_150px] lg:items-center ${
                        isLight
                          ? "border-gray-200 bg-gray-50 hover:border-amber-300 hover:bg-white"
                          : "border-gray-700 bg-gray-900 hover:border-amber-300 hover:bg-gray-800"
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black">
                          {t("dashboard.recent.order", {
                            id: order.id.slice(0, 8),
                          })}
                        </p>
                        <p
                          className={`mt-1 text-xs font-bold ${
                            isLight ? "text-gray-500" : "text-gray-400"
                          }`}
                        >
                          {formatDateTime(
                            order.createdAt,
                            locale,
                            t("common.notAvailable")
                          )}
                        </p>
                      </div>

                      <span
                        className={`inline-flex h-9 items-center justify-center rounded-full border px-3 text-xs font-black ${getStatusPillClassName(
                          order.status,
                          isLight
                        )}`}
                      >
                        {getTranslatedStatusLabel(order.status)}
                      </span>

                      <span
                        className={`text-sm font-bold ${
                          isLight ? "text-gray-500" : "text-gray-400"
                        }`}
                      >
                        {t("dashboard.recent.items", {
                          count: (order.items ?? []).length,
                        })}
                      </span>

                      <span className="text-sm font-black lg:text-right">
                        {formatCurrency(
                          convertFromAzn(getOrderTotal(order), selectedCurrency),
                          locale,
                          selectedCurrency
                        )}
                      </span>
                    </article>
                  ))}
                </div>
              ) : (
                <div
                  className={`flex min-h-40 items-center justify-center p-6 text-center text-sm font-bold ${
                    isLight ? "text-gray-500" : "text-gray-400"
                  }`}
                >
                  {t("dashboard.recent.empty")}
                </div>
              )}
            </section>
          </>
        )}
      </section>
    </main>
  );
};

export default Dashboard;
