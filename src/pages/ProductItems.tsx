import { useEffect, useMemo, useState } from "react";
import {
  Boxes,
  CircleDollarSign,
  PackageSearch,
  RefreshCcw,
  Ruler,
  Search,
  Warehouse,
  X,
} from "lucide-react";

import {
  getProductItems,
  type ProductItem,
} from "../lib/services/productItemsService";
import { useThemeStore } from "../store/useThemeStore";

const formatCurrency = (value?: number | null) =>
  new Intl.NumberFormat("en", {
    style: "currency",
    currency: "AZN",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value ?? NaN) ? value ?? 0 : 0);

const formatUnitCurrency = (value?: number | null) =>
  new Intl.NumberFormat("en", {
    style: "currency",
    currency: "AZN",
    maximumFractionDigits: 5,
  }).format(Number.isFinite(value ?? NaN) ? value ?? 0 : 0);

const formatNumber = (value?: number | null) =>
  new Intl.NumberFormat("en", {
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

const ProductItems = () => {
  const theme = useThemeStore((state) => state.theme);
  const [productItems, setProductItems] = useState<ProductItem[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const isLight = theme === "light";

  const loadProductItems = async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await getProductItems();
      setProductItems(response);
    } catch {
      setErrorMessage("Product items could not be loaded. Please try again.");
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
          setErrorMessage("Product items could not be loaded. Please try again.");
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
                  Warehouse
                </p>
                <h1 className="text-3xl font-black">Product Items</h1>
              </div>
            </div>
            <p
              className={`mt-3 text-sm font-semibold ${
                isLight ? "text-gray-500" : "text-gray-400"
              }`}
            >
              Track stock, units, unit prices, and total value for raw product
              items.
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
                    Items
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
                    Stock
                  </p>
                  <p className="text-xl font-black">{formatNumber(totalStock)}</p>
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
                    Avg unit
                  </p>
                  <p className="text-xl font-black">
                    {formatUnitCurrency(averageUnitPrice)}
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
                    Value
                  </p>
                  <p className="text-xl font-black">
                    {formatCurrency(totalStockValue)}
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
                  placeholder="Search product items"
                  className={`h-11 w-full rounded-lg border pl-10 pr-12 text-sm font-semibold outline-none transition-all duration-200 ${
                    isLight
                      ? "border-gray-200 bg-gray-50 placeholder:text-gray-400 focus:border-amber-400"
                      : "border-gray-600 bg-gray-900 placeholder:text-gray-500 focus:border-amber-400"
                  }`}
                />
                <button
                  type="button"
                  onClick={handleSearchClear}
                  aria-label="Clear product item search"
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

            <div
              className={`flex flex-wrap items-center gap-3 text-sm font-semibold ${
                isLight ? "text-gray-500" : "text-gray-400"
              }`}
            >
              <span>
                Showing {filteredProductItems.length} of {productItems.length}
              </span>
              <span className="hidden h-1 w-1 rounded-full bg-current sm:block" />
              <span>{lowStockCount} low stock</span>
            </div>
          </div>

          {isLoading ? (
            <div className="flex min-h-80 items-center justify-center p-6">
              <p
                className={`font-semibold ${
                  isLight ? "text-gray-500" : "text-gray-400"
                }`}
              >
                Loading product items...
              </p>
            </div>
          ) : errorMessage ? (
            <div className="flex min-h-80 flex-col items-center justify-center p-6 text-center">
              <p className="font-bold text-red-500">{errorMessage}</p>
              <button
                type="button"
                onClick={() => void loadProductItems()}
                className="mt-4 flex h-11 items-center justify-center gap-2 rounded-lg bg-red-500 px-4 font-bold text-white transition-all duration-200 hover:cursor-pointer hover:bg-red-600 active:scale-98"
              >
                <RefreshCcw size={17} />
                Retry
              </button>
            </div>
          ) : filteredProductItems.length === 0 ? (
            <div className="flex min-h-80 flex-col items-center justify-center p-6 text-center">
              <Boxes
                size={38}
                className={isLight ? "text-gray-300" : "text-gray-600"}
              />
              <p className="mt-3 font-bold">No product items found</p>
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
              {filteredProductItems.map((item) => {
                const rowValue = (item.pricePerUnit || 0) * (item.stock || 0);
                const stockStyle = getStockStyle(item.stock, isLight);

                return (
                  <article
                    key={item.id}
                    className={`grid gap-4 p-4 transition-colors duration-200 lg:grid-cols-[minmax(0,1.5fr)_minmax(160px,0.75fr)_minmax(160px,0.75fr)_minmax(160px,0.75fr)] lg:items-center ${
                      isLight ? "hover:bg-amber-50/50" : "hover:bg-gray-700/50"
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-red-500 text-white shadow-sm shadow-red-950/15">
                        <Boxes size={21} />
                      </span>
                      <div className="min-w-0">
                        <h2 className="truncate font-black">
                          {item.name || "Unnamed item"}
                        </h2>
                        <p
                          className={`mt-1 inline-flex items-center gap-1.5 text-sm font-semibold ${
                            isLight ? "text-gray-500" : "text-gray-400"
                          }`}
                        >
                          <Ruler size={15} className="text-red-500" />
                          {item.unit || "No unit"}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p
                        className={`text-xs font-black uppercase tracking-wide ${
                          isLight ? "text-gray-500" : "text-gray-400"
                        }`}
                      >
                        Price per unit
                      </p>
                      <p className="mt-1 text-lg font-black">
                        {formatUnitCurrency(item.pricePerUnit)}
                      </p>
                    </div>

                    <div>
                      <p
                        className={`text-xs font-black uppercase tracking-wide ${
                          isLight ? "text-gray-500" : "text-gray-400"
                        }`}
                      >
                        Stock
                      </p>
                      <span
                        className={`mt-1 inline-flex rounded-full border px-3 py-1 text-sm font-black ${stockStyle}`}
                      >
                        {formatNumber(item.stock)}
                      </span>
                    </div>

                    <div className="lg:text-right">
                      <p
                        className={`text-xs font-black uppercase tracking-wide ${
                          isLight ? "text-gray-500" : "text-gray-400"
                        }`}
                      >
                        Total value
                      </p>
                      <p className="mt-1 text-lg font-black">
                        {formatCurrency(rowValue)}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
};

export default ProductItems;
