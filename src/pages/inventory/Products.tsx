import { useEffect, useMemo, useRef, useState } from "react";
import {
  BadgePercent,
  Boxes,
  CalendarDays,
  CircleDollarSign,
  CreditCard,
  FileText,
  ImageOff,
  ImagePlus,
  LoaderCircle,
  Minus,
  Package,
  Plus,
  RefreshCcw,
  Search,
  ShoppingCart,
  Sparkles,
  Tag,
  Trash2,
  X,
  type LucideIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";

import {
  createProduct,
  deleteProduct,
  getProducts,
  uploadProductImage,
  type Product,
} from "../../lib/services/productService";
import {
  getProductItems,
  type ProductItem,
} from "../../lib/services/productItemsService";
import {
  createOrder,
  type PaymentType,
} from "../../lib/services/orderService";
import { API_BASE_URL } from "../../store/apiStore";
import useAuthStore from "../../store/authStore";
import { useThemeStore } from "../../store/useThemeStore";

const formatCurrency = (value: number | null | undefined, locale: string) =>
  new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "AZN",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value ?? NaN) ? value ?? 0 : 0);

const formatDate = (
  value: string | null | undefined,
  fallback: string
) => {
  if (!value) return fallback;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return fallback;

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear()).padStart(4, "0");

  return `${day}.${month}.${year}`;
};

const getProductImageUrl = (imageUrl?: string | null) => {
  if (!imageUrl) return "";

  if (/^https?:\/\//i.test(imageUrl)) return imageUrl;

  return `${API_BASE_URL}/${imageUrl.replace(/^\/+/, "")}`;
};

const formatDiscount = (
  discount: number | null | undefined,
  locale: string,
  t: (key: string, options?: Record<string, unknown>) => string
) => {
  if (!discount || discount <= 0) return t("products.noDiscount");

  return discount <= 100
    ? t("products.percentOff", {
        value: new Intl.NumberFormat(locale, {
          maximumFractionDigits: 2,
        }).format(discount),
      })
    : t("products.amountOff", { value: formatCurrency(discount, locale) });
};

type NumericCreateField = "price" | "discount";

type ProductItemDraft = {
  productItemId: string;
  quantity: string;
};

const defaultCreateProductForm = {
  name: "",
  price: "",
  description: "",
  discount: "",
};

const paymentTypes: Array<{ labelKey: string; value: PaymentType }> = [
  { labelKey: "products.quickOrder.payment.cash", value: 0 },
  { labelKey: "products.quickOrder.payment.card", value: 1 },
];

const Products = () => {
  const theme = useThemeStore((state) => state.theme);
  const currentUser = useAuthStore((state) => state.user);
  const { t, i18n } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreateDialogVisible, setIsCreateDialogVisible] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createErrorMessage, setCreateErrorMessage] = useState("");
  const [createForm, setCreateForm] = useState(defaultCreateProductForm);
  const [availableProductItems, setAvailableProductItems] = useState<
    ProductItem[]
  >([]);
  const [isProductItemsLoading, setIsProductItemsLoading] = useState(false);
  const [productItemDrafts, setProductItemDrafts] = useState<
    ProductItemDraft[]
  >([]);
  const [productImageFile, setProductImageFile] = useState<File | null>(null);
  const [productImagePreviewUrl, setProductImagePreviewUrl] = useState("");
  const [quickOrderProduct, setQuickOrderProduct] = useState<Product | null>(
    null
  );
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isQuickOrderDialogVisible, setIsQuickOrderDialogVisible] =
    useState(false);
  const [isDeleteDialogVisible, setIsDeleteDialogVisible] = useState(false);
  const [isQuickOrderCreating, setIsQuickOrderCreating] = useState(false);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);
  const [quickOrderErrorMessage, setQuickOrderErrorMessage] = useState("");
  const [quickOrderQuantity, setQuickOrderQuantity] = useState("1");
  const [quickOrderPaymentType, setQuickOrderPaymentType] =
    useState<PaymentType>(0);
  const createDialogAnimationFrameRef = useRef<number | null>(null);
  const createDialogCloseTimerRef = useRef<number | null>(null);
  const quickOrderDialogAnimationFrameRef = useRef<number | null>(null);
  const quickOrderDialogCloseTimerRef = useRef<number | null>(null);
  const deleteDialogAnimationFrameRef = useRef<number | null>(null);
  const deleteDialogCloseTimerRef = useRef<number | null>(null);
  const isLight = theme === "light";
  const locale = i18n.resolvedLanguage ?? i18n.language;

  const loadProducts = async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await getProducts();
      setProducts(response);
    } catch {
      setErrorMessage("products.loadError");
      toast.error(t("products.loadError"), { id: "products-load-error" });
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
          setErrorMessage("products.loadError");
          toast.error(t("products.loadError"), { id: "products-load-error" });
        }
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [t]);

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

      if (quickOrderDialogAnimationFrameRef.current) {
        window.cancelAnimationFrame(quickOrderDialogAnimationFrameRef.current);
      }

      if (quickOrderDialogCloseTimerRef.current) {
        window.clearTimeout(quickOrderDialogCloseTimerRef.current);
      }

      if (deleteDialogAnimationFrameRef.current) {
        window.cancelAnimationFrame(deleteDialogAnimationFrameRef.current);
      }

      if (deleteDialogCloseTimerRef.current) {
        window.clearTimeout(deleteDialogCloseTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      if (productImagePreviewUrl) {
        window.URL.revokeObjectURL(productImagePreviewUrl);
      }
    };
  }, [productImagePreviewUrl]);

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
    setCreateForm(defaultCreateProductForm);
    setProductItemDrafts([]);
    setProductImageFile(null);

    if (productImagePreviewUrl) {
      window.URL.revokeObjectURL(productImagePreviewUrl);
      setProductImagePreviewUrl("");
    }
  };

  const handleProductImageSelect = (file?: File) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setCreateErrorMessage("products.create.invalidImage");
      toast.error(t("products.create.invalidImage"));
      return;
    }

    if (productImagePreviewUrl) {
      window.URL.revokeObjectURL(productImagePreviewUrl);
    }

    const previewUrl = window.URL.createObjectURL(file);
    setProductImageFile(file);
    setProductImagePreviewUrl(previewUrl);
    setCreateErrorMessage("");
  };

  const clearProductImage = () => {
    setProductImageFile(null);

    if (productImagePreviewUrl) {
      window.URL.revokeObjectURL(productImagePreviewUrl);
      setProductImagePreviewUrl("");
    }
  };

  const loadProductItemsForCreate = async () => {
    setIsProductItemsLoading(true);

    try {
      const response = await getProductItems();
      setAvailableProductItems(response);

      if (response.length > 0) {
        setProductItemDrafts((current) =>
          current.length > 0
            ? current
            : [{ productItemId: response[0].id, quantity: "1" }]
        );
      }
    } catch {
      setCreateErrorMessage("productItems.loadError");
      toast.error(t("productItems.loadError"), {
        id: "product-items-load-error",
      });
    } finally {
      setIsProductItemsLoading(false);
    }
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

    if (availableProductItems.length === 0) {
      void loadProductItemsForCreate();
    } else if (productItemDrafts.length === 0) {
      setProductItemDrafts([
        { productItemId: availableProductItems[0].id, quantity: "1" },
      ]);
    }
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

  const openQuickOrderDialog = (product: Product) => {
    if (quickOrderDialogAnimationFrameRef.current) {
      window.cancelAnimationFrame(quickOrderDialogAnimationFrameRef.current);
    }

    if (quickOrderDialogCloseTimerRef.current) {
      window.clearTimeout(quickOrderDialogCloseTimerRef.current);
      quickOrderDialogCloseTimerRef.current = null;
    }

    setQuickOrderProduct(product);
    setQuickOrderQuantity("1");
    setQuickOrderPaymentType(0);
    setQuickOrderErrorMessage("");
    setIsQuickOrderDialogVisible(false);

    quickOrderDialogAnimationFrameRef.current = window.requestAnimationFrame(
      () => {
        setIsQuickOrderDialogVisible(true);
        quickOrderDialogAnimationFrameRef.current = null;
      }
    );
  };

  const finishQuickOrderDialogClose = () => {
    if (quickOrderDialogAnimationFrameRef.current) {
      window.cancelAnimationFrame(quickOrderDialogAnimationFrameRef.current);
      quickOrderDialogAnimationFrameRef.current = null;
    }

    if (quickOrderDialogCloseTimerRef.current) {
      window.clearTimeout(quickOrderDialogCloseTimerRef.current);
    }

    setIsQuickOrderDialogVisible(false);

    quickOrderDialogCloseTimerRef.current = window.setTimeout(() => {
      setQuickOrderProduct(null);
      setQuickOrderQuantity("1");
      setQuickOrderPaymentType(0);
      setQuickOrderErrorMessage("");
      quickOrderDialogCloseTimerRef.current = null;
    }, 320);
  };

  const closeQuickOrderDialog = () => {
    if (isQuickOrderCreating) return;

    finishQuickOrderDialogClose();
  };

  const openDeleteDialog = (product: Product) => {
    if (deleteDialogAnimationFrameRef.current) {
      window.cancelAnimationFrame(deleteDialogAnimationFrameRef.current);
    }

    if (deleteDialogCloseTimerRef.current) {
      window.clearTimeout(deleteDialogCloseTimerRef.current);
      deleteDialogCloseTimerRef.current = null;
    }

    setProductToDelete(product);
    setIsDeleteDialogVisible(false);

    deleteDialogAnimationFrameRef.current = window.requestAnimationFrame(() => {
      setIsDeleteDialogVisible(true);
      deleteDialogAnimationFrameRef.current = null;
    });
  };

  const finishDeleteDialogClose = () => {
    if (deleteDialogAnimationFrameRef.current) {
      window.cancelAnimationFrame(deleteDialogAnimationFrameRef.current);
      deleteDialogAnimationFrameRef.current = null;
    }

    if (deleteDialogCloseTimerRef.current) {
      window.clearTimeout(deleteDialogCloseTimerRef.current);
    }

    setIsDeleteDialogVisible(false);

    deleteDialogCloseTimerRef.current = window.setTimeout(() => {
      setProductToDelete(null);
      deleteDialogCloseTimerRef.current = null;
    }, 320);
  };

  const closeDeleteDialog = () => {
    if (isDeletingProduct) return;

    finishDeleteDialogClose();
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;

    setIsDeletingProduct(true);

    try {
      await deleteProduct(productToDelete.id);
      const refreshedProducts = await getProducts();
      setProducts(refreshedProducts);
      toast.success(t("products.delete.success"));
      finishDeleteDialogClose();
    } catch {
      toast.error(t("products.delete.error"));
    } finally {
      setIsDeletingProduct(false);
    }
  };

  const handleQuickOrderQuantityChange = (value: string) => {
    setQuickOrderQuantity(value);
    setQuickOrderErrorMessage("");
  };

  const adjustQuickOrderQuantity = (direction: -1 | 1) => {
    const currentQuantity = Number(quickOrderQuantity);
    const nextQuantity = Math.max(
      1,
      (Number.isFinite(currentQuantity) ? currentQuantity : 1) + direction
    );

    handleQuickOrderQuantityChange(String(nextQuantity));
  };

  const quickOrderQuantityValue = Number(quickOrderQuantity);
  const quickOrderTotal =
    quickOrderProduct &&
    Number.isFinite(quickOrderQuantityValue) &&
    quickOrderQuantityValue > 0
      ? quickOrderProduct.price * quickOrderQuantityValue
      : 0;

  const handleCreateQuickOrder = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!quickOrderProduct) return;

    if (!currentUser?.id) {
      setQuickOrderErrorMessage("products.quickOrder.userMissing");
      toast.error(t("products.quickOrder.userMissing"));
      return;
    }

    if (
      !Number.isFinite(quickOrderQuantityValue) ||
      quickOrderQuantityValue <= 0
    ) {
      setQuickOrderErrorMessage("products.quickOrder.quantityInvalid");
      toast.error(t("products.quickOrder.quantityInvalid"));
      return;
    }

    setIsQuickOrderCreating(true);
    setQuickOrderErrorMessage("");

    try {
      await createOrder({
        creatorId: currentUser.id,
        orderItems: [
          {
            productId: quickOrderProduct.id,
            quantity: quickOrderQuantityValue,
            price: quickOrderProduct.price,
          },
        ],
        totalPrice: quickOrderTotal,
        paymentType: quickOrderPaymentType,
      });

      toast.success(t("products.quickOrder.toast.created"));
      finishQuickOrderDialogClose();
    } catch {
      setQuickOrderErrorMessage("products.quickOrder.createError");
      toast.error(t("products.quickOrder.toast.createError"));
    } finally {
      setIsQuickOrderCreating(false);
    }
  };

  const handleCreateFormChange = (
    field: keyof typeof createForm,
    value: string
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

  const showCreateError = (messageKey: string) => {
    setCreateErrorMessage(messageKey);
    toast.error(t(messageKey));
  };

  const handleProductItemDraftChange = (
    index: number,
    field: keyof ProductItemDraft,
    value: string
  ) => {
    setProductItemDrafts((current) =>
      current.map((draft, draftIndex) =>
        draftIndex === index ? { ...draft, [field]: value } : draft
      )
    );
    setCreateErrorMessage("");
  };

  const adjustProductItemQuantity = (index: number, direction: -1 | 1) => {
    const currentDraft = productItemDrafts[index];
    const currentQuantity = Number(currentDraft?.quantity);
    const nextQuantity = Math.max(
      0,
      (Number.isFinite(currentQuantity) ? currentQuantity : 0) + direction
    );

    handleProductItemDraftChange(index, "quantity", String(nextQuantity));
  };

  const addProductItemDraft = () => {
    const firstProductItem = availableProductItems[0];

    if (!firstProductItem) {
      showCreateError("products.create.noProductItemsAvailable");
      return;
    }

    setProductItemDrafts((current) => [
      ...current,
      { productItemId: firstProductItem.id, quantity: "1" },
    ]);
    setCreateErrorMessage("");
  };

  const removeProductItemDraft = (index: number) => {
    setProductItemDrafts((current) =>
      current.filter((_, draftIndex) => draftIndex !== index)
    );
    setCreateErrorMessage("");
  };

  const handleCreateProduct = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const name = createForm.name.trim();
    const description = createForm.description.trim();
    const price = Number(createForm.price);
    const discount = createForm.discount.trim()
      ? Number(createForm.discount)
      : 0;
    const productItems = productItemDrafts.map((draft) => ({
      productItemId: draft.productItemId,
      quantity: Number(draft.quantity),
    }));

    if (!name) {
      showCreateError("products.create.nameRequired");
      return;
    }

    if (!productImageFile) {
      showCreateError("products.create.imageRequired");
      return;
    }

    if (!createForm.price.trim() || !Number.isFinite(price) || price < 0) {
      showCreateError("products.create.priceInvalid");
      return;
    }

    if (!Number.isFinite(discount) || discount < 0) {
      showCreateError("products.create.discountInvalid");
      return;
    }

    if (
      productItems.length === 0 ||
      productItems.some(
        (item) =>
          !item.productItemId ||
          !Number.isFinite(item.quantity) ||
          item.quantity <= 0
      )
    ) {
      showCreateError("products.create.productItemsInvalid");
      return;
    }

    setIsCreating(true);
    setCreateErrorMessage("");

    try {
      const imageUrl = await uploadProductImage(productImageFile);

      await createProduct({
        name,
        price,
        description,
        imageUrl,
        discount,
        productItems,
      });

      const refreshedProducts = await getProducts();
      setProducts(refreshedProducts);
      toast.success(t("products.create.created"));
      finishCreateDialogClose();
    } catch {
      setCreateErrorMessage("products.create.createError");
      toast.error(t("products.create.createError"));
    } finally {
      setIsCreating(false);
    }
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
                <Package size={23} />
              </span>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-red-500">
                  {t("products.eyebrow")}
                </p>
                <h1 className="text-3xl font-black">{t("products.title")}</h1>
              </div>
            </div>
            <p
              className={`mt-3 text-sm font-semibold ${
                isLight ? "text-gray-500" : "text-gray-400"
              }`}
            >
              {t("products.subtitle")}
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
                    {t("products.metrics.products")}
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
                    {t("products.metrics.avgPrice")}
                  </p>
                  <p className="text-xl font-black">
                    {formatCurrency(averagePrice, locale)}
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
                    {t("products.metrics.stockValue")}
                  </p>
                  <p className="text-xl font-black">
                    {formatCurrency(inventoryValue, locale)}
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
                  placeholder={t("products.searchPlaceholder")}
                  className={`h-11 w-full rounded-lg border pl-10 pr-12 text-sm font-semibold outline-none transition-all duration-200 ${
                    isLight
                      ? "border-gray-200 bg-gray-50 placeholder:text-gray-400 focus:border-amber-400"
                      : "border-gray-600 bg-gray-900 placeholder:text-gray-500 focus:border-amber-400"
                  }`}
                />
                <button
                  type="button"
                  onClick={handleSearchClear}
                  aria-label={t("products.clearSearch")}
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
                    shown: filteredProducts.length,
                    total: products.length,
                  })}
                </span>
                <span className="hidden h-1 w-1 rounded-full bg-current sm:block" />
                <span>{t("products.discounted", { count: discountedProducts })}</span>
              </div>
              <button
                type="button"
                onClick={openCreateDialog}
                aria-label={t("products.createAria")}
                className="flex h-11 items-center justify-center gap-2 rounded-xl bg-red-500 px-4 text-sm font-black text-white shadow-md shadow-red-950/15 transition-all duration-200 hover:cursor-pointer hover:bg-red-600 active:scale-95"
              >
                <Plus size={21} strokeWidth={2.7} />
                <span>{t("products.newProduct")}</span>
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
                {t("products.loading")}
              </p>
            </div>
          ) : errorMessage ? (
            <div className="flex min-h-80 flex-col items-center justify-center p-6 text-center">
              <p className="font-bold text-red-500">{t(errorMessage)}</p>
              <button
                type="button"
                onClick={() => void loadProducts()}
                className="mt-4 flex h-11 items-center justify-center gap-2 rounded-lg bg-red-500 px-4 font-bold text-white transition-all duration-200 hover:cursor-pointer hover:bg-red-600 active:scale-98"
              >
                <RefreshCcw size={17} />
                {t("common.retry")}
              </button>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex min-h-80 flex-col items-center justify-center p-6 text-center">
              <Package
                size={38}
                className={isLight ? "text-gray-300" : "text-gray-600"}
              />
              <p className="mt-3 font-bold">{t("products.emptyTitle")}</p>
              <p
                className={`mt-1 text-sm font-semibold ${
                  isLight ? "text-gray-500" : "text-gray-400"
                }`}
              >
                {t("products.emptyMessage")}
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
                          alt={product.name || t("common.productAlt")}
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
                          {formatDiscount(product.discount, locale, t)}
                        </span>
                      )}
                    </div>

                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h2 className="truncate text-lg font-black">
                            {product.name || t("common.unnamedProduct")}
                          </h2>
                          <p
                            className={`mt-1 line-clamp-2 min-h-10 text-sm font-semibold ${
                              isLight ? "text-gray-500" : "text-gray-400"
                            }`}
                          >
                            {product.description || t("common.noDescription")}
                          </p>
                        </div>

                        <span className="shrink-0 rounded-lg bg-red-500 px-3 py-2 text-sm font-black text-white shadow-sm shadow-red-950/15">
                          {formatCurrency(product.price, locale)}
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
                            <Boxes size={16} className="text-red-500" />
                            {t("products.itemsTotal")}
                          </span>
                          <span className="font-black">
                            {formatCurrency(
                              product.productItemsTotalPrice,
                              locale
                            )}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-3">
                          <span
                            className={`inline-flex items-center gap-2 font-semibold ${
                              isLight ? "text-gray-500" : "text-gray-400"
                            }`}
                          >
                            <CalendarDays size={16} className="text-red-500" />
                            {t("products.updated")}
                          </span>
                          <span className="font-bold">
                            {formatDate(
                              product.createdAt,
                              t("common.notAvailable")
                            )}
                          </span>
                        </div>

                        <div className="mt-1 grid gap-2 sm:grid-cols-2">
                          <button
                            type="button"
                            onClick={() => openQuickOrderDialog(product)}
                            aria-label={t("products.quickOrder.createFor", {
                              product:
                                product.name || t("common.unnamedProduct"),
                            })}
                            className="flex h-11 items-center justify-center gap-2 rounded-xl bg-red-500 px-4 text-sm font-black text-white shadow-md shadow-red-950/15 transition-all duration-200 hover:cursor-pointer hover:bg-amber-400 hover:text-gray-950 hover:shadow-amber-500/25 active:scale-95"
                          >
                            <ShoppingCart size={17} strokeWidth={2.7} />
                            <span>{t("products.quickOrder.cardAction")}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => openDeleteDialog(product)}
                            aria-label={t("products.delete.aria", {
                              product:
                                product.name || t("common.unnamedProduct"),
                            })}
                            className={`flex h-11 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-black transition-all duration-200 hover:cursor-pointer ${
                              isLight
                                ? "border-red-200 bg-white text-red-600 hover:border-red-300 hover:bg-red-50"
                                : "border-red-400/40 bg-gray-800 text-red-200 hover:border-red-300 hover:bg-red-500/15"
                            }`}
                          >
                            <Trash2 size={17} strokeWidth={2.7} />
                            <span>{t("products.delete.button")}</span>
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

      {productToDelete && (
        <div
          aria-hidden={!isDeleteDialogVisible}
          className={`fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-black/45 px-4 py-5 backdrop-blur-[2px] transition-all duration-300 ease-out sm:items-center ${
            isDeleteDialogVisible
              ? "pointer-events-auto opacity-100"
              : "pointer-events-none opacity-0"
          }`}
          onClick={closeDeleteDialog}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-product-dialog-title"
            onClick={(event) => event.stopPropagation()}
            className={`w-full max-w-md overflow-hidden rounded-2xl border p-5 shadow-2xl transition-all duration-300 ease-out sm:p-6 ${
              isDeleteDialogVisible
                ? "translate-y-0 scale-100 opacity-100"
                : "translate-y-5 scale-95 opacity-0 sm:translate-y-3"
            } ${
              isLight
                ? "border-gray-200 bg-white text-gray-900 shadow-gray-950/15"
                : "border-gray-700 bg-gray-800 text-white shadow-black/35"
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-red-500 text-white shadow-md shadow-red-950/20">
                <Trash2 size={22} />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-red-500">
                  {t("products.delete.eyebrow")}
                </p>
                <h2 id="delete-product-dialog-title" className="mt-1 text-xl font-black">
                  {t("products.delete.title")}
                </h2>
                <p
                  className={`mt-2 text-sm font-semibold ${
                    isLight ? "text-gray-500" : "text-gray-400"
                  }`}
                >
                  {t("products.delete.message", {
                    product:
                      productToDelete.name || t("common.unnamedProduct"),
                  })}
                </p>
              </div>
            </div>

            <div
              className={`mt-5 flex flex-col-reverse gap-3 border-t pt-4 sm:flex-row sm:justify-end ${
                isLight ? "border-gray-200" : "border-gray-700"
              }`}
            >
              <button
                type="button"
                onClick={closeDeleteDialog}
                disabled={isDeletingProduct}
                className={`h-11 rounded-xl border px-5 font-bold transition-all duration-200 hover:cursor-pointer active:scale-98 disabled:cursor-not-allowed disabled:opacity-60 ${
                  isLight
                    ? "border-gray-200 bg-white hover:bg-gray-100"
                    : "border-gray-700 bg-gray-900 hover:bg-gray-700"
                }`}
              >
                {t("common.cancel")}
              </button>
              <button
                type="button"
                onClick={() => void handleDeleteProduct()}
                disabled={isDeletingProduct}
                className="flex h-11 items-center justify-center gap-2 rounded-xl bg-red-500 px-5 font-bold text-white shadow-md shadow-red-950/20 transition-all duration-200 hover:cursor-pointer hover:bg-red-600 active:scale-98 disabled:cursor-not-allowed disabled:bg-red-300"
              >
                {isDeletingProduct && (
                  <LoaderCircle size={17} className="animate-spin" />
                )}
                {isDeletingProduct
                  ? t("products.delete.deleting")
                  : t("products.delete.confirm")}
              </button>
            </div>
          </section>
        </div>
      )}

      {quickOrderProduct && (
        <div
          aria-hidden={!isQuickOrderDialogVisible}
          className={`fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-black/45 px-4 py-5 backdrop-blur-[2px] transition-all duration-300 ease-out sm:items-center ${
            isQuickOrderDialogVisible
              ? "pointer-events-auto opacity-100"
              : "pointer-events-none opacity-0"
          }`}
          onClick={closeQuickOrderDialog}
        >
          <section
            className={`w-full max-w-xl overflow-hidden rounded-2xl border shadow-2xl transition-all duration-300 ease-out ${
              isQuickOrderDialogVisible
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
                    <ShoppingCart size={21} />
                  </span>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-red-500">
                      {t("products.quickOrder.eyebrow")}
                    </p>
                    <h2 className="text-xl font-black">
                      {t("products.quickOrder.title")}
                    </h2>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={closeQuickOrderDialog}
                  aria-label={t("products.quickOrder.closeAria")}
                  disabled={isQuickOrderCreating}
                  className={`flex size-10 shrink-0 items-center justify-center rounded-full border transition-all duration-200 hover:cursor-pointer active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 ${
                    isLight
                      ? "border-gray-200 hover:bg-gray-100"
                      : "border-gray-700 hover:bg-gray-700"
                  }`}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateQuickOrder} className="mt-6 grid gap-4">
                <section
                  className={`grid gap-3 rounded-xl border p-3 transition-colors duration-200 sm:grid-cols-[96px_minmax(0,1fr)] ${
                    isLight
                      ? "border-gray-200 bg-gray-50"
                      : "border-gray-700 bg-gray-900"
                  }`}
                >
                  <div
                    className={`relative aspect-square overflow-hidden rounded-xl ${
                      isLight ? "bg-gray-100" : "bg-gray-800"
                    }`}
                  >
                    {getProductImageUrl(quickOrderProduct.imageUrl) ? (
                      <img
                        src={getProductImageUrl(quickOrderProduct.imageUrl)}
                        alt={quickOrderProduct.name || t("common.productAlt")}
                        className="size-full object-cover"
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
                        <ImageOff size={28} />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <h3 className="truncate text-lg font-black">
                      {quickOrderProduct.name || t("common.unnamedProduct")}
                    </h3>
                    <p
                      className={`mt-1 line-clamp-2 text-sm font-semibold ${
                        isLight ? "text-gray-500" : "text-gray-400"
                      }`}
                    >
                      {quickOrderProduct.description || t("common.noDescription")}
                    </p>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <span className="rounded-lg bg-red-500 px-3 py-2 text-sm font-black text-white shadow-sm shadow-red-950/15">
                        {formatCurrency(quickOrderProduct.price, locale)}
                      </span>
                      {quickOrderProduct.discount > 0 && (
                        <span
                          className={`rounded-lg border px-3 py-2 text-xs font-black ${
                            isLight
                              ? "border-amber-300 bg-amber-50 text-red-700"
                              : "border-amber-300/50 bg-amber-300/10 text-amber-100"
                          }`}
                        >
                          {formatDiscount(quickOrderProduct.discount, locale, t)}
                        </span>
                      )}
                    </div>
                  </div>
                </section>

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
                    <Package size={15} className="text-red-500" />
                    {t("products.quickOrder.quantity")}
                  </div>

                  <div
                    className={`mt-3 flex h-12 overflow-hidden rounded-xl border ${
                      isLight
                        ? "border-gray-200 bg-white"
                        : "border-gray-700 bg-gray-800"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => adjustQuickOrderQuantity(-1)}
                      disabled={isQuickOrderCreating}
                      aria-label={t("products.quickOrder.decreaseQuantity")}
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
                      value={quickOrderQuantity}
                      onChange={(event) =>
                        handleQuickOrderQuantityChange(event.target.value)
                      }
                      min="1"
                      step="1"
                      disabled={isQuickOrderCreating}
                      className={`h-full min-w-0 flex-1 bg-transparent px-2 text-center text-base font-black outline-none [appearance:textfield] disabled:cursor-not-allowed disabled:opacity-60 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${
                        isLight
                          ? "placeholder:text-gray-300"
                          : "placeholder:text-gray-600"
                      }`}
                    />

                    <button
                      type="button"
                      onClick={() => adjustQuickOrderQuantity(1)}
                      disabled={isQuickOrderCreating}
                      aria-label={t("products.quickOrder.increaseQuantity")}
                      className="flex w-12 shrink-0 items-center justify-center bg-red-500 text-white transition-all duration-200 hover:cursor-pointer hover:bg-red-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      <Plus size={18} strokeWidth={2.7} />
                    </button>
                  </div>
                </section>

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
                    {t("products.quickOrder.payment.label")}
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {paymentTypes.map(({ labelKey, value }) => {
                      const isActive = quickOrderPaymentType === value;

                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setQuickOrderPaymentType(value)}
                          disabled={isQuickOrderCreating}
                          className={`h-11 rounded-xl border px-2 text-sm font-black transition-all duration-200 hover:cursor-pointer active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 ${
                            isActive
                              ? "border-red-500 bg-red-500 text-white shadow-md shadow-red-950/15"
                              : isLight
                              ? "border-gray-200 bg-white text-gray-600 hover:border-amber-300 hover:bg-amber-50 hover:text-red-600"
                              : "border-gray-700 bg-gray-800 text-gray-300 hover:border-amber-300 hover:bg-gray-700 hover:text-amber-100"
                          }`}
                        >
                          {t(labelKey)}
                        </button>
                      );
                    })}
                  </div>
                </section>

                <div
                  className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
                    isLight
                      ? "border-gray-200 bg-white"
                      : "border-gray-700 bg-gray-900"
                  }`}
                >
                  <span
                    className={`text-sm font-black uppercase tracking-wide ${
                      isLight ? "text-gray-500" : "text-gray-400"
                    }`}
                  >
                    {t("products.quickOrder.total")}
                  </span>
                  <span className="text-xl font-black">
                    {formatCurrency(quickOrderTotal, locale)}
                  </span>
                </div>

                <p
                  className={`min-h-5 text-sm font-bold transition-all duration-200 ${
                    quickOrderErrorMessage
                      ? "translate-y-0 text-red-500 opacity-100"
                      : "-translate-y-1 opacity-0"
                  }`}
                >
                  {quickOrderErrorMessage
                    ? t(quickOrderErrorMessage)
                    : t("common.ready")}
                </p>

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeQuickOrderDialog}
                    disabled={isQuickOrderCreating}
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
                    disabled={isQuickOrderCreating}
                    className="flex h-11 items-center justify-center gap-2 rounded-lg bg-red-500 px-4 font-bold text-white transition-all duration-200 hover:cursor-pointer hover:bg-red-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isQuickOrderCreating && (
                      <LoaderCircle size={17} className="animate-spin" />
                    )}
                    {t("products.quickOrder.submit")}
                  </button>
                </div>
              </form>
            </div>
          </section>
        </div>
      )}

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
            className={`w-full max-w-3xl overflow-hidden rounded-2xl border shadow-2xl transition-all duration-300 ease-out ${
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
                      {t("products.create.eyebrow")}
                    </p>
                    <h2 className="text-xl font-black">
                      {t("products.create.title")}
                    </h2>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={closeCreateDialog}
                  aria-label={t("products.create.closeAria")}
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

              <form onSubmit={handleCreateProduct} className="mt-6 grid gap-4">
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(220px,0.65fr)]">
                  <div
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
                      <Package size={15} className="text-red-500" />
                      {t("products.create.name")}
                    </span>
                    <input
                      type="text"
                      value={createForm.name}
                      onChange={(event) =>
                        handleCreateFormChange("name", event.target.value)
                      }
                      placeholder={t("products.create.productNamePlaceholder")}
                      className={`mt-3 h-12 w-full rounded-xl border px-4 text-base font-black outline-none transition-all duration-200 ${
                        isLight
                          ? "border-gray-200 bg-white placeholder:text-gray-300 focus:border-amber-400"
                          : "border-gray-700 bg-gray-800 placeholder:text-gray-600 focus:border-amber-400"
                      }`}
                    />
                  </div>

                  <div
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
                      <ImagePlus size={15} className="text-red-500" />
                      {t("products.create.productImage")}
                    </span>
                    <div
                      className={`relative mt-3 flex h-32 overflow-hidden rounded-xl border ${
                        isLight
                          ? "border-gray-200 bg-white"
                          : "border-gray-700 bg-gray-800"
                      }`}
                    >
                      {productImagePreviewUrl ? (
                        <img
                          src={productImagePreviewUrl}
                          alt={t("common.selectedProductAlt")}
                          className="size-full object-cover"
                        />
                      ) : (
                        <label className="flex size-full cursor-pointer flex-col items-center justify-center gap-2 text-center">
                          <ImagePlus
                            size={30}
                            className={isLight ? "text-gray-300" : "text-gray-600"}
                          />
                          <span
                            className={`text-sm font-black ${
                              isLight ? "text-gray-500" : "text-gray-400"
                            }`}
                          >
                            {t("products.create.chooseImage")}
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            disabled={isCreating}
                            onChange={(event) =>
                              handleProductImageSelect(event.target.files?.[0])
                            }
                            className="hidden"
                          />
                        </label>
                      )}

                      {productImagePreviewUrl && (
                        <div className="absolute inset-x-2 bottom-2 flex items-center justify-between gap-2">
                          <label className="flex h-9 cursor-pointer items-center justify-center rounded-lg bg-white/90 px-3 text-xs font-black text-gray-800 shadow-md backdrop-blur transition-all duration-200 hover:bg-white active:scale-95">
                            {t("products.create.replaceImage")}
                            <input
                              type="file"
                              accept="image/*"
                              disabled={isCreating}
                              onChange={(event) =>
                                handleProductImageSelect(event.target.files?.[0])
                              }
                              className="hidden"
                            />
                          </label>
                          <button
                            type="button"
                            onClick={clearProductImage}
                            disabled={isCreating}
                            aria-label={t("products.create.removeImage")}
                            className="flex size-9 items-center justify-center rounded-lg bg-red-500 text-white shadow-md transition-all duration-200 hover:cursor-pointer hover:bg-red-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      )}
                    </div>

                    {productImageFile && (
                      <p
                        className={`mt-2 truncate text-xs font-bold ${
                          isLight ? "text-gray-500" : "text-gray-400"
                        }`}
                      >
                        {productImageFile.name}
                      </p>
                    )}
                  </div>
                </div>

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
                    <FileText size={15} className="text-red-500" />
                    {t("products.create.description")}
                  </span>
                  <textarea
                    value={createForm.description}
                    onChange={(event) =>
                      handleCreateFormChange("description", event.target.value)
                    }
                    placeholder={t("products.create.descriptionPlaceholder")}
                    rows={3}
                    className={`mt-3 w-full resize-none rounded-xl border px-4 py-3 text-sm font-semibold outline-none transition-all duration-200 ${
                      isLight
                        ? "border-gray-200 bg-white placeholder:text-gray-300 focus:border-amber-400"
                        : "border-gray-700 bg-gray-800 placeholder:text-gray-600 focus:border-amber-400"
                    }`}
                  />
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  {renderStepperField({
                    field: "price",
                    label: t("products.create.price"),
                    placeholder: "0",
                    icon: CircleDollarSign,
                    inputStep: "0.01",
                  })}
                  {renderStepperField({
                    field: "discount",
                    label: t("products.create.discount"),
                    placeholder: "0",
                    icon: BadgePercent,
                    inputStep: "0.01",
                  })}
                </div>

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
                      <Boxes size={15} className="text-red-500" />
                      {t("products.create.productItems")}
                    </div>
                    <button
                      type="button"
                      onClick={addProductItemDraft}
                      disabled={isCreating || isProductItemsLoading}
                      className="flex h-10 items-center justify-center gap-2 rounded-xl bg-red-500 px-3 text-sm font-black text-white transition-all duration-200 hover:cursor-pointer hover:bg-red-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      <Plus size={17} strokeWidth={2.7} />
                      {t("products.create.addItem")}
                    </button>
                  </div>

                  {isProductItemsLoading ? (
                    <div
                      className={`mt-3 flex min-h-28 items-center justify-center rounded-xl border ${
                        isLight
                          ? "border-gray-200 bg-white text-gray-500"
                          : "border-gray-700 bg-gray-800 text-gray-400"
                      }`}
                    >
                      <LoaderCircle size={18} className="mr-2 animate-spin" />
                      <span className="font-bold">
                        {t("products.create.loadingItems")}
                      </span>
                    </div>
                  ) : productItemDrafts.length === 0 ? (
                    <div
                      className={`mt-3 flex min-h-28 items-center justify-center rounded-xl border text-center text-sm font-bold ${
                        isLight
                          ? "border-gray-200 bg-white text-gray-500"
                          : "border-gray-700 bg-gray-800 text-gray-400"
                      }`}
                    >
                      {t("products.create.addAtLeastOne")}
                    </div>
                  ) : (
                    <div className="mt-3 grid gap-3">
                      {productItemDrafts.map((draft, index) => (
                        <div
                          key={`${draft.productItemId}-${index}`}
                          className={`grid gap-3 rounded-xl border p-3 md:grid-cols-[minmax(0,1fr)_220px_44px] md:items-end ${
                            isLight
                              ? "border-gray-200 bg-white"
                              : "border-gray-700 bg-gray-800"
                          }`}
                        >
                          <div className="grid gap-1.5">
                            <span
                              className={`text-xs font-black uppercase tracking-wide ${
                                isLight ? "text-gray-500" : "text-gray-400"
                              }`}
                            >
                              {t("products.create.item")}
                            </span>
                            <select
                              value={draft.productItemId}
                              onChange={(event) =>
                                handleProductItemDraftChange(
                                  index,
                                  "productItemId",
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
                              {availableProductItems.map((item) => (
                                <option key={item.id} value={item.id}>
                                  {item.name} (
                                  {t(`units.${item.unit}`, {
                                    defaultValue: item.unit,
                                  })}
                                  )
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="grid gap-1.5">
                            <span
                              className={`text-xs font-black uppercase tracking-wide ${
                                isLight ? "text-gray-500" : "text-gray-400"
                              }`}
                            >
                              {t("products.create.quantity")}
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
                                onClick={() =>
                                  adjustProductItemQuantity(index, -1)
                                }
                                disabled={
                                  isCreating ||
                                  !Number.isFinite(Number(draft.quantity)) ||
                                  Number(draft.quantity) <= 0
                                }
                                aria-label={t("products.create.decreaseQuantity")}
                                className={`flex w-11 shrink-0 items-center justify-center border-r transition-all duration-200 enabled:hover:cursor-pointer enabled:active:scale-95 disabled:cursor-not-allowed disabled:opacity-45 ${
                                  isLight
                                    ? "border-gray-200 text-gray-600 enabled:hover:bg-red-50 enabled:hover:text-red-600"
                                    : "border-gray-700 text-gray-300 enabled:hover:bg-red-500/15 enabled:hover:text-red-200"
                                }`}
                              >
                                <Minus size={17} strokeWidth={2.7} />
                              </button>
                              <input
                                type="number"
                                min="0"
                                step="any"
                                value={draft.quantity}
                                aria-label={t("products.create.quantity")}
                                onChange={(event) =>
                                  handleProductItemDraftChange(
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
                                onClick={() =>
                                  adjustProductItemQuantity(index, 1)
                                }
                                disabled={isCreating}
                                aria-label={t("products.create.increaseQuantity")}
                                className="flex w-11 shrink-0 items-center justify-center bg-red-500 text-white transition-all duration-200 hover:cursor-pointer hover:bg-red-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
                              >
                                <Plus size={17} strokeWidth={2.7} />
                              </button>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeProductItemDraft(index)}
                            disabled={isCreating}
                            aria-label={t("products.create.removeItem")}
                            className={`flex h-11 items-center justify-center rounded-xl border transition-all duration-200 hover:cursor-pointer active:scale-95 disabled:cursor-not-allowed disabled:opacity-45 ${
                              isLight
                                ? "border-gray-200 text-gray-500 hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                                : "border-gray-700 text-gray-300 hover:border-red-400 hover:bg-red-500/15 hover:text-red-200"
                            }`}
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

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
                    disabled={isCreating || isProductItemsLoading}
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

export default Products;
