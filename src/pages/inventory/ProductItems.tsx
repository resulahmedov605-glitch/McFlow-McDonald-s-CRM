import { useEffect, useMemo, useRef, useState } from "react";
import {
  Boxes,
  CircleDollarSign,
  LoaderCircle,
  Minus,
  PackageSearch,
  Plus,
  RefreshCcw,
  Ruler,
  Search,
  Warehouse,
  X,
  type LucideIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import {
  createProductItem,
  getProductItems,
  type ProductItem,
  type UnitType,
} from "../lib/services/productItemsService";
import { useThemeStore } from "../store/useThemeStore";

const formatCurrency = (value: number | null | undefined, locale: string) =>
  new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "AZN",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value ?? NaN) ? value ?? 0 : 0);

const formatUnitCurrency = (value: number | null | undefined, locale: string) =>
  new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "AZN",
    maximumFractionDigits: 5,
  }).format(Number.isFinite(value ?? NaN) ? value ?? 0 : 0);

const formatNumber = (value: number | null | undefined, locale: string) =>
  new Intl.NumberFormat(locale, {
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value ?? NaN) ? value ?? 0 : 0);

const getStockStyle = (stock: number, isLight: boolean) => {
  if (stock <= 0) {
    return isLight
      ? "border-red-300 bg-red-50 text-red-700"
      : "border-red-400/60 bg-red-500/15 text-red-200";
  }

  if (stock <= 10) {
    return isLight
      ? "border-amber-300 bg-amber-50 text-amber-700"
      : "border-amber-300/70 bg-amber-500/15 text-amber-100";
  }

  return isLight
    ? "border-emerald-300 bg-emerald-50 text-emerald-700"
    : "border-emerald-300/60 bg-emerald-500/15 text-emerald-100";
};

type NumericCreateField = "pricePerUnit" | "stock";

const unitOptions: UnitType[] = [
  "Grams",
  "Kilograms",
  "Liters",
  "Milliliters",
  "Pieces",
  "Calories",
];

const defaultCreateForm = {
  name: "",
  unit: "Grams" as UnitType,
  pricePerUnit: "",
  stock: "",
};

const ProductItems = () => {
  const theme = useThemeStore((state) => state.theme);
  const { t, i18n } = useTranslation();
  const [productItems, setProductItems] = useState<ProductItem[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreateDialogVisible, setIsCreateDialogVisible] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createErrorMessage, setCreateErrorMessage] = useState("");
  const [createForm, setCreateForm] = useState(defaultCreateForm);
  const createDialogAnimationFrameRef = useRef<number | null>(null);
  const createDialogCloseTimerRef = useRef<number | null>(null);
  const isLight = theme === "light";
  const locale = i18n.resolvedLanguage ?? i18n.language;

  const loadProductItems = async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await getProductItems();
      setProductItems(response);
    } catch {
      setErrorMessage("productItems.loadError");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isActive = true;

    getProductItems()
      .then((response) => {
        if (isActive) setProductItems(response);
      })
      .catch(() => {
        if (isActive) {
          setErrorMessage("productItems.loadError");
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

  useEffect(() => {
    return () => {
      if (createDialogAnimationFrameRef.current) {
        window.cancelAnimationFrame(createDialogAnimationFrameRef.current);
      }

      if (createDialogCloseTimerRef.current) {
        window.clearTimeout(createDialogCloseTimerRef.current);
      }
    };
  }, []);

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
    if (createDialogAnimationFrameRef.current) {
      window.cancelAnimationFrame(createDialogAnimationFrameRef.current);
    }

    if (createDialogCloseTimerRef.current) {
      window.clearTimeout(createDialogCloseTimerRef.current);
      createDialogCloseTimerRef.current = null;
    }

    setCreateErrorMessage("");
    setIsCreateDialogOpen(true);
    setIsCreateDialogVisible(false);

    createDialogAnimationFrameRef.current = window.requestAnimationFrame(() => {
      setIsCreateDialogVisible(true);
      createDialogAnimationFrameRef.current = null;
    });
  };

  const resetCreateForm = () => {
    setCreateErrorMessage("");
    setCreateForm(defaultCreateForm);
  };

  const finishCreateDialogClose = () => {
    if (createDialogAnimationFrameRef.current) {
      window.cancelAnimationFrame(createDialogAnimationFrameRef.current);
      createDialogAnimationFrameRef.current = null;
    }

    if (createDialogCloseTimerRef.current) {
      window.clearTimeout(createDialogCloseTimerRef.current);
    }

    setIsCreateDialogVisible(false);

    createDialogCloseTimerRef.current = window.setTimeout(() => {
      setIsCreateDialogOpen(false);
      resetCreateForm();
      createDialogCloseTimerRef.current = null;
    }, 320);
  };

  const closeCreateDialog = () => {
    if (isCreating) return;

    finishCreateDialogClose();
  };

  const handleCreateFormChange = (
    field: keyof typeof createForm,
    value: string | UnitType
  ) => {
    setCreateForm((current) => ({ ...current, [field]: value }));
    setCreateErrorMessage("");
  };

  const adjustCreateNumber = (field: NumericCreateField, direction: -1 | 1) => {
    const currentValue = Number(createForm[field]);
    const nextValue = Math.max(
      0,
      (Number.isFinite(currentValue) ? currentValue : 0) + direction
    );

    handleCreateFormChange(field, String(nextValue));
  };

  const handleCreateProductItem = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const name = createForm.name.trim();
    const unit = createForm.unit;
    const pricePerUnit = Number(createForm.pricePerUnit);
    const stock = Number(createForm.stock);

    if (!name) {
      setCreateErrorMessage("productItems.create.nameRequired");
      return;
    }

    if (!unitOptions.includes(unit)) {
      setCreateErrorMessage("productItems.create.invalidUnit");
      return;
    }

    if (!Number.isFinite(pricePerUnit) || pricePerUnit < 0) {
      setCreateErrorMessage("productItems.create.priceInvalid");
      return;
    }

    if (!Number.isFinite(stock) || stock < 0) {
      setCreateErrorMessage("productItems.create.stockInvalid");
      return;
    }

    setIsCreating(true);
    setCreateErrorMessage("");

    try {
      await createProductItem({
        name,
        unit,
        pricePerUnit,
        stock,
      });

      const refreshedProductItems = await getProductItems();
      setProductItems(refreshedProductItems);
      finishCreateDialogClose();
    } catch {
      setCreateErrorMessage("productItems.create.createError");
    } finally {
      setIsCreating(false);
    }
  };

  const filteredProductItems = useMemo(() => {
    const query = debouncedSearch.toLowerCase();

    if (!query) return productItems;

    return productItems.filter((item) =>
      [item.name, item.unit].some((value) =>
        value?.toLowerCase().includes(query)
      )
    );
  }, [debouncedSearch, productItems]);

  const totalStock = productItems.reduce(
    (total, item) => total + (item.stock || 0),
    0
  );
  const totalStockValue = productItems.reduce(
    (total, item) => total + (item.pricePerUnit || 0) * (item.stock || 0),
    0
  );
  const averageUnitPrice = productItems.length
    ? productItems.reduce(
        (total, item) => total + (item.pricePerUnit || 0),
        0
      ) / productItems.length
    : 0;
  const lowStockCount = productItems.filter((item) => item.stock <= 10).length;
  const trimmedSearch = search.trim();
  const isSearchPending =
    trimmedSearch.length >= 2 && trimmedSearch !== debouncedSearch;
  const renderStepperField = ({
    field,
    label,
    placeholder,
    icon: Icon,
    inputStep = "1",
  }: {
    field: NumericCreateField;
    label: string;
    placeholder: string;
    icon: LucideIcon;
    inputStep?: string;
  }) => (
    <label
      className={`rounded-xl border p-3 transition-colors duration-200 ${
        isLight
          ? "border-gray-200 bg-gray-50"
          : "border-gray-700 bg-gray-900"
      }`}
    >
      <span
        className={`flex items-center gap-2 text-xs font-black uppercase tracking-wide ${
          isLight ? "text-gray-500" : "text-gray-400"
        }`}
      >
        <Icon size={15} className="text-red-500" />
        {label}
      </span>

      <div
        className={`mt-3 flex h-12 overflow-hidden rounded-xl border ${
          isLight
            ? "border-gray-200 bg-white"
            : "border-gray-700 bg-gray-800"
        }`}
      >
        <button
          type="button"
          onClick={() => adjustCreateNumber(field, -1)}
          disabled={isCreating}
          aria-label={t("common.decrease", { label })}
          className={`flex w-12 shrink-0 items-center justify-center border-r transition-all duration-200 hover:cursor-pointer active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 ${
            isLight
              ? "border-gray-200 text-gray-600 hover:bg-red-50 hover:text-red-600"
              : "border-gray-700 text-gray-300 hover:bg-red-500/15 hover:text-red-200"
          }`}
        >
          <Minus size={18} strokeWidth={2.7} />
        </button>

        <input
          type="number"
          value={createForm[field]}
          onChange={(event) =>
            handleCreateFormChange(field, event.target.value)
          }
          min="0"
          step={inputStep}
          placeholder={placeholder}
          className={`h-full min-w-0 flex-1 bg-transparent px-2 text-center text-base font-black outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${
            isLight
              ? "placeholder:text-gray-300"
              : "placeholder:text-gray-600"
          }`}
        />

        <button
          type="button"
          onClick={() => adjustCreateNumber(field, 1)}
          disabled={isCreating}
          aria-label={t("common.increase", { label })}
          className="flex w-12 shrink-0 items-center justify-center bg-red-500 text-white transition-all duration-200 hover:cursor-pointer hover:bg-red-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
        >
          <Plus size={18} strokeWidth={2.7} />
        </button>
      </div>
    </label>
  );

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
                <Boxes size={23} />
              </span>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-red-500">
                  {t("productItems.eyebrow")}
                </p>
                <h1 className="text-3xl font-black">{t("productItems.title")}</h1>
              </div>
            </div>
            <p
              className={`mt-3 text-sm font-semibold ${
                isLight ? "text-gray-500" : "text-gray-400"
              }`}
            >
              {t("productItems.subtitle")}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[680px] xl:grid-cols-4">
            <div
              className={`rounded-xl border px-4 py-3 shadow-sm ${
                isLight
                  ? "border-gray-200 bg-white"
                  : "border-gray-700 bg-gray-800"
              }`}
            >
              <div className="flex items-center gap-3">
                <PackageSearch size={20} className="text-red-500" />
                <div>
                  <p
                    className={`text-xs font-bold uppercase ${
                      isLight ? "text-gray-500" : "text-gray-400"
                    }`}
                  >
                    {t("productItems.metrics.items")}
                  </p>
                  <p className="text-xl font-black">{productItems.length}</p>
                </div>
              </div>
            </div>

            <div
              className={`rounded-xl border px-4 py-3 shadow-sm ${
                isLight
                  ? "border-gray-200 bg-white"
                  : "border-gray-700 bg-gray-800"
              }`}
            >
              <div className="flex items-center gap-3">
                <Warehouse size={20} className="text-red-500" />
                <div>
                  <p
                    className={`text-xs font-bold uppercase ${
                      isLight ? "text-gray-500" : "text-gray-400"
                    }`}
                  >
                    {t("productItems.metrics.stock")}
                  </p>
                  <p className="text-xl font-black">{formatNumber(totalStock, locale)}</p>
                </div>
              </div>
            </div>

            <div
              className={`rounded-xl border px-4 py-3 shadow-sm ${
                isLight
                  ? "border-gray-200 bg-white"
                  : "border-gray-700 bg-gray-800"
              }`}
            >
              <div className="flex items-center gap-3">
                <CircleDollarSign size={20} className="text-red-500" />
                <div>
                  <p
                    className={`text-xs font-bold uppercase ${
                      isLight ? "text-gray-500" : "text-gray-400"
                    }`}
                  >
                    {t("productItems.metrics.avgUnit")}
                  </p>
                  <p className="text-xl font-black">
                    {formatUnitCurrency(averageUnitPrice, locale)}
                  </p>
                </div>
              </div>
            </div>

            <div
              className={`rounded-xl border px-4 py-3 shadow-sm ${
                isLight
                  ? "border-gray-200 bg-white"
                  : "border-gray-700 bg-gray-800"
              }`}
            >
              <div className="flex items-center gap-3">
                <Ruler size={20} className="text-red-500" />
                <div>
                  <p
                    className={`text-xs font-bold uppercase ${
                      isLight ? "text-gray-500" : "text-gray-400"
                    }`}
                  >
                    {t("productItems.metrics.value")}
                  </p>
                  <p className="text-xl font-black">
                    {formatCurrency(totalStockValue, locale)}
                  </p>
                </div>
              </div>
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
                  placeholder={t("productItems.searchPlaceholder")}
                  className={`h-11 w-full rounded-lg border pl-10 pr-12 text-sm font-semibold outline-none transition-all duration-200 ${
                    isLight
                      ? "border-gray-200 bg-gray-50 placeholder:text-gray-400 focus:border-amber-400"
                      : "border-gray-600 bg-gray-900 placeholder:text-gray-500 focus:border-amber-400"
                  }`}
                />
                <button
                  type="button"
                  onClick={handleSearchClear}
                  aria-label={t("productItems.clearSearch")}
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
                  ? t("common.typeMoreToSearch")
                  : t("common.searching")}
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
                <span>
                  {t("common.showingOf", {
                    shown: filteredProductItems.length,
                    total: productItems.length,
                  })}
                </span>
                <span className="hidden h-1 w-1 rounded-full bg-current sm:block" />
                <span>{t("productItems.lowStock", { count: lowStockCount })}</span>
              </div>
              <button
                type="button"
                onClick={openCreateDialog}
                aria-label={t("productItems.createAria")}
                className="flex h-11 items-center justify-center gap-2 rounded-xl bg-red-500 px-4 text-sm font-black text-white shadow-md shadow-red-950/15 transition-all duration-200 hover:cursor-pointer hover:bg-red-600 active:scale-95"
              >
                <Plus size={21} strokeWidth={2.7} />
                <span>{t("productItems.newItem")}</span>
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
                {t("productItems.loading")}
              </p>
            </div>
          ) : errorMessage ? (
            <div className="flex min-h-80 flex-col items-center justify-center p-6 text-center">
              <p className="font-bold text-red-500">{t(errorMessage)}</p>
              <button
                type="button"
                onClick={() => void loadProductItems()}
                className="mt-4 flex h-11 items-center justify-center gap-2 rounded-lg bg-red-500 px-4 font-bold text-white transition-all duration-200 hover:cursor-pointer hover:bg-red-600 active:scale-98"
              >
                <RefreshCcw size={17} />
                {t("common.retry")}
              </button>
            </div>
          ) : filteredProductItems.length === 0 ? (
            <div className="flex min-h-80 flex-col items-center justify-center p-6 text-center">
              <Boxes
                size={38}
                className={isLight ? "text-gray-300" : "text-gray-600"}
              />
              <p className="mt-3 font-bold">{t("productItems.emptyTitle")}</p>
              <p
                className={`mt-1 text-sm font-semibold ${
                  isLight ? "text-gray-500" : "text-gray-400"
                }`}
              >
                {t("productItems.emptyMessage")}
              </p>
            </div>
          ) : (
            <div className="grid gap-3 p-4">
              {filteredProductItems.map((item) => {
                const rowValue = (item.pricePerUnit || 0) * (item.stock || 0);
                const stockStyle = getStockStyle(item.stock, isLight);

                return (
                  <article
                    key={item.id}
                    className={`relative grid gap-4 overflow-hidden rounded-xl border p-4 pl-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 lg:grid-cols-[minmax(0,1.5fr)_minmax(160px,0.75fr)_minmax(160px,0.75fr)_minmax(160px,0.75fr)] lg:items-center ${
                      isLight
                        ? "border-gray-200 bg-gray-50 hover:border-amber-300 hover:bg-white hover:shadow-gray-900/10"
                        : "border-gray-700 bg-gray-900 hover:border-amber-300 hover:bg-gray-800 hover:shadow-black/30"
                    }`}
                  >
                    <span className="absolute inset-y-0 left-0 w-1 bg-red-500" />
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-red-500 text-white shadow-sm shadow-red-950/15">
                        <Boxes size={21} />
                      </span>
                      <div className="min-w-0">
                        <h2 className="truncate font-black">
                          {item.name || t("common.unnamedItem")}
                        </h2>
                        <p
                          className={`mt-1 inline-flex items-center gap-1.5 text-sm font-semibold ${
                            isLight ? "text-gray-500" : "text-gray-400"
                          }`}
                        >
                          <Ruler size={15} className="text-red-500" />
                          {item.unit
                            ? t(`units.${item.unit}`, { defaultValue: item.unit })
                            : t("productItems.noUnit")}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p
                        className={`text-xs font-black uppercase tracking-wide ${
                          isLight ? "text-gray-500" : "text-gray-400"
                        }`}
                      >
                        {t("productItems.pricePerUnit")}
                      </p>
                      <p className="mt-1 text-lg font-black">
                        {formatUnitCurrency(item.pricePerUnit, locale)}
                      </p>
                    </div>

                    <div>
                      <p
                        className={`text-xs font-black uppercase tracking-wide ${
                          isLight ? "text-gray-500" : "text-gray-400"
                        }`}
                      >
                        {t("productItems.stock")}
                      </p>
                      <span
                        className={`mt-1 inline-flex rounded-full border px-3 py-1 text-sm font-black ${stockStyle}`}
                      >
                        {formatNumber(item.stock, locale)}
                      </span>
                    </div>

                    <div className="lg:text-right">
                      <p
                        className={`text-xs font-black uppercase tracking-wide ${
                          isLight ? "text-gray-500" : "text-gray-400"
                        }`}
                      >
                        {t("productItems.totalValue")}
                      </p>
                      <p className="mt-1 text-lg font-black">
                        {formatCurrency(rowValue, locale)}
                      </p>
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
          aria-hidden={!isCreateDialogVisible}
          className={`fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-black/45 px-4 py-5 backdrop-blur-[2px] transition-all duration-300 ease-out sm:items-center ${
            isCreateDialogVisible
              ? "pointer-events-auto opacity-100"
              : "pointer-events-none opacity-0"
          }`}
          onClick={closeCreateDialog}
        >
          <section
            className={`w-full max-w-2xl overflow-hidden rounded-2xl border shadow-2xl transition-all duration-300 ease-out ${
              isCreateDialogVisible
                ? "translate-y-0 scale-100 opacity-100"
                : "translate-y-5 scale-95 opacity-0 sm:translate-y-3"
            } ${
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
                      {t("productItems.create.eyebrow")}
                    </p>
                    <h2 className="text-xl font-black">
                      {t("productItems.create.title")}
                    </h2>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={closeCreateDialog}
                  aria-label={t("productItems.create.closeAria")}
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

              <form
                onSubmit={handleCreateProductItem}
                className="mt-6 grid gap-4"
              >
                <label
                  className={`rounded-xl border p-3 transition-colors duration-200 ${
                    isLight
                      ? "border-gray-200 bg-gray-50"
                      : "border-gray-700 bg-gray-900"
                  }`}
                >
                  <span
                    className={`flex items-center gap-2 text-xs font-black uppercase tracking-wide ${
                      isLight ? "text-gray-500" : "text-gray-400"
                    }`}
                  >
                    <Boxes size={15} className="text-red-500" />
                    {t("productItems.create.name")}
                  </span>
                  <input
                    type="text"
                    value={createForm.name}
                    onChange={(event) =>
                      handleCreateFormChange("name", event.target.value)
                    }
                    placeholder={t("productItems.create.namePlaceholder")}
                    className={`mt-3 h-12 w-full rounded-xl border px-4 text-base font-black outline-none transition-all duration-200 ${
                      isLight
                        ? "border-gray-200 bg-white placeholder:text-gray-300 focus:border-amber-400"
                        : "border-gray-700 bg-gray-800 placeholder:text-gray-600 focus:border-amber-400"
                    }`}
                  />
                </label>

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
                    <Ruler size={15} className="text-red-500" />
                    {t("productItems.create.unit")}
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {unitOptions.map((unit) => {
                      const isActive = createForm.unit === unit;

                      return (
                        <button
                          key={unit}
                          type="button"
                          onClick={() => handleCreateFormChange("unit", unit)}
                          disabled={isCreating}
                          className={`h-11 rounded-xl border px-2 text-sm font-black transition-all duration-200 hover:cursor-pointer active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 ${
                            isActive
                              ? "border-red-500 bg-red-500 text-white shadow-md shadow-red-950/15"
                              : isLight
                              ? "border-gray-200 bg-white text-gray-600 hover:border-amber-300 hover:bg-amber-50 hover:text-red-600"
                              : "border-gray-700 bg-gray-800 text-gray-300 hover:border-amber-300 hover:bg-gray-700 hover:text-amber-100"
                          }`}
                        >
                          {t(`units.${unit}`)}
                        </button>
                      );
                    })}
                  </div>
                </section>

                <div className="grid gap-4 sm:grid-cols-2">
                  {renderStepperField({
                    field: "pricePerUnit",
                    label: t("productItems.create.unitPrice"),
                    placeholder: "0",
                    icon: CircleDollarSign,
                    inputStep: "0.00001",
                  })}
                  {renderStepperField({
                    field: "stock",
                    label: t("productItems.create.stock"),
                    placeholder: "0",
                    icon: Warehouse,
                  })}
                </div>

                <p
                  className={`min-h-5 text-sm font-bold transition-all duration-200 ${
                    createErrorMessage
                      ? "translate-y-0 text-red-500 opacity-100"
                      : "-translate-y-1 opacity-0"
                  }`}
                >
                  {createErrorMessage ? t(createErrorMessage) : t("common.ready")}
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
                    {t("common.cancel")}
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="flex h-11 items-center justify-center gap-2 rounded-lg bg-red-500 px-4 font-bold text-white transition-all duration-200 hover:cursor-pointer hover:bg-red-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isCreating && (
                      <LoaderCircle size={17} className="animate-spin" />
                    )}
                    {t("common.create")}
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

export default ProductItems;
