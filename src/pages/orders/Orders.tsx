import { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  Ban,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  CreditCard,
  LoaderCircle,
  Minus,
  Package,
  Plus,
  RefreshCcw,
  Search,
  ShoppingCart,
  Timer,
  Trash2,
  X,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import {
  cancelOrder,
  changeOrderStatus,
  completeOrder,
  createOrder,
  getOrders,
  type Order,
  type OrderStatus,
  type PaymentType,
} from "../../lib/services/orderService";
import { getProducts, type Product } from "../../lib/services/productService";
import useAuthStore from "../../store/authStore";
import { useThemeStore } from "../../store/useThemeStore";

type OrderItemDraft = {
  productId: string;
  quantity: string;
};

const paymentTypes: Array<{ label: string; value: PaymentType }> = [
  { label: "Cash", value: 0 },
  { label: "Card", value: 1 },
];
const statusOptions: OrderStatus[] = [
  "Created",
  "Approved",
  "InProgress",
  "Completed",
  "Rejected",
];

const formatCurrency = (value: number | null | undefined, locale: string) =>
  new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "AZN",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value ?? NaN) ? value ?? 0 : 0);

const formatNumber = (value: number | null | undefined, locale: string) =>
  new Intl.NumberFormat(locale, {
    maximumFractionDigits: 3,
  }).format(Number.isFinite(value ?? NaN) ? value ?? 0 : 0);

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
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const getStatusStyle = (status: string, isLight: boolean) => {
  const normalizedStatus = status.toLowerCase();

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

const Orders = () => {
  const theme = useThemeStore((state) => state.theme);
  const currentUser = useAuthStore((state) => state.user);
  const { i18n } = useTranslation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createErrorMessage, setCreateErrorMessage] = useState("");
  const [paymentType, setPaymentType] = useState<PaymentType>(0);
  const [orderItemDrafts, setOrderItemDrafts] = useState<OrderItemDraft[]>([]);
  const [updatingOrderId, setUpdatingOrderId] = useState("");
  const isLight = theme === "light";
  const locale = i18n.resolvedLanguage ?? i18n.language;

  const productById = useMemo(() => {
    return new Map(products.map((product) => [product.id, product]));
  }, [products]);

  const getOrderTotal = (order: Order) =>
    order.items.reduce(
      (total, item) => total + (item.price || 0) * (item.quantity || 0),
      0
    );

  const loadOrdersPage = async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const [ordersResponse, productsResponse] = await Promise.all([
        getOrders(),
        getProducts(),
      ]);
      setOrders(ordersResponse);
      setProducts(productsResponse);
    } catch {
      setErrorMessage("Orders could not be loaded. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isActive = true;

    Promise.all([getOrders(), getProducts()])
      .then(([ordersResponse, productsResponse]) => {
        if (!isActive) return;

        setOrders(ordersResponse);
        setProducts(productsResponse);
      })
      .catch(() => {
        if (isActive) {
          setErrorMessage("Orders could not be loaded. Please try again.");
        }
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, []);

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

  const resetCreateForm = () => {
    setCreateErrorMessage("");
    setPaymentType(0);
    setOrderItemDrafts([]);
  };

  const openCreateDialog = () => {
    setCreateErrorMessage("");
    setIsCreateDialogOpen(true);

    if (products.length > 0 && orderItemDrafts.length === 0) {
      setOrderItemDrafts([{ productId: products[0].id, quantity: "1" }]);
    }
  };

  const closeCreateDialog = () => {
    if (isCreating) return;

    setIsCreateDialogOpen(false);
    resetCreateForm();
  };

  const handleOrderItemDraftChange = (
    index: number,
    field: keyof OrderItemDraft,
    value: string
  ) => {
    setOrderItemDrafts((current) =>
      current.map((draft, draftIndex) =>
        draftIndex === index ? { ...draft, [field]: value } : draft
      )
    );
    setCreateErrorMessage("");
  };

  const adjustOrderItemQuantity = (index: number, direction: -1 | 1) => {
    const currentDraft = orderItemDrafts[index];
    const currentQuantity = Number(currentDraft?.quantity);
    const nextQuantity = Math.max(
      0,
      (Number.isFinite(currentQuantity) ? currentQuantity : 0) + direction
    );

    handleOrderItemDraftChange(index, "quantity", String(nextQuantity));
  };

  const addOrderItemDraft = () => {
    const firstProduct = products[0];

    if (!firstProduct) {
      setCreateErrorMessage("No products are available.");
      return;
    }

    setOrderItemDrafts((current) => [
      ...current,
      { productId: firstProduct.id, quantity: "1" },
    ]);
    setCreateErrorMessage("");
  };

  const removeOrderItemDraft = (index: number) => {
    setOrderItemDrafts((current) =>
      current.filter((_, draftIndex) => draftIndex !== index)
    );
    setCreateErrorMessage("");
  };

  const createDraftItems = () =>
    orderItemDrafts.map((draft) => {
      const product = productById.get(draft.productId);

      return {
        productId: draft.productId,
        quantity: Number(draft.quantity),
        price: product?.price ?? 0,
      };
    });

  const createDraftTotal = createDraftItems().reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const handleCreateOrder = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!currentUser?.id) {
      setCreateErrorMessage("Current user could not be resolved.");
      return;
    }

    const orderItems = createDraftItems();

    if (
      orderItems.length === 0 ||
      orderItems.some(
        (item) =>
          !item.productId ||
          !Number.isFinite(item.quantity) ||
          item.quantity <= 0
      )
    ) {
      setCreateErrorMessage("Choose at least one product and quantity.");
      return;
    }

    setIsCreating(true);
    setCreateErrorMessage("");

    try {
      await createOrder({
        creatorId: currentUser.id,
        orderItems,
        totalPrice: createDraftTotal,
        paymentType,
      });

      const refreshedOrders = await getOrders();
      setOrders(refreshedOrders);
      closeCreateDialog();
    } catch {
      setCreateErrorMessage("Order could not be created.");
    } finally {
      setIsCreating(false);
    }
  };

  const refreshOrdersOnly = async () => {
    const refreshedOrders = await getOrders();
    setOrders(refreshedOrders);
  };

  const handleStatusChange = async (orderId: string, status: OrderStatus) => {
    setUpdatingOrderId(orderId);

    try {
      await changeOrderStatus({ orderId, status });
      await refreshOrdersOnly();
    } finally {
      setUpdatingOrderId("");
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    setUpdatingOrderId(orderId);

    try {
      await cancelOrder(orderId);
      await refreshOrdersOnly();
    } finally {
      setUpdatingOrderId("");
    }
  };

  const handleCompleteOrder = async (orderId: string) => {
    setUpdatingOrderId(orderId);

    try {
      await completeOrder(orderId);
      await refreshOrdersOnly();
    } finally {
      setUpdatingOrderId("");
    }
  };

  const filteredOrders = useMemo(() => {
    const query = debouncedSearch.toLowerCase();

    if (!query) return orders;

    return orders.filter((order) => {
      const productNames = order.items
        .map((item) => productById.get(item.productId)?.name ?? item.productId)
        .join(" ");

      return [order.id, order.creatorId, order.status, productNames].some(
        (value) => value.toLowerCase().includes(query)
      );
    });
  }, [debouncedSearch, orders, productById]);

  const totalRevenue = orders.reduce(
    (total, order) => total + getOrderTotal(order),
    0
  );
  const completedOrders = orders.filter(
    (order) => order.status.toLowerCase() === "completed"
  ).length;
  const activeOrders = orders.filter((order) =>
    ["created", "approved", "inprogress"].includes(order.status.toLowerCase())
  ).length;
  const trimmedSearch = search.trim();
  const isSearchPending =
    trimmedSearch.length >= 2 && trimmedSearch !== debouncedSearch;

  return (
    <main
      className={`flex flex-1 flex-col px-4 py-8 transition-colors duration-300 sm:px-6 lg:px-8 ${
        isLight ? "bg-gray-50 text-gray-900" : "bg-gray-900 text-white"
      }`}
    >
      <section className="mx-auto w-full max-w-7xl">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-xl bg-red-500 text-white shadow-md shadow-red-950/20">
                <ShoppingCart size={23} />
              </span>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-red-500">
                  Sales
                </p>
                <h1 className="text-3xl font-black">Orders</h1>
              </div>
            </div>
            <p
              className={`mt-3 text-sm font-semibold ${
                isLight ? "text-gray-500" : "text-gray-400"
              }`}
            >
              Manage order creation, status changes, and fulfillment.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[620px]">
            {[
              {
                label: "Orders",
                value: orders.length,
                icon: ClipboardList,
              },
              {
                label: "Active",
                value: activeOrders,
                icon: Timer,
              },
              {
                label: "Revenue",
                value: formatCurrency(totalRevenue, locale),
                icon: CircleDollarSign,
              },
            ].map(({ label, value, icon: Icon }) => (
              <div
                key={label}
                className={`rounded-xl border px-4 py-3 shadow-sm ${
                  isLight
                    ? "border-gray-200 bg-white"
                    : "border-gray-700 bg-gray-800"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={20} className="text-red-500" />
                  <div>
                    <p
                      className={`text-xs font-bold uppercase ${
                        isLight ? "text-gray-500" : "text-gray-400"
                      }`}
                    >
                      {label}
                    </p>
                    <p className="text-xl font-black">{value}</p>
                  </div>
                </div>
              </div>
            ))}
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
            className={`flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center lg:justify-between ${
              isLight ? "border-gray-200" : "border-gray-700"
            }`}
          >
            <div className="w-full lg:max-w-sm">
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
                  placeholder="Search orders"
                  className={`h-11 w-full rounded-lg border pl-10 pr-12 text-sm font-semibold outline-none transition-all duration-200 ${
                    isLight
                      ? "border-gray-200 bg-gray-50 placeholder:text-gray-400 focus:border-amber-400"
                      : "border-gray-600 bg-gray-900 placeholder:text-gray-500 focus:border-amber-400"
                  }`}
                />
                <button
                  type="button"
                  onClick={handleSearchClear}
                  aria-label="Clear order search"
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

            <div className="flex flex-wrap items-center gap-3">
              <div
                className={`flex min-h-11 flex-wrap items-center gap-3 rounded-xl border px-3 text-sm font-semibold ${
                  isLight
                    ? "border-gray-200 bg-gray-50 text-gray-500"
                    : "border-gray-700 bg-gray-900 text-gray-400"
                }`}
              >
                <span>Showing {filteredOrders.length} of {orders.length}</span>
                <span className="hidden h-1 w-1 rounded-full bg-current sm:block" />
                <span>{completedOrders} completed</span>
              </div>
              <button
                type="button"
                onClick={openCreateDialog}
                aria-label="Create order"
                className="flex h-11 items-center justify-center gap-2 rounded-xl bg-red-500 px-4 text-sm font-black text-white shadow-md shadow-red-950/15 transition-all duration-200 hover:cursor-pointer hover:bg-red-600 active:scale-95"
              >
                <Plus size={21} strokeWidth={2.7} />
                <span>New order</span>
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex min-h-80 items-center justify-center p-6">
              <p
                className={`font-semibold ${
                  isLight ? "text-gray-500" : "text-gray-400"
                }`}
              >
                Loading orders...
              </p>
            </div>
          ) : errorMessage ? (
            <div className="flex min-h-80 flex-col items-center justify-center p-6 text-center">
              <p className="font-bold text-red-500">{errorMessage}</p>
              <button
                type="button"
                onClick={() => void loadOrdersPage()}
                className="mt-4 flex h-11 items-center justify-center gap-2 rounded-lg bg-red-500 px-4 font-bold text-white transition-all duration-200 hover:cursor-pointer hover:bg-red-600 active:scale-98"
              >
                <RefreshCcw size={17} />
                Retry
              </button>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="flex min-h-80 flex-col items-center justify-center p-6 text-center">
              <ShoppingCart
                size={38}
                className={isLight ? "text-gray-300" : "text-gray-600"}
              />
              <p className="mt-3 font-bold">No orders found</p>
              <p
                className={`mt-1 text-sm font-semibold ${
                  isLight ? "text-gray-500" : "text-gray-400"
                }`}
              >
                Try a different search term or create a new order.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 p-4">
              {filteredOrders.map((order) => {
                const orderTotal = getOrderTotal(order);
                const isUpdating = updatingOrderId === order.id;
                const isClosed = ["completed", "rejected"].includes(
                  order.status.toLowerCase()
                );

                return (
                  <article
                    key={order.id}
                    className={`relative overflow-hidden rounded-xl border p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 ${
                      isLight
                        ? "border-gray-200 bg-gray-50 hover:border-amber-300 hover:bg-white hover:shadow-gray-900/10"
                        : "border-gray-700 bg-gray-900 hover:border-amber-300 hover:bg-gray-800 hover:shadow-black/30"
                    }`}
                  >
                    <span className="absolute inset-y-0 left-0 w-1 bg-red-500" />
                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(220px,0.7fr)]">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="break-all text-lg font-black">
                            Order {order.id.slice(0, 8)}
                          </h2>
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-black ${getStatusStyle(
                              order.status,
                              isLight
                            )}`}
                          >
                            <BadgeCheck size={14} />
                            {order.status}
                          </span>
                        </div>
                        <p
                          className={`mt-1 text-sm font-semibold ${
                            isLight ? "text-gray-500" : "text-gray-400"
                          }`}
                        >
                          {formatDate(order.createdAt, locale, "Not available")}
                        </p>

                        <div className="mt-4 grid gap-2">
                          {order.items.map((item) => {
                            const product = productById.get(item.productId);

                            return (
                              <div
                                key={item.id}
                                className={`grid gap-2 rounded-lg border px-3 py-2 text-sm sm:grid-cols-[minmax(0,1fr)_90px_110px] sm:items-center ${
                                  isLight
                                    ? "border-gray-200 bg-white"
                                    : "border-gray-700 bg-gray-800"
                                }`}
                              >
                                <div className="min-w-0">
                                  <p className="truncate font-black">
                                    {product?.name ?? item.productId}
                                  </p>
                                  <p
                                    className={`text-xs font-semibold ${
                                      isLight
                                        ? "text-gray-500"
                                        : "text-gray-400"
                                    }`}
                                  >
                                    {formatCurrency(item.price, locale)}
                                  </p>
                                </div>
                                <p className="font-bold">
                                  Qty {formatNumber(item.quantity, locale)}
                                </p>
                                <p className="font-black sm:text-right">
                                  {formatCurrency(
                                    item.price * item.quantity,
                                    locale
                                  )}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 lg:items-end">
                        <div className="lg:text-right">
                          <p
                            className={`text-xs font-black uppercase tracking-wide ${
                              isLight ? "text-gray-500" : "text-gray-400"
                            }`}
                          >
                            Total
                          </p>
                          <p className="text-2xl font-black">
                            {formatCurrency(orderTotal, locale)}
                          </p>
                        </div>

                        <div className="grid w-full gap-2 sm:grid-cols-2 lg:max-w-xs">
                          <select
                            value={statusOptions.includes(
                              order.status as OrderStatus
                            )
                              ? order.status
                              : "Created"}
                            onChange={(event) =>
                              void handleStatusChange(
                                order.id,
                                event.target.value as OrderStatus
                              )
                            }
                            disabled={isUpdating}
                            className={`h-10 rounded-lg border px-3 text-sm font-black outline-none transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${
                              isLight
                                ? "border-gray-200 bg-white focus:border-amber-400"
                                : "border-gray-700 bg-gray-800 focus:border-amber-400"
                            }`}
                          >
                            {statusOptions.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>

                          <button
                            type="button"
                            onClick={() => void handleCompleteOrder(order.id)}
                            disabled={isUpdating || isClosed}
                            className="flex h-10 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 text-sm font-black text-white transition-all duration-200 hover:cursor-pointer hover:bg-emerald-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isUpdating ? (
                              <LoaderCircle size={16} className="animate-spin" />
                            ) : (
                              <CheckCircle2 size={16} />
                            )}
                            Complete
                          </button>

                          <button
                            type="button"
                            onClick={() => void handleCancelOrder(order.id)}
                            disabled={isUpdating || isClosed}
                            className="flex h-10 items-center justify-center gap-2 rounded-lg bg-red-500 px-3 text-sm font-black text-white transition-all duration-200 hover:cursor-pointer hover:bg-red-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 sm:col-span-2"
                          >
                            <Ban size={16} />
                            Cancel
                          </button>
                        </div>
                      </div>
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
          className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-black/45 px-4 py-5 backdrop-blur-[2px] sm:items-center"
          onClick={closeCreateDialog}
        >
          <section
            className={`w-full max-w-3xl overflow-hidden rounded-2xl border shadow-2xl transition-colors duration-300 ${
              isLight
                ? "border-gray-200 bg-white text-gray-900 shadow-gray-950/15"
                : "border-gray-700 bg-gray-800 text-white shadow-black/35"
            }`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="h-1.5 bg-red-500" />

            <div className="max-h-[calc(100vh-52px)] overflow-y-auto p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-12 items-center justify-center rounded-xl bg-red-500 text-white shadow-md shadow-red-950/20">
                    <Plus size={21} />
                  </span>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-red-500">
                      New order
                    </p>
                    <h2 className="text-xl font-black">Create Order</h2>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={closeCreateDialog}
                  aria-label="Close create order dialog"
                  disabled={isCreating}
                  className={`flex size-10 shrink-0 items-center justify-center rounded-full border transition-all duration-200 hover:cursor-pointer active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 ${
                    isLight
                      ? "border-gray-200 hover:bg-gray-100"
                      : "border-gray-700 hover:bg-gray-700"
                  }`}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateOrder} className="mt-6 grid gap-4">
                <section
                  className={`rounded-xl border p-3 transition-colors duration-200 ${
                    isLight
                      ? "border-gray-200 bg-gray-50"
                      : "border-gray-700 bg-gray-900"
                  }`}
                >
                  <div
                    className={`flex items-center gap-2 text-xs font-black uppercase tracking-wide ${
                      isLight ? "text-gray-500" : "text-gray-400"
                    }`}
                  >
                    <CreditCard size={15} className="text-red-500" />
                    Payment
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {paymentTypes.map(({ label, value }) => {
                      const isActive = paymentType === value;

                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setPaymentType(value)}
                          disabled={isCreating}
                          className={`h-11 rounded-xl border px-2 text-sm font-black transition-all duration-200 hover:cursor-pointer active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 ${
                            isActive
                              ? "border-red-500 bg-red-500 text-white shadow-md shadow-red-950/15"
                              : isLight
                              ? "border-gray-200 bg-white text-gray-600 hover:border-amber-300 hover:bg-amber-50 hover:text-red-600"
                              : "border-gray-700 bg-gray-800 text-gray-300 hover:border-amber-300 hover:bg-gray-700 hover:text-amber-100"
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </section>

                <section
                  className={`rounded-xl border p-3 transition-colors duration-200 ${
                    isLight
                      ? "border-gray-200 bg-gray-50"
                      : "border-gray-700 bg-gray-900"
                  }`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div
                      className={`flex items-center gap-2 text-xs font-black uppercase tracking-wide ${
                        isLight ? "text-gray-500" : "text-gray-400"
                      }`}
                    >
                      <Package size={15} className="text-red-500" />
                      Products
                    </div>
                    <button
                      type="button"
                      onClick={addOrderItemDraft}
                      disabled={isCreating}
                      className="flex h-10 items-center justify-center gap-2 rounded-xl bg-red-500 px-3 text-sm font-black text-white transition-all duration-200 hover:cursor-pointer hover:bg-red-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      <Plus size={17} strokeWidth={2.7} />
                      Add product
                    </button>
                  </div>

                  {orderItemDrafts.length === 0 ? (
                    <div
                      className={`mt-3 flex min-h-28 items-center justify-center rounded-xl border text-center text-sm font-bold ${
                        isLight
                          ? "border-gray-200 bg-white text-gray-500"
                          : "border-gray-700 bg-gray-800 text-gray-400"
                      }`}
                    >
                      Add at least one product.
                    </div>
                  ) : (
                    <div className="mt-3 grid gap-3">
                      {orderItemDrafts.map((draft, index) => {
                        const product = productById.get(draft.productId);
                        const quantity = Number(draft.quantity);
                        const lineTotal =
                          (product?.price ?? 0) *
                          (Number.isFinite(quantity) ? quantity : 0);

                        return (
                          <div
                            key={`${draft.productId}-${index}`}
                            className={`grid gap-3 rounded-xl border p-3 md:grid-cols-[minmax(0,1fr)_220px_44px] md:items-end ${
                              isLight
                                ? "border-gray-200 bg-white"
                                : "border-gray-700 bg-gray-800"
                            }`}
                          >
                            <label className="grid gap-1.5">
                              <span
                                className={`text-xs font-black uppercase tracking-wide ${
                                  isLight ? "text-gray-500" : "text-gray-400"
                                }`}
                              >
                                Product
                              </span>
                              <select
                                value={draft.productId}
                                onChange={(event) =>
                                  handleOrderItemDraftChange(
                                    index,
                                    "productId",
                                    event.target.value
                                  )
                                }
                                disabled={isCreating}
                                className={`h-11 rounded-xl border px-3 text-sm font-black outline-none transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${
                                  isLight
                                    ? "border-gray-200 bg-gray-50 focus:border-amber-400"
                                    : "border-gray-700 bg-gray-900 focus:border-amber-400"
                                }`}
                              >
                                {products.map((product) => (
                                  <option key={product.id} value={product.id}>
                                    {product.name} -{" "}
                                    {formatCurrency(product.price, locale)}
                                  </option>
                                ))}
                              </select>
                            </label>

                            <label className="grid gap-1.5">
                              <span
                                className={`text-xs font-black uppercase tracking-wide ${
                                  isLight ? "text-gray-500" : "text-gray-400"
                                }`}
                              >
                                Quantity
                              </span>
                              <div
                                className={`flex h-11 overflow-hidden rounded-xl border ${
                                  isLight
                                    ? "border-gray-200 bg-gray-50"
                                    : "border-gray-700 bg-gray-900"
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={() => adjustOrderItemQuantity(index, -1)}
                                  disabled={isCreating}
                                  aria-label="Decrease order item quantity"
                                  className={`flex w-11 shrink-0 items-center justify-center border-r transition-all duration-200 hover:cursor-pointer active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 ${
                                    isLight
                                      ? "border-gray-200 text-gray-600 hover:bg-red-50 hover:text-red-600"
                                      : "border-gray-700 text-gray-300 hover:bg-red-500/15 hover:text-red-200"
                                  }`}
                                >
                                  <Minus size={17} strokeWidth={2.7} />
                                </button>
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  value={draft.quantity}
                                  onChange={(event) =>
                                    handleOrderItemDraftChange(
                                      index,
                                      "quantity",
                                      event.target.value
                                    )
                                  }
                                  disabled={isCreating}
                                  className={`min-w-0 flex-1 bg-transparent px-2 text-center text-sm font-black outline-none [appearance:textfield] disabled:cursor-not-allowed disabled:opacity-60 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${
                                    isLight
                                      ? "placeholder:text-gray-300"
                                      : "placeholder:text-gray-600"
                                  }`}
                                />
                                <button
                                  type="button"
                                  onClick={() => adjustOrderItemQuantity(index, 1)}
                                  disabled={isCreating}
                                  aria-label="Increase order item quantity"
                                  className="flex w-11 shrink-0 items-center justify-center bg-red-500 text-white transition-all duration-200 hover:cursor-pointer hover:bg-red-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
                                >
                                  <Plus size={17} strokeWidth={2.7} />
                                </button>
                              </div>
                              <p
                                className={`text-xs font-bold ${
                                  isLight ? "text-gray-500" : "text-gray-400"
                                }`}
                              >
                                {formatCurrency(lineTotal, locale)}
                              </p>
                            </label>

                            <button
                              type="button"
                              onClick={() => removeOrderItemDraft(index)}
                              disabled={isCreating || orderItemDrafts.length === 1}
                              aria-label="Remove order product"
                              className={`flex h-11 items-center justify-center rounded-xl border transition-all duration-200 hover:cursor-pointer active:scale-95 disabled:cursor-not-allowed disabled:opacity-45 ${
                                isLight
                                  ? "border-gray-200 text-gray-500 hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                                  : "border-gray-700 text-gray-300 hover:border-red-400 hover:bg-red-500/15 hover:text-red-200"
                              }`}
                            >
                              <Trash2 size={17} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>

                <div
                  className={`rounded-xl border p-4 ${
                    isLight
                      ? "border-gray-200 bg-gray-50"
                      : "border-gray-700 bg-gray-900"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <span
                      className={`text-sm font-black uppercase tracking-wide ${
                        isLight ? "text-gray-500" : "text-gray-400"
                      }`}
                    >
                      Total
                    </span>
                    <span className="text-2xl font-black">
                      {formatCurrency(createDraftTotal, locale)}
                    </span>
                  </div>
                </div>

                <p
                  className={`min-h-5 text-sm font-bold transition-all duration-200 ${
                    createErrorMessage
                      ? "translate-y-0 text-red-500 opacity-100"
                      : "-translate-y-1 opacity-0"
                  }`}
                >
                  {createErrorMessage || "Ready"}
                </p>

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeCreateDialog}
                    disabled={isCreating}
                    className={`h-11 rounded-lg border px-4 font-bold transition-all duration-200 hover:cursor-pointer active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 ${
                      isLight
                        ? "border-gray-200 bg-white text-gray-700 hover:bg-gray-100"
                        : "border-gray-700 bg-gray-900 text-gray-200 hover:bg-gray-700"
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="flex h-11 items-center justify-center gap-2 rounded-lg bg-red-500 px-4 font-bold text-white transition-all duration-200 hover:cursor-pointer hover:bg-red-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isCreating && (
                      <LoaderCircle size={17} className="animate-spin" />
                    )}
                    Create
                  </button>
                </div>
              </form>
            </div>
          </section>
        </div>
      )}
    </main>
  );
};

export default Orders;
