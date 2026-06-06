import { useEffect, useMemo, useState } from "react";
import {
  BadgePercent,
  Boxes,
  CalendarDays,
  ImageOff,
  Package,
  RefreshCcw,
  Search,
  Sparkles,
  Tag,
  X,
} from "lucide-react";

import {
  getProducts,
  type Product,
} from "../lib/services/productService";
import { API_BASE_URL } from "../store/apiStore";
import { useThemeStore } from "../store/useThemeStore";

const formatCurrency = (value?: number | null) =>
  new Intl.NumberFormat("en", {
    style: "currency",
    currency: "AZN",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value ?? NaN) ? value ?? 0 : 0);

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

const getProductImageUrl = (imageUrl?: string | null) => {
  if (!imageUrl) return "";

  if (/^https?:\/\//i.test(imageUrl)) return imageUrl;

  return `${API_BASE_URL}/${imageUrl.replace(/^\/+/, "")}`;
};

const formatDiscount = (discount?: number | null) => {
  if (!discount || discount <= 0) return "No discount";

  return discount <= 100
    ? `${discount}% off`
    : `${formatCurrency(discount)} off`;
};

const Products = () => {
  const theme = useThemeStore((state) => state.theme);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const isLight = theme === "light";

  const loadProducts = async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await getProducts();
      setProducts(response);
    } catch {
      setErrorMessage("Products could not be loaded. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isActive = true;

    getProducts()
      .then((response) => {
        if (isActive) setProducts(response);
      })
      .catch(() => {
        if (isActive) {
          setErrorMessage("Products could not be loaded. Please try again.");
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

  const filteredProducts = useMemo(() => {
    const query = debouncedSearch.toLowerCase();

    if (!query) return products;

    return products.filter((product) =>
      [product.name, product.description].some((value) =>
        value?.toLowerCase().includes(query)
      )
    );
  }, [debouncedSearch, products]);

  const inventoryValue = useMemo(
    () =>
      products.reduce(
        (total, product) => total + (product.productItemsTotalPrice || 0),
        0
      ),
    [products]
  );

  const averagePrice = products.length
    ? products.reduce((total, product) => total + (product.price || 0), 0) /
      products.length
    : 0;
  const discountedProducts = products.filter(
    (product) => product.discount > 0
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
                <Package size={23} />
              </span>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-red-500">
                  Inventory
                </p>
                <h1 className="text-3xl font-black">Products</h1>
              </div>
            </div>
            <p
              className={`mt-3 text-sm font-semibold ${
                isLight ? "text-gray-500" : "text-gray-400"
              }`}
            >
              Browse product catalog, pricing, discounts, and total stock value.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[560px]">
            <div
              className={`rounded-xl border px-4 py-3 shadow-sm ${
                isLight
                  ? "border-gray-200 bg-white"
                  : "border-gray-700 bg-gray-800"
              }`}
            >
              <div className="flex items-center gap-3">
                <Boxes size={20} className="text-red-500" />
                <div>
                  <p
                    className={`text-xs font-bold uppercase ${
                      isLight ? "text-gray-500" : "text-gray-400"
                    }`}
                  >
                    Products
                  </p>
                  <p className="text-xl font-black">{products.length}</p>
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
                <Tag size={20} className="text-red-500" />
                <div>
                  <p
                    className={`text-xs font-bold uppercase ${
                      isLight ? "text-gray-500" : "text-gray-400"
                    }`}
                  >
                    Avg price
                  </p>
                  <p className="text-xl font-black">
                    {formatCurrency(averagePrice)}
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
                <Sparkles size={20} className="text-red-500" />
                <div>
                  <p
                    className={`text-xs font-bold uppercase ${
                      isLight ? "text-gray-500" : "text-gray-400"
                    }`}
                  >
                    Stock value
                  </p>
                  <p className="text-xl font-black">
                    {formatCurrency(inventoryValue)}
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
                  placeholder="Search products"
                  className={`h-11 w-full rounded-lg border pl-10 pr-12 text-sm font-semibold outline-none transition-all duration-200 ${
                    isLight
                      ? "border-gray-200 bg-gray-50 placeholder:text-gray-400 focus:border-amber-400"
                      : "border-gray-600 bg-gray-900 placeholder:text-gray-500 focus:border-amber-400"
                  }`}
                />
                <button
                  type="button"
                  onClick={handleSearchClear}
                  aria-label="Clear product search"
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
              <span>Showing {filteredProducts.length} of {products.length}</span>
              <span className="hidden h-1 w-1 rounded-full bg-current sm:block" />
              <span>{discountedProducts} discounted</span>
            </div>
          </div>

          {isLoading ? (
            <div className="flex min-h-80 items-center justify-center p-6">
              <p
                className={`font-semibold ${
                  isLight ? "text-gray-500" : "text-gray-400"
                }`}
              >
                Loading products...
              </p>
            </div>
          ) : errorMessage ? (
            <div className="flex min-h-80 flex-col items-center justify-center p-6 text-center">
              <p className="font-bold text-red-500">{errorMessage}</p>
              <button
                type="button"
                onClick={() => void loadProducts()}
                className="mt-4 flex h-11 items-center justify-center gap-2 rounded-lg bg-red-500 px-4 font-bold text-white transition-all duration-200 hover:cursor-pointer hover:bg-red-600 active:scale-98"
              >
                <RefreshCcw size={17} />
                Retry
              </button>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex min-h-80 flex-col items-center justify-center p-6 text-center">
              <Package
                size={38}
                className={isLight ? "text-gray-300" : "text-gray-600"}
              />
              <p className="mt-3 font-bold">No products found</p>
              <p
                className={`mt-1 text-sm font-semibold ${
                  isLight ? "text-gray-500" : "text-gray-400"
                }`}
              >
                Try a different search term.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredProducts.map((product) => {
                const imageUrl = getProductImageUrl(product.imageUrl);

                return (
                  <article
                    key={product.id}
                    className={`overflow-hidden rounded-xl border shadow-sm transition-all duration-200 hover:-translate-y-0.5 ${
                      isLight
                        ? "border-gray-200 bg-gray-50 hover:border-amber-300 hover:shadow-gray-900/10"
                        : "border-gray-700 bg-gray-900 hover:border-amber-300 hover:shadow-black/30"
                    }`}
                  >
                    <div
                      className={`relative aspect-[4/3] overflow-hidden ${
                        isLight ? "bg-gray-100" : "bg-gray-800"
                      }`}
                    >
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={product.name || "Product"}
                          className="size-full object-cover transition-transform duration-300 hover:scale-105"
                          onError={(event) => {
                            event.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <div
                          className={`flex size-full items-center justify-center ${
                            isLight ? "text-gray-300" : "text-gray-600"
                          }`}
                        >
                          <ImageOff size={40} />
                        </div>
                      )}

                      {product.discount > 0 && (
                        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-red-500 px-3 py-1 text-xs font-black text-white shadow-md shadow-red-950/15">
                          <BadgePercent size={14} />
                          {formatDiscount(product.discount)}
                        </span>
                      )}
                    </div>

                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h2 className="truncate text-lg font-black">
                            {product.name || "Unnamed product"}
                          </h2>
                          <p
                            className={`mt-1 line-clamp-2 min-h-10 text-sm font-semibold ${
                              isLight ? "text-gray-500" : "text-gray-400"
                            }`}
                          >
                            {product.description || "No description provided."}
                          </p>
                        </div>

                        <span className="shrink-0 rounded-lg bg-red-500 px-3 py-2 text-sm font-black text-white shadow-sm shadow-red-950/15">
                          {formatCurrency(product.price)}
                        </span>
                      </div>

                      <div
                        className={`mt-4 grid gap-3 border-t pt-4 text-sm ${
                          isLight ? "border-gray-200" : "border-gray-700"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span
                            className={`inline-flex items-center gap-2 font-semibold ${
                              isLight ? "text-gray-500" : "text-gray-400"
                            }`}
                          >
                            <Sparkles size={16} className="text-red-500" />
                            Items total
                          </span>
                          <span className="font-black">
                            {formatCurrency(product.productItemsTotalPrice)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-3">
                          <span
                            className={`inline-flex items-center gap-2 font-semibold ${
                              isLight ? "text-gray-500" : "text-gray-400"
                            }`}
                          >
                            <CalendarDays size={16} className="text-red-500" />
                            Updated
                          </span>
                          <span className="font-bold">
                            {formatDate(product.updatedAt)}
                          </span>
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
    </main>
  );
};

export default Products;
